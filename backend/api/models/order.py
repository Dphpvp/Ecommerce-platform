from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class OrderRequest(BaseModel):
    shipping_address: Optional[Dict[str, Any]] = None
    payment_method: Optional[str] = None
    payment_intent_id: Optional[str] = None

class PaymentIntentRequest(BaseModel):
    amount: int = Field(..., gt=0)
    currency: str = Field(default="ron")