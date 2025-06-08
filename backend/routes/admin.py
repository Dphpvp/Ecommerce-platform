from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId

from models.admin import OrderStatus, OrderStatusUpdate, AdminDashboardResponse
from auth.dependencies import get_current_user, get_admin_user
from database.connection import db
from utils.email import send_email

router = APIRouter(prefix="/admin", tags=["admin"])

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
    
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = []
    
    async for order in cursor:
        # Get user info for each order
        user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
        
        order_data = {
            "_id": str(order["_id"]),
            "user_id": order["user_id"],
            "user_info": {
                "email": user["email"] if user else "Unknown",
                "full_name": user.get("full_name", "Unknown") if user else "Unknown",
                "phone": user.get("phone", "") if user else ""
            },
            "items": order["items"],
            "total_amount": order["total_amount"],
            "shipping_address": order.get("shipping_address"),
            "payment_method": order.get("payment_method"),
            "status": order["status"],
            "created_at": order["created_at"]
        }
        orders.append(order_data)
    
    # Get order count for pagination
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

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str, 
    status_update: OrderStatusUpdate, 
    admin_user: dict = Depends(get_admin_user)
):
    """Update order status"""
    # Check if order exists
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status
    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "status": status_update.status,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update order status")
    
    # Get user info for email notification
    user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
    
    # Send status update email to customer
    if user:
        status_messages = {
            "accepted": "Your order has been accepted and is being prepared for shipment.",
            "processing": "Your order is currently being processed.",
            "shipped": "Great news! Your order has been shipped and is on its way to you.",
            "delivered": "Your order has been delivered. Thank you for your business!",
            "cancelled": "Unfortunately, your order has been cancelled. Please contact us for more information."
        }
        
        email_body = f"""
        <html>
        <body>
            <h2>Order Status Update</h2>
            <p>Hello {user.get('full_name', 'Customer')},</p>
            <p>Your order #{order_id} status has been updated.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <p><strong>New Status:</strong> <span style="color: #007bff; font-weight: bold;">{status_update.status.title()}</span></p>
                <p>{status_messages.get(status_update.status, 'Your order status has been updated.')}</p>
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
        
        await send_email(
            user["email"], 
            f"Order Status Update - #{order_id}", 
            email_body
        )
    
    return {"message": f"Order status updated to {status_update.status}"}

@router.get("/dashboard")
async def get_admin_dashboard(admin_user: dict = Depends(get_admin_user)):
    """Get admin dashboard statistics"""
    
    # Get order statistics
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    processing_orders = await db.orders.count_documents({"status": "processing"})
    shipped_orders = await db.orders.count_documents({"status": "shipped"})
    
    # Get total revenue
    revenue_pipeline = [
        {"$match": {"status": {"$in": ["accepted", "processing", "shipped", "delivered"]}}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    # Get recent orders
    recent_orders_cursor = db.orders.find().sort("created_at", -1).limit(5)
    recent_orders = []
    async for order in recent_orders_cursor:
        user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
        recent_orders.append({
            "_id": str(order["_id"]),
            "customer_name": user.get("full_name", "Unknown") if user else "Unknown",
            "total_amount": order["total_amount"],
            "status": order["status"],
            "created_at": order["created_at"]
        })
    
    # Get low stock products
    low_stock_products = []
    async for product in db.products.find({"stock": {"$lt": 10}}):
        low_stock_products.append({
            "_id": str(product["_id"]),
            "name": product["name"],
            "stock": product["stock"],
            "category": product["category"]
        })
    
    return {
        "statistics": {
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "processing_orders": processing_orders,
            "shipped_orders": shipped_orders,
            "total_revenue": total_revenue
        },
        "recent_orders": recent_orders,
        "low_stock_products": low_stock_products
    }

@router.get("/categories")
async def get_categories(admin_user: dict = Depends(get_admin_user)):
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    categories = await db.products.aggregate(pipeline).to_list(None)
    
    return {
        "categories": [
            {"name": cat["_id"], "product_count": cat["count"]} 
            for cat in categories
        ]
    }

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