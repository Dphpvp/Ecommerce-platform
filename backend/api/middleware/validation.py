from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from fastapi import Request
from api.utils.security import SecurityValidator
from api.middleware.rate_limiter import rate_limiter, get_client_ip

class SecureUser(BaseModel):
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
    
    @validator('full_name')
    def validate_full_name(cls, v):
        return SecurityValidator.sanitize_string(v, 100)
    
    @validator('address')
    def validate_address(cls, v):
        if v:
            return SecurityValidator.sanitize_string(v, 500)
        return ""

class SecureProduct(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    price: float = Field(..., gt=0, le=999999.99)
    category: str = Field(..., min_length=1, max_length=100)
    image_url: str = Field(..., min_length=1, max_length=500)
    stock: int = Field(..., ge=0, le=999999)
    
    @validator('name')
    def validate_name(cls, v):
        return SecurityValidator.sanitize_string(v, 200)
    
    @validator('description')
    def validate_description(cls, v):
        return SecurityValidator.sanitize_html(v)
    
    @validator('category')
    def validate_category(cls, v):
        return SecurityValidator.sanitize_string(v, 100)
    
    @validator('image_url')
    def validate_image_url(cls, v):
        if not SecurityValidator.validate_image_url(v):
            raise ValueError("Invalid image URL")
        return SecurityValidator.validate_url(v)

class SecureContactForm(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., max_length=254)
    phone: str = Field(default="", max_length=20)
    message: str = Field(..., min_length=20, max_length=2000)
    
    @validator('name')
    def validate_name(cls, v):
        return SecurityValidator.sanitize_string(v, 100)
    
    @validator('email')
    def validate_email(cls, v):
        return SecurityValidator.validate_email_format(v)
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            return SecurityValidator.validate_phone(v)
        return ""
    
    @validator('message')
    def validate_message(cls, v):
        return SecurityValidator.sanitize_html(v)

class SecureUserProfileUpdate(BaseModel):
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

# Export the functions and classes needed by api.py
__all__ = [
    'SecureUser', 
    'SecureProduct', 
    'SecureContactForm', 
    'SecureUserProfileUpdate', 
    'SecurityValidator', 
    'rate_limiter', 
    'get_client_ip'
]