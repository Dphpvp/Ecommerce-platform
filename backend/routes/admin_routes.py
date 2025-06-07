from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
import motor.motor_asyncio
from datetime import datetime
from dependencies import get_current_user, db, Product

# Import from main.py
from main import get_current_user, db, Product

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
async def get_all_orders(admin_user: dict = Depends(get_admin_user)):
    orders_cursor = db.orders.aggregate([
        {"$lookup": {"from": "users", "localField": "user_id", "foreignField": "_id", "as": "user"}},
        {"$unwind": "$user"},
        {"$sort": {"created_at": -1}},
        {"$project": {
            "_id": 1, "total_amount": 1, "status": 1, "created_at": 1, "items": 1,
            "customer_name": "$user.full_name", "customer_email": "$user.email",
            "shipping_address": 1
        }}
    ])
    orders = []
    async for order in orders_cursor:
        order["_id"] = str(order["_id"])
        orders.append(order)
    return orders

@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_data: dict, admin_user: dict = Depends(get_admin_user)):
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
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
        users.append(user)
    return users

@router.put("/users/{user_id}/admin")
async def toggle_admin_status(user_id: str, admin_data: dict, admin_user: dict = Depends(get_admin_user)):
    is_admin = admin_data.get("is_admin", False)
    
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
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted"}