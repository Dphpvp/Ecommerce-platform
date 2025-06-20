from typing import Optional
from datetime import datetime, timezone, timedelta
import secrets
import bcrypt
from jose import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from bson import ObjectId

from api.models.auth import UserLoginRequest, UserRegisterRequest, GoogleLoginRequest
from api.models.responses import AuthResponse, UserResponse, MessageResponse
from api.core.config import get_settings
from api.core.database import get_database
from api.core.exceptions import AuthenticationError, ValidationError
from api.services.email_service import EmailService
from api.utils.security import SecurityValidator
from api.core.logging import get_logger
from captcha.verification import verify_recaptcha

settings = get_settings()
logger = get_logger(__name__)

class AuthService:
    def __init__(self):
        self.db = get_database()
        self.email_service = EmailService()
        self.security_validator = SecurityValidator()
    
    async def register_user(self, request: UserRegisterRequest, http_request) -> MessageResponse:
        await self._validate_registration_data(request)
        
        hashed_password = self._hash_password(request.password)
        verification_token = secrets.token_urlsafe(32)
        
        user_data = {
            "username": request.username.lower(),
            "email": request.email.lower(),
            "password": hashed_password,
            "full_name": request.full_name,
            "address": request.address or "",
            "phone": request.phone,
            "is_admin": False,
            "email_verified": False,
            "verification_token": verification_token,
            "verification_token_created": datetime.now(timezone.utc),
            "two_factor_enabled": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await self.db.users.insert_one(user_data)
        
        try:
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
            await self.email_service.send_verification_email(
                request.email, request.full_name, verification_url
            )
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
        
        return MessageResponse(message="User registered successfully. Please verify your email.")
    
    async def authenticate_user(self, request: UserLoginRequest, http_request, response) -> AuthResponse:
        user = await self._find_user_by_identifier(request.identifier)
        
        if not user or not self._verify_password(request.password, user["password"]):
            raise AuthenticationError("Invalid credentials")
        
        if not user.get("email_verified", False):
            raise AuthenticationError("Email not verified")
        
        if user.get("two_factor_enabled"):
            temp_token = self._create_jwt_token(str(user["_id"]), timedelta(minutes=10))
            return AuthResponse(
                success=False,
                requires_2fa=True,
                method=user.get("two_factor_method", "app"),
                temp_token=temp_token,
                message="Please enter your 2FA code"
            )
        
        return await self._create_auth_response(user, response)
    
    async def google_authenticate(self, request: GoogleLoginRequest, response) -> AuthResponse:
        try:
            idinfo = id_token.verify_oauth2_token(
                request.token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Invalid issuer')
            
            email = idinfo['email']
            name = idinfo.get('name', '')
            google_id = idinfo['sub']
            picture = idinfo.get('picture', '')
            
            user = await self._find_or_create_google_user(email, name, google_id, picture)
            return await self._create_auth_response(user, response)
            
        except ValueError as e:
            raise AuthenticationError(f"Google authentication failed: {str(e)}")
    
    async def verify_email(self, token: str) -> MessageResponse:
        user = await self.db.users.find_one({"verification_token": token})
        
        if not user:
            raise ValidationError("Invalid verification token")
        
        if user.get("email_verified", False):
            return MessageResponse(message="Email already verified")
        
        token_created = user.get("verification_token_created")
        if token_created:
            if isinstance(token_created, datetime):
                if token_created.tzinfo is None:
                    token_created = token_created.replace(tzinfo=timezone.utc)
                
                if datetime.now(timezone.utc) > token_created + timedelta(hours=24):
                    raise ValidationError("Verification token expired")
        
        await self.db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"email_verified": True},
                "$unset": {"verification_token": "", "verification_token_created": ""}
            }
        )
        
        return MessageResponse(message="Email verified successfully")
    
    async def resend_verification_email(self, email: str) -> dict:
        """Resend verification email"""
        try:
            logger.info(f"Attempting to resend verification for: {email}")
            
            user = await self.db.users.find_one({"email": email})
            
            if not user:
                logger.error(f"User not found: {email}")
                raise ValidationError("User not found")
            
            if user.get("email_verified", False):
                logger.info(f"Email already verified: {email}")
                return {"message": "Email already verified"}
            
            # Generate new token
            verification_token = secrets.token_urlsafe(32)
            await self.db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "verification_token": verification_token,
                        "verification_token_created": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Send new verification email
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
            await self.email_service.send_verification_email(
                email, user.get("full_name", "User"), verification_url
            )
            
            return {"message": "Verification email sent"}
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error in resend_verification: {str(e)}")
            raise ValidationError(f"Failed to send verification email: {str(e)}")
    
    async def request_password_reset(self, email: str, recaptcha_response: str) -> dict:
        """Request password reset with rate limiting"""
        try:
            # Verify reCAPTCHA
            if not verify_recaptcha(recaptcha_response):
                raise ValidationError("reCAPTCHA verification failed")
            
            user = await self.db.users.find_one({"email": email})
            if not user:
                # Don't reveal if email exists
                return {"message": "If the email exists, a reset link has been sent"}
            
            # Generate reset token
            reset_token = secrets.token_urlsafe(32)
            expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
            
            await self.db.password_resets.insert_one({
                "user_id": user["_id"],
                "token": reset_token,
                "expires_at": expires_at,
                "used": False,
                "created_at": datetime.now(timezone.utc)
            })
            
            # Send reset email
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            await self.email_service.send_password_reset_email(
                user["email"], user.get("full_name", ""), reset_url
            )
            
            return {"message": "If the email exists, a reset link has been sent"}
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Password reset request error: {e}")
            raise ValidationError("Failed to process password reset request")
    
    async def reset_password(self, token: str, new_password: str) -> dict:
        """Reset password using token"""
        
        # Find valid reset token
        reset_record = await self.db.password_resets.find_one({
            "token": token,
            "used": False,
            "expires_at": {"$gt": datetime.now(timezone.utc)}
        })
        
        if not reset_record:
            raise ValidationError("Invalid or expired reset token")
        
        # Validate new password
        if len(new_password) < 6:
            raise ValidationError("Password must be at least 6 characters long")
        
        # Hash new password
        new_hashed_password = self._hash_password(new_password)
        
        # Update user password
        result = await self.db.users.update_one(
            {"_id": reset_record["user_id"]},
            {
                "$set": {
                    "password": new_hashed_password,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.matched_count == 0:
            raise ValidationError("User not found")
        
        # Mark token as used
        await self.db.password_resets.update_one(
            {"_id": reset_record["_id"]},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
        )
        
        return {"message": "Password reset successfully"}
    
    async def change_password(self, user_id: str, old_password: str, new_password: str, confirm_password: str, recaptcha_response: str) -> dict:
        """Change user password"""
        try:
            # Verify reCAPTCHA
            if not verify_recaptcha(recaptcha_response):
                raise ValidationError("reCAPTCHA verification failed")
            
            # Validate password confirmation
            if new_password != confirm_password:
                raise ValidationError("New passwords do not match")
            
            # Validate password requirements
            if len(new_password) < 10:
                raise ValidationError("New password must be at least 10 characters long")
            
            if not any(c.isupper() for c in new_password):
                raise ValidationError("New password must contain at least one uppercase letter")
            
            if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in new_password):
                raise ValidationError("New password must contain at least one special character")
            
            # Get current user
            current_user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            if not current_user:
                raise ValidationError("User not found")
            
            # Check if user has a password (Google users might not have one)
            if not current_user.get("password"):
                raise ValidationError("Cannot change password for Google authenticated accounts")
            
            # Verify old password
            if not self._verify_password(old_password, current_user["password"]):
                raise ValidationError("Current password is incorrect")
            
            # Check if new password is different from old password
            if self._verify_password(new_password, current_user["password"]):
                raise ValidationError("New password must be different from current password")
            
            # Hash new password
            new_hashed_password = self._hash_password(new_password)
            
            # Update password in database
            result = await self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"password": new_hashed_password, "updated_at": datetime.now(timezone.utc)}}
            )
            
            if result.matched_count == 0:
                raise ValidationError("User not found")
            
            return {"message": "Password changed successfully"}
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Change password error: {e}")
            raise ValidationError("Failed to change password")
    
    def clear_session(self, response) -> None:
        response.delete_cookie(
            key="session_token", path="/", domain=None,
            secure=True, httponly=True, samesite="none"
        )
    
    async def _validate_registration_data(self, request: UserRegisterRequest) -> None:
        existing_email = await self.db.users.find_one({"email": request.email.lower()})
        if existing_email:
            raise ValidationError("Email already registered")
        
        existing_username = await self.db.users.find_one({"username": request.username.lower()})
        if existing_username:
            raise ValidationError("Username already taken")
        
        existing_phone = await self.db.users.find_one({"phone": request.phone})
        if existing_phone:
            raise ValidationError("Phone number already registered")
    
    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def _verify_password(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def _create_jwt_token(self, user_id: str, expires_in: timedelta = timedelta(days=7)) -> str:
        payload = {
            "user_id": user_id,
            "exp": datetime.now(timezone.utc) + expires_in
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    
    async def _find_user_by_identifier(self, identifier: str) -> Optional[dict]:
        identifier_type = self.security_validator.get_identifier_type(identifier)
        
        if identifier_type == "email":
            return await self.db.users.find_one({"email": identifier.lower()})
        elif identifier_type == "phone":
            return await self.db.users.find_one({"phone": identifier})
        else:
            return await self.db.users.find_one({"username": identifier.lower()})
    
    async def _find_or_create_google_user(self, email: str, name: str, google_id: str, picture: str) -> dict:
        user = await self.db.users.find_one({"email": email})
        
        if user:
            await self.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "profile_image_url": picture,
                    "full_name": name or user.get("full_name", ""),
                    "email_verified": True,
                    "last_login": datetime.now(timezone.utc)
                }}
            )
            return await self.db.users.find_one({"_id": user["_id"]})
        else:
            username = email.split('@')[0]
            counter = 1
            original_username = username
            
            while await self.db.users.find_one({"username": username}):
                username = f"{original_username}{counter}"
                counter += 1
            
            phone = f"+1-555-{secrets.randbelow(9000) + 1000:04d}"
            while await self.db.users.find_one({"phone": phone}):
                phone = f"+1-555-{secrets.randbelow(9000) + 1000:04d}"
            
            user_data = {
                "username": username,
                "email": email,
                "password": "",
                "full_name": name,
                "phone": phone,
                "address": "",
                "google_id": google_id,
                "profile_image_url": picture,
                "is_admin": False,
                "email_verified": True,
                "two_factor_enabled": False,
                "created_at": datetime.now(timezone.utc)
            }
            
            result = await self.db.users.insert_one(user_data)
            return await self.db.users.find_one({"_id": result.inserted_id})
    
    async def _create_auth_response(self, user: dict, response) -> AuthResponse:
        token = self._create_jwt_token(str(user["_id"]))
        
        response.set_cookie(
            key="session_token", value=token, max_age=7 * 24 * 60 * 60,
            httponly=True, secure=True, samesite="none", path="/", domain=None
        )
        
        return AuthResponse(
            success=True,
            token=token,
            user=UserResponse.from_dict(user)
        )