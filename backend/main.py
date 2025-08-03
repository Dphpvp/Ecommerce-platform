# backend/main.py - FIXED CORS and Security Headers
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
import stripe
import os

from api import router as api_router
from routes.admin_routes import router as admin_router
from middleware.validation import rate_limiter, get_client_ip

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

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(admin_router)

# Security middleware
if ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# FIXED CORS configuration - Explicit origins with credentials
origins = [
    "https://vergishop.vercel.app",
    "https://vs1.vercel.app"
]

# Add FRONTEND_URL if set and not already included
if FRONTEND_URL and FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)

# Add development origins for local testing
if os.getenv("ENVIRONMENT") == "development":
    origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

# CRITICAL: Explicit origins required for credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # NO WILDCARDS with credentials
    allow_credentials=True,  # Essential for session cookies
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
        "X-Requested-With",
        "Cache-Control"
    ],
    expose_headers=["Set-Cookie"],  # Critical for cookie-based auth
    max_age=600,
)

# FIXED COOP middleware for checkout authentication
class COOPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Allow popups for authentication and checkout pages
        if request.url.path.startswith(('/checkout', '/auth', '/payment', '/api/auth')):
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        else:
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        
        return response

app.add_middleware(COOPMiddleware)

# Handle OPTIONS requests for CORS preflight
@app.options("/{path:path}")
async def handle_options(path: str, request: Request):
    """Handle CORS preflight requests"""
    origin = request.headers.get("origin")
    
    # Create response with proper CORS headers
    from fastapi.responses import Response
    response = Response()
    
    if origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-CSRF-Token, X-Request-Signature, X-Request-Timestamp, X-Requested-With, Cache-Control"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "3600"
    
    return response

# Security headers middleware - FIXED for authenticated requests
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # CSP for authenticated requests - more permissive for checkout
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
async def root():
    return {
        "message": "E-commerce API is running", 
        "status": "healthy",
        "version": "1.0.2",
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
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/test")
async def test_endpoint():
    """Test endpoint to verify API is working"""
    return {
        "message": "API is working", 
        "timestamp": datetime.now().isoformat(),
        "environment": "production",
        "cors": "credentials-enabled",
        "origins": origins
    }

@app.get("/api/cors-test")
async def cors_test(request: Request):
    """Test CORS configuration with credentials"""
    origin = request.headers.get("origin")
    
    return {
        "cors": "working",
        "message": "CORS is properly configured for credentials",
        "request_origin": origin,
        "allowed_origins": origins,
        "credentials_supported": True,
        "cookies": dict(request.cookies),
        "timestamp": datetime.now().isoformat()
    }

# Global exception handler
@app.exception_handler(500)
async def internal_server_error(request: Request, exc: Exception):
    print(f"❌ Internal Server Error: {exc}")
    return {"error": "Internal server error", "message": "Something went wrong"}

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    print(f"❌ 404 Not Found: {request.url}")
    return {"error": "Not found", "path": str(request.url), "message": "Endpoint not found"}

# Startup event
@app.on_event("startup")
async def startup_event():
    """Create indexes and print configuration status on startup"""
    print("🚀 E-commerce Backend Starting Up...")
    print("=" * 50)
    
    # Create database indexes
    try:
        from database.connection import db
        
        # Products indexes
        await db.products.create_index("category")
        await db.products.create_index("name")
        await db.products.create_index("price")
        await db.products.create_index([("name", "text"), ("description", "text")])
        
        # Users indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.users.create_index("phone", unique=True)
        
        # Orders indexes
        await db.orders.create_index("user_id")
        await db.orders.create_index("status")
        await db.orders.create_index("created_at")
        await db.orders.create_index("order_number")
        
        # Cart indexes
        await db.cart.create_index("user_id")
        await db.cart.create_index([("user_id", 1), ("product_id", 1)], unique=True)
        
        print("📊 Database indexes created successfully")
        
    except Exception as e:
        print(f"⚠️ Index creation failed: {e}")
    
    # Configuration status check
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")
    
    if email_user and email_password:
        print(f"📧 Email Configuration: ✅ CONFIGURED")
        print(f"📧 Email User: {email_user}")
        print(f"📧 Admin Email: {admin_email}")
    else:
        print(f"📧 Email Configuration: ❌ NOT CONFIGURED")
        print("⚠️  Add EMAIL_USER and EMAIL_PASSWORD to environment variables")
    
    frontend_url = os.getenv("FRONTEND_URL")
    backend_url = os.getenv("BACKEND_URL")
    
    print(f"🌐 Frontend URL: {frontend_url}")
    print(f"🖥️  Backend URL: {backend_url}")
    print(f"🔐 CORS Origins: {origins}")
    print(f"🍪 Credentials Enabled: True")
    
    mongodb_url = os.getenv("MONGODB_URL")
    if mongodb_url:
        print(f"💾 Database: ✅ CONFIGURED")
    else:
        print(f"💾 Database: ❌ NOT CONFIGURED")
    
    if STRIPE_SECRET_KEY:
        key_preview = STRIPE_SECRET_KEY[:7] + "..." + STRIPE_SECRET_KEY[-4:]
        print(f"💳 Stripe: ✅ CONFIGURED ({key_preview})")
    else:
        print(f"💳 Stripe: ❌ NOT CONFIGURED")
    
    print("=" * 50)
    print("🎯 Ready to handle requests!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)