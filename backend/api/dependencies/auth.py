from fastapi import Depends, HTTPException, Request, status
from jose import jwt, JWTError
from bson import ObjectId
from typing import Optional
from api.core.config import get_settings
from api.core.database import get_database

settings = get_settings()

async def get_current_user_from_session(request: Request) -> dict:
    db = get_database()
    
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        payload = jwt.decode(session_token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid session token")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid session token")

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