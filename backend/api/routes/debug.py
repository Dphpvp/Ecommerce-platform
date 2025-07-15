from fastapi import APIRouter, Request
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

@router.get("/mobile")
async def mobile_debug(request: Request):
    """Mobile debug endpoint"""
    headers = dict(request.headers)
    
    # Check database connection
    db_status = "unknown"
    try:
        from api.core.database import get_database
        db = get_database()
        # Test connection with a simple query
        await db.products.count_documents({})
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "mobile_debug",
        "request_headers": headers,
        "user_agent": headers.get("user-agent", "unknown"),
        "platform": headers.get("x-platform", "unknown"),
        "device_type": headers.get("x-device-type", "unknown"),
        "origin": headers.get("origin", "unknown"),
        "database_status": db_status,
        "endpoint_path": "/api/debug/mobile",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/test")
async def api_test():
    """Simple test endpoint to verify API routing"""
    return {"status": "API routing works", "timestamp": datetime.now().isoformat()}