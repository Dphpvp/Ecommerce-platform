# Compatibility layer for legacy imports and authentication functions
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timezone
from bson import ObjectId
from api.core.database import get_database
from api.core.config import get_settings

settings = get_settings()
security = HTTPBearer()

# Create db instance for backward compatibility
db = get_database()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user via Bearer token"""
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_from_session(request: Request) -> dict:
    """Get current user from session cookie or Authorization header"""
    try:
        # Try Authorization header first
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
                user_id = payload.get("user_id")
                if user_id:
                    user = await db.users.find_one({"_id": ObjectId(user_id)})
                    if user:
                        return user
            except jwt.ExpiredSignatureError:
                pass
            except jwt.JWTError:
                pass
        
        # Try session cookie
        session_token = request.cookies.get("session_token")
        if session_token:
            try:
                payload = jwt.decode(session_token, settings.JWT_SECRET, algorithms=["HS256"])
                user_id = payload.get("user_id")
                if user_id:
                    user = await db.users.find_one({"_id": ObjectId(user_id)})
                    if user:
                        return user
            except jwt.ExpiredSignatureError:
                raise HTTPException(status_code=401, detail="Session expired")
            except jwt.JWTError:
                raise HTTPException(status_code=401, detail="Invalid session")
        
        raise HTTPException(status_code=401, detail="Authentication required")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def get_admin_user(current_user: dict = Depends(get_current_user_from_session)):
    """Check if user is admin"""
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Additional compatibility functions
def require_csrf_token(request: Request) -> bool:
    """CSRF validation"""
    from api.middleware.csrf import csrf_protection
    
    if request.method in {"POST", "PUT", "DELETE", "PATCH"}:
        x_csrf_token = request.headers.get("X-CSRF-Token")
        if not x_csrf_token:
            raise HTTPException(status_code=403, detail="CSRF token missing")
        
        if not csrf_protection.validate_token(x_csrf_token, None):
            raise HTTPException(status_code=403, detail="Invalid CSRF token")
    
    return True

async def get_current_user_optional(request: Request):
    """Get current user without requiring authentication"""
    try:
        return await get_current_user_from_session(request)
    except HTTPException:
        return None

# Helper function for creating user response
def create_user_response(token, user):
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]), 
            "email": user["email"], 
            "username": user["username"],
            "full_name": user.get("full_name", ""),
            "address": user.get("address"),
            "phone": user.get("phone"),
            "profile_image_url": user.get("profile_image_url"),
            "is_admin": user.get("is_admin", False),
            "email_verified": user.get("email_verified", False),
            "two_factor_enabled": user.get("two_factor_enabled", False),
            "two_factor_method": user.get("two_factor_method", "app")
        }
    }

__all__ = [
    'get_current_user',
    'get_current_user_from_session',
    'get_admin_user', 
    'require_csrf_token',
    'get_current_user_optional',
    'db',
    'create_user_response'
]