from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional
from api.services.product_service import ProductService
from api.models.product import ProductRequest, ProductSearchRequest
from api.dependencies.auth import get_admin_user, require_csrf_token
from api.core.logging import get_logger

router = APIRouter()
product_service = ProductService()
logger = get_logger(__name__)

@router.post("")
async def create_product(
    request: ProductRequest,
    admin_user: dict = Depends(get_admin_user),
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        result = await product_service.create_product(request, admin_user)
        logger.info(f"Product created by admin: {admin_user['email']}")
        return result
    except Exception as e:
        logger.error(f"Create product error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("")
async def get_products(
    request: Request,
    category: Optional[str] = None, 
    limit: int = Query(50, le=100), 
    skip: int = Query(0, ge=0)
):
    try:
        # Log mobile request info
        headers = dict(request.headers)
        platform = headers.get("x-platform", "unknown")
        device_type = headers.get("x-device-type", "unknown")
        user_agent = headers.get("user-agent", "unknown")
        
        logger.info(f"Products request - Platform: {platform}, Device: {device_type}, UA: {user_agent}")
        
        products = await product_service.get_products(category, limit, skip)
        logger.info(f"Products retrieved: {len(products)} items for platform: {platform}")
        return products
    except Exception as e:
        logger.error(f"Get products error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get products")

@router.get("/search")
async def search_products(
    q: str = Query("", description="Search query"),
    category: str = Query("", description="Product category"),
    min_price: float = Query(0, ge=0, description="Minimum price"),
    max_price: float = Query(999999, ge=0, description="Maximum price"),
    limit: int = Query(50, le=100, description="Maximum number of results"),
    skip: int = Query(0, ge=0, description="Number of results to skip")
):
    try:
        request = ProductSearchRequest(
            q=q, 
            category=category, 
            min_price=min_price,
            max_price=max_price, 
            limit=limit, 
            skip=skip
        )
        result = await product_service.search_products(request)
        logger.info(f"Product search performed: query='{q}', results={result.get('count', 0)}")
        return result
    except Exception as e:
        logger.error(f"Product search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@router.get("/categories")
async def get_categories():
    try:
        categories = await product_service.get_categories()
        return categories
    except Exception as e:
        logger.error(f"Get categories error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get categories")

@router.get("/mobile-test")
async def mobile_test(request: Request):
    """Simple endpoint to test mobile connectivity"""
    try:
        headers = dict(request.headers)
        platform = headers.get("x-platform", "unknown")
        device_type = headers.get("x-device-type", "unknown")
        
        # Test database connection
        db_count = await product_service.db.products.count_documents({})
        
        return {
            "status": "success",
            "message": "Mobile API connection working",
            "platform": platform,
            "device_type": device_type,
            "products_count": db_count,
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        logger.error(f"Mobile test error: {e}")
        return {
            "status": "error",
            "message": str(e),
            "timestamp": "2024-01-01T00:00:00Z"
        }

@router.get("/{product_id}")
async def get_product(product_id: str):
    try:
        product = await product_service.get_product(product_id)
        return product
    except Exception as e:
        logger.error(f"Get product error: {e}")
        raise HTTPException(status_code=404, detail="Product not found")

@router.put("/{product_id}")
async def update_product(
    product_id: str,
    request: ProductRequest,
    admin_user: dict = Depends(get_admin_user),
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        result = await product_service.update_product(product_id, request, admin_user)
        logger.info(f"Product updated by admin: {admin_user['email']}")
        return result
    except Exception as e:
        logger.error(f"Update product error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    admin_user: dict = Depends(get_admin_user),
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        result = await product_service.delete_product(product_id, admin_user)
        logger.info(f"Product deleted by admin: {admin_user['email']}")
        return result
    except Exception as e:
        logger.error(f"Delete product error: {e}")
        raise HTTPException(status_code=400, detail=str(e))