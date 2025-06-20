from fastapi import APIRouter, HTTPException, Depends, Request
from api.services.cart_service import CartService
from api.models.cart import CartItemRequest
from api.dependencies.auth import get_current_user_from_session, require_csrf_token
from api.core.logging import get_logger

router = APIRouter()
cart_service = CartService()
logger = get_logger(__name__)

@router.get("")
async def get_cart(request: Request):
    try:
        user = await get_current_user_from_session(request)
        cart_items = await cart_service.get_cart(str(user["_id"]))
        logger.info(f"Cart retrieved for user: {user['email']}")
        return cart_items
    except Exception as e:
        logger.error(f"Get cart error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cart")

@router.post("/add")
async def add_to_cart(
    cart_request: CartItemRequest,
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        user = await get_current_user_from_session(request)
        result = await cart_service.add_to_cart(cart_request, str(user["_id"]))
        logger.info(f"Item added to cart for user: {user['email']}")
        return result
    except Exception as e:
        logger.error(f"Add to cart error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/update/{item_id}")
async def update_cart_item(
    item_id: str,
    quantity: int,
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        user = await get_current_user_from_session(request)
        result = await cart_service.update_cart_item(item_id, quantity, str(user["_id"]))
        return result
    except Exception as e:
        logger.error(f"Update cart item error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{item_id}")
async def remove_from_cart(
    item_id: str,
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        user = await get_current_user_from_session(request)
        result = await cart_service.remove_from_cart(item_id, str(user["_id"]))
        logger.info(f"Item removed from cart for user: {user['email']}")
        return result
    except Exception as e:
        logger.error(f"Remove from cart error: {e}")
        raise HTTPException(status_code=404, detail="Cart item not found")

@router.delete("")
async def clear_cart(
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        user = await get_current_user_from_session(request)
        result = await cart_service.clear_cart(str(user["_id"]))
        logger.info(f"Cart cleared for user: {user['email']}")
        return result
    except Exception as e:
        logger.error(f"Clear cart error: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear cart")