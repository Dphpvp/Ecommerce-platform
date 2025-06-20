import re
import html
from email_validator import validate_email, EmailNotValidError
from fastapi import HTTPException

class SecurityValidator:
    @staticmethod
    def sanitize_string(text: str, max_length: int = 1000) -> str:
        if not text:
            return ""
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        text = text[:max_length].strip()
        return html.escape(text, quote=False)
    
    @staticmethod
    def sanitize_html(text: str) -> str:
        if not text:
            return ""
        text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
        return html.escape(text, quote=False)
    
    @staticmethod
    def validate_email_format(email: str) -> str:
        try:
            email = email.strip().lower()
            valid = validate_email(email)
            return valid.email.lower()
        except EmailNotValidError:
            raise HTTPException(status_code=400, detail="Invalid email format")
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        if not phone:
            return ""
        cleaned = re.sub(r'[^\d\+\s\-\(\)]', '', phone)
        if not re.match(r'^[\+]?[\d\s\-\(\)]{7,20}$', cleaned):
            raise HTTPException(status_code=400, detail="Invalid phone format")
        return cleaned
    
    @staticmethod
    def validate_username(username: str) -> str:
        if not username:
            raise HTTPException(status_code=400, detail="Username is required")
        
        username = username.strip()
        if len(username) < 3 or len(username) > 50:
            raise HTTPException(status_code=400, detail="Username must be 3-50 characters")
        
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            raise HTTPException(status_code=400, detail="Username contains invalid characters")
        
        return username.lower()
    
    @staticmethod
    def validate_password_strength(password: str) -> str:
        if len(password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        return password
    
    @staticmethod
    def validate_password_complexity(password: str) -> bool:
        has_upper = bool(re.search(r'[A-Z]', password))
        has_lower = bool(re.search(r'[a-z]', password))
        has_digit = bool(re.search(r'\d', password))
        has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
        return all([has_upper, has_lower, has_digit, has_special])
    
    @staticmethod
    def validate_url(url: str) -> str:
        return url
    
    @staticmethod
    def validate_image_url(url: str) -> bool:
        return True
    
    @staticmethod
    def get_identifier_type(identifier: str) -> str:
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        phone_pattern = r'^[\+]?[1-9][\d]{3,14}$'
        
        if re.match(email_pattern, identifier):
            return "email"
        elif re.match(phone_pattern, identifier.replace(" ", "").replace("-", "")):
            return "phone"
        else:
            return "username"