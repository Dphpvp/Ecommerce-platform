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