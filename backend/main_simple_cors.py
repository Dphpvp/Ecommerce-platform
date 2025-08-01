from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
async def get_csrf_token():
    return {"csrf_token": "test-csrf-token-123"}

@app.post("/api/auth/register")
async def register(request: Request):
    return {
        "message": "Registration successful",
        "origin": request.headers.get("origin"),
        "test": True
    }

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