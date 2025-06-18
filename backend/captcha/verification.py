import requests
import os
from typing import Optional

def verify_recaptcha(captcha_response: str, remote_ip: Optional[str] = None) -> bool:
    """Verify reCAPTCHA response"""
    secret_key = os.getenv("RECAPTCHA_SECRET_KEY")
    
    if not secret_key:
        return False  # Allow in development
    
    if not captcha_response:
        return False
    
    try:
        data = {
            "secret": secret_key,
            "response": captcha_response
        }
        
        if remote_ip:
            data["remoteip"] = remote_ip
        
        response = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data=data,
            timeout=10.0
        )
        
        if response.status_code != 200:
            return False
        
        result = response.json()
        return result.get("success", False)
        
    except Exception:
        return False