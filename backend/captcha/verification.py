import requests
import os
import json
import base64
import time
from typing import Optional

def verify_recaptcha(captcha_response: str, remote_ip: Optional[str] = None, request_headers: Optional[dict] = None) -> bool:
    """Verify reCAPTCHA response (web) or mobile captcha token"""
    
    if not captcha_response:
        return False
    
    # Check if this is a mobile captcha token (base64 encoded JSON)
    if _is_mobile_captcha_token(captcha_response):
        return _verify_mobile_captcha(captcha_response, request_headers)
    
    # Handle web reCAPTCHA
    return _verify_web_recaptcha(captcha_response, remote_ip)


def _is_mobile_captcha_token(token: str) -> bool:
    """Check if token is a mobile captcha token"""
    try:
        decoded = base64.b64decode(token)
        data = json.loads(decoded)
        return data.get('platform') == 'mobile'
    except:
        return False


def _verify_mobile_captcha(token: str, request_headers: Optional[dict] = None) -> bool:
    """Verify mobile captcha token"""
    try:
        # Check if request is from mobile platform
        if request_headers:
            user_agent = request_headers.get('User-Agent', '').lower()
            capacitor_platform = request_headers.get('X-Capacitor-Platform')
            
            # Allow if from Capacitor mobile app
            if capacitor_platform or 'capacitor' in user_agent:
                # Decode and validate the mobile token
                decoded = base64.b64decode(token)
                data = json.loads(decoded)
                
                # Check token age (valid for 5 minutes)
                timestamp = data.get('timestamp', 0)
                current_time = time.time() * 1000  # Convert to milliseconds
                if current_time - timestamp > 300000:  # 5 minutes
                    return False
                
                # Token is valid for mobile apps
                return True
        
        return False
    except Exception:
        return False


def _verify_web_recaptcha(captcha_response: str, remote_ip: Optional[str] = None) -> bool:
    """Verify web reCAPTCHA response"""
    secret_key = os.getenv("RECAPTCHA_SECRET_KEY")
    
    if not secret_key:
        # Allow in development mode
        return os.getenv("ENVIRONMENT", "production").lower() in ["development", "dev", "local"]
    
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