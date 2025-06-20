from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from datetime import datetime
import os

# Import only the new structured API and admin routes
from api.main import router as api_router
from backend.api.routes.admin_routes import router as admin_router

# Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://vergishop.vercel.app")
ALLOWED_HOSTS_STR = os.getenv("ALLOWED_HOSTS", "vergishop.vercel.app,vs1.vercel.app,ecommerce-platform-nizy.onrender.com")
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STR.split(",") if host.strip()]

app = FastAPI(
    title="E-commerce API",
    version="1.0.0",
    description="E-commerce Platform API",
    docs_url=None,
    redoc_url=None,
)

# Include routers
app.include_router(api_router)  # New structured API
app.include_router(admin_router)  # Admin routes

# Security middleware
if ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# CORS
origins = ["https://vergishop.vercel.app", "https://vs1.vercel.app"]
if FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)
if os.getenv("ENVIRONMENT") == "development":
    origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Accept", "Accept-Language", "Content-Language", "Content-Type", "Authorization", "X-CSRF-Token"],
    expose_headers=["Set-Cookie"],
    max_age=600,
)

@app.get("/")
async def root():
    return {"message": "E-commerce API is running", "status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)