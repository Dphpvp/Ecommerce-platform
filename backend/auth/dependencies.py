# backend/dependencies.py - Fixed and consolidated version
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from bson import ObjectId
import os

# Import database from your database connection file
from database.connection import db

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-key")

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
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

async def get_current_user_optional(request: Request):
    """Get current user without requiring authentication"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        
        if user_id:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            return user
    except:
        pass
    return None

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Check if user is admin"""
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_current_user_from_cookie_or_header(request: Request):
    """Get user from session cookie or authorization header"""
    try:
        # Try session manager first
        from middleware.session import session_manager
        
        try:
            token = session_manager.get_session_token(request)
            payload = session_manager.verify_session_token(token)
            
            user_id = payload.get("user_id")
            if user_id:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
                if user:
                    return user
        except:
            pass
        
        # Fallback to JWT header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("user_id")
            
            if user_id:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
                if user:
                    return user
        
        raise HTTPException(status_code=401, detail="Authentication required")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")