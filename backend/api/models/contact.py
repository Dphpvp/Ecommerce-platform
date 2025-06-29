from pydantic import BaseModel, EmailStr, Field, validator
from api.utils.security import SecurityValidator

class ContactRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., max_length=254)
    phone: str = Field(default="", max_length=20)
    message: str = Field(..., min_length=20, max_length=2000)
    send_confirmation: bool = Field(default=False)
    
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