import pyotp
import qrcode
import io
import base64
import secrets
from datetime import datetime, timezone, timedelta
from jose import jwt
from bson import ObjectId

from api.models.auth import TwoFactorSetupRequest, TwoFactorVerificationRequest
from api.models.responses import TwoFactorSetupResponse, AuthResponse, UserResponse
from api.core.config import get_settings
from api.core.database import get_database
from api.core.exceptions import AuthenticationError, ValidationError
from api.services.email_service import EmailService
from api.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)

class TwoFactorService:
    def __init__(self):
        self.db = get_database()
        self.email_service = EmailService()
    
    async def setup_2fa(self, request: TwoFactorSetupRequest, current_user: dict) -> TwoFactorSetupResponse:
        if not current_user.get("email_verified"):
            raise ValidationError("Email must be verified before enabling 2FA")
        
        if current_user.get("two_factor_enabled"):
            raise ValidationError("2FA is already enabled. Please disable it first to change methods.")
        
        if request.method == "app":
            return await self._setup_app_2fa(current_user)
        elif request.method == "email":
            return await self._setup_email_2fa(current_user)
        else:
            raise ValidationError("Invalid method. Choose 'app' or 'email'")
    
    async def _setup_app_2fa(self, current_user: dict) -> TwoFactorSetupResponse:
        secret = pyotp.random_base32()
        
        try:
            totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                name=current_user["email"],
                issuer_name="ECommerce App"
            )
            
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(totp_uri)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            qr_code = base64.b64encode(buffer.getvalue()).decode()
            
            # Store secret temporarily with expiration
            await self.db.users.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "two_factor_secret_temp": secret,
                        "two_factor_method": "app",
                        "two_factor_setup_expires": datetime.now(timezone.utc) + timedelta(minutes=10)
                    }
                }
            )
            
            return TwoFactorSetupResponse(
                method="app",
                secret=secret,
                qr_code=f"data:image/png;base64,{qr_code}",
                message="Scan this QR code with your authenticator app and enter the 6-digit code to verify.",
                expires_in=600,
                instructions="Scan this QR code with your authenticator app and enter the 6-digit code to verify."
            )
            
        except Exception as qr_error:
            logger.error(f"QR code generation error: {qr_error}")
            raise ValidationError("Failed to generate QR code")
    
    async def _setup_email_2fa(self, current_user: dict) -> TwoFactorSetupResponse:
        # Setup email 2FA
        await self.db.users.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "two_factor_method": "email",
                    "two_factor_setup_expires": datetime.now(timezone.utc) + timedelta(minutes=10)
                }
            }
        )
        
        # Send test code
        code = self._generate_email_2fa_code()
        await self.db.users.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "email_2fa_code_temp": code,
                    "email_2fa_code_created": datetime.now(timezone.utc)
                }
            }
        )
        
        try:
            user_name = current_user.get("full_name", current_user.get("username", "User"))
            await self.email_service.send_2fa_email_code(current_user["email"], code, user_name)
            
            return TwoFactorSetupResponse(
                method="email",
                message="Verification code sent to your email",
                email_hint=f"***{current_user['email'][-10:]}",
                expires_in=600,  # 10 minutes
                code_expires_in=300  # 5 minutes
            )
            
        except Exception as email_error:
            logger.error(f"Failed to send 2FA setup email: {email_error}")
            # Clean up on email failure
            await self.db.users.update_one(
                {"_id": current_user["_id"]},
                {
                    "$unset": {
                        "two_factor_method": "",
                        "email_2fa_code_temp": "",
                        "email_2fa_code_created": "",
                        "two_factor_setup_expires": ""
                    }
                }
            )
            raise ValidationError("Failed to send verification email")
    
    async def verify_2fa_setup(self, code: str, current_user: dict) -> dict:
        """Verify and enable 2FA for both app and email"""
        try:
            # Get fresh user data
            user = await self.db.users.find_one({"_id": current_user["_id"]})
            if not user:
                raise ValidationError("User not found")
            
            # Check setup expiration
            setup_expires = user.get("two_factor_setup_expires")
            if setup_expires:
                if isinstance(setup_expires, datetime):
                    if setup_expires.tzinfo is None:
                        setup_expires = setup_expires.replace(tzinfo=timezone.utc)
                    
                    if datetime.now(timezone.utc) > setup_expires:
                        # Clean up expired setup
                        await self._cleanup_expired_setup(current_user["_id"])
                        raise ValidationError("2FA setup expired. Please start setup again.")
            
            method = user.get("two_factor_method")
            if not method:
                raise ValidationError("No 2FA setup in progress")
            
            # Validate code format
            if not code or len(code) != 6 or not code.isdigit():
                raise ValidationError("Please enter a valid 6-digit code")
            
            if method == "app":
                return await self._verify_app_setup(code, user)
            elif method == "email":
                return await self._verify_email_setup(code, user)
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"2FA setup verification error: {e}")
            raise ValidationError("Failed to verify 2FA setup")
    
    async def _verify_app_setup(self, code: str, user: dict) -> dict:
        temp_secret = user.get("two_factor_secret_temp")
        if not temp_secret:
            raise ValidationError("No app-based 2FA setup in progress")
        
        try:
            totp = pyotp.TOTP(temp_secret)
            if not totp.verify(code, valid_window=1):
                raise ValidationError("Invalid 2FA code. Please check your authenticator app.")
        except Exception as totp_error:
            logger.error(f"TOTP verification error: {totp_error}")
            raise ValidationError("Invalid 2FA code")
        
        # Generate backup codes
        backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
        
        await self.db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "two_factor_enabled": True,
                    "two_factor_secret": temp_secret,
                    "two_factor_method": "app",
                    "backup_codes": backup_codes,
                    "two_factor_enabled_at": datetime.now(timezone.utc)
                },
                "$unset": {
                    "two_factor_secret_temp": "",
                    "two_factor_setup_expires": ""
                }
            }
        )
        
        return {
            "success": True,
            "message": "App-based 2FA enabled successfully",
            "method": "app",
            "backup_codes": backup_codes,
            "warning": "Save these backup codes in a secure location. Each can only be used once."
        }
    
    async def _verify_email_setup(self, code: str, user: dict) -> dict:
        temp_code = user.get("email_2fa_code_temp")
        code_created = user.get("email_2fa_code_created")
        
        if not temp_code:
            raise ValidationError("No verification code found. Please start setup again.")
        
        # Check if code expired (5 minutes)
        if code_created:
            if isinstance(code_created, datetime):
                if code_created.tzinfo is None:
                    code_created = code_created.replace(tzinfo=timezone.utc)
                
                if datetime.now(timezone.utc) > code_created + timedelta(minutes=5):
                    raise ValidationError("Verification code expired. Please start setup again.")
        
        if code != temp_code:
            raise ValidationError("Invalid verification code. Please check your email.")
        
        # Generate backup codes
        backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
        
        await self.db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "two_factor_enabled": True,
                    "two_factor_method": "email",
                    "backup_codes": backup_codes,
                    "two_factor_enabled_at": datetime.now(timezone.utc)
                },
                "$unset": {
                    "email_2fa_code_temp": "",
                    "email_2fa_code_created": "",
                    "two_factor_setup_expires": ""
                }
            }
        )
        
        return {
            "success": True,
            "message": "Email-based 2FA enabled successfully",
            "method": "email",
            "backup_codes": backup_codes,
            "warning": "Save these backup codes in a secure location. Each can only be used once."
        }
    
    async def _cleanup_expired_setup(self, user_id: ObjectId):
        """Clean up expired 2FA setup"""
        await self.db.users.update_one(
            {"_id": user_id},
            {
                "$unset": {
                    "two_factor_secret_temp": "",
                    "two_factor_method": "",
                    "email_2fa_code_temp": "",
                    "email_2fa_code_created": "",
                    "two_factor_setup_expires": ""
                }
            }
        )

    async def verify_2fa_login(self, request: TwoFactorVerificationRequest, response) -> AuthResponse:
        try:
            payload = jwt.decode(request.temp_token, settings.JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("user_id")
        except:
            raise AuthenticationError("Invalid temporary token")
        
        user = await self.db.users.find_one({"_id": ObjectId(user_id)})
        if not user or not user.get("two_factor_enabled"):
            raise AuthenticationError("Invalid 2FA state")
        
        method = user.get("two_factor_method", "app")
        verified = False
        
        if method == "app":
            secret = user.get("two_factor_secret")
            if secret:
                totp = pyotp.TOTP(secret)
                verified = totp.verify(request.code, valid_window=1)
        elif method == "email":
            stored_code = user.get("email_2fa_code")
            code_created = user.get("email_2fa_code_created")
            
            if stored_code and code_created:
                if isinstance(code_created, datetime):
                    if code_created.tzinfo is None:
                        code_created = code_created.replace(tzinfo=timezone.utc)
                    
                    if datetime.now(timezone.utc) <= code_created + timedelta(minutes=5):
                        verified = (request.code == stored_code)
                        if verified:
                            await self.db.users.update_one(
                                {"_id": user["_id"]},
                                {"$unset": {"email_2fa_code": "", "email_2fa_code_created": ""}}
                            )
        
        # Check backup codes if primary failed
        if not verified:
            backup_codes = user.get("backup_codes", [])
            if request.code.upper() in backup_codes:
                backup_codes.remove(request.code.upper())
                await self.db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"backup_codes": backup_codes}}
                )
                verified = True
        
        if not verified:
            raise AuthenticationError("Invalid verification code")
        
        # Create session
        from api.services.auth_service import AuthService
        auth_service = AuthService()
        return await auth_service._create_auth_response(user, response)
    
    async def send_2fa_email_code(self, temp_token: str) -> dict:
        """Send 2FA code via email during login"""
        try:
            payload = jwt.decode(temp_token, settings.JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("user_id")
        except jwt.ExpiredSignatureError:
            raise ValidationError("Session expired. Please login again.")
        except jwt.JWTError:
            raise ValidationError("Invalid temporary token")
        
        user = await self.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise ValidationError("User not found")
        
        if not user.get("two_factor_enabled") or user.get("two_factor_method") != "email":
            raise ValidationError("Email 2FA is not enabled")
        
        # Generate and send new code
        code = self._generate_email_2fa_code()
        await self.db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "email_2fa_code": code,
                    "email_2fa_code_created": datetime.now(timezone.utc)
                }
            }
        )
        
        user_name = user.get("full_name", user.get("username", "User"))
        await self.email_service.send_2fa_email_code(user["email"], code, user_name)
        
        return {
            "message": "Verification code sent to your email",
            "email_hint": f"***{user['email'][-10:]}",
            "expires_in": 300
        }
    
    async def disable_2fa(self, password: str, code: str, current_user: dict) -> dict:
        """Disable 2FA - Enhanced version"""
        try:
            # Verify password
            if not current_user.get("password"):
                raise ValidationError("Cannot disable 2FA for OAuth accounts")
            
            from api.services.auth_service import AuthService
            auth_service = AuthService()
            if not auth_service._verify_password(password, current_user["password"]):
                raise ValidationError("Invalid password")
            
            if not current_user.get("two_factor_enabled"):
                raise ValidationError("2FA is not enabled")
            
            # Verify 2FA code based on method
            method = current_user.get("two_factor_method", "app")
            verified = False
            
            if method == "app":
                secret = current_user.get("two_factor_secret")
                if not secret:
                    raise ValidationError("2FA secret not found")
                
                try:
                    totp = pyotp.TOTP(secret)
                    verified = totp.verify(code, valid_window=1)
                except Exception as e:
                    logger.error(f"TOTP disable verification error: {e}")
                    verified = False
                
                if not verified:
                    # Check backup codes
                    backup_codes = current_user.get("backup_codes", [])
                    if code.upper() in backup_codes:
                        verified = True
            
            elif method == "email":
                stored_code = current_user.get("disable_2fa_code")
                code_created = current_user.get("disable_2fa_code_created")
                
                if not stored_code:
                    raise ValidationError("No verification code found. Please request a code first.")
                
                # Check if code expired (5 minutes)
                if code_created:
                    if isinstance(code_created, datetime):
                        if code_created.tzinfo is None:
                            code_created = code_created.replace(tzinfo=timezone.utc)
                        
                        if datetime.now(timezone.utc) > code_created + timedelta(minutes=5):
                            raise ValidationError("Verification code expired. Please request a new code.")
                
                verified = (code == stored_code)
            
            if not verified:
                raise ValidationError("Invalid verification code")
            
            # Disable 2FA
            await self.db.users.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "two_factor_enabled": False,
                        "two_factor_disabled_at": datetime.now(timezone.utc)
                    },
                    "$unset": {
                        "two_factor_secret": "",
                        "backup_codes": "",
                        "two_factor_method": "",
                        "disable_2fa_code": "",
                        "disable_2fa_code_created": "",
                        "two_factor_enabled_at": ""
                    }
                }
            )
            
            return {"success": True, "message": "2FA disabled successfully"}
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Disable 2FA error: {e}")
            raise ValidationError("Failed to disable 2FA")
    
    async def send_disable_2fa_code(self, password: str, current_user: dict) -> dict:
        """Send 2FA code for disabling 2FA"""
        try:
            # Verify password
            from api.services.auth_service import AuthService
            auth_service = AuthService()
            if not auth_service._verify_password(password, current_user["password"]):
                raise ValidationError("Invalid password")
            
            # Check if user has email-based 2FA
            if not current_user.get("two_factor_enabled"):
                raise ValidationError("2FA is not enabled")
            
            if current_user.get("two_factor_method") != "email":
                raise ValidationError("Email 2FA is not enabled")
            
            # Rate limiting for disable codes
            last_sent = current_user.get("last_disable_2fa_email_sent")
            if last_sent:
                if isinstance(last_sent, datetime):
                    if last_sent.tzinfo is None:
                        last_sent = last_sent.replace(tzinfo=timezone.utc)
                    
                    # Minimum 60 seconds between requests
                    if datetime.now(timezone.utc) < last_sent + timedelta(seconds=60):
                        raise ValidationError("Please wait before requesting another code")
            
            # Generate and send code
            code = self._generate_email_2fa_code()
            await self.db.users.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "disable_2fa_code": code,
                        "disable_2fa_code_created": datetime.now(timezone.utc),
                        "last_disable_2fa_email_sent": datetime.now(timezone.utc)
                    }
                }
            )
            
            try:
                user_name = current_user.get("full_name", current_user.get("username", "User"))
                await self.email_service.send_2fa_email_code(current_user["email"], code, user_name)
                
                return {
                    "message": "Verification code sent to your email",
                    "email_hint": f"***{current_user['email'][-10:]}",
                    "expires_in": 300
                }
                
            except Exception as email_error:
                logger.error(f"Failed to send disable 2FA email: {email_error}")
                raise ValidationError("Failed to send verification email")
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Send disable 2FA code error: {e}")
            raise ValidationError("Failed to process request")
    
    async def get_2fa_status(self, current_user: dict) -> dict:
        """Get current 2FA status"""
        try:
            user = await self.db.users.find_one({"_id": current_user["_id"]})
            
            return {
                "enabled": user.get("two_factor_enabled", False),
                "method": user.get("two_factor_method") if user.get("two_factor_enabled") else None,
                "backup_codes_count": len(user.get("backup_codes", [])),
                "email_verified": user.get("email_verified", False),
                "can_setup": user.get("email_verified", False) and not user.get("two_factor_enabled", False)
            }
            
        except Exception as e:
            logger.error(f"2FA status error: {e}")
            raise ValidationError("Failed to get 2FA status")
    
    async def generate_backup_codes(self, current_user: dict) -> dict:
        """Generate new backup codes"""
        try:
            if not current_user.get("two_factor_enabled"):
                raise ValidationError("2FA must be enabled to generate backup codes")
            
            # Generate new backup codes
            backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
            
            await self.db.users.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"backup_codes": backup_codes}}
            )
            
            return {
                "backup_codes": backup_codes,
                "message": "New backup codes generated",
                "warning": "Save these codes securely. Your old backup codes are no longer valid."
            }
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Generate backup codes error: {e}")
            raise ValidationError("Failed to generate backup codes")

    def _generate_email_2fa_code(self):
        return f"{secrets.randbelow(1000000):06d}"