from fastapi import APIRouter, HTTPException, Depends, Query
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
    category: Optional[str] = None, 
    limit: int = Query(50, le=100), 
    skip: int = Query(0, ge=0)
):
    try:
        products = await product_service.get_products(category, limit, skip)
        logger.info(f"Products retrieved: {len(products)} items")
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