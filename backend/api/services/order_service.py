from typing import List
from bson import ObjectId
from datetime import datetime, timezone
import secrets

from api.models.order import OrderRequest
from api.core.database import get_database
from api.core.exceptions import NotFoundError, ValidationError
from api.services.email_service import EmailService

class OrderService:
    def __init__(self):
        self.db = get_database()
        self.email_service = EmailService()
    
    async def create_order(self, request: OrderRequest, user: dict) -> dict:
        """Create a new order from user's cart"""
        user_id = str(user["_id"])
        
        # Get cart items
        cart_items = []
        total_amount = 0.0
        
        async for item in self.db.cart.find({"user_id": user_id}):
            try:
                product = await self.db.products.find_one({"_id": ObjectId(item["product_id"])})
                if not product:
                    continue
                
                # Check stock availability
                if product["stock"] < item["quantity"]:
                    raise ValidationError(f"Insufficient stock for {product['name']}")
                
                item_total = product["price"] * item["quantity"]
                total_amount += item_total
                
                cart_items.append({
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
        
        # Generate order number
        order_number = f"ORD-{secrets.token_hex(4).upper()}-{datetime.now().strftime('%Y%m%d')}"
        
        # Create order
        order_data = {
            "order_number": order_number,
            "user_id": user_id,
            "items": cart_items,
            "total_amount": total_amount,
            "shipping_address": request.shipping_address or user.get("address", ""),
            "payment_method": request.payment_method or "stripe",
            "payment_intent_id": request.payment_intent_id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await self.db.orders.insert_one(order_data)
        order_id = str(result.inserted_id)
        
        # Update product stock and clear cart
        for item in cart_items:
            await self.db.products.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"stock": -item["quantity"]}}
            )
        
        await self.db.cart.delete_many({"user_id": user_id})
        
        # Send emails
        try:
            user_name = user.get("full_name", user.get("username", "Customer"))
            await self.email_service.send_order_confirmation_email(
                user["email"], user_name, order_number, total_amount, cart_items
            )
            await self.email_service.send_admin_order_notification(
                order_number, user["email"], user_name, total_amount, cart_items
            )
        except Exception as e:
            print(f"Failed to send order emails: {e}")
        
        return {
            "message": "Order created successfully",
            "order_id": order_id,
            "order_number": order_number,
            "total_amount": total_amount
        }
    
    async def get_orders(self, user_id: str) -> List[dict]:
        """Get all orders for a user"""
        orders = []
        
        async for order in self.db.orders.find({"user_id": user_id}).sort("created_at", -1):
            order["_id"] = str(order["_id"])
            # Ensure all product IDs in items are strings
            for item in order.get("items", []):
                if "product" in item and "_id" in item["product"]:
                    item["product"]["_id"] = str(item["product"]["_id"])
            orders.append(order)
        
        return orders
    
    async def get_order(self, order_id: str, user_id: str) -> dict:
        """Get a specific order by ID"""
        try:
            order = await self.db.orders.find_one({
                "_id": ObjectId(order_id),
                "user_id": user_id
            })
        except:
            raise NotFoundError("Invalid order ID")
        
        if not order:
            raise NotFoundError("Order not found")
        
        order["_id"] = str(order["_id"])
        # Ensure all product IDs in items are strings
        for item in order.get("items", []):
            if "product" in item and "_id" in item["product"]:
                item["product"]["_id"] = str(item["product"]["_id"])
        
        return order
    
    async def update_order_status(self, order_id: str, status: str, admin_user: dict) -> dict:
        """Update order status (admin only)"""
        valid_statuses = ["pending", "accepted", "processing", "shipped", "delivered", "cancelled"]
        
        if status not in valid_statuses:
            raise ValidationError("Invalid status")
        
        result = await self.db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.matched_count == 0:
            raise NotFoundError("Order not found")
        
        return {"message": f"Order status updated to {status}"}
    
    async def get_order_statistics(self) -> dict:
        """Get order statistics for admin dashboard"""
        total_orders = await self.db.orders.count_documents({})
        pending_orders = await self.db.orders.count_documents({"status": "pending"})
        processing_orders = await self.db.orders.count_documents({"status": "processing"})
        shipped_orders = await self.db.orders.count_documents({"status": "shipped"})
        delivered_orders = await self.db.orders.count_documents({"status": "delivered"})
        
        # Calculate total revenue
        revenue_pipeline = [
            {"$match": {"status": {"$in": ["shipped", "delivered"]}}},
            {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
        ]
        revenue_result = await self.db.orders.aggregate(revenue_pipeline).to_list(1)
        total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
        
        return {
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "processing_orders": processing_orders,
            "shipped_orders": shipped_orders,
            "delivered_orders": delivered_orders,
            "total_revenue": total_revenue
        }