from fastapi import Response, Request
import os

class SessionManager:
    def __init__(self):
        self.environment = os.getenv("ENVIRONMENT", "production")
        self.is_production = self.environment == "production"
    
    def set_session_cookie(self, response: Response, token: str, max_age: int = 7 * 24 * 60 * 60):
        """Set session cookie with proper security settings"""
        response.set_cookie(
            key="session_token",
            value=token,
            max_age=max_age,
            httponly=True,
            secure=self.is_production,  # Only secure in production
            samesite="none" if self.is_production else "lax",
            path="/",
            domain=None
        )
    
    def clear_session_cookie(self, response: Response):
        """Clear session cookie with multiple configurations"""
        configurations = [
            {
                "key": "session_token",
                "path": "/",
                "domain": None,
                "secure": True,
                "httponly": True,
                "samesite": "none"
            },
            {
                "key": "session_token", 
                "path": "/",
                "secure": False,
                "httponly": True,
                "samesite": "lax"
            }
        ]
        
        for config in configurations:
            response.delete_cookie(**config)
    
    def get_session_token(self, request: Request) -> str:
        """Extract session token from request"""
        # Try Authorization header first
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split(" ")[1]
        
        # Try session cookie
        return request.cookies.get("session_token", "")

# Global session manager instance
session_manager = SessionManager()