from fastapi import Depends, HTTPException, Request, status
from jose import jwt, JWTError
from bson import ObjectId
from typing import Optional
from api.core.config import get_settings
from api.core.database import get_database


settings = get_settings()

async def get_current_user_from_session(request: Request) -> dict:
    """Get current user from session cookie or Authorization header"""
    db = get_database()
    
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

async def get_admin_user(current_user: dict = Depends(get_current_user_from_session)) -> dict:
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def require_csrf_token(request: Request) -> bool:
    from api.middleware.csrf import csrf_protection
    
    if request.method in {"POST", "PUT", "DELETE", "PATCH"}:
        x_csrf_token = request.headers.get("X-CSRF-Token")
        if not x_csrf_token:
            raise HTTPException(status_code=403, detail="CSRF token missing")
        
        if not csrf_protection.validate_token(x_csrf_token, None):
            raise HTTPException(status_code=403, detail="Invalid CSRF token")
    
    return True

async def get_current_user_optional(request: Request) -> Optional[dict]:
    """Get current user without requiring authentication."""
    try:
        return await get_current_user_from_session(request)
    except HTTPException:
        return None