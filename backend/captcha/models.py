# backend/captcha/models.py
from pydantic import BaseModel
from typing import Optional

class CaptchaVerification(BaseModel):
    """Model for CAPTCHA verification request"""
    captcha_response: str
    remote_ip: Optional[str] = None

class CaptchaResult(BaseModel):
    """Model for CAPTCHA verification result"""
    success: bool
    challenge_ts: Optional[str] = None
    hostname: Optional[str] = None
    error_codes: Optional[list] = None