import requests
import os
import json
import base64
import time
from typing import Optional

def verify_recaptcha(captcha_response: str, remote_ip: Optional[str] = None, request_headers: Optional[dict] = None) -> bool:
    """Verify reCAPTCHA response (web) or mobile captcha token"""
    
    if not captcha_response:
        print("❌ CAPTCHA: No response provided")
        # Check if this is a mobile request and allow mobile captcha fallback
        if request_headers:
            user_agent = request_headers.get('User-Agent', '').lower()
            capacitor_platform = request_headers.get('X-Capacitor-Platform')
            mobile_app_header = request_headers.get('X-Mobile-App')
            
            if capacitor_platform or mobile_app_header or 'capacitor' in user_agent or 'android' in user_agent:
                print("📱 MOBILE: Allowing mobile platform without explicit captcha")
                return True
        
        return False
    
    # Emergency fallback token for debugging mobile issues
    if captcha_response == 'emergency-fallback-token':
        print("🔧 DEBUG: Using emergency fallback token")
        # Only allow from mobile apps during debugging
        if request_headers:
            user_agent = request_headers.get('User-Agent', '').lower()
            capacitor_platform = request_headers.get('X-Capacitor-Platform')
            mobile_app_header = request_headers.get('X-Mobile-App')
            
            if capacitor_platform or mobile_app_header or 'capacitor' in user_agent:
                print("✅ DEBUG: Emergency fallback accepted for mobile app")
                return True
        
        print("❌ DEBUG: Emergency fallback rejected - not from mobile app")
        return False
    
    # Check if this is a mobile captcha token (base64 encoded JSON)
    if _is_mobile_captcha_token(captcha_response):
        return _verify_mobile_captcha(captcha_response, request_headers)
    
    # Handle web reCAPTCHA
    return _verify_web_recaptcha(captcha_response, remote_ip)


def _is_mobile_captcha_token(token: str) -> bool:
    """Check if token is a mobile captcha token"""
    try:
        # Check for Android-safe encoding first
        if token.startswith('android-'):
            return True
            
        # Check standard base64 encoding
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
            android_webview = request_headers.get('X-Android-WebView')
            
            # Allow if from Capacitor mobile app or Android WebView
            is_mobile_app = (capacitor_platform or 
                           android_webview or 
                           'capacitor' in user_agent or
                           'android' in user_agent)
            
            if is_mobile_app:
                # Handle Android-safe encoding
                if token.startswith('android-'):
                    return _verify_android_safe_token(token, request_headers)
                
                # Handle standard base64 encoding
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
    except Exception as e:
        print(f"❌ Mobile captcha verification failed: {e}")
        return False


def _verify_android_safe_token(token: str, request_headers: Optional[dict] = None) -> bool:
    """Verify Android-safe encoded token"""
    try:
        # Remove 'android-' prefix
        hex_data = token[8:]
        
        # Decode hex to string
        decoded_str = ''
        for i in range(0, len(hex_data), 2):
            hex_char = hex_data[i:i+2]
            if len(hex_char) == 2:
                decoded_str += chr(int(hex_char, 16))
        
        # Parse JSON
        data = json.loads(decoded_str)
        
        # Validate timestamp (5 minutes)
        timestamp = data.get('timestamp', 0)
        current_time = time.time() * 1000
        if current_time - timestamp > 300000:
            return False
        
        # Validate platform
        if data.get('platform') != 'mobile':
            return False
        
        print(f"✅ Android-safe token verified successfully")
        return True
        
    except Exception as e:
        print(f"❌ Android-safe token verification failed: {e}")
        return False


def _verify_web_recaptcha(captcha_response: str, remote_ip: Optional[str] = None) -> bool:
    """Verify web reCAPTCHA response"""
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