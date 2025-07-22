# DISABLED - All reCAPTCHA functionality temporarily disabled
# Will be reimplemented fresh for web-only

# import requests
# import os
# import json
# import base64
# import time
# from typing import Optional

def verify_recaptcha(captcha_response: str, remote_ip: Optional[str] = None, request_headers: Optional[dict] = None) -> bool:
    """reCAPTCHA verification DISABLED - returns True for all requests"""
    print("⚠️ CAPTCHA: Verification temporarily disabled - will be reimplemented fresh for web-only")
    print(f"📝 CAPTCHA: Received token: {captcha_response[:50] if captcha_response else 'None'}...")
    return True  # Allow all requests while reCAPTCHA is disabled


# DISABLED - All helper functions commented out
# def _verify_web_recaptcha(captcha_response: str, remote_ip: Optional[str] = None) -> bool:
# def _is_mobile_recaptcha_token(token: str, request_headers: Optional[dict] = None) -> bool:
# def _verify_mobile_recaptcha(captcha_response: str, remote_ip: Optional[str] = None) -> bool:
# def _is_mobile_captcha_token(token: str) -> bool:
# def _verify_mobile_captcha(token: str, request_headers: Optional[dict] = None) -> bool:
# def _verify_production_fallback() -> bool:

# All reCAPTCHA verification functions are disabled and will be reimplemented fresh for web-only
print("📝 reCAPTCHA verification module disabled - all functions return success")