from typing import List
from datetime import datetime  # Added this import
from bson import ObjectId

from api.models.order import OrderRequest
from api.core.database import get_database
from api.core.exceptions import ValidationError
from api.services.email_service import EmailService

class OrderService:
    def __init__(self):
        self.db = get_database()
        self.email_service = EmailService()
    
    async def create_order(self, request: OrderRequest, user: dict) -> dict:
        user_id = str(user["_id"])
        
        # Get cart items
        cart_items = []
        async for item in self.db.cart.find({"user_id": user_id}):
            try:
                product = await self.db.products.find_one({"_id": ObjectId(item["product_id"])})
                if product:
                    cart_items.append({
                        "id": str(item["_id"]),
                        "product_id": item["product_id"],
                        "quantity": item["quantity"],
                        "product": {
                            "id": str(product["_id"]),
                            "name": product["name"],
                            "price": product["price"],
                            "image_url": product.get("image_url", "")
                        }
                    })
            except Exception:
                continue
        
        if not cart_items:
            raise ValidationError("Cart is empty")
        
        total = sum(item["product"]["price"] * item["quantity"] for item in cart_items)
        order_number = await self._get_next_order_number()
        
        order = {
            "order_number": f"{order_number:05d}",
            "user_id": user_id,
            "items": cart_items,
            "total_amount": total,
            "shipping_address": request.shipping_address,
            "payment_method": request.payment_method,
            "payment_intent_id": request.payment_intent_id,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        
        result = await self.db.orders.insert_one(order)
        order_id = str(result.inserted_id)
        
        # Clear cart
        await self.db.cart.delete_many({"user_id": user_id})
        
        # Update product stock
        for item in cart_items:
            await self.db.products.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"stock": -item["quantity"]}}
            )
        
        # Send email notifications
        try:
            user_name = user.get("full_name", user.get("username", "Customer"))
            user_email = user["email"]
            
            await self.email_service.send_order_confirmation_email(
                user_email=user_email,
                user_name=user_name,
                order_id=order["order_number"],
                total_amount=total,
                items=cart_items
            )
            
            await self.email_service.send_admin_order_notification(
                order_id=order["order_number"],
                user_email=user_email,
                user_name=user_name,
                total_amount=total,
                items=cart_items
            )
        except Exception as e:
            print(f"Email notification error: {e}")
        
        return {
            "message": "Order created successfully",
            "order_id": order_id,
            "order_number": order["order_number"]
        }
    
    async def get_orders(self, user_id: str) -> List[dict]:
        cursor = self.db.orders.find({"user_id": user_id}).sort("created_at", -1)
        orders = []
        async for order in cursor:
            order["_id"] = str(order["_id"])
            orders.append(order)
        
        return orders
    
    async def get_order(self, order_id: str, user_id: str) -> dict:
        from api.core.exceptions import NotFoundError
        
        order = await self.db.orders.find_one({"_id": ObjectId(order_id), "user_id": user_id})
        if not order:
            raise NotFoundError("Order not found")
        
        order["_id"] = str(order["_id"])
        return order
    
    async def _get_next_order_number(self) -> int:
        counter = await self.db.counters.find_one_and_update(
            {"_id": "order_number"},
            {"$inc": {"value": 1}},
            upsert=True,
            return_document=True
        )
        return counter["value"]