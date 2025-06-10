from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import stripe
import os
from dotenv import load_dotenv

# 🆕 Load environment variables from .env file
load_dotenv()

# Import your existing routers
from api import router as api_router
from routes.admin_routes import router as admin_router

# Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Initialize FastAPI
app = FastAPI(title="E-commerce API")

# 🆕 Updated CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://localhost:3000",  # Local HTTPS
        FRONTEND_URL,  # Your Vercel URL from environment
        "vs1.vercel.app", # All Vercel subdomains
        "vergishop.vercel.app",
        "https://ecommerce-platform-snowy.vercel.app",
        
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stripe configuration
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(admin_router)

# 🆕 Health check endpoint
@app.get("/")
async def root():
    return {"message": "E-commerce API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    email_configured = bool(os.getenv("EMAIL_USER") and os.getenv("EMAIL_PASSWORD"))
    return {
        "status": "healthy",
        "email_configured": email_configured,
        "frontend_url": FRONTEND_URL
    }

# 🆕 Startup event to check configuration
@app.on_event("startup")
async def startup_event():
    """Print configuration status on startup"""
    print("🚀 E-commerce Backend Starting Up...")
    print("=" * 50)
    
    # Email configuration check
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
    
    # URL configuration check
    frontend_url = os.getenv("FRONTEND_URL")
    backend_url = os.getenv("BACKEND_URL")
    
    print(f"🌐 Frontend URL: {frontend_url}")
    print(f"🖥️  Backend URL: {backend_url}")
    
    # Database check
    mongodb_url = os.getenv("MONGODB_URL")
    if mongodb_url:
        print(f"💾 Database: ✅ CONFIGURED")
    else:
        print(f"💾 Database: ❌ NOT CONFIGURED")
    
    # Stripe check
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