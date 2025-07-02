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

# Security middleware
if ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# CORS configuration
origins = [
    "https://vergishop.vercel.app",
    "https://vs1.vercel.app"
]

if FRONTEND_URL and FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)

if os.getenv("ENVIRONMENT") == "development":
    origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

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
        "Cache-Control"
    ],
    expose_headers=["Set-Cookie"],
    max_age=600,
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

# Handle OPTIONS requests for CORS preflight
@app.options("/{path:path}")
async def handle_options(path: str, request: Request):
    origin = request.headers.get("origin")
    
    from fastapi.responses import Response
    response = Response()
    
    if origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-CSRF-Token, X-Request-Signature, X-Request-Timestamp"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "3600"
    
    return response

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

# Global exception handlers
@app.exception_handler(500)
async def internal_server_error(request: Request, exc: Exception):
    print(f"❌ Internal Server Error: {exc}")
    return JSONResponse(
        {"error": "Internal server error", "message": "Something went wrong"}, 
        status_code=500
    )

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    print(f"❌ 404 Not Found: {request.url}")
    return JSONResponse(
        {"error": "Not found", "path": str(request.url), "message": "Endpoint not found"}, 
        status_code=404
    )

@app.exception_handler(408)
async def timeout_handler(request: Request, exc: HTTPException):
    print(f"⏰ Request Timeout: {request.url}")
    return JSONResponse(
        {"error": "Request timeout", "message": "Request took too long to process"}, 
        status_code=408
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    print("🚀 E-commerce Backend Starting Up...")
    print("=" * 50)
    
    try:
        from api.core.database import get_database
        db = get_database()
        
        # Create database indexes with error handling
        indexes_to_create = [
            (db.products, "category", {}),
            (db.products, "name", {}),
            (db.products, "price", {}),
            (db.products, [("name", "text"), ("description", "text")], {}),
            (db.users, "email", {"unique": True}),
            (db.users, "username", {"unique": True}),
            (db.users, "phone", {"unique": True, "sparse": True}),
            (db.orders, "user_id", {}),
            (db.orders, "status", {}),
            (db.orders, "created_at", {}),
            (db.orders, "order_number", {"unique": True}),
            (db.cart, "user_id", {}),
            (db.cart, [("user_id", 1), ("product_id", 1)], {"unique": True}),
        ]
        
        for collection, index_spec, options in indexes_to_create:
            try:
                await collection.create_index(index_spec, **options)
            except Exception as idx_error:
                if "already exists" in str(idx_error) or "same name" in str(idx_error):
                    continue  # Index already exists, skip
                print(f"⚠️ Failed to create index {index_spec}: {idx_error}")
        
        print("📊 Database indexes verified/created successfully")
        
    except Exception as e:
        print(f"⚠️ Index creation failed: {e}")
    
    # Configuration status
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")
    
    if email_user and email_password:
        print(f"📧 Email Configuration: ✅ CONFIGURED")
        print(f"📧 Admin Email: {admin_email}")
    else:
        print(f"📧 Email Configuration: ❌ NOT CONFIGURED")
    
    print(f"🌐 Frontend URL: {FRONTEND_URL}")
    print(f"🔐 CORS Origins: {origins}")
    print(f"🍪 Credentials Enabled: True")
    print(f"⏱️ Request Timeout: Enabled (15-60s)")
    
    if os.getenv("MONGODB_URL"):
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