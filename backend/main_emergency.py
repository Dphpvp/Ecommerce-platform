from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio

# CRITICAL: Force disable uvloop to prevent memory corruption
try:
    import uvloop
    uvloop = None
    print("🚫 uvloop disabled to prevent memory corruption")
except ImportError:
    print("✅ uvloop not installed")

# Set asyncio to use pure Python event loop
if hasattr(asyncio, 'set_event_loop_policy'):
    asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())
    print("✅ Using pure Python asyncio event loop")

# Ultra minimal app with NO custom imports
app = FastAPI(title="E-commerce API - Emergency Mode")

# Simple CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vergishop.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Emergency API is running", "status": "emergency_mode"}

@app.get("/health")
async def health():
    return {"status": "ok", "mode": "emergency"}

@app.get("/api/csrf-token")
@app.post("/api/csrf-token")
async def get_csrf_token():
    return {"csrf_token": "emergency-token-123"}

@app.post("/api/auth/login")
async def emergency_login(request: Request):
    body = await request.json()
    return {
        "message": "Emergency login successful",
        "user": {
            "id": "emergency_user",
            "username": body.get("identifier", "emergency"),
            "email": "emergency@test.com"
        },
        "token": "emergency_jwt_token"
    }

@app.post("/api/auth/register")
async def emergency_register(request: Request):
    body = await request.json()
    return {
        "message": "Emergency registration successful",
        "user": {
            "id": "emergency_new",
            "username": body.get("username", "newuser"),
            "email": body.get("email", "new@test.com")
        }
    }

@app.get("/api/products")
async def emergency_products():
    return [
        {"_id": "1", "name": "Emergency Product", "price": 100, "image_url": "https://via.placeholder.com/300"}
    ]

# Handle OPTIONS requests
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