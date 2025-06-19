from pydantic import BaseModel, Field

class CartItemRequest(BaseModel):
    product_id: str = Field(...)
    quantity: int = Field(..., gt=0, le=100)

# ===== api/models/order.py =====
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class OrderRequest(BaseModel):
    shipping_address: Optional[Dict[str, Any]] = None
    payment_method: Optional[str] = None
    payment_intent_id: Optional[str] = None

class PaymentIntentRequest(BaseModel):
    amount: int = Field(..., gt=0)
    currency: str = Field(default="ron")