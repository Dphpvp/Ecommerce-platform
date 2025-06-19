from fastapi import APIRouter, HTTPException, Depends, Request
from api.services.cart_service import CartService
from api.models.cart import CartItemRequest
from api.dependencies.auth import get_current_user_from_session, require_csrf_token

router = APIRouter()
cart_service = CartService()

@router.get("")
async def get_cart(request: Request):
    try:
        user = await get_current_user_from_session(request)
        return await cart_service.get_cart(str(user["_id"]))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add")
async def add_to_cart(
    cart_request: CartItemRequest,
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        user = await get_current_user_from_session(request)
        return await cart_service.add_to_cart(cart_request, str(user["_id"]))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{item_id}")
async def remove_from_cart(
    item_id: str,
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        user = await get_current_user_from_session(request)
        return await cart_service.remove_from_cart(item_id, str(user["_id"]))
    except Exception as e:
        raise HTTPException(status_code=404, detail="Cart item not found")