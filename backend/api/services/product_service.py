from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from api.models.product import ProductRequest, ProductSearchRequest
from api.models.responses import ProductResponse
from api.core.database import get_database
from api.core.exceptions import NotFoundError, ValidationError

class ProductService:
    def __init__(self):
        self.db = get_database()
    
    async def create_product(self, request: ProductRequest, admin_user: dict) -> dict:
        if request.price <= 0:
            raise ValidationError("Price must be positive")
        
        if request.stock < 0:
            raise ValidationError("Stock cannot be negative")
        
        product_data = request.dict()
        product_data["created_at"] = datetime.utcnow()
        product_data["created_by"] = str(admin_user["_id"])
        
        result = await self.db.products.insert_one(product_data)
        return {"message": "Product created", "id": str(result.inserted_id)}
    
    async def get_products(self, category: Optional[str] = None, limit: int = 50, skip: int = 0) -> List[dict]:
        query = {}
        if category and category.strip():
            query["category"] = category.strip()
        
        limit = min(limit, 50)
        skip = max(skip, 0)
        
        cursor = self.db.products.find(query).skip(skip).limit(limit)
        products = []
        
        async for product in cursor:
            image_url = product.get("image_url", "")
            if "via.placeholder.com" in image_url or not image_url:
                product["image_url"] = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80"
            
            product["_id"] = str(product["_id"])
            products.append(product)
        
        return products
    
    async def get_product(self, product_id: str) -> dict:
        product = await self.db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise NotFoundError("Product not found")
        
        product["_id"] = str(product["_id"])
        return product
    
    async def search_products(self, request: ProductSearchRequest) -> dict:
        query = {}
        
        if request.q:
            query["$text"] = {"$search": request.q}
        
        if request.category:
            query["category"] = request.category
        
        if request.min_price > 0 or request.max_price < 999999:
            query["price"] = {}
            if request.min_price > 0:
                query["price"]["$gte"] = request.min_price
            if request.max_price < 999999:
                query["price"]["$lte"] = request.max_price
        
        cursor = self.db.products.find(query).skip(request.skip).limit(request.limit)
        products = []
        async for product in cursor:
            product["_id"] = str(product["_id"])
            products.append(product)
        
        return {"products": products, "count": len(products)}