# backend/main.py - Fixed CORS for credentials
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import Response
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

# CORS configuration - FIXED for credentials
origins = [
    "https://vergishop.vercel.app",
    "https://vs1.vercel.app"
]

# Add FRONTEND_URL if set and not already included
if FRONTEND_URL and FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)

if os.getenv("ENVIRONMENT") == "development":
    origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

# CRITICAL: Proper CORS with credentials
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
        "Cookie",
        "Set-Cookie"
    ],
    expose_headers=["Set-Cookie", "Content-Type"],
    max_age=3600,
)

# Custom CORS middleware for better control
@app.middleware("http")
async def custom_cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    
    # Handle preflight requests
    if request.method == "OPTIONS":
        response = Response(content="", status_code=200)
        if origin in origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-CSRF-Token, X-Request-Signature, X-Request-Timestamp, Cookie"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "3600"
        return response
    
    # Process the request
    response = await call_next(request)
    
    # Add CORS headers to all responses
    if origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
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
    print(f"🌐 Frontend URL: {FRONTEND_URL}")
    print(f"🌐 CORS Origins: {origins}")
    print(f"🔐 Credentials: Enabled")
    print("=" * 50)
    print("🎯 Ready to handle requests!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)