from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone
from dependencies import get_current_user, db
from api.models.product import ProductRequest
from api.services.email_service import EmailService

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Admin middleware
async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

email_service = EmailService()

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
            "_id": 1, "order_number": 1, "total_amount": 1, "status": 1, "created_at": 1,
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
@router.get("/products")
async def get_admin_products(admin_user: dict = Depends(get_admin_user)):
    cursor = db.products.find({})
    products = []
    async for product in cursor:
        product["_id"] = str(product["_id"])
        products.append(product)
    return {"products": products}

@router.put("/products/{product_id}")
async def update_product(product_id: str, product_data: dict, admin_user: dict = Depends(get_admin_user)):
    try:
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {**product_data, "updated_at": datetime.now(timezone.utc)}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin_user: dict = Depends(get_admin_user)):
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# Order management
@router.get("/orders")
async def get_all_orders(
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    admin_user: dict = Depends(get_admin_user)
):
    """Get all orders for admin review"""
    query = {}
    if status:
        query["status"] = status
    
    orders_cursor = db.orders.aggregate([
        {"$match": query},
        {"$addFields": {"user_obj_id": {"$toObjectId": "$user_id"}}},
        {"$lookup": {
            "from": "users", 
            "localField": "user_obj_id", 
            "foreignField": "_id", 
            "as": "user_info"
        }},
        {"$unwind": "$user_info"},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$project": {
            "_id": 1, 
            "order_number": 1,
            "total_amount": 1, 
            "status": 1, 
            "created_at": 1, 
            "items": 1,
            "shipping_address": 1,
            "payment_method": 1,
            "user_info": {
                "full_name": "$user_info.full_name",
                "email": "$user_info.email", 
                "username": "$user_info.username",
                "phone": "$user_info.phone"
            }
        }}
    ])
    
    orders = []
    async for order in orders_cursor:
        order["_id"] = str(order["_id"])
        orders.append(order)
    
    # Get total count for pagination
    total_orders = await db.orders.count_documents(query)
    
    return {
        "orders": orders,
        "total": total_orders,
        "has_more": (skip + limit) < total_orders
    }

@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, admin_user: dict = Depends(get_admin_user)):
    """Get detailed order information for admin"""
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get user info
    user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
    
    order_data = {
        "_id": str(order["_id"]),
        "order_number": order.get("order_number"),
        "user_id": order["user_id"],
        "user_info": {
            "email": user["email"] if user else "Unknown",
            "full_name": user.get("full_name", "Unknown") if user else "Unknown",
            "phone": user.get("phone", "") if user else "",
            "address": user.get("address", "") if user else ""
        },
        "items": order["items"],
        "total_amount": order["total_amount"],
        "shipping_address": order.get("shipping_address"),
        "payment_method": order.get("payment_method"),
        "status": order["status"],
        "created_at": order["created_at"]
    }
    
    return order_data

# Order status update
@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str, 
    status_data: dict, 
    admin_user: dict = Depends(get_admin_user)
):
    """Update order status with email notification"""
    valid_statuses = ["pending", "accepted", "processing", "shipped", "delivered", "cancelled"]
    new_status = status_data.get("status")
    
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Check if order exists
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status
    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update order status")
    
    # Get user info for email notification
    user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
    
    # Send status update email to customer
    if user:
        status_messages = {
            "accepted": "Your order has been accepted and is being prepared for shipment.",
            "processing": "Your order is currently being processed.",
            "shipped": "Great news! Your order has been shipped.",
            "delivered": "Your order has been delivered. Thank you for your business!",
            "cancelled": "Unfortunately, your order has been cancelled. Please contact us for more information."
        }
        
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">Order Status Update</h2>
            <p>Hello {user.get('full_name', 'Customer')},</p>
            <p>Your order #{order.get('order_number', order_id)} status has been updated.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <p><strong>New Status:</strong> <span style="color: #007bff; font-weight: bold;">{new_status.title()}</span></p>
                <p>{status_messages.get(new_status, 'Your order status has been updated.')}</p>
                <p><strong>Order Total:</strong> ${order['total_amount']:.2f}</p>
            </div>
            
            <p>Thank you for shopping with us!</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                This is an automated notification from E-Shop.<br>
                If you have any questions, please contact our support team.
            </p>
        </body>
        </html>
        """
        
        try:
            await email_service.send_email(
                user["email"], 
                f"Order Status Update - #{order.get('order_number', order_id)}", 
                email_body
            )
        except Exception as e:
            print(f"Failed to send status update email: {e}")
    
    return {"message": f"Order status updated to {new_status}"}

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
    
    # Check if this is the last admin
    if admin_user.get("is_admin") and await db.users.count_documents({"is_admin": True}) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last admin account")
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted"}

# Categories and analytics
@router.get("/categories")
async def get_categories(admin_user: dict = Depends(get_admin_user)):
    """Get all product categories with counts"""
    pipeline = [
        {"$group": {
            "_id": "$category", 
            "count": {"$sum": 1}, 
            "total_stock": {"$sum": "$stock"},
            "avg_price": {"$avg": "$price"}
        }},
        {"$sort": {"count": -1}}
    ]
    categories = await db.products.aggregate(pipeline).to_list(None)
    
    return {
        "categories": [
            {
                "name": cat["_id"], 
                "product_count": cat["count"],
                "total_stock": cat["total_stock"],
                "avg_price": round(cat["avg_price"], 2)
            } for cat in categories
        ]
    }

# Analytics endpoints
@router.get("/analytics/sales")
async def get_sales_analytics(admin_user: dict = Depends(get_admin_user)):
    """Get sales analytics data"""
    # Daily sales for last 30 days
    from datetime import timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    daily_sales_pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}, "status": {"$in": ["shipped", "delivered"]}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "total_sales": {"$sum": "$total_amount"},
            "order_count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    daily_sales = await db.orders.aggregate(daily_sales_pipeline).to_list(None)
    
    # Top selling products
    top_products_pipeline = [
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product.name",
            "total_sold": {"$sum": "$items.quantity"},
            "total_revenue": {"$sum": {"$multiply": ["$items.quantity", "$items.product.price"]}}
        }},
        {"$sort": {"total_sold": -1}},
        {"$limit": 10}
    ]
    
    top_products = await db.orders.aggregate(top_products_pipeline).to_list(None)
    
    return {
        "daily_sales": daily_sales,
        "top_products": top_products
    }

# Debug endpoints
@router.get("/debug/products")
async def debug_products(admin_user: dict = Depends(get_admin_user)):
    cursor = db.products.find({}).limit(3)
    products = []
    async for product in cursor:
        products.append({
            "_id": str(product["_id"]),
            "name": product.get("name"),
            "category": product.get("category"),
            "price": product.get("price"),
            "stock": product.get("stock")
        })
    return {"products": products}

@router.get("/debug")
async def debug_info(admin_user: dict = Depends(get_admin_user)):
    # Count total products
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({})
    
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
        "total_orders": total_orders,
        "total_users": total_users,
        "sample_products": sample_products
    }