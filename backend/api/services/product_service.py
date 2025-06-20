from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from api.models.product import ProductRequest, ProductSearchRequest
from api.models.responses import ProductResponse
from api.core.database import get_database
from api.core.exceptions import NotFoundError, ValidationError
from api.utils.security import SecurityValidator

class ProductService:
    def __init__(self):
        self.db = get_database()
    
    async def create_product(self, request: ProductRequest, admin_user: dict) -> dict:
        if request.price <= 0:
            raise ValidationError("Price must be positive")
        
        if request.stock < 0:
            raise ValidationError("Stock cannot be negative")
        
        # Validate image URL
        if not SecurityValidator.validate_image_url(request.image_url):
            raise ValidationError("Invalid image URL")
        
        product_data = request.dict()
        product_data["created_at"] = datetime.utcnow()
        product_data["created_by"] = str(admin_user["_id"])
        product_data["updated_at"] = datetime.utcnow()
        
        result = await self.db.products.insert_one(product_data)
        return {"message": "Product created", "id": str(result.inserted_id)}
    
    async def get_products(self, category: Optional[str] = None, limit: int = 50, skip: int = 0) -> List[dict]:
        query = {}
        if category and category.strip():
            query["category"] = category.strip()
        
        limit = min(limit, 100)  # Maximum 100 products per request
        skip = max(skip, 0)
        
        cursor = self.db.products.find(query).skip(skip).limit(limit)
        products = []
        
        async for product in cursor:
            # Fix placeholder image URLs
            image_url = product.get("image_url", "")
            if "via.placeholder.com" in image_url or not image_url:
                product["image_url"] = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80"
            
            product["_id"] = str(product["_id"])
            if "created_by" in product:
                product["created_by"] = str(product["created_by"])
            products.append(product)
        
        return products
    
    async def get_product(self, product_id: str) -> dict:
        try:
            product = await self.db.products.find_one({"_id": ObjectId(product_id)})
        except:
            raise NotFoundError("Invalid product ID")
            
        if not product:
            raise NotFoundError("Product not found")
        
        # Fix placeholder image URLs
        image_url = product.get("image_url", "")
        if "via.placeholder.com" in image_url or not image_url:
            product["image_url"] = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80"
        
        product["_id"] = str(product["_id"])
        if "created_by" in product:
            product["created_by"] = str(product["created_by"])
        return product
    
    async def update_product(self, product_id: str, request: ProductRequest, admin_user: dict) -> dict:
        if request.price <= 0:
            raise ValidationError("Price must be positive")
        
        if request.stock < 0:
            raise ValidationError("Stock cannot be negative")
        
        # Validate image URL
        if not SecurityValidator.validate_image_url(request.image_url):
            raise ValidationError("Invalid image URL")
        
        update_data = request.dict()
        update_data["updated_at"] = datetime.utcnow()
        update_data["updated_by"] = str(admin_user["_id"])
        
        try:
            result = await self.db.products.update_one(
                {"_id": ObjectId(product_id)},
                {"$set": update_data}
            )
        except:
            raise ValidationError("Invalid product ID")
        
        if result.matched_count == 0:
            raise NotFoundError("Product not found")
        
        return {"message": "Product updated successfully"}
    
    async def delete_product(self, product_id: str, admin_user: dict) -> dict:
        try:
            result = await self.db.products.delete_one({"_id": ObjectId(product_id)})
        except:
            raise ValidationError("Invalid product ID")
        
        if result.deleted_count == 0:
            raise NotFoundError("Product not found")
        
        return {"message": "Product deleted successfully"}
    
    async def search_products(self, request: ProductSearchRequest) -> dict:
        # Sanitize search inputs
        query = {}
        
        if request.q:
            # Create text search query
            sanitized_query = SecurityValidator.sanitize_string(request.q, 100)
            query["$or"] = [
                {"name": {"$regex": sanitized_query, "$options": "i"}},
                {"description": {"$regex": sanitized_query, "$options": "i"}},
                {"category": {"$regex": sanitized_query, "$options": "i"}}
            ]
        
        if request.category:
            sanitized_category = SecurityValidator.sanitize_string(request.category, 100)
            query["category"] = {"$regex": sanitized_category, "$options": "i"}
        
        # Price range filter
        if request.min_price > 0 or request.max_price < 999999:
            query["price"] = {}
            if request.min_price > 0:
                query["price"]["$gte"] = request.min_price
            if request.max_price < 999999:
                query["price"]["$lte"] = request.max_price
        
        # Validate pagination
        limit = min(request.limit, 100)  # Max 100 items per request
        skip = max(request.skip, 0)
        
        cursor = self.db.products.find(query).skip(skip).limit(limit)
        products = []
        async for product in cursor:
            # Fix placeholder image URLs
            image_url = product.get("image_url", "")
            if "via.placeholder.com" in image_url or not image_url:
                product["image_url"] = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80"
            
            product["_id"] = str(product["_id"])
            products.append(product)
        
        # Get total count for pagination
        total_count = await self.db.products.count_documents(query)
        
        return {
            "products": products, 
            "count": len(products),
            "total": total_count,
            "has_more": (skip + limit) < total_count
        }
    
    async def get_categories(self) -> dict:
        """Get all product categories with counts"""
        pipeline = [
            {
                "$group": {
                    "_id": "$category", 
                    "count": {"$sum": 1},
                    "total_stock": {"$sum": "$stock"},
                    "avg_price": {"$avg": "$price"}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        categories = []
        async for cat in self.db.products.aggregate(pipeline):
            categories.append({
                "name": cat["_id"], 
                "product_count": cat["count"],
                "total_stock": cat["total_stock"],
                "avg_price": round(cat["avg_price"], 2)
            })
        
        return {"categories": categories}
    
    async def get_featured_products(self, limit: int = 10) -> List[dict]:
        """Get featured products (highest rated or most recent)"""
        cursor = self.db.products.find().sort("created_at", -1).limit(limit)
        products = []
        
        async for product in cursor:
            # Fix placeholder image URLs
            image_url = product.get("image_url", "")
            if "via.placeholder.com" in image_url or not image_url:
                product["image_url"] = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80"
            
            product["_id"] = str(product["_id"])
            products.append(product)
        
        return products
    
    async def get_low_stock_products(self, threshold: int = 10) -> List[dict]:
        """Get products with low stock for admin alerts"""
        cursor = self.db.products.find({"stock": {"$lt": threshold}}).sort("stock", 1)
        products = []
        
        async for product in cursor:
            product["_id"] = str(product["_id"])
            products.append({
                "id": str(product["_id"]),
                "name": product["name"],
                "stock": product["stock"],
                "category": product["category"],
                "price": product["price"]
            })
        
        return products