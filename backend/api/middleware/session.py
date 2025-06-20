from fastapi import Response
import os

class SessionManager:
    def __init__(self):
        self.environment = os.getenv("ENVIRONMENT", "production")
    
    def set_session_cookie(self, response: Response, token: str, max_age: int = 7 * 24 * 60 * 60):
        """Set session cookie with proper security settings"""
        response.set_cookie(
            key="session_token",
            value=token,
            max_age=max_age,
            httponly=True,
            secure=True,  # Always secure for production
            samesite="none" if self.environment == "production" else "lax",
            path="/",
            domain=None  # Let browser set domain
        )
    
    def clear_session_cookie(self, response: Response):
        """Clear session cookie"""
        # Clear with multiple configurations to ensure it's removed
        response.delete_cookie(
            key="session_token",
            path="/",
            domain=None,
            secure=True,
            httponly=True,
            samesite="none"
        )
        
        # Also try clearing without domain specification
        response.delete_cookie(
            key="session_token",
            path="/",
            secure=True,
            httponly=True,
            samesite="none"
        )

# Global session manager instance
session_manager = SessionManager()