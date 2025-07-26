from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class MessageResponse(BaseModel):
    message: str
    success: bool = True

class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error_code: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    address: Optional[str]
    phone: Optional[str]
    profile_image_url: Optional[str]
    is_admin: bool
    email_verified: bool
    two_factor_enabled: bool
    
    @classmethod
    def from_dict(cls, user_dict: dict) -> "UserResponse":
        return cls(
            id=str(user_dict["_id"]),
            username=user_dict["username"],
            email=user_dict["email"],
            full_name=user_dict.get("full_name", ""),
            address=user_dict.get("address"),
            phone=user_dict.get("phone"),
            profile_image_url=user_dict.get("profile_image_url"),
            is_admin=user_dict.get("is_admin", False),
            email_verified=user_dict.get("email_verified", False),
            two_factor_enabled=user_dict.get("two_factor_enabled", False)
        )

class AuthResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[UserResponse] = None
    requires_2fa: bool = False
    method: Optional[str] = None
    temp_token: Optional[str] = None
    message: Optional[str] = None
    email_hint: Optional[str] = None

class TwoFactorSetupResponse(BaseModel):
    method: str
    secret: Optional[str] = None
    qr_code: Optional[str] = None
    message: str
    email_hint: Optional[str] = None
    expires_in: int
    backup_codes: Optional[List[str]] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    image_url: str
    stock: int
    created_at: Optional[datetime] = None

class CartItemResponse(BaseModel):
    id: str
    product_id: str
    quantity: int
    product: ProductResponse

class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: str
    items: List[Dict[str, Any]]
    total_amount: float
    status: str
    created_at: datetime