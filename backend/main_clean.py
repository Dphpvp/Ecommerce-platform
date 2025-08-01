from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create minimal FastAPI app
app = FastAPI(title="E-commerce API", version="1.0.0")

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
async def register():
    return {"message": "Registration endpoint working"}