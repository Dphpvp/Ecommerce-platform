# backend/captcha/__init__.py
from .verification import verify_recaptcha

__all__ = ['verify_recaptcha']