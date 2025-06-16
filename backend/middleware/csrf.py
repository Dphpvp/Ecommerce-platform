# backend/middleware/csrf.py
import secrets
import hashlib
import hmac
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import time
import os

CSRF_SECRET = os.getenv("CSRF_SECRET", secrets.token_hex(32))
CSRF_TOKEN_EXPIRY = 3600  # 1 hour

class CSRFProtection:
    def __init__(self):
        self.secret = CSRF_SECRET.encode()
    
    def generate_token(self, session_id: str = None) -> str:
        """Generate CSRF token"""
        timestamp = str(int(time.time()))
        session_id = session_id or secrets.token_hex(16)
        
        # Create token payload
        payload = f"{session_id}:{timestamp}"
        
        # Create HMAC signature
        signature = hmac.new(
            self.secret,
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return f"{payload}:{signature}"
    
    def validate_token(self, token: str, session_id: str = None) -> bool:
        """Validate CSRF token"""
        if not token:
            return False
        
        try:
            parts = token.split(":")
            if len(parts) != 3:
                return False
            
            token_session_id, timestamp, signature = parts
            
            # Check if session matches (if provided)
            if session_id and token_session_id != session_id:
                return False
            
            # Check token expiry
            current_time = int(time.time())
            token_time = int(timestamp)
            
            if current_time - token_time > CSRF_TOKEN_EXPIRY:
                return False
            
            # Verify signature
            payload = f"{token_session_id}:{timestamp}"
            expected_signature = hmac.new(
                self.secret,
                payload.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
            
        except (ValueError, TypeError):
            return False

csrf_protection = CSRFProtection()

async def csrf_middleware(request: Request, call_next):
    """CSRF middleware for FastAPI"""
    
    # Skip CSRF for safe methods and auth endpoints
    safe_methods = {"GET", "HEAD", "OPTIONS"}
    csrf_exempt_paths = {"/api/auth/login", "/api/auth/register", "/api/auth/google"}
    
    if (request.method in safe_methods or 
        request.url.path in csrf_exempt_paths or
        request.url.path.startswith("/api/products") and request.method == "GET"):
        
        response = await call_next(request)
        
        # Add CSRF token to response for future requests
        if request.method == "GET" and not request.url.path.startswith("/api/"):
            csrf_token = csrf_protection.generate_token()
            response.headers["X-CSRF-Token"] = csrf_token
        
        return response
    
    # Check for CSRF token in headers
    csrf_token = request.headers.get("X-CSRF-Token")
    
    if not csrf_token:
        raise HTTPException(
            status_code=403,
            detail="CSRF token missing"
        )
    
    # Get user session from JWT token
    auth_header = request.headers.get("Authorization")
    session_id = None
    
    if auth_header and auth_header.startswith("Bearer "):
        # Extract session info from JWT if needed
        # For now, we'll validate without session_id
        pass
    
    if not csrf_protection.validate_token(csrf_token, session_id):
        raise HTTPException(
            status_code=403,
            detail="Invalid CSRF token"
        )
    
    response = await call_next(request)
    return response