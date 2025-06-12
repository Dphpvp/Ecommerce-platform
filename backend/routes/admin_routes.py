from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
import motor.motor_asyncio
from datetime import datetime
from dependencies import get_current_user, db
from api import Product

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Admin middleware
async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# Dashboard endpoint
@router.get("/dashboard")
async def get_dashboard_stats(admin_user: dict = Depends(get_admin_user)):
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
    
    # Recent orders
    recent_orders_cursor = db.orders.aggregate([
        {"$lookup": {"from": "users", "localField": "user_id", "foreignField": "_id", "as": "user"}},
        {"$unwind": "$user"},
        {"$sort": {"created_at": -1}},
        {"$limit": 5},
        {"$project": {
            "_id": 1, "total_amount": 1, "status": 1, "created_at": 1,
            "customer_name": "$user.full_name", "customer_email": "$user.email"
        }}
    ])
    recent_orders = await recent_orders_cursor.to_list(5)
    for order in recent_orders:
        order["_id"] = str(order["_id"])
    
    # Low stock products
    low_stock_cursor = db.products.find({"stock": {"$lt": 10}})
    low_stock_products = []
    async for product in low_stock_cursor:
        product["_id"] = str(product["_id"])
        low_stock_products.append(product)
    
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

# Product management
@router.put("/products/{product_id}")
async def update_product(product_id: str, product: Product, admin_user: dict = Depends(get_admin_user)):
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": product.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}

@router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# Order management
@router.get("/orders")
async def get_all_orders(status: str = None, admin_user: dict = Depends(get_admin_user)):
    # Build match stage for aggregation
    match_stage = {}
    if status:
        match_stage["status"] = status
    
    # Add match stage to pipeline if needed
    pipeline = []
    if match_stage:
        pipeline.append({"$match": match_stage})
    
    pipeline.extend([
        {"$addFields": {"user_obj_id": {"$toObjectId": "$user_id"}}},
        {"$lookup": {
            "from": "users", 
            "localField": "user_obj_id", 
            "foreignField": "_id", 
            "as": "user_info"
        }},
        {"$unwind": "$user_info"},
        {"$sort": {"created_at": -1}},
        {"$project": {
            "_id": 1, 
            "order_number": 1,
            "total_amount": 1, 
            "status": 1, 
            "created_at": 1, 
            "items": 1,
            "shipping_address": 1,
            "user_info": {
                "full_name": "$user_info.full_name",
                "email": "$user_info.email", 
                "username": "$user_info.username",
                "phone": "$user_info.phone"
            }
        }}
    ])
    
    orders_cursor = db.orders.aggregate(pipeline)
    orders = []
    async for order in orders_cursor:
        order["_id"] = str(order["_id"])
        orders.append(order)
    return {"orders": orders}

# Order status update
@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_data: dict, admin_user: dict = Depends(get_admin_user)):
    valid_statuses = ["pending", "accepted", "processing", "shipped", "delivered", "cancelled"]
    new_status = status_data.get("status")
    
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": new_status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# User management
@router.get("/users")
async def get_all_users(admin_user: dict = Depends(get_admin_user)):
    cursor = db.users.find({}, {"password": 0})
    users = []
    async for user in cursor:
        user["_id"] = str(user["_id"])
        order_count = await db.orders.count_documents({"user_id": str(user["_id"])})
        user["order_count"] = order_count
        users.append(user)
    return {"users": users}

@router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: dict, admin_user: dict = Depends(get_admin_user)):
    """Update user information"""
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

@router.put("/users/{user_id}/admin")
async def toggle_admin_status(user_id: str, admin_data: dict, admin_user: dict = Depends(get_admin_user)):
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

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin_user: dict = Depends(get_admin_user)):
    if str(admin_user["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Also delete user's orders and cart items
    await db.orders.delete_many({"user_id": user_id})
    await db.cart.delete_many({"user_id": user_id})
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

# Product listing for admin
@router.get("/products")
async def get_admin_products(admin_user: dict = Depends(get_admin_user)):
    cursor = db.products.find({})
    products = []
    async for product in cursor:
        product["_id"] = str(product["_id"])
        products.append(product)
    return {"products": products}

# Category management
@router.get("/categories")
async def get_categories(admin_user: dict = Depends(get_admin_user)):
    """Get all product categories with counts"""
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}, "total_stock": {"$sum": "$stock"}}},
        {"$sort": {"count": -1}}
    ]
    categories = await db.products.aggregate(pipeline).to_list(None)
    
    return {
        "categories": [
            {
                "name": cat["_id"], 
                "product_count": cat["count"],
                "total_stock": cat["total_stock"]
            } for cat in categories if cat["_id"]  # Filter out null categories
        ]
    }

@router.post("/categories")
async def create_category(category_data: dict, admin_user: dict = Depends(get_admin_user)):
    """Create a new category by adding a placeholder product"""
    category_name = category_data.get("name", "").strip()
    
    if not category_name:
        raise HTTPException(status_code=400, detail="Category name is required")
    
    # Check if category already exists
    existing = await db.products.find_one({"category": category_name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    # Insert a placeholder product to make category visible
    placeholder_product = {
        "name": f"Sample {category_name} Product",
        "description": "Placeholder product - edit or delete as needed",
        "price": 0.01,
        "category": category_name,
        "image_url": "https://via.placeholder.com/400x300?text=Sample+Product",
        "stock": 0,
        "created_at": datetime.utcnow()
    }
    
    await db.products.insert_one(placeholder_product)
    return {"success": True, "message": f"Category '{category_name}' created with sample product"}

@router.delete("/categories/{category_name}")
async def delete_category(category_name: str, admin_user: dict = Depends(get_admin_user)):
    """Delete a category and move products to 'Uncategorized'"""
    # Update all products in this category
    result = await db.products.update_many(
        {"category": category_name},
        {"$set": {"category": "Uncategorized"}}
    )
    
    return {"success": True, "message": f"Category deleted. {result.modified_count} products moved to 'Uncategorized'"}

# Debug endpoints
@router.get("/debug/products")
async def debug_products(admin_user: dict = Depends(get_admin_user)):
    cursor = db.products.find({}).limit(3)
    products = []
    async for product in cursor:
        products.append({
            "_id": str(product["_id"]),
            "name": product.get("name"),
            "category": product.get("category")
        })
    return {"products": products}

@router.get("/debug")
async def debug_categories(admin_user: dict = Depends(get_admin_user)):
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