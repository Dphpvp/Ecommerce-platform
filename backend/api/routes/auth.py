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
    EmailVerificationRequest
)
from api.models.responses import (
    AuthResponse, 
    TwoFactorSetupResponse, 
    MessageResponse
)
from api.dependencies.auth import get_current_user_from_session, get_current_user_optional, require_csrf_token
from api.dependencies.rate_limiting import rate_limit
from api.core.exceptions import AuthenticationError, ValidationError
from api.core.logging import get_logger
from api.core.database import get_database
from captcha import verify_recaptcha

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

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(request: EmailVerificationRequest) -> MessageResponse:
    try:
        await auth_service.verify_email(request.token)
        logger.info(f"Email verified successfully for token: {request.token[:8]}...")
        return MessageResponse(message="Email verified successfully")
    except ValidationError as e:
        logger.warning(f"Email verification failed: {e.detail}")
        raise HTTPException(status_code=400, detail=e.detail)

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
    
@router.get("/csrf-token")
async def get_csrf_token(request: Request):
    from api.middleware.csrf import csrf_protection
    from jose import jwt
    from api.core.config import get_settings
    
    settings = get_settings()
    session_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            session_id = payload.get("user_id")
        except:
            pass
    
    csrf_token = csrf_protection.generate_token(session_id)
    return {"csrf_token": csrf_token}

@router.post("/request-password-reset")
@rate_limit(max_attempts=3, window_minutes=60, endpoint_name="password_reset")
async def request_password_reset(request_data: PasswordResetRequest, http_request: Request):
    try:
        if not verify_recaptcha(request_data.recaptcha_response):
            raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
        
        db = get_database()
        user = await db.users.find_one({"email": request_data.email})
        if not user:
            return MessageResponse(message="If the email exists, a reset link has been sent")
        
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        await db.password_resets.insert_one({
            "user_id": user["_id"],
            "token": reset_token,
            "expires_at": expires_at,
            "used": False,
            "created_at": datetime.now(timezone.utc)
        })
        
        from api.core.config import get_settings
        settings = get_settings()
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        await email_service.send_password_reset_email(
            user["email"], 
            user.get("full_name", ""), 
            reset_url
        )
        
        return MessageResponse(message="If the email exists, a reset link has been sent")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Password reset request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process password reset request")

@router.post("/reset-password")
async def reset_password(request: dict):
    db = get_database()
    token = request.get("token")
    new_password = request.get("new_password")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password required")
    
    reset_record = await db.password_resets.find_one({
        "token": token,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    new_hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    result = await db.users.update_one(
        {"_id": reset_record["user_id"]},
        {"$set": {"password": new_hashed_password, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.password_resets.update_one(
        {"_id": reset_record["_id"]},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
    )
    
    return MessageResponse(message="Password reset successfully")

@router.put("/change-password")
async def change_password(
    password_data: PasswordChangeRequest, 
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        current_user = await get_current_user_from_session(request)
        db = get_database()
    except HTTPException as e:
        raise e
    
    if not verify_recaptcha(password_data.recaptcha_response):
        raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
    
    user_id = str(current_user["_id"])
    
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    
    if len(password_data.new_password) < 10:
        raise HTTPException(status_code=400, detail="New password must be at least 10 characters long")
    
    if not any(c.isupper() for c in password_data.new_password):
        raise HTTPException(status_code=400, detail="New password must contain at least one uppercase letter")
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password_data.new_password):
        raise HTTPException(status_code=400, detail="New password must contain at least one special character")
    
    if not current_user.get("password"):
        raise HTTPException(status_code=400, detail="Cannot change password for Google authenticated accounts")
    
    if not bcrypt.checkpw(password_data.old_password.encode('utf-8'), current_user["password"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if bcrypt.checkpw(password_data.new_password.encode('utf-8'), current_user["password"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="New password must be different from current password")
    
    new_hashed_password = bcrypt.hashpw(password_data.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": new_hashed_password, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return MessageResponse(message="Password changed successfully")