from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Minimal FastAPI app for testing
app = FastAPI(
    title="E-commerce API",
    version="1.0.0",
    description="E-commerce Platform API - Minimal Version",
)

# Basic CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vergishop.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Minimal API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}