from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from api.utils.security import SecurityValidator

class UserLoginRequest(BaseModel):
    identifier: str = Field(..., description="Email, username, or phone")
    password: str = Field(..., min_length=8, max_length=128)
    recaptcha_response: str = Field(default="NO_CAPTCHA_YET", description="Captcha verification disabled")

class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr = Field(..., max_length=254)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    address: Optional[str] = Field(default="", max_length=500)
    phone: str = Field(..., min_length=10, max_length=20)
    
    @validator('username')
    def validate_username(cls, v):
        return SecurityValidator.validate_username(v)
    
    @validator('email')
    def validate_email(cls, v):
        return SecurityValidator.validate_email_format(v)
    
    @validator('password')
    def validate_password(cls, v):
        SecurityValidator.validate_password_strength(v)
        if not SecurityValidator.validate_password_complexity(v):
            raise ValueError("Password must contain uppercase, lowercase, number, and special character")
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        return SecurityValidator.validate_phone(v)

class GoogleLoginRequest(BaseModel):
    token: str = Field(..., description="Google OAuth token")
    # Optional fields for enhanced client compatibility
    type: Optional[str] = Field(None, description="Token type (optional)")
    platform: Optional[str] = Field(None, description="Platform info (optional)")
    userInfo: Optional[dict] = Field(None, description="User info (optional)")
    
    class Config:
        extra = "ignore"  # Ignore any additional fields

class TwoFactorSetupRequest(BaseModel):
    method: str = Field(..., description="2FA method: 'app' or 'email'")
    
    @validator('method')
    def validate_method(cls, v):
        if v not in ['app', 'email']:
            raise ValueError("Method must be 'app' or 'email'")
        return v

class TwoFactorVerificationRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
    temp_token: Optional[str] = Field(None)

class EmailVerificationRequest(BaseModel):
    token: str = Field(...)

class PasswordResetRequest(BaseModel):
    email: EmailStr = Field(...)
    recaptcha_response: str = Field(default="NO_CAPTCHA_YET")

class PasswordChangeRequest(BaseModel):
    old_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    recaptcha_response: str = Field(default="NO_CAPTCHA_YET")

class TwoFactorSetup(BaseModel):
    code: str

class TwoFactorDisable(BaseModel):
    password: str
    code: str

class ResendVerification(BaseModel):
    email: str