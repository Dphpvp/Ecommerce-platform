# backend/middleware/validation.py - Enhanced version
import re
import html
import bleach
import ipaddress
import urllib.parse
from typing import Any, Dict, List, Union
from fastapi import HTTPException
from pydantic import BaseModel, validator, Field
from email_validator import validate_email, EmailNotValidError

# Allowed HTML tags for rich text (very restrictive)
ALLOWED_TAGS = ['b', 'i', 'u', 'em', 'strong', 'p', 'br']
ALLOWED_ATTRIBUTES = {}

class SecurityValidator:
    """Enhanced security validation and sanitization utilities"""
    
    @staticmethod
    def sanitize_html(text: str) -> str:
        """Remove malicious HTML/XSS with enhanced protection"""
        if not text:
            return ""
        
        # Remove script tags and javascript
        text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
        text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
        
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
        """Enhanced string sanitization"""
        if not text:
            return ""
        
        # Remove null bytes and control characters
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        # Remove potential SQL injection patterns
        sql_patterns = [
            r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)',
            r'(--|\#|\/\*|\*\/)',
            r'(\bOR\b.*=.*\b(OR|AND)\b)',
            r'(\'\s*(OR|AND)\s*\'\w+\'\s*=\s*\'\w+)',
        ]
        
        for pattern in sql_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        # Limit length and trim
        text = text[:max_length].strip()
        
        # HTML escape
        return html.escape(text, quote=False)
    
    @staticmethod
    def validate_email_format(email: str) -> str:
        """Enhanced email validation"""
        try:
            # Basic sanitization first
            email = email.strip().lower()
            
            # Check for suspicious patterns
            if '..' in email or email.startswith('.') or email.endswith('.'):
                raise HTTPException(status_code=400, detail="Invalid email format")
            
            # Validate email format
            valid = validate_email(email)
            
            # Additional checks
            domain = valid.email.split('@')[1]
            if len(domain) > 253 or any(len(part) > 63 for part in domain.split('.')):
                raise HTTPException(status_code=400, detail="Invalid email domain")
            
            return valid.email.lower()
        except EmailNotValidError:
            raise HTTPException(status_code=400, detail="Invalid email format")
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        """Enhanced phone validation"""
        if not phone:
            return ""
        
        # Remove all non-digit characters except + and spaces
        cleaned = re.sub(r'[^\d\+\s\-\(\)]', '', phone)
        
        # Enhanced phone validation
        if not re.match(r'^[\+]?[\d\s\-\(\)]{7,20}$', cleaned):
            raise HTTPException(status_code=400, detail="Invalid phone format")
        
        # Check for obviously fake numbers
        digits_only = re.sub(r'[^\d]', '', cleaned)
        if len(set(digits_only)) == 1:  # All same digits
            raise HTTPException(status_code=400, detail="Invalid phone number")
        
        return cleaned
    
    @staticmethod
    def validate_password_strength(password: str) -> str:
        """Enhanced password validation"""
        if len(password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
        if len(password) > 128:
            raise HTTPException(status_code=400, detail="Password too long")
        
        # Check for common weak passwords
        weak_passwords = [
            'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
            'password123', 'admin123', '12345678', 'qwerty123'
        ]
        if password.lower() in weak_passwords:
            raise HTTPException(status_code=400, detail="Password is too weak")
        
        return password
    
    @staticmethod
    def validate_password_complexity(password: str) -> bool:
        """Check password complexity requirements"""
        if len(password) < 8:
            return False
        
        # Check for at least one of each: uppercase, lowercase, digit, special char
        has_upper = bool(re.search(r'[A-Z]', password))
        has_lower = bool(re.search(r'[a-z]', password))
        has_digit = bool(re.search(r'\d', password))
        has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
        
        return all([has_upper, has_lower, has_digit, has_special])
    
    @staticmethod
    def validate_url(url: str) -> str:
        """Enhanced URL validation"""
        if not url:
            return ""
        
        try:
            # Parse and validate URL
            parsed = urllib.parse.urlparse(url)
            
            # Check scheme
            if parsed.scheme not in ['http', 'https']:
                raise HTTPException(status_code=400, detail="URL must use http or https")
            
            # Check for malicious patterns
            if any(bad in url.lower() for bad in ['javascript:', 'data:', 'vbscript:', 'file:']):
                raise HTTPException(status_code=400, detail="Invalid URL scheme")
            
            # Validate domain
            if not parsed.netloc:
                raise HTTPException(status_code=400, detail="Invalid URL format")
            
            # Check for private/internal IPs if domain is IP
            try:
                ip = ipaddress.ip_address(parsed.netloc.split(':')[0])
                if ip.is_private or ip.is_loopback or ip.is_link_local:
                    raise HTTPException(status_code=400, detail="Private IP addresses not allowed")
            except ValueError:
                pass  # Not an IP, which is fine
            
            return url
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail="Invalid URL format")
    
    @staticmethod
    def validate_image_url(url: str) -> bool:
        """Validate image URL"""
        if not url:
            return False
        
        try:
            SecurityValidator.validate_url(url)
            
            # Check for image file extensions
            valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
            url_lower = url.lower()
            
            # Allow URLs without extensions if they're from trusted domains
            trusted_domains = ['picsum.photos', 'via.placeholder.com', 'images.unsplash.com', 'api.dicebear.com']
            
            parsed = urllib.parse.urlparse(url)
            domain = parsed.netloc.lower()
            
            if any(trusted in domain for trusted in trusted_domains):
                return True
            
            if not any(url_lower.endswith(ext) for ext in valid_extensions):
                return False
            
            return True
            
        except:
            return False
    
    @staticmethod
    def validate_username(username: str) -> str:
        """Enhanced username validation"""
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        
        # Remove whitespace
        username = username.strip()
        
        # Length check
        if len(username) < 3 or len(username) > 50:
            raise HTTPException(status_code=400, detail="Username must be 3-50 characters")
        
        # Character validation (alphanumeric, underscore, hyphen only)
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            raise HTTPException(status_code=400, detail="Username can only contain letters, numbers, underscore, and hyphen")
        
        # Cannot start with numbers or special characters
        if not username[0].isalpha():
            raise HTTPException(status_code=400, detail="Username must start with a letter")
        
        # Check for reserved usernames
        reserved = ['admin', 'root', 'api', 'www', 'mail', 'support', 'test', 'null', 'undefined']
        if username.lower() in reserved:
            raise HTTPException(status_code=400, detail="Username is reserved")
        
        return username.lower()

# Enhanced Pydantic models with stricter validation
class SecureUser(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=254)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
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
        SecurityValidator.validate_password_strength(v)
        if not SecurityValidator.validate_password_complexity(v):
            raise ValueError("Password must contain uppercase, lowercase, number, and special character")
        return v
    
    @validator('full_name')
    def validate_full_name(cls, v):
        sanitized = SecurityValidator.sanitize_string(v, 100)
        if len(sanitized.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return sanitized
    
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
    description: str = Field(..., min_length=10, max_length=2000)
    price: float = Field(..., gt=0, le=999999.99)
    category: str = Field(..., min_length=1, max_length=100)
    image_url: str = Field(..., min_length=1, max_length=500)
    stock: int = Field(..., ge=0, le=999999)
    
    @validator('name')
    def validate_name(cls, v):
        sanitized = SecurityValidator.sanitize_string(v, 200)
        if len(sanitized.strip()) < 1:
            raise ValueError("Product name is required")
        return sanitized
    
    @validator('description')
    def validate_description(cls, v):
        sanitized = SecurityValidator.sanitize_html(v)
        if len(sanitized.strip()) < 10:
            raise ValueError("Description must be at least 10 characters")
        return sanitized
    
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
    email: str = Field(..., max_length=254)
    phone: str = Field(default="", max_length=20)
    message: str = Field(..., min_length=20, max_length=2000)
    
    @validator('name')
    def validate_name(cls, v):
        sanitized = SecurityValidator.sanitize_string(v, 100)
        if len(sanitized.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return sanitized
    
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
        sanitized = SecurityValidator.sanitize_html(v)
        if len(sanitized.strip()) < 20:
            raise ValueError("Message must be at least 20 characters")
        
        # Check for spam indicators
        url_count = len(re.findall(r'http[s]?://|www\.|\w+\.(com|net|org|edu)', sanitized.lower()))
        if url_count > 2:
            raise ValueError("Too many URLs in message")
        
        return sanitized

class SecureUserProfileUpdate(BaseModel):
    full_name: str = Field(None, max_length=100)
    email: str = Field(None, max_length=254)
    phone: str = Field(None, max_length=20)
    address: str = Field(None, max_length=500)
    profile_image_url: str = Field(None, max_length=500)
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if v is not None:
            sanitized = SecurityValidator.sanitize_string(v, 100)
            if len(sanitized.strip()) < 2:
                raise ValueError("Full name must be at least 2 characters")
            return sanitized
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
            if not SecurityValidator.validate_image_url(v):
                raise ValueError("Invalid image URL")
            return SecurityValidator.validate_url(v)
        return v

# Enhanced Rate Limiter with improved tracking
class RateLimiter:
    def __init__(self):
        self.requests = {}
        self.blocked_ips = {}
    
    def is_allowed(self, identifier: str, max_requests: int = 10, window: int = 60) -> bool:
        """Enhanced rate limiting with progressive blocking"""
        import time
        current_time = time.time()
        
        # Check if IP is temporarily blocked
        if identifier in self.blocked_ips:
            if current_time < self.blocked_ips[identifier]:
                return False
            else:
                del self.blocked_ips[identifier]
        
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        # Remove old requests outside the window
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier] 
            if current_time - req_time < window
        ]
        
        # Check if under the limit
        if len(self.requests[identifier]) >= max_requests:
            # Progressive blocking: longer blocks for repeat offenders
            block_duration = min(300 * (len(self.requests[identifier]) // max_requests), 3600)
            self.blocked_ips[identifier] = current_time + block_duration
            return False
        
        # Add current request
        self.requests[identifier].append(current_time)
        return True

rate_limiter = RateLimiter()

def get_client_ip(request) -> str:
    """Enhanced client IP extraction"""
    # Check multiple headers that proxies might use
    headers_to_check = [
        "cf-connecting-ip",      # Cloudflare
        "x-forwarded-for",       # Standard proxy header
        "x-real-ip",             # Nginx
        "x-client-ip",           # Apache
        "x-forwarded",           # Some proxies
        "forwarded-for",         # Some proxies
        "forwarded"              # RFC 7239
    ]
    
    for header in headers_to_check:
        ip = request.headers.get(header)
        if ip:
            # X-Forwarded-For can contain multiple IPs, take the first
            ip = ip.split(',')[0].strip()
            # Validate IP format
            try:
                ipaddress.ip_address(ip)
                return ip
            except ValueError:
                continue
    
    # Fallback to request client
    return request.client.host if request.client else "unknown"