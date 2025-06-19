import secrets
import hashlib
import hmac
import time
import os

CSRF_SECRET = os.getenv("CSRF_SECRET", secrets.token_hex(32))

class CSRFProtection:
    def __init__(self):
        self.secret = CSRF_SECRET.encode()
    
    def generate_token(self, session_id: str = None) -> str:
        timestamp = str(int(time.time()))
        session_id = session_id or secrets.token_hex(16)
        payload = f"{session_id}:{timestamp}"
        signature = hmac.new(self.secret, payload.encode(), hashlib.sha256).hexdigest()
        return f"{payload}:{signature}"
    
    def validate_token(self, token: str, session_id: str = None) -> bool:
        if not token:
            return False
        
        try:
            parts = token.split(":")
            if len(parts) != 3:
                return False
            
            token_session_id, timestamp, signature = parts
            current_time = int(time.time())
            token_time = int(timestamp)
            
            if current_time - token_time > 3600:  # 1 hour expiry
                return False
            
            payload = f"{token_session_id}:{timestamp}"
            expected_signature = hmac.new(self.secret, payload.encode(), hashlib.sha256).hexdigest()
            return hmac.compare_digest(signature, expected_signature)
        except (ValueError, TypeError):
            return False

csrf_protection = CSRFProtection()