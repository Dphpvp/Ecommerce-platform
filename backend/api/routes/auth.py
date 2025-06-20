from fastapi import APIRouter, HTTPException, Depends, Request, Response
from typing import Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import secrets
import bcrypt

from api.services.auth_service import AuthService
from api.services.two_factor_service import TwoFactorService
from api.services.email_service import EmailService
from api.models.auth import (
    UserLoginRequest, 
    UserRegisterRequest, 
    GoogleLoginRequest,
    TwoFactorSetupRequest,
    TwoFactorVerificationRequest,
    PasswordResetRequest,
    PasswordChangeRequest,
    EmailVerificationRequest,
    ResendVerification,
    TwoFactorSetup,
    TwoFactorDisable
)
from api.models.responses import (
    AuthResponse, 
    TwoFactorSetupResponse, 
    MessageResponse
)
from api.models.profile import UserProfileUpdate
from api.dependencies.auth import get_current_user_from_session, get_current_user_optional, require_csrf_token
from api.dependencies.rate_limiting import rate_limit
from api.core.exceptions import AuthenticationError, ValidationError
from api.core.logging import get_logger
from api.core.database import get_database
from captcha.verification import verify_recaptcha

router = APIRouter()
logger = get_logger(__name__)

# Services
auth_service = AuthService()
two_factor_service = TwoFactorService()
email_service = EmailService()

@router.post("/register", response_model=MessageResponse)
@rate_limit(max_attempts=3, window_minutes=60, endpoint_name="register")
async def register(
    request: UserRegisterRequest,
    http_request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
) -> MessageResponse:
    try:
        await auth_service.register_user(request, http_request)
        logger.info(f"User registered successfully: {request.email}")
        return MessageResponse(message="User registered successfully. Please verify your email.")
    except ValidationError as e:
        logger.warning(f"Registration validation failed: {e.detail}")
        raise HTTPException(status_code=400, detail=e.detail)
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login", response_model=AuthResponse)
@rate_limit(max_attempts=5, window_minutes=15, endpoint_name="login")
async def login(
    request: UserLoginRequest,
    http_request: Request,
    response: Response
) -> AuthResponse:
    try:
        auth_response = await auth_service.authenticate_user(request, http_request, response)
        logger.info(f"User login successful: {request.identifier}")
        return auth_response
    except AuthenticationError as e:
        logger.warning(f"Login failed: {e.detail}")
        raise HTTPException(status_code=401, detail=e.detail)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/logout")
async def logout(response: Response) -> MessageResponse:
    auth_service.clear_session(response)
    logger.info("User logged out successfully")
    return MessageResponse(message="Logged out successfully")

@router.get("/logout")
async def logout_get(response: Response) -> MessageResponse:
    auth_service.clear_session(response)
    logger.info("User logged out successfully")
    return MessageResponse(message="Logged out successfully")

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(request: EmailVerificationRequest) -> MessageResponse:
    try:
        await auth_service.verify_email(request.token)
        logger.info(f"Email verified successfully for token: {request.token[:8]}...")
        return MessageResponse(message="Email verified successfully")
    except ValidationError as e:
        logger.warning(f"Email verification failed: {e.detail}")
        raise HTTPException(status_code=400, detail=e.detail)

@router.post("/resend-verification")
async def resend_verification(email_data: ResendVerification):
    try:
        result = await auth_service.resend_verification_email(email_data.email)
        return result
    except Exception as e:
        logger.error(f"Error in resend_verification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send verification email: {str(e)}")

@router.post("/google", response_model=AuthResponse)
async def google_login(
    request: GoogleLoginRequest,
    response: Response
) -> AuthResponse:
    try:
        auth_response = await auth_service.google_authenticate(request, response)
        logger.info("Google authentication successful")
        return auth_response
    except AuthenticationError as e:
        logger.warning(f"Google auth failed: {e.detail}")
        raise HTTPException(status_code=400, detail=e.detail)

@router.get("/me")
async def get_me(request: Request):
    try:
        user = await get_current_user_from_session(request)
        from api.models.responses import UserResponse
        return UserResponse.from_dict(user)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication required")

@router.post("/setup-2fa", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    request: TwoFactorSetupRequest,
    http_request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
) -> TwoFactorSetupResponse:
    try:
        current_user = await get_current_user_from_session(http_request)
        setup_response = await two_factor_service.setup_2fa(request, current_user)
        logger.info(f"2FA setup initiated for user: {current_user['email']}")
        return setup_response
    except ValidationError as e:
        logger.warning(f"2FA setup validation failed: {e.detail}")
        raise HTTPException(status_code=400, detail=e.detail)

@router.post("/verify-2fa-setup")
async def verify_2fa_setup(
    verification_data: TwoFactorSetup, 
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        current_user = await get_current_user_from_session(request)
        result = await two_factor_service.verify_2fa_setup(verification_data.code, current_user)
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.detail)
    except Exception as e:
        logger.error(f"2FA setup verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify 2FA setup")

@router.post("/verify-2fa", response_model=AuthResponse)
async def verify_2fa(
    request: TwoFactorVerificationRequest,
    response: Response
) -> AuthResponse:
    try:
        auth_response = await two_factor_service.verify_2fa_login(request, response)
        logger.info("2FA verification successful")
        return auth_response
    except AuthenticationError as e:
        logger.warning(f"2FA verification failed: {e.detail}")
        raise HTTPException(status_code=401, detail=e.detail)

@router.post("/send-2fa-email")
async def send_2fa_email(request_data: dict):
    try:
        temp_token = request_data.get("temp_token")
        if not temp_token:
            raise HTTPException(status_code=400, detail="Temporary token is required")
        
        result = await two_factor_service.send_2fa_email_code(temp_token)
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.detail)
    except Exception as e:
        logger.error(f"Send 2FA email error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/disable-2fa")
async def disable_2fa(
    verification_data: TwoFactorDisable, 
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        current_user = await get_current_user_from_session(request)
        result = await two_factor_service.disable_2fa(
            verification_data.password, 
            verification_data.code, 
            current_user
        )
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.detail)
    except Exception as e:
        logger.error(f"Disable 2FA error: {e}")
        raise HTTPException(status_code=500, detail="Failed to disable 2FA")

@router.post("/send-disable-2fa-code")
async def send_disable_2fa_code(request_data: dict, request: Request):
    try:
        current_user = await get_current_user_from_session(request)
        password = request_data.get("password")
        
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        result = await two_factor_service.send_disable_2fa_code(password, current_user)
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.detail)
    except Exception as e:
        logger.error(f"Send disable 2FA code error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process request")

@router.get("/2fa-status")
async def get_2fa_status(request: Request):
    try:
        current_user = await get_current_user_from_session(request)
        return await two_factor_service.get_2fa_status(current_user)
    except Exception as e:
        logger.error(f"2FA status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get 2FA status")

@router.post("/generate-backup-codes")
async def generate_backup_codes(request: Request):
    try:
        current_user = await get_current_user_from_session(request)
        return await two_factor_service.generate_backup_codes(current_user)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.detail)
    except Exception as e:
        logger.error(f"Generate backup codes error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate backup codes")

@router.post("/request-password-reset")
@rate_limit(max_attempts=3, window_minutes=60, endpoint_name="password_reset")
async def request_password_reset(request_data: PasswordResetRequest, http_request: Request):
    try:
        result = await auth_service.request_password_reset(request_data.email, request_data.recaptcha_response)
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.detail)
    except Exception as e:
        logger.error(f"Password reset request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process password reset request")

@router.post("/reset-password")
async def reset_password(request: dict):
    try:
        token = request.get("token")
        new_password = request.get("new_password")
        
        if not token or not new_password:
            raise HTTPException(status_code=400, detail="Token and new password required")
        
        result = await auth_service.reset_password(token, new_password)
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.detail)
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

@router.put("/change-password")
async def change_password(
    password_data: PasswordChangeRequest, 
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        current_user = await get_current_user_from_session(request)
        user_id = str(current_user["_id"])
        
        result = await auth_service.change_password(
            user_id,
            password_data.old_password,
            password_data.new_password, 
            password_data.confirm_password,
            password_data.recaptcha_response
        )
        return result
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.detail)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

# Profile endpoints for backward compatibility
@router.get("/upload-avatar")
async def upload_avatar(request: Request):
    try:
        user = await get_current_user_from_session(request)
        
        sample_avatars = [
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['username']}1",
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['username']}2", 
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['username']}3",
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['username']}4",
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['username']}5",
            f"https://api.dicebear.com/7.x/adventurer/svg?seed={user['username']}1",
            f"https://api.dicebear.com/7.x/adventurer/svg?seed={user['username']}2",
            f"https://api.dicebear.com/7.x/adventurer/svg?seed={user['username']}3",
            f"https://api.dicebear.com/7.x/personas/svg?seed={user['username']}1",
            f"https://api.dicebear.com/7.x/personas/svg?seed={user['username']}2"
        ]
        
        return {
            "message": "Avatar options available",
            "avatars": sample_avatars
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load avatars")

@router.put("/update-profile")
async def update_profile(
    profile_data: UserProfileUpdate, 
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)  
):
    try:
        current_user = await get_current_user_from_session(request)
        user_id = str(current_user["_id"])
        db = get_database()
        
        # Build update data, only including provided fields
        update_data = {}
        if profile_data.full_name is not None:
            update_data["full_name"] = profile_data.full_name.strip()
        if profile_data.email is not None:
            # Check if email is already taken by another user
            existing_user = await db.users.find_one({
                "email": profile_data.email.strip().lower(),
                "_id": {"$ne": ObjectId(user_id)}
            })
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already in use")
            update_data["email"] = profile_data.email.strip().lower()
        if profile_data.phone is not None:
            # Check if phone is already taken by another user
            if profile_data.phone.strip():
                existing_user = await db.users.find_one({
                    "phone": profile_data.phone.strip(),
                    "_id": {"$ne": ObjectId(user_id)}
                })
                if existing_user:
                    raise HTTPException(status_code=400, detail="Phone number already in use")
            update_data["phone"] = profile_data.phone.strip()
        if profile_data.address is not None:
            update_data["address"] = profile_data.address.strip()
        if profile_data.profile_image_url is not None:
            update_data["profile_image_url"] = profile_data.profile_image_url
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Update user in database
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return updated user data
        updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": str(updated_user["_id"]),
                "username": updated_user["username"],
                "email": updated_user["email"],
                "full_name": updated_user.get("full_name", ""),
                "address": updated_user.get("address", ""),
                "phone": updated_user.get("phone", ""),
                "profile_image_url": updated_user.get("profile_image_url"),
                "is_admin": updated_user.get("is_admin", False),
                "email_verified": updated_user.get("email_verified", False),
                "two_factor_enabled": updated_user.get("two_factor_enabled", False)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

# Debug routes
@router.get("/debug-user/{email}")
async def debug_user(email: str):
    db = get_database()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"error": "User not found"}
    
    return {
        "email": user["email"],
        "email_verified": user.get("email_verified", False),
        "is_admin": user.get("is_admin", False),
        "has_verification_token": bool(user.get("verification_token")),
        "created_at": user.get("created_at")
    }
    
@router.get("/debug-token/{token}")
async def debug_token(token: str):
    try:
        db = get_database()
        user = await db.users.find_one({"verification_token": token})
        if user:
            return {
                "found": True,
                "email": user["email"],
                "email_verified": user.get("email_verified", False),
                "token_created": user.get("verification_token_created"),
                "expired": (datetime.now(timezone.utc) - user.get("verification_token_created", datetime.now(timezone.utc))).days > 1 if user.get("verification_token_created") else False
            }
        else:
            return {"found": False, "token": token}
    except Exception as e:
        return {"error": str(e)}