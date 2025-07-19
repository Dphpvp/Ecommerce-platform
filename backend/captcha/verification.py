import requests
import os
import json
import base64
import time
from typing import Optional

def verify_recaptcha(captcha_response: str, remote_ip: Optional[str] = None, request_headers: Optional[dict] = None) -> bool:
    """Verify Google reCAPTCHA response for both web and mobile platforms"""
    
    if not captcha_response:
        print("❌ CAPTCHA: No response provided")
        return False
    
    # Handle Google reCAPTCHA for all platforms (web and mobile)
    return _verify_web_recaptcha(captcha_response, remote_ip)


def _verify_web_recaptcha(captcha_response: str, remote_ip: Optional[str] = None) -> bool:
    """Verify Google reCAPTCHA response for both web and mobile platforms"""
    secret_key = os.getenv("RECAPTCHA_SECRET_KEY")
    
    if not secret_key:
        print("❌ CAPTCHA: RECAPTCHA_SECRET_KEY environment variable not set")
        print("🔧 PRODUCTION: This is required for production deployment on Render")
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
            print(f"❌ CAPTCHA: Google API returned status {response.status_code}")
            return False
        
        result = response.json()
        success = result.get("success", False)
        
        if not success:
            error_codes = result.get("error-codes", [])
            print(f"❌ CAPTCHA: Verification failed - {error_codes}")
        else:
            print("✅ CAPTCHA: Verification successful")
            
        return success
        
    except Exception as e:
        print(f"❌ CAPTCHA: Exception during verification - {str(e)}")
        return False