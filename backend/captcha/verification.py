# backend/captcha/verification.py
import httpx
import os
from typing import Optional

RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

async def verify_recaptcha(captcha_response: str, remote_ip: Optional[str] = None) -> bool:
    """
    Verify reCAPTCHA response with Google's API
    
    Args:
        captcha_response: The response token from reCAPTCHA
        remote_ip: Optional IP address of the user
    
    Returns:
        bool: True if verification successful, False otherwise
    """
    secret_key = os.getenv("RECAPTCHA_SECRET_KEY")
    
    if not secret_key:
        print("⚠️ RECAPTCHA_SECRET_KEY not configured")
        return False
    
    if not captcha_response:
        return False
    
    try:
        data = {
            "secret": secret_key,
            "response": captcha_response
        }
        
        if remote_ip:
            data["remoteip"] = remote_ip
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                RECAPTCHA_VERIFY_URL,
                data=data,
                timeout=10.0
            )
            
            if response.status_code != 200:
                print(f"❌ reCAPTCHA API error: {response.status_code}")
                return False
            
            result = response.json()
            success = result.get("success", False)
            
            if not success:
                error_codes = result.get("error-codes", [])
                print(f"❌ reCAPTCHA verification failed: {error_codes}")
            
            return success
            
    except httpx.TimeoutException:
        print("❌ reCAPTCHA verification timeout")
        return False
    except Exception as e:
        print(f"❌ reCAPTCHA verification error: {str(e)}")
        return False