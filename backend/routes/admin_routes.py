# backend/routes/admin_routes.py - Fixed version
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import re
from urllib.parse import unquote
from pydantic import BaseModel

from dependencies import get_admin_user
from database.connection import db

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Product model for admin routes
class Product(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str
    stock: int

# Dashboard endpoint
@router.get("/dashboard")
async def get_dashboard_stats(admin_user: dict = Depends(get_admin_user)):
    try:
        # Order statistics
        total_orders = await db.orders.count_documents({})
        pending_orders = await db.orders.count_documents({"status": "pending"})
        processing_orders = await db.orders.count_documents({"status": "processing"})
        shipped_orders = await db.orders.count_documents({"status": "shipped"})
        delivered_orders = await db.orders.count_documents({"status": "delivered"})
        
        # Revenue
        revenue_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}]
        revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0
        
        # Users
        total_users = await db.users.count_documents({})
        admin_users = await db.users.count_documents({"is_admin": True})
        
        # Products
        total_products = await db.products.count_documents({})
        
        # Recent orders (simplified to avoid complex aggregation issues)
        recent_orders = []
        try:
            cursor = db.orders.find({}).sort("created_at", -1).limit(5)
            async for order in cursor:
                order["_id"] = str(order["_id"])
                # Get user info separately to avoid aggregation issues
                if "user_id" in order:
                    try:
                        user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
                        if user:
                            order["customer_name"] = user.get("full_name", "Unknown")
                            order["customer_email"] = user.get("email", "Unknown")
                    except:
                        order["customer_name"] = "Unknown"
                        order["customer_email"] = "Unknown"
                recent_orders.append(order)
        except Exception as e:
            print(f"Recent orders error: {e}")
            recent_orders = []
        
        # Low stock products
        low_stock_products = []
        try:
            cursor = db.products.find({"stock": {"$lt": 10}}).limit(10)
            async for product in cursor:
                product["_id"] = str(product["_id"])
                low_stock_products.append(product)
        except Exception as e:
            print(f"Low stock products error: {e}")
            low_stock_products = []
        
        return {
            "statistics": {
                "orders": {
                    "total_orders": total_orders,
                    "pending_orders": pending_orders,
                    "accepted_orders": 0,
                    "processing_orders": processing_orders,
                    "shipped_orders": shipped_orders,
                    "delivered_orders": delivered_orders
                },
                "revenue": {"total_revenue": total_revenue},
                "users": {"total_users": total_users, "admin_users": admin_users},
                "products": {"total_products": total_products}
            },
            "recent_orders": recent_orders,
            "low_stock_products": low_stock_products
        }
    except Exception as e:
        print(f"Dashboard error: {e}")
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")

# Product management
@router.put("/products/{product_id}")
async def update_product(product_id: str, product: Product, admin_user: dict = Depends(get_admin_user)):
    try:
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": product.dict()}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Product update error: {str(e)}")

@router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin_user: dict = Depends(get_admin_user)):
    try:
        result = await db.products.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Product delete error: {str(e)}")

# Order management
@router.get("/orders")
async def get_all_orders(status: Optional[str] = None, admin_user: dict = Depends(get_admin_user)):
    try:
        query = {}
        if status:
            query["status"] = status
        
        # Simplified query without complex aggregation
        cursor = db.orders.find(query).sort("created_at", -1).limit(100)
        orders = []
        
        async for order in cursor:
            order["_id"] = str(order["_id"])
            
            # Get user info separately to avoid aggregation issues
            if "user_id" in order:
                try:
                    user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
                    if user:
                        order["user_info"] = {
                            "full_name": user.get("full_name", "Unknown"),
                            "email": user.get("email", "Unknown"),
                            "username": user.get("username", "Unknown"),
                            "phone": user.get("phone", "Unknown")
                        }
                    else:
                        order["user_info"] = {
                            "full_name": "Unknown",
                            "email": "Unknown",
                            "username": "Unknown",
                            "phone": "Unknown"
                        }
                except Exception as e:
                    print(f"User lookup error for order {order['_id']}: {e}")
                    order["user_info"] = {
                        "full_name": "Error",
                        "email": "Error",
                        "username": "Error",
                        "phone": "Error"
                    }
            
            orders.append(order)
        
        return {"orders": orders}
    except Exception as e:
        print(f"Orders fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Orders fetch error: {str(e)}")

# Order status update
@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_data: dict, admin_user: dict = Depends(get_admin_user)):
    try:
        valid_statuses = ["pending", "accepted", "processing", "shipped", "delivered", "cancelled"]
        new_status = status_data.get("status")
        
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        result = await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {"message": "Order status updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status update error: {str(e)}")

# User management
@router.get("/users")
async def get_all_users(admin_user: dict = Depends(get_admin_user)):
    try:
        cursor = db.users.find({}, {"password": 0}).limit(100)
        users = []
        async for user in cursor:
            user["_id"] = str(user["_id"])
            try:
                order_count = await db.orders.count_documents({"user_id": str(user["_id"])})
                user["order_count"] = order_count
            except:
                user["order_count"] = 0
            users.append(user)
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Users fetch error: {str(e)}")

@router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: dict, admin_user: dict = Depends(get_admin_user)):
    try:
        # Remove any fields that shouldn't be updated
        allowed_fields = ["full_name", "email", "username", "phone", "address"]
        update_data = {k: v for k, v in user_data.items() if k in allowed_fields}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Check if email or username already exists (if being updated)
        if "email" in update_data:
            existing_email = await db.users.find_one({"email": update_data["email"], "_id": {"$ne": ObjectId(user_id)}})
            if existing_email:
                raise HTTPException(status_code=400, detail="Email already exists")
        
        if "username" in update_data:
            existing_username = await db.users.find_one({"username": update_data["username"], "_id": {"$ne": ObjectId(user_id)}})
            if existing_username:
                raise HTTPException(status_code=400, detail="Username already exists")
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"User update error: {str(e)}")

@router.put("/users/{user_id}/admin")
async def toggle_admin_status(user_id: str, admin_data: dict, admin_user: dict = Depends(get_admin_user)):
    try:
        is_admin = admin_data.get("is_admin", False)
        
        # Prevent admin from removing their own admin status
        if str(admin_user["_id"]) == user_id and not is_admin:
            raise HTTPException(status_code=400, detail="Cannot remove your own admin privileges")
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_admin": is_admin}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User admin status updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Admin status update error: {str(e)}")

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin_user: dict = Depends(get_admin_user)):
    try:
        if str(admin_user["_id"]) == user_id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        # Also delete user's orders and cart items
        await db.orders.delete_many({"user_id": user_id})
        await db.cart.delete_many({"user_id": user_id})
        
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"User delete error: {str(e)}")

# Product listing for admin
@router.get("/products")
async def get_admin_products(admin_user: dict = Depends(get_admin_user)):
    try:
        cursor = db.products.find({}).limit(100)
        products = []
        async for product in cursor:
            product["_id"] = str(product["_id"])
            products.append(product)
        return {"products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Products fetch error: {str(e)}")

# Category management
@router.get("/categories")
async def get_categories(admin_user: dict = Depends(get_admin_user)):
    try:
        pipeline = [
            {"$group": {
                "_id": "$category", 
                "count": {"$sum": 1}, 
                "total_stock": {"$sum": "$stock"}
            }},
            {"$sort": {"_id": 1}}
        ]
        categories = await db.products.aggregate(pipeline).to_list(None)
        
        flat_categories = []
        
        for cat in categories:
            if cat["_id"]:  # Filter out null categories
                category_name = cat["_id"]
                parts = category_name.split('/')
                
                flat_categories.append({
                    "name": category_name,
                    "product_count": cat["count"],
                    "total_stock": cat["total_stock"],
                    "level": len(parts) - 1,
                    "parent": '/'.join(parts[:-1]) if len(parts) > 1 else None
                })
        
        return {"categories": flat_categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Categories fetch error: {str(e)}")

@router.post("/categories")
async def create_category(category_data: dict, admin_user: dict = Depends(get_admin_user)):
    try:
        category_name = category_data.get("name", "").strip()
        parent_category = category_data.get("parent", "").strip()
        
        if not category_name:
            raise HTTPException(status_code=400, detail="Category name is required")
        
        # Build full category path
        if parent_category:
            full_category_name = f"{parent_category}/{category_name}"
        else:
            full_category_name = category_name
        
        # Check if category already exists
        existing = await db.products.find_one({"category": full_category_name})
        if existing:
            raise HTTPException(status_code=400, detail="Category already exists")
        
        # Create placeholder product
        placeholder_product = {
            "name": f"Sample {category_name} Product",
            "description": "Placeholder product - edit or delete as needed",
            "price": 0.01,
            "category": full_category_name,
            "image_url": "https://via.placeholder.com/400x300?text=Sample+Product",
            "stock": 0,
            "created_at": datetime.utcnow()
        }
        
        await db.products.insert_one(placeholder_product)
        return {"success": True, "message": f"Category '{full_category_name}' created"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Category creation error: {str(e)}")

@router.delete("/categories/{category_name:path}")
async def delete_category(category_name: str, admin_user: dict = Depends(get_admin_user)):
    try:
        # Properly decode URL-encoded category name
        category_name = unquote(category_name)
        
        # Find all categories that start with this category name (including subcategories)
        categories_to_delete = await db.products.distinct("category", {
            "category": {"$regex": f"^{re.escape(category_name)}(/.*)?$"}
        })
        
        if not categories_to_delete:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Move all products in these categories to 'Uncategorized'
        result = await db.products.update_many(
            {"category": {"$in": categories_to_delete}},
            {"$set": {"category": "Uncategorized"}}
        )
        
        return {
            "success": True, 
            "message": f"Category and {len(categories_to_delete)} subcategories deleted. {result.modified_count} products moved to 'Uncategorized'"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Category deletion error: {str(e)}")

# Debug endpoints
@router.get("/debug/products")
async def debug_products(admin_user: dict = Depends(get_admin_user)):
    try:
        cursor = db.products.find({}).limit(3)
        products = []
        async for product in cursor:
            products.append({
                "_id": str(product["_id"]),
                "name": product.get("name"),
                "category": product.get("category")
            })
        return {"products": products}
    except Exception as e:
        return {"error": str(e), "products": []}

@router.get("/debug")
async def debug_categories(admin_user: dict = Depends(get_admin_user)):
    try:
        # Count total products
        total_products = await db.products.count_documents({})
        
        # Get first few products
        sample_products = []
        async for product in db.products.find({}).limit(3):
            sample_products.append({
                "name": product.get("name"),
                "category": product.get("category"),
                "all_fields": list(product.keys())
            })
        
        return {
            "total_products": total_products,
            "sample_products": sample_products
        }
    except Exception as e:
        return {"error": str(e), "total_products": 0, "sample_products": []}

# Health check
@router.get("/health")
async def admin_health(admin_user: dict = Depends(get_admin_user)):
    return {"status": "healthy", "admin": True, "user": admin_user.get("email", "unknown")}