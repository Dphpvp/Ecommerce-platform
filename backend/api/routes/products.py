from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from api.services.product_service import ProductService
from api.models.product import ProductRequest, ProductSearchRequest
from api.dependencies.auth import get_admin_user, require_csrf_token

router = APIRouter()
product_service = ProductService()

@router.post("")
async def create_product(
    request: ProductRequest,
    admin_user: dict = Depends(get_admin_user),
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        return await product_service.create_product(request, admin_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("")
async def get_products(category: Optional[str] = None, limit: int = 50, skip: int = 0):
    try:
        return await product_service.get_products(category, limit, skip)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{product_id}")
async def get_product(product_id: str):
    try:
        return await product_service.get_product(product_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Product not found")

@router.get("/search")
async def search_products(
    q: str = "",
    category: str = "",
    min_price: float = 0,
    max_price: float = 999999,
    limit: int = 50,
    skip: int = 0
):
    try:
        request = ProductSearchRequest(
            q=q, category=category, min_price=min_price,
            max_price=max_price, limit=limit, skip=skip
        )
        return await product_service.search_products(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))