from fastapi import APIRouter, HTTPException, Depends, Request
from api.services.order_service import OrderService
from api.services.payment_service import PaymentService
from api.models.order import OrderRequest, PaymentIntentRequest
from api.dependencies.auth import get_current_user_from_session, require_csrf_token

router = APIRouter()
order_service = OrderService()
payment_service = PaymentService()

@router.post("")
async def create_order(
    order_request: OrderRequest,
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        user = await get_current_user_from_session(request)
        return await order_service.create_order(order_request, user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("")
async def get_orders(request: Request):
    try:
        user = await get_current_user_from_session(request)
        return await order_service.get_orders(str(user["_id"]))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{order_id}")
async def get_order(order_id: str, request: Request):
    try:
        user = await get_current_user_from_session(request)
        return await order_service.get_order(order_id, str(user["_id"]))
    except Exception as e:
        raise HTTPException(status_code=404, detail="Order not found")

@router.post("/payment/create-intent")
async def create_payment_intent(payment_request: PaymentIntentRequest):
    try:
        return await payment_service.create_payment_intent(payment_request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))