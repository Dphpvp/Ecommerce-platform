from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timezone
from bson import ObjectId
from api.core.database import get_database
from api.core.config import get_settings

settings = get_settings()
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user via Bearer token"""
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        db = get_database()
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
    db = get_database()
    
    try:
        # Try Authorization header first (for better compatibility)
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
                pass  # Try cookie next
            except jwt.JWTError:
                pass  # Try cookie next
        
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

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Check if user is admin"""
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user