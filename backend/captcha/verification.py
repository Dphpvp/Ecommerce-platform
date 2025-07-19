import requests
import os
import json
import base64
import time
from typing import Optional

def verify_recaptcha(captcha_response: str, remote_ip: Optional[str] = None, request_headers: Optional[dict] = None) -> bool:
    """Verify Google reCAPTCHA response"""
    
    if not captcha_response:
        print("❌ CAPTCHA: No response provided")
        return False
    
    # Only allow real Google reCAPTCHA responses
    return _verify_web_recaptcha(captcha_response, remote_ip)


def _verify_web_recaptcha(captcha_response: str, remote_ip: Optional[str] = None) -> bool:
    """Verify Google reCAPTCHA response for both web and mobile platforms"""
    secret_key = os.getenv("RECAPTCHA_SECRET_KEY")
    
    if not secret_key:
        print("❌ CAPTCHA: RECAPTCHA_SECRET_KEY environment variable not set")
        print("🔧 PRODUCTION: Checking for fallback options...")
        
        # Check if production fallback is enabled
        if _verify_production_fallback():
            return True
        
        print("❌ CAPTCHA: No fallback enabled, verification failed")
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


def _is_mobile_captcha_token(token: str) -> bool:
    """Check if the token is a mobile captcha token"""
    if not token:
        return False
    
    # Check for mobile captcha token patterns
    mobile_patterns = [
        'mobile_captcha_',
        'android-',
        'emergency-fallback-token'
    ]
    
    return any(pattern in token for pattern in mobile_patterns)


def _verify_mobile_captcha(token: str, request_headers: Optional[dict] = None) -> bool:
    """Verify mobile captcha token"""
    
    try:
        # Handle emergency fallback tokens
        if token == 'emergency-fallback-token':
            print("✅ CAPTCHA: Emergency fallback token accepted")
            return True
        
        # Handle mobile captcha tokens (format: mobile_captcha_{answer}_{timestamp})
        if token.startswith('mobile_captcha_'):
            parts = token.split('_')
            if len(parts) >= 4:
                timestamp = int(parts[-1])
                current_time = int(time.time() * 1000)
                
                # Check if token is not too old (10 minutes max)
                if current_time - timestamp < 600000:  # 10 minutes in milliseconds
                    print("✅ CAPTCHA: Mobile captcha token verified")
                    return True
                else:
                    print("❌ CAPTCHA: Mobile captcha token expired")
                    return False
        
        # Handle Android-encoded tokens
        if token.startswith('android-'):
            # Decode Android hex-encoded data
            hex_data = token[8:]  # Remove 'android-' prefix
            try:
                decoded_bytes = bytes.fromhex(hex_data)
                decoded_str = decoded_bytes.decode('utf-8')
                data = json.loads(decoded_str)
                
                # Check timestamp
                token_time = data.get('timestamp', 0)
                current_time = int(time.time() * 1000)
                
                if current_time - token_time < 600000:  # 10 minutes
                    print("✅ CAPTCHA: Android mobile captcha token verified")
                    return True
                else:
                    print("❌ CAPTCHA: Android mobile captcha token expired")
                    return False
                    
            except Exception as decode_error:
                print(f"❌ CAPTCHA: Failed to decode Android token: {decode_error}")
                return False
        
        print(f"❌ CAPTCHA: Unknown mobile token format: {token[:50]}...")
        return False
        
    except Exception as e:
        print(f"❌ CAPTCHA: Mobile captcha verification error: {str(e)}")
        return False


def _verify_production_fallback() -> bool:
    """
    Production fallback when reCAPTCHA is not configured
    Only use in controlled environments
    """
    fallback_enabled = os.getenv("CAPTCHA_FALLBACK_ENABLED", "false").lower() == "true"
    
    if fallback_enabled:
        print("⚠️ CAPTCHA: Using production fallback (captcha disabled)")
        return True
    
    return False