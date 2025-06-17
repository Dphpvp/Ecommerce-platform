# backend/main.py - CORS and Database Fixed
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
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
    docs_url=None,  # Disabled in production
    redoc_url=None,  # Disabled in production
)

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(admin_router)

# Security middleware
if ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# CORS configuration - FIXED FOR CREDENTIALS
origins = [
    "https://vergishop.vercel.app",
    "https://vs1.vercel.app"
]

# Add FRONTEND_URL if set and not already included
if FRONTEND_URL and FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)

# Add development origins only if in development
if os.getenv("ENVIRONMENT") == "development":
    origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

# CRITICAL: NO WILDCARDS when using credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Specific origins only - NO "*"
    allow_credentials=True,  # This requires specific origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
        "X-Request-Signature",
        "X-Request-Timestamp"
    ],  # Explicit headers instead of "*"
    expose_headers=["*"],
    max_age=3600,
)

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
        response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-CSRF-Token, X-Request-Signature, X-Request-Timestamp"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "3600"
    
    return response

# CORS middleware - Fixed for credentials
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # FIXED: Relaxed Cross-Origin-Opener-Policy for Google Auth
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    
    # Simplified CSP for credentials
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

# Security headers middleware (simplified)
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Simplified CSP for credentials
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https: blob:; "
        "connect-src 'self' " + " ".join(origins) + "; "
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
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/csrf-token")
async def get_csrf_token():
    """CSRF token endpoint - disabled for debugging"""
    return {
        "csrf_token": "disabled-for-debugging", 
        "message": "CSRF temporarily disabled",
        "note": "Remove this when re-enabling CSRF"
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
    print("🚀 E-commerce Backend Starting Up...")
    print(f"🌐 Frontend URL: {FRONTEND_URL}")
    print(f"🔗 CORS Origins: {origins}")
    print(f"🍪 Credentials: ENABLED")
    print(f"🛡️ CSRF: Temporarily disabled")
    
    try:
        from database.connection import db, client
        
        # Test database connection - FIXED
        await client.admin.command('ping')
        print("📡 Database connection successful")
        
        # Create indexes with error handling
        try:
            await db.users.create_index("email", unique=True)
            print("✅ Users email index created")
        except Exception as e:
            print(f"⚠️ Users index: {e}")
        
        try:
            await db.products.create_index("category")
            print("✅ Products category index created")
        except Exception as e:
            print(f"⚠️ Products index: {e}")
        
        try:
            await db.orders.create_index("user_id")
            print("✅ Orders user_id index created")
        except Exception as e:
            print(f"⚠️ Orders index: {e}")
        
        try:
            await db.cart.create_index("user_id")
            print("✅ Cart user_id index created")
        except Exception as e:
            print(f"⚠️ Cart index: {e}")
        
    except Exception as e:
        print(f"❌ Database setup error: {e}")
        print("💡 Check MONGODB_URL environment variable")
    
    # Print environment status
    env_vars = {
        "MONGODB_URL": bool(os.getenv("MONGODB_URL")),
        "JWT_SECRET": bool(os.getenv("JWT_SECRET")),
        "EMAIL_USER": bool(os.getenv("EMAIL_USER")),
        "EMAIL_PASSWORD": bool(os.getenv("EMAIL_PASSWORD")),
        "FRONTEND_URL": bool(os.getenv("FRONTEND_URL")),
        "STRIPE_SECRET_KEY": bool(os.getenv("STRIPE_SECRET_KEY"))
    }
    
    print("\n📊 Environment Variables:")
    for var, is_set in env_vars.items():
        status = "✅" if is_set else "❌"
        print(f"{status} {var}: {'Set' if is_set else 'Not set'}")
    
    print(f"\n🎯 Server ready!")
    print(f"🔧 Test CORS: https://ecommerce-platform-nizy.onrender.com/api/cors-test")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)