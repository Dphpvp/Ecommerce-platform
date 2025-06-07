from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import stripe
import os

# Import your existing routers
from api import router as api_router
from routes.admin_routes import router as admin_router

# Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

# Initialize FastAPI
app = FastAPI(title="E-commerce API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ecommerce-platform-snowy.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stripe configuration
stripe.api_key = STRIPE_SECRET_KEY

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(admin_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)