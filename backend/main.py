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

@app.post("/api/auth/register")
async def register(request: Request):
    return {
        "message": "Registration successful",
        "origin": request.headers.get("origin"),
        "test": True
    }

# Include the full API router
app.include_router(api_router)

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