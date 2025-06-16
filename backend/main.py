# backend/main.py - Fixed version
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import stripe
import os

# Import API router properly
from api import router as api_router
from routes.admin_routes import router as admin_router
from middleware.csrf import csrf_middleware
from middleware.validation import rate_limiter, get_client_ip
from middleware.rate_limiter import RateLimiter

# Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_HOSTS_STR = os.getenv("ALLOWED_HOSTS", "vergishop.vercel.app,vs1.vercel.app")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STR.split(",") if host.strip()]

# Add localhost for development
if os.getenv("ENVIRONMENT") == "development":
    ALLOWED_HOSTS.extend(["localhost", "127.0.0.1"])

# Initialize FastAPI
app = FastAPI(
    title="E-commerce API",
    docs_url="/api/docs" if os.getenv("ENVIRONMENT") == "development" else None,
    redoc_url="/api/redoc" if os.getenv("ENVIRONMENT") == "development" else None,
)

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(admin_router)

# Security middleware
if ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# CORS configuration
origins = [
    "https://vergishop.vercel.app",
    "https://vs1.vercel.app"
]

if os.getenv("ENVIRONMENT") == "development":
    origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token"],
)

# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    client_ip = get_client_ip(request)
    
    # Different limits for different endpoints
    sensitive_endpoints = ["/api/auth/login", "/api/auth/register", "/api/contact"]
    
    if any(request.url.path.startswith(endpoint) for endpoint in sensitive_endpoints):
        if not rate_limiter.is_allowed(f"{client_ip}:sensitive", max_requests=5, window=300):
            raise HTTPException(status_code=429, detail="Too many requests")
    else:
        if not rate_limiter.is_allowed(f"{client_ip}:general", max_requests=100, window=60):
            raise HTTPException(status_code=429, detail="Too many requests")
    
    response = await call_next(request)
    return response

# CSRF middleware
app.middleware("http")(csrf_middleware)

# Security headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Add security headers"""
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), location=()"
    
    # Content Security Policy
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.google.com https://www.paypal.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https: blob:; "
        "connect-src 'self' https://api.dicebear.com; "
        "frame-src https://accounts.google.com https://www.google.com https://www.paypal.com; "
        "object-src 'none'; "
        "base-uri 'self'"
    )
    response.headers["Content-Security-Policy"] = csp
    
    return response

# Stripe configuration
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# Health check endpoints
@app.get("/")
async def root():
    return {"message": "E-commerce API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    email_configured = bool(os.getenv("EMAIL_USER") and os.getenv("EMAIL_PASSWORD"))
    return {
        "status": "healthy",
        "email_configured": email_configured,
        "frontend_url": FRONTEND_URL,
        "security": "enabled"
    }

# CSRF token endpoint
@app.get("/api/csrf-token")
async def get_csrf_token():
    """Get CSRF token for frontend"""
    from middleware.csrf import csrf_protection
    token = csrf_protection.generate_token()
    return {"csrf_token": token}

# Startup event
@app.on_event("startup")
async def startup_event():
    """Simplified startup without complex imports"""
    print("🚀 E-commerce Backend Starting Up...")
    
    try:
        from database.connection import db
        
        # Create basic indexes only
        await db.users.create_index("email", unique=True)
        await db.products.create_index("category")
        await db.orders.create_index("user_id")
        
        print("📊 Basic indexes created")
        
    except Exception as e:
        print(f"⚠️ Startup warning: {e}")
        # Don't fail startup on index issues
    
    print("🎯 Server ready!")

        
    except Exception as e:
        print(f"⚠️ Index creation failed: {e}")
    
    # Configuration status check
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    csrf_secret = os.getenv("CSRF_SECRET")
    
    if email_user and email_password:
        print(f"📧 Email Configuration: ✅ CONFIGURED")
    else:
        print(f"📧 Email Configuration: ❌ NOT CONFIGURED")
    
    if csrf_secret:
        print(f"🔒 CSRF Protection: ✅ CONFIGURED")
    else:
        print(f"🔒 CSRF Protection: ⚠️ USING DEFAULT SECRET")
    
    print(f"🛡️ Security Headers: ✅ ENABLED")
    print(f"⏱️ Rate Limiting: ✅ ENABLED")
    print(f"🔍 Input Validation: ✅ ENABLED")
    
    print("=" * 50)
    print("🎯 Ready to handle requests!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)