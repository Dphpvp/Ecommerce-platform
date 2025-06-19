from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from api.utils.security import SecurityValidator

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=254)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    profile_image_url: Optional[str] = Field(None, max_length=500)
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if v is not None:
            return SecurityValidator.sanitize_string(v, 100)
        return v
    
    @validator('email')
    def validate_email(cls, v):
        if v is not None:
            return SecurityValidator.validate_email_format(v)
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None and v:
            return SecurityValidator.validate_phone(v)
        return v