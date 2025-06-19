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

settings = get_settings()

class TwoFactorService:
    def __init__(self):
        self.db = get_database()
    
    async def setup_2fa(self, request: TwoFactorSetupRequest, current_user: dict) -> TwoFactorSetupResponse:
        if not current_user.get("email_verified"):
            raise ValidationError("Email must be verified before enabling 2FA")
        
        if current_user.get("two_factor_enabled"):
            raise ValidationError("2FA is already enabled")
        
        if request.method == "app":
            secret = pyotp.random_base32()
            
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
                message="Scan QR code with authenticator app",
                expires_in=600
            )
        
        elif request.method == "email":
            await self.db.users.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "two_factor_method": "email",
                        "two_factor_setup_expires": datetime.now(timezone.utc) + timedelta(minutes=10)
                    }
                }
            )
            
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
            
            return TwoFactorSetupResponse(
                method="email",
                message="Verification code sent to your email",
                email_hint=f"***{current_user['email'][-10:]}",
                expires_in=600
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
    
    def _generate_email_2fa_code(self):
        return f"{secrets.randbelow(1000000):06d}"