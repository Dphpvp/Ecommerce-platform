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

@lru_cache()
def get_settings() -> Settings:
    return Settings()
