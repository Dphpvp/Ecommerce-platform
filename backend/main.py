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

# Initialize FastAPI
app = FastAPI(
    title="E-commerce API",
    version="1.0.0",
    description="E-commerce Platform API",
    docs_url=None,
    redoc_url=None,
)

# Include only the main API router (admin routes are already included in api_router)
app.include_router(api_router)

# Timeout middleware
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

# Security middleware (disabled for local development)
if ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# CORS configuration
origins = [
    "https://vergishop.vercel.app",
    "https://vs1.vercel.app"
]

if FRONTEND_URL and FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)

# Always include production frontend URL
origins.extend(["https://vergishop.vercel.app"])

# Add mobile origins for Capacitor (production only)
mobile_origins = [
    "https://vergishop.vercel.app"
]
origins.extend(mobile_origins)

# Debug CORS configuration
print("CORS Origins:", origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vergishop.vercel.app"],  # Exact domain required for credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# COOP middleware for checkout authentication
class COOPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        if request.url.path.startswith(('/checkout', '/auth', '/payment', '/api/auth')):
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        else:
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        
        return response

app.add_middleware(COOPMiddleware)

# Basic health check endpoint (no middleware dependencies)
@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "ok", "message": "Server is running"}

# Let CORSMiddleware handle OPTIONS requests automatically

# Debug middleware to log requests
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

# Security headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    if request.url.path.startswith(('/checkout', '/payment')):
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://accounts.google.com https://js.stripe.com; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' " + " ".join(origins) + " https://api.stripe.com; "
            "frame-src 'self' https://accounts.google.com https://js.stripe.com; "
            "object-src 'none'"
        )
    else:
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://accounts.google.com; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' " + " ".join(origins) + "; "
            "frame-src 'self' https://accounts.google.com; "
            "object-src 'none'"
        )
    response.headers["Content-Security-Policy"] = csp
    
    return response

# Stripe configuration
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# Health check endpoints
@app.get("/")
@app.head("/")
async def root():
    return {
        "message": "E-commerce API is running", 
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    email_configured = bool(os.getenv("EMAIL_USER") and os.getenv("EMAIL_PASSWORD"))
    mongodb_configured = bool(os.getenv("MONGODB_URL"))
    
    return {
        "status": "healthy",
        "email_configured": email_configured,
        "mongodb_configured": mongodb_configured,
        "frontend_url": FRONTEND_URL,
        "cors_origins": origins,
        "credentials_enabled": True,
        "timeout_enabled": True,
        "timestamp": datetime.now().isoformat()
    }

# CSRF Token endpoint for anonymous users
@app.get("/api/csrf-token")
@app.post("/api/csrf-token")
async def get_csrf_token_compat(request: Request):
    """CSRF token endpoint supporting anonymous users"""
    from api.middleware.csrf import csrf_protection
    from jose import jwt
    from api.core.config import get_settings
    
    settings = get_settings()
    session_id = "anonymous"
    
    # Try to get session if available
    session_token = request.cookies.get("session_token")
    if session_token:
        try:
            payload = jwt.decode(session_token, settings.JWT_SECRET, algorithms=["HS256"])
            session_id = payload.get("user_id", "anonymous")
        except:
            pass
    
    csrf_token = csrf_protection.generate_token(session_id)
    return {"csrf_token": csrf_token}

# Global exception handlers
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
        {"error": "Not found", "path": str(request.url), "message": "Endpoint not found"}, 
        status_code=404
    )

@app.exception_handler(408)
async def timeout_handler(request: Request, exc: HTTPException):
    print(f"Request Timeout: {request.url}")
    return JSONResponse(
        {"error": "Request timeout", "message": "Request took too long to process"}, 
        status_code=408
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    print("E-commerce Backend Starting Up...")
    print("=" * 50)
    
    try:
        from api.core.database import get_database
        db = get_database()
        
        # Check and create indexes safely
        async def ensure_index(collection, index_spec, options=None):
            options = options or {}
            try:
                existing_indexes = await collection.list_indexes().to_list(None)
                index_names = [idx['name'] for idx in existing_indexes]
                
                # Generate expected index name
                if isinstance(index_spec, list):
                    expected_name = "_".join([f"{field}_{direction}" for field, direction in index_spec])
                else:
                    expected_name = f"{index_spec}_1"
                
                if expected_name not in index_names:
                    await collection.create_index(index_spec, **options)
                    
            except Exception as e:
                if "already exists" not in str(e).lower():
                    print(f"⚠️ Index warning: {e}")
        
        # Create indexes
        await ensure_index(db.products, "category")
        await ensure_index(db.products, "name") 
        await ensure_index(db.products, "price")
        await ensure_index(db.products, [("name", "text"), ("description", "text")])
        await ensure_index(db.users, "email", {"unique": True})
        await ensure_index(db.users, "username", {"unique": True})
        await ensure_index(db.orders, "user_id")
        await ensure_index(db.orders, "status")
        await ensure_index(db.orders, "created_at")
        await ensure_index(db.orders, "order_number", {"unique": True})
        await ensure_index(db.cart, "user_id")
        await ensure_index(db.cart, [("user_id", 1), ("product_id", 1)], {"unique": True})
        
        print("Database indexes verified/created successfully")
        
    except Exception as e:
        print(f"Database setup warning: {e}")
    
    # Configuration status
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")
    
    if email_user and email_password:
        print(f"Email Configuration: CONFIGURED")
        print(f"Admin Email: {admin_email}")
    else:
        print(f"Email Configuration: NOT CONFIGURED")
    
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"CORS Origins: {origins}")
    print(f"Credentials Enabled: True")
    print(f"Request Timeout: Enabled (15-60s)")
    
    if os.getenv("MONGODB_URL"):
        print(f"Database: CONFIGURED")
    else:
        print(f"Database: NOT CONFIGURED")
    
    if STRIPE_SECRET_KEY:
        key_preview = STRIPE_SECRET_KEY[:7] + "..." + STRIPE_SECRET_KEY[-4:]
        print(f"Stripe: CONFIGURED ({key_preview})")
    else:
        print(f"Stripe: NOT CONFIGURED")
    
    print("=" * 50)
    print("Ready to handle requests!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)