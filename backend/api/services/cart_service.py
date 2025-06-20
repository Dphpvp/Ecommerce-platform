from typing import List
from bson import ObjectId
from datetime import datetime  # Added this import

from api.models.cart import CartItemRequest
from api.core.database import get_database
from api.core.exceptions import NotFoundError, ValidationError

class CartService:
    def __init__(self):
        self.db = get_database()
    
    async def get_cart(self, user_id: str) -> List[dict]:
        cart_items = []
        async for item in self.db.cart.find({"user_id": user_id}):
            try:
                product = await self.db.products.find_one({"_id": ObjectId(item["product_id"])})
                if product:
                    # Fix placeholder image URLs
                    image_url = product.get("image_url", "")
                    if "via.placeholder.com" in image_url or not image_url:
                        product["image_url"] = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80"
                    
                    cart_items.append({
                        "id": str(item["_id"]),
                        "product_id": item["product_id"],
                        "quantity": item["quantity"],
                        "added_at": item.get("added_at"),
                        "product": {
                            "id": str(product["_id"]),
                            "name": product["name"],
                            "price": product["price"],
                            "image_url": product["image_url"],
                            "stock": product.get("stock", 0)
                        }
                    })
            except Exception:
                continue
        
        return cart_items
    
    async def add_to_cart(self, request: CartItemRequest, user_id: str) -> dict:
        product = await self.db.products.find_one({"_id": ObjectId(request.product_id)})
        if not product:
            raise NotFoundError("Product not found")
        
        if product["stock"] < request.quantity:
            raise ValidationError("Insufficient stock")
        
        existing_item = await self.db.cart.find_one({"user_id": user_id, "product_id": request.product_id})
        if existing_item:
            new_quantity = existing_item["quantity"] + request.quantity
            if product["stock"] < new_quantity:
                raise ValidationError("Insufficient stock for total quantity")
            
            await self.db.cart.update_one(
                {"user_id": user_id, "product_id": request.product_id},
                {"$set": {"quantity": new_quantity, "updated_at": datetime.utcnow()}}
            )
        else:
            cart_data = {
                "user_id": user_id,
                "product_id": request.product_id,
                "quantity": request.quantity,
                "added_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await self.db.cart.insert_one(cart_data)
        
        return {"message": "Item added to cart"}
    
    async def update_cart_item(self, item_id: str, quantity: int, user_id: str) -> dict:
        if quantity <= 0:
            return await self.remove_from_cart(item_id, user_id)
        
        # Get cart item
        cart_item = await self.db.cart.find_one({"_id": ObjectId(item_id), "user_id": user_id})
        if not cart_item:
            raise NotFoundError("Cart item not found")
        
        # Check product stock
        product = await self.db.products.find_one({"_id": ObjectId(cart_item["product_id"])})
        if not product:
            raise NotFoundError("Product not found")
        
        if product["stock"] < quantity:
            raise ValidationError("Insufficient stock")
        
        # Update quantity
        await self.db.cart.update_one(
            {"_id": ObjectId(item_id), "user_id": user_id},
            {"$set": {"quantity": quantity, "updated_at": datetime.utcnow()}}
        )
        
        return {"message": "Cart item updated"}
    
    async def remove_from_cart(self, item_id: str, user_id: str) -> dict:
        result = await self.db.cart.delete_one({"_id": ObjectId(item_id), "user_id": user_id})
        
        if result.deleted_count == 0:
            raise NotFoundError("Cart item not found")
        
        return {"message": "Item removed from cart"}
    
    async def clear_cart(self, user_id: str) -> dict:
        result = await self.db.cart.delete_many({"user_id": user_id})
        return {"message": f"Cart cleared. {result.deleted_count} items removed"}
    
    async def get_cart_total(self, user_id: str) -> float:
        """Calculate total cart value"""
        total = 0.0
        async for item in self.db.cart.find({"user_id": user_id}):
            try:
                product = await self.db.products.find_one({"_id": ObjectId(item["product_id"])})
                if product:
                    total += product["price"] * item["quantity"]
            except Exception:
                continue
        return total
    
    async def get_cart_count(self, user_id: str) -> int:
        """Get total number of items in cart"""
        count = 0
        async for item in self.db.cart.find({"user_id": user_id}):
            count += item["quantity"]
        return count