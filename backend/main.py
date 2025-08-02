from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import the full API router
from api.main import router as api_router

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
    """CSRF token endpoint supporting anonymous users"""
    try:
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
    except Exception as e:
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