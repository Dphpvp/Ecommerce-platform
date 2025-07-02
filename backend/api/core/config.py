from pydantic_settings import BaseSettings  # ✅ Correct
from functools import lru_cache
import os

class Settings(BaseSettings):
    MONGODB_URL: str = os.getenv("MONGODB_URL", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-jwt-secret")
    CSRF_SECRET: str = os.getenv("CSRF_SECRET", "your-csrf-secret")
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    RECAPTCHA_SECRET_KEY: str = os.getenv("RECAPTCHA_SECRET_KEY", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    EMAIL_HOST: str = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT: int = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USER: str = os.getenv("EMAIL_USER", "")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        env_file = ".env"
        case_sensitive = True
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate required fields in production
        if self.ENVIRONMENT == "production":
            required = ["MONGODB_URL", "JWT_SECRET", "EMAIL_USER"]
            missing = [field for field in required if not getattr(self, field)]
            if missing:
                raise ValueError(f"Missing required env vars: {missing}")
        
        # Validate JWT secret strength
        if len(self.JWT_SECRET) < 32:
            if self.ENVIRONMENT == "production":
                raise ValueError("JWT_SECRET must be at least 32 characters in production")
            print("⚠️ Warning: JWT_SECRET should be at least 32 characters")
        
        # Validate email configuration
        if self.EMAIL_USER and not self.EMAIL_PASSWORD:
            print("⚠️ Warning: EMAIL_USER set but EMAIL_PASSWORD missing")
        
        # Validate URLs
        if not self.FRONTEND_URL.startswith(('http://', 'https://')):
            raise ValueError("FRONTEND_URL must start with http:// or https://")

@lru_cache()
def get_settings() -> Settings:
    return Settings()