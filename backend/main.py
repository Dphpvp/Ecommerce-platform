from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
import stripe
import os
import asyncio

from api.main import router as api_router

# Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://vergishop.vercel.app")
ALLOWED_HOSTS_STR = os.getenv("ALLOWED_HOSTS", "vergishop.vercel.app,vs1.vercel.app,ecommerce-platform-nizy.onrender.com")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STR.split(",") if host.strip()]

# ✅ Strict production CORS
origins = [
    "https://vergishop.vercel.app",
    "https://vs1.vercel.app"
]

# Debug
print("CORS Origins:", origins)

app = FastAPI(
    title="E-commerce API",
    version="1.0.0",
    description="E-commerce Platform API",
    docs_url=None,
    redoc_url=None,
)

# ✅ CORS Middleware (must be first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
        "X-Request-Signature",
        "X-Request-Timestamp",
        "Cache-Control",
        "X-Platform",
        "X-Device-Type"
    ],
    expose_headers=["Set-Cookie"],
    max_age=600,
)

# ⏱️ Timeout Middleware
class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            timeout = 30.0
            if request.url.path.startswith(('/api/uploads', '/api/admin/dashboard')):
                timeout = 60.0
            elif request.url.path.startswith('/api/auth'):
                timeout = 15.0
            return await asyncio.wait_for(call_next(request), timeout=timeout)
        except asyncio.TimeoutError:
            return JSONResponse(
                {"error": "Request timeout", "message": "Request took too long to process"},
                status_code=408
            )

app.add_middleware(TimeoutMiddleware)

# 🧾 COOP Middleware for Checkout
class COOPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.url.path == '/checkout':
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        return response

app.add_middleware(COOPMiddleware)

# 📜 Debugging Requests
@app.middleware("http")
async def debug_middleware(request: Request, call_next):
    print(f"Request: {request.method} {request.url} from {request.headers.get('origin', 'no-origin')}")
    try:
        response = await call_next(request)
        print(f"Response: {response.status_code}")
        return response
    except Exception as e:
        print(f"Error in request processing: {e}")
        raise

# 🔐 Security Headers
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# ✅ Trusted Host Middleware
if ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# 📦 API Router
app.include_router(api_router)

# ✅ Root + Health
@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/status")
async def status():
    return {
        "status": "running",
        "version": "1.0.0",
        "environment": "production",
        "timestamp": datetime.now().isoformat(),
        "cors_origins": origins,
        "middleware_count": len(app.user_middleware),
        "timeout_enabled": True,
    }

# ✅ Handle CORS preflight for CSRF endpoint
@app.options("/api/csrf-token")
async def options_csrf_token():
    return JSONResponse(status_code=200)

# 🔑 CSRF Token endpoint
@app.get("/api/csrf-token")
@app.post("/api/csrf-token")
async def get_csrf_token_compat(request: Request):
    from api.middleware.csrf import csrf_protection
    from jose import jwt
    from api.core.config import get_settings

    settings = get_settings()
    session_id = "anonymous"
    session_token = request.cookies.get("session_token")
    if session_token:
        try:
            payload = jwt.decode(session_token, settings.JWT_SECRET, algorithms=["HS256"])
            session_id = payload.get("user_id", "anonymous")
        except:
            pass

    csrf_token = csrf_protection.generate_token(session_id)
    return {"csrf_token": csrf_token}

# 🧪 Test-only register endpoint
@app.post("/api/auth/register")
async def register(request: Request):
    return {
        "message": "Registration endpoint working",
        "origin": request.headers.get("origin"),
    }

# 🧯 Error Handlers
@app.exception_handler(500)
async def internal_server_error(request: Request, exc: Exception):
    print(f"Internal Server Error: {exc}")
    return JSONResponse(
        {"error": "Internal server error", "message": "Something went wrong"},
        status_code=500
    )

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    print(f"404 Not Found: {request.url}")
    return JSONResponse(
        {"error": "Not found", "message": "The requested resource was not found"},
        status_code=404
    )

@app.exception_handler(408)
async def timeout_handler(request: Request, exc: HTTPException):
    print(f"Request Timeout: {request.url}")
    return JSONResponse(
        {"error": "Request timeout", "message": "Request took too long to process"},
        status_code=408
    )
