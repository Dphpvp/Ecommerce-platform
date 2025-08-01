from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

# Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://vergishop.vercel.app")

# Create FastAPI app
app = FastAPI(
    title="E-commerce API", 
    version="1.0.0",
    description="E-commerce Platform API"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vergishop.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}

# Basic CSRF token endpoint for testing
@app.get("/api/csrf-token")
async def get_csrf_token():
    return {"csrf_token": "test-token-123"}

# Basic register endpoint for testing
@app.post("/api/auth/register")
async def register(request: Request):
    return {"message": "Registration endpoint working", "origin": request.headers.get("origin")}