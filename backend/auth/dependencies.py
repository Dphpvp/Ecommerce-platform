# backend/dependencies.py - FIXED Authentication Dependencies
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from bson import ObjectId
import os
from database.connection import db

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-key")
security = HTTPBearer()

# FIXED: Use OAuth2PasswordBearer instead of HTTPBearer to avoid 403 bug
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

async def get_current_user_from_session(request: Request):
    """Get current user from session cookie - FIXED for proper error handling"""
    try:
        # Try session cookie first
        session_token = request.cookies.get("session_token")
        
        if session_token:
            try:
                payload = jwt.decode(session_token, JWT_SECRET, algorithms=["HS256"])
                user_id = payload.get("user_id")
                
                if not user_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid session token",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                user = await db.users.find_one({"_id": ObjectId(user_id)})
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User not found",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                return user
                
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            except jwt.JWTError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid session token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        # Fallback to Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                user_id = payload.get("user_id")
                
                if not user_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid token",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                user = await db.users.find_one({"_id": ObjectId(user_id)})
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User not found",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                return user
                
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            except jwt.JWTError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        # No authentication found
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current authenticated user from JWT token - FIXED for 401 errors"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_optional(request: Request):
    """Get current user without requiring authentication"""
    try:
        return await get_current_user_from_session(request)
    except HTTPException:
        return None

async def get_admin_user(current_user: dict = Depends(get_current_user_from_session)):
    """Check if user is admin - FIXED to use session-based auth"""
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# FIXED: Flexible authentication for different endpoints
# async def get_current_user_flexible(request: Request):
#     """Get user from session cookie or authorization header - FIXED"""
#     try:
#         return await get_current_user_from_session(request)
#     except HTTPException as e:
#         # Re-raise with proper status code
#         if e.status_code == 401:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Authentication failed",
#                 headers={"WWW-Authenticate": "Bearer"},
#             )
#         raise e

# Alternative function for backward compatibility
async def get_current_user_from_cookie_or_header(request: Request):
    """Alias for get_current_user_flexible"""
    return await get_current_user_flexible(request)

async def get_current_user_flexible(request: Request):
    """Get current user from session cookie or Authorization header"""
    try:
        # Try Authorization header first (for better compatibility)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
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
                payload = jwt.decode(session_token, JWT_SECRET, algorithms=["HS256"])
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