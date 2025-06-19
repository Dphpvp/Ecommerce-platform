from typing import List
from bson import ObjectId
import datetime

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
        
        return cart_items
    
    async def add_to_cart(self, request: CartItemRequest, user_id: str) -> dict:
        product = await self.db.products.find_one({"_id": ObjectId(request.product_id)})
        if not product:
            raise NotFoundError("Product not found")
        
        if product["stock"] < request.quantity:
            raise ValidationError("Insufficient stock")
        
        existing_item = await self.db.cart.find_one({"user_id": user_id, "product_id": request.product_id})
        if existing_item:
            await self.db.cart.update_one(
                {"user_id": user_id, "product_id": request.product_id},
                {"$inc": {"quantity": request.quantity}}
            )
        else:
            cart_data = {
                "user_id": user_id,
                "product_id": request.product_id,
                "quantity": request.quantity,
                "added_at": datetime.utcnow()
            }
            await self.db.cart.insert_one(cart_data)
        
        return {"message": "Item added to cart"}
    
    async def remove_from_cart(self, item_id: str, user_id: str) -> dict:
        result = await self.db.cart.delete_one({"_id": ObjectId(item_id), "user_id": user_id})
        
        if result.deleted_count == 0:
            raise NotFoundError("Cart item not found")
        
        return {"message": "Item removed from cart"}