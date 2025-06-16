# backend/middleware/validation.py
import re
import html
import bleach
from typing import Any, Dict, List, Union
from fastapi import HTTPException
from pydantic import BaseModel, validator, Field
from email_validator import validate_email, EmailNotValidError

# Allowed HTML tags for rich text (very restrictive)
ALLOWED_TAGS = ['b', 'i', 'u', 'em', 'strong', 'p', 'br']
ALLOWED_ATTRIBUTES = {}

class SecurityValidator:
    """Security validation and sanitization utilities"""
    
    @staticmethod
    def sanitize_html(text: str) -> str:
        """Remove malicious HTML/XSS"""
        if not text:
            return ""
        
        # Use bleach to sanitize HTML
        sanitized = bleach.clean(
            text, 
            tags=ALLOWED_TAGS, 
            attributes=ALLOWED_ATTRIBUTES,
            strip=True
        )
        
        # Additional HTML entity encoding
        return html.escape(sanitized, quote=False)
    
    @staticmethod
    def sanitize_string(text: str, max_length: int = 1000) -> str:
        """Basic string sanitization"""
        if not text:
            return ""
        
        # Remove null bytes and control characters
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        # Limit length
        text = text[:max_length]
        
        # HTML escape
        return html.escape(text.strip(), quote=False)
    
    @staticmethod
    def validate_email_format(email: str) -> str:
        """Validate and sanitize email"""
        try:
            # Validate email format
            valid = validate_email(email)
            return valid.email.lower()
        except EmailNotValidError:
            raise HTTPException(status_code=400, detail="Invalid email format")
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        """Validate phone number format"""
        if not phone:
            return ""
        
        # Remove all non-digit characters except + and spaces
        cleaned = re.sub(r'[^\d\+\s\-\(\)]', '', phone)
        
        # Basic phone validation (adjust regex as needed)
        if not re.match(r'^[\+]?[\d\s\-\(\)]{7,20}$', cleaned):
            raise HTTPException(status_code=400, detail="Invalid phone format")
        
        return cleaned
    
    @staticmethod
    def validate_password_strength(password: str) -> str:
        """Validate password strength"""
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        if len(password) > 128:
            raise HTTPException(status_code=400, detail="Password too long")
        
        # Check for common weak passwords
        weak_passwords = ['password', '123456', 'qwerty', 'admin', 'letmein']
        if password.lower() in weak_passwords:
            raise HTTPException(status_code=400, detail="Password is too weak")
        
        return password
    
    @staticmethod
    def validate_url(url: str) -> str:
        """Validate URL format"""
        if not url:
            return ""
        
        # Basic URL validation
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        if not url_pattern.match(url):
            raise HTTPException(status_code=400, detail="Invalid URL format")
        
        # Prevent javascript: and data: URLs
        if url.lower().startswith(('javascript:', 'data:', 'vbscript:')):
            raise HTTPException(status_code=400, detail="Invalid URL scheme")
        
        return url
    
    @staticmethod
    def validate_username(username: str) -> str:
        """Validate username format"""
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        
        # Remove whitespace
        username = username.strip()
        
        # Length check
        if len(username) < 3 or len(username) > 50:
            raise HTTPException(status_code=400, detail="Username must be 3-50 characters")
        
        # Character validation (alphanumeric, underscore, hyphen)
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            raise HTTPException(status_code=400, detail="Username can only contain letters, numbers, underscore, and hyphen")
        
        return username.lower()

# Enhanced Pydantic models with validation
class SecureUser(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=254)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=100)
    address: str = Field(default="", max_length=500)
    phone: str = Field(default="", max_length=20)
    
    @validator('username')
    def validate_username(cls, v):
        return SecurityValidator.validate_username(v)
    
    @validator('email')
    def validate_email(cls, v):
        return SecurityValidator.validate_email_format(v)
    
    @validator('password')
    def validate_password(cls, v):
        return SecurityValidator.validate_password_strength(v)
    
    @validator('full_name')
    def validate_full_name(cls, v):
        return SecurityValidator.sanitize_string(v, 100)
    
    @validator('address')
    def validate_address(cls, v):
        return SecurityValidator.sanitize_string(v, 500)
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            return SecurityValidator.validate_phone(v)
        return ""

class SecureProduct(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
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
        return SecurityValidator.validate_url(v)

class SecureContactForm(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., max_length=254)
    phone: str = Field(default="", max_length=20)
    message: str = Field(..., min_length=10, max_length=2000)
    
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
    full_name: str = Field(None, max_length=100)
    email: str = Field(None, max_length=254)
    phone: str = Field(None, max_length=20)
    address: str = Field(None, max_length=500)
    profile_image_url: str = Field(None, max_length=500)
    
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
    
    @validator('address')
    def validate_address(cls, v):
        if v is not None:
            return SecurityValidator.sanitize_string(v, 500)
        return v
    
    @validator('profile_image_url')
    def validate_profile_image_url(cls, v):
        if v is not None and v:
            return SecurityValidator.validate_url(v)
        return v

# Rate limiting helper
class RateLimiter:
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, identifier: str, max_requests: int = 10, window: int = 60) -> bool:
        """Simple in-memory rate limiting"""
        import time
        current_time = time.time()
        
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        # Remove old requests outside the window
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier] 
            if current_time - req_time < window
        ]
        
        # Check if under the limit
        if len(self.requests[identifier]) >= max_requests:
            return False
        
        # Add current request
        self.requests[identifier].append(current_time)
        return True

rate_limiter = RateLimiter()

def get_client_ip(request) -> str:
    """Get client IP from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"