from pydantic import BaseModel
from enum import Enum
from typing import Optional

class OrderStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class AdminDashboardStats(BaseModel):
    total_orders: int
    pending_orders: int
    processing_orders: int
    shipped_orders: int
    total_revenue: float

class RecentOrder(BaseModel):
    id: str
    customer_name: str
    total_amount: float
    status: str
    created_at: str

class LowStockProduct(BaseModel):
    id: str
    name: str
    stock: int
    category: str

class AdminDashboardResponse(BaseModel):
    statistics: AdminDashboardStats
    recent_orders: list[RecentOrder]
    low_stock_products: list[LowStockProduct]