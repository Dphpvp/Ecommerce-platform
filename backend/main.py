from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
import stripe
import os
import asyncio

# Try importing the API router (main suspect)
from api.main import router as api_router

# Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://vergishop.vercel.app")
ALLOWED_HOSTS_STR = os.getenv("ALLOWED_HOSTS", "vergishop.vercel.app,vs1.vercel.app,ecommerce-platform-nizy.onrender.com")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STR.split(",") if host.strip()]

# Create FastAPI app
app = FastAPI(
    title="E-commerce API", 
    version="1.0.0",
    description="E-commerce Platform API"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vergishop.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Timeout middleware (suspect for memory corruption)
class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            # Different timeouts for different endpoints
            timeout = 30.0  # Default 30 seconds
            
            if request.url.path.startswith(('/api/uploads', '/api/admin/dashboard')):
                timeout = 60.0  # 60 seconds for uploads and dashboard
            elif request.url.path.startswith('/api/auth'):
                timeout = 15.0  # 15 seconds for auth endpoints
            
            return await asyncio.wait_for(call_next(request), timeout=timeout)
        except asyncio.TimeoutError:
            return JSONResponse(
                {"error": "Request timeout", "message": "Request took too long to process"}, 
                status_code=408
            )

app.add_middleware(TimeoutMiddleware)

# Simple security headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

# Add TrustedHostMiddleware
if ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# Include the API router (major suspect for memory corruption)
app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}

# Basic CSRF token endpoint for testing
@app.get("/api/csrf-token")
async def get_csrf_token():
    return {"csrf_token": "test-token-123"}

# Basic register endpoint for testing
@app.post("/api/auth/register")
async def register(request: Request):
    return {"message": "Registration endpoint working", "origin": request.headers.get("origin")}