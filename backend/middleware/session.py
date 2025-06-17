# backend/middleware/session.py - Fixed version
import hmac
import hashlib
import time
import secrets
from fastapi import HTTPException, Request, Response
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
import os

JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-key")
SESSION_SECRET = os.getenv("SESSION_SECRET", secrets.token_hex(32))

# Fixed cookie domain configuration
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN")  # Will be None for localhost
SECURE_COOKIES = os.getenv("ENVIRONMENT") == "production"

class SecureSessionManager:
    def __init__(self):
        self.secret = SESSION_SECRET.encode()
        
    def create_session_token(self, user_id: str, expires_in: timedelta = timedelta(hours=8)) -> str:
        """Create JWT token for session"""
        payload = {
            "user_id": user_id,
            "exp": datetime.now(timezone.utc) + expires_in,
            "iat": datetime.now(timezone.utc),
            "session_id": secrets.token_hex(16)
        }
        return jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    
    def set_session_cookie(self, response: Response, token: str):
    """Set session cookie for cross-domain"""
    cookie_kwargs = {
        "key": "session_token", 
        "value": token,
        "max_age": 8 * 60 * 60,
        "httponly": True,
        "secure": True,  # Must be True for cross-domain
        "samesite": "none",  # Required for cross-domain
    }
    response.set_cookie(**cookie_kwargs)
    
    def clear_session_cookie(self, response: Response):
        """Clear session cookie"""
        cookie_kwargs = {
            "key": "session_token",
            "secure": SECURE_COOKIES,
            "httponly": True,
            "samesite": "strict" if SECURE_COOKIES else "lax"
        }
        
        if COOKIE_DOMAIN and SECURE_COOKIES:
            cookie_kwargs["domain"] = COOKIE_DOMAIN
            
        response.delete_cookie(**cookie_kwargs)
    
    def get_session_token(self, request: Request) -> str:
        """Extract token from cookie or Authorization header"""
        # Try cookie first
        token = request.cookies.get("session_token")
        if token:
            return token
            
        # Fallback to Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split(" ")[1]
            
        raise HTTPException(status_code=401, detail="No session token")
    
    def verify_session_token(self, token: str) -> dict:
        """Verify and decode session token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Session expired")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid session")

# Request signing for API security
class RequestSigner:
    def __init__(self):
        self.secret = SESSION_SECRET.encode()
    
    def sign_request(self, method: str, path: str, body: str, timestamp: int) -> str:
        """Create HMAC signature for request"""
        message = f"{method}|{path}|{body}|{timestamp}"
        signature = hmac.new(
            self.secret,
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def verify_request(self, request: Request, body: str = "") -> bool:
        """Verify request signature"""
        signature = request.headers.get("X-Request-Signature")
        timestamp = request.headers.get("X-Request-Timestamp")
        
        if not signature or not timestamp:
            return False
        
        try:
            timestamp_int = int(timestamp)
            current_time = int(time.time())
            
            # Check timestamp is within 5 minutes
            if abs(current_time - timestamp_int) > 300:
                return False
            
            expected_signature = self.sign_request(
                request.method,
                str(request.url.path),
                body,
                timestamp_int
            )
            
            return hmac.compare_digest(signature, expected_signature)
        except (ValueError, TypeError):
            return False

session_manager = SecureSessionManager()
request_signer = RequestSigner()

# Updated dependencies
async def get_current_user_from_session(request: Request):
    """Get current user from session cookie"""
    from database.connection import db
    from bson import ObjectId
    
    try:
        token = session_manager.get_session_token(request)
        payload = session_manager.verify_session_token(token)
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Session verification error: {e}")
        raise HTTPException(status_code=401, detail="Session verification failed")

async def verify_request_signature(request: Request, body: str = ""):
    """Middleware to verify request signatures"""
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        if not request_signer.verify_request(request, body):
            raise HTTPException(status_code=403, detail="Invalid request signature")
    return True