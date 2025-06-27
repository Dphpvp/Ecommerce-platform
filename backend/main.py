from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
import stripe
import os
from fastapi.staticfiles import StaticFiles
from api.routes import auth, products, cart, orders, contact, profile, debug
from api.routes.admin_routes import router as admin_router
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

# FIXED: Include routers with proper prefixes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(cart.router, prefix="/api/cart", tags=["cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(contact.router, prefix="/api/contact", tags=["contact"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(debug.router, prefix="/api/debug", tags=["debug"])
# Admin routes already have /api/admin prefix in their router
app.include_router(admin_router, tags=["admin"])
app.include_router(api_router, tags=["api"])


# Security middleware
if ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# FIXED CORS configuration - Explicit origins with credentials
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

# FIXED COOP middleware for checkout authentication
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
    """Handle CORS preflight requests"""
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

# FIXED: Add compatibility endpoints for frontend
@app.get("/api/csrf-token")
async def get_csrf_token_root(request: Request):
    """CSRF token endpoint for frontend compatibility"""
    from api.middleware.csrf import csrf_protection
    from jose import jwt
    from api.core.config import get_settings
    
    settings = get_settings()
    session_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            session_id = payload.get("user_id")
        except:
            pass
    
    csrf_token = csrf_protection.generate_token(session_id)
    return {"csrf_token": csrf_token}

@app.post("/api/payment/create-intent")
async def create_payment_intent_root(payment_request: dict):
    """Payment intent endpoint for frontend compatibility"""
    from api.services.payment_service import PaymentService
    from api.models.order import PaymentIntentRequest
    
    try:
        payment_service = PaymentService()
        request_model = PaymentIntentRequest(**payment_request)
        return await payment_service.create_payment_intent(request_model)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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
        "cookies": dict(request.cookies),
        "timestamp": datetime.now().isoformat()
    }

# Global exception handlers
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
    
    try:
        from api.core.database import get_database
        db = get_database()
        
        # Create database indexes
        await db.products.create_index("category")
        await db.products.create_index("name")
        await db.products.create_index("price")
        await db.products.create_index([("name", "text"), ("description", "text")])
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.users.create_index("phone", unique=True)
        await db.orders.create_index("user_id")
        await db.orders.create_index("status")
        await db.orders.create_index("created_at")
        await db.orders.create_index("order_number")
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