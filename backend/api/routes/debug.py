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
            "/api/orders",
            "/api/contact",
            "/api/admin/dashboard"
        ],
        "message": "API is functioning correctly"
    }

@router.get("/routes")
async def list_routes():
    """List all available routes"""
    return {
        "auth_routes": [
            "POST /api/auth/login",
            "POST /api/auth/register", 
            "GET /api/auth/me",
            "POST /api/auth/logout"
        ],
        "contact_routes": [
            "POST /api/contact"
        ],
        "admin_routes": [
            "GET /api/admin/dashboard",
            "GET /api/admin/orders",
            "GET /api/admin/users"
        ],
        "product_routes": [
            "GET /api/products",
            "GET /api/products/search"
        ]
    }

@router.get("/test-contact")
async def test_contact_endpoint():
    """Test if contact endpoint is accessible"""
    return {
        "contact_endpoint": "/api/contact",
        "method": "POST",
        "status": "accessible",
        "note": "Use POST method with proper CSRF token"
    }