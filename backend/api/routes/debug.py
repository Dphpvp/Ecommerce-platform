from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("")
async def debug_info():
    """Debug endpoint to check API status"""
    return {
        "api_status": "working",
        "timestamp": datetime.now().isoformat(),
        "routes": [
            "/api/auth/me",
            "/api/auth/login", 
            "/api/products",
            "/api/cart",
            "/api/orders"
        ],
        "message": "API is functioning correctly"
    }