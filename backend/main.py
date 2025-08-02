from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
import traceback
import logging

# Import the full API router
from api.main import router as api_router

# Configure logging for memory debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Minimal app with working CORS
app = FastAPI(title="E-commerce API")

# Simple, working CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vergishop.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is running", "cors": "enabled"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/csrf-token")
@app.post("/api/csrf-token")
async def get_csrf_token_compat(request: Request):
    """CSRF token endpoint supporting anonymous users - with memory debugging"""
    try:
        logger.info("🔐 CSRF token request started")
        
        from api.middleware.csrf import csrf_protection
        from jose import jwt
        from api.core.config import get_settings
        
        logger.info("🔐 CSRF imports successful")
        
        settings = get_settings()
        session_id = "anonymous"
        
        # Try to get session if available
        session_token = request.cookies.get("session_token")
        if session_token:
            try:
                logger.info("🔐 Attempting JWT decode")
                payload = jwt.decode(session_token, settings.JWT_SECRET, algorithms=["HS256"])
                session_id = payload.get("user_id", "anonymous")
                logger.info("🔐 JWT decode successful")
            except Exception as jwt_error:
                logger.warning(f"🔐 JWT decode failed: {jwt_error}")
                pass
        
        logger.info("🔐 Generating CSRF token")
        csrf_token = csrf_protection.generate_token(session_id)
        logger.info("🔐 CSRF token generated successfully")
        
        return {"csrf_token": csrf_token}
    except Exception as e:
        logger.error(f"🔐 CSRF token generation failed: {e}")
        logger.error(f"🔐 Traceback: {traceback.format_exc()}")
        # Fallback if CSRF system not available
        return {"csrf_token": "fallback-csrf-token-123"}

# Include the working authentication and products routes
# Test individual route modules to find the problematic one
from api.routes import auth, products, cart, orders, contact, debug, uploads, newsletter

# Include auth routes (your working authentication system)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Include products router to get real database products
app.include_router(products.router, prefix="/api/products", tags=["products"])

# Start with safe routes first
app.include_router(contact.router, prefix="/api/contact", tags=["contact"])
app.include_router(debug.router, prefix="/api/debug", tags=["debug"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(newsletter.router, prefix="/api/newsletter", tags=["newsletter"])

# These might also cause issues, test one by one:
# app.include_router(cart.router, prefix="/api/cart", tags=["cart"])
# app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
# app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
# app.include_router(admin_routes.router, prefix="/api/admin", tags=["admin"])

# Handle any OPTIONS request
@app.options("/{full_path:path}")
async def handle_options(full_path: str):
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "https://vergishop.vercel.app",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Memory debugging and startup diagnostics
@app.on_event("startup")
async def startup_diagnostic():
    logger.info("🚀 E-commerce Backend Starting Up...")
    logger.info("=" * 50)
    
    # Log loaded modules that could cause memory issues
    logger.info("📦 Checking for problematic native modules:")
    dangerous_modules = []
    
    for name in sys.modules.keys():
        if any(pattern in name.lower() for pattern in ["uv", "crypto", "loop", "bcrypt", "jose", "jwt"]):
            dangerous_modules.append(name)
            logger.info(f"⚠️  {name}")
    
    if not dangerous_modules:
        logger.info("✅ No dangerous modules detected")
    
    # Check uvloop specifically
    if "uvloop" in sys.modules:
        logger.error("❌ uvloop detected - this causes memory corruption!")
    else:
        logger.info("✅ uvloop not loaded - using pure asyncio")
    
    logger.info("=" * 50)
    logger.info("🎯 Ready to handle requests!")