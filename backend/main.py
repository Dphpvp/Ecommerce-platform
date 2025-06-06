from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import motor.motor_asyncio
from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt
import stripe
from bson import ObjectId
import asyncio
from fastapi import FastAPI
from api import router
from enum import Enum
import os

# Configuration
MONGODB_URL = os.getenv("MONGODB_URL")
JWT_SECRET = "your-jwt-secret-key"
STRIPE_SECRET_KEY = "sk_test_your_stripe_secret_key"

# Initialize FastAPI
app = FastAPI()
app.include_router(router, prefix="/api")  # Include your API router
# app.include_router(router, prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Keep for local development
        "https://ecommerce-platform-snowy.vercel.app",  
    ],                 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.ecommerce

# Stripe configuration
stripe.api_key = "sk_test_51RWK32RdyxKMeI2qLEuhXRESx74GFwX6mavGSxQaaBJkKCxFpayjj1AmOTEHXEWbVzNFOdE2kKA5rN5nnjZDJogS00qH27sIXA"

# Security
security = HTTPBearer()

# Admin-related Enums and Models
class OrderStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class UserRoleUpdate(BaseModel):
    is_admin: bool

# Existing Pydantic models
class User(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    address: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Product(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str
    stock: int

class CartItem(BaseModel):
    product_id: str
    quantity: int

class Order(BaseModel):
    user_id: str
    items: List[dict]
    total_amount: float
    shipping_address: dict
    payment_method: str

class PaymentIntent(BaseModel):
    amount: int
    currency: str = "usd"

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Admin dependency
async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Check if user is admin"""
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Routes

@app.post("/api/auth/register")
async def register(user: User):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = hash_password(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "full_name": user.full_name,
        "address": user.address,
        "phone": user.phone,
        "is_admin": False,  # Add admin field
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_data)
    token = create_jwt_token(str(result.inserted_id))
    
    return {"message": "User registered successfully", "token": token}

@app.post("/api/auth/login")
async def login(user_login: UserLogin):
    user = await db.users.find_one({"email": user_login.email})
    if not user or not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(str(user["_id"]))
    return {
        "token": token, 
        "user": {
            "id": str(user["_id"]), 
            "email": user["email"], 
            "username": user["username"],
            "full_name": user.get("full_name", ""),
            "is_admin": user.get("is_admin", False)  # Include admin status
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "address": current_user.get("address"),
        "phone": current_user.get("phone"),
        "is_admin": current_user.get("is_admin", False)  # Include admin status
    }

@app.post("/api/products")
async def create_product(product: Product):
    product_data = product.dict()
    product_data["created_at"] = datetime.utcnow()
    result = await db.products.insert_one(product_data)
    return {"message": "Product created", "id": str(result.inserted_id)}

@app.get("/api/products")
async def get_products(category: Optional[str] = None, limit: int = 20, skip: int = 0):
    query = {}
    if category:
        query["category"] = category
    
    cursor = db.products.find(query).skip(skip).limit(limit)
    products = []
    async for product in cursor:
        product["_id"] = str(product["_id"])
        products.append(product)
    
    return products

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product["_id"] = str(product["_id"])
    return product

@app.post("/api/cart/add")
async def add_to_cart(cart_item: CartItem, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Check if product exists
    product = await db.products.find_one({"_id": ObjectId(cart_item.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check stock
    if product["stock"] < cart_item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Add to cart
    cart_data = {
        "user_id": user_id,
        "product_id": cart_item.product_id,
        "quantity": cart_item.quantity,
        "added_at": datetime.utcnow()
    }
    
    # Check if item already in cart
    existing_item = await db.cart.find_one({"user_id": user_id, "product_id": cart_item.product_id})
    if existing_item:
        await db.cart.update_one(
            {"user_id": user_id, "product_id": cart_item.product_id},
            {"$inc": {"quantity": cart_item.quantity}}
        )
    else:
        await db.cart.insert_one(cart_data)
    
    return {"message": "Item added to cart"}

@app.get("/api/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$addFields": {"product_obj_id": {"$toObjectId": "$product_id"}}},
        {"$lookup": {
            "from": "products",
            "localField": "product_obj_id",
            "foreignField": "_id",
            "as": "product"
        }},
        {"$unwind": "$product"}
    ]
    
    cart_items = []
    async for item in db.cart.aggregate(pipeline):
        cart_items.append({
            "id": str(item["_id"]),
            "product_id": item["product_id"],
            "quantity": item["quantity"],
            "product": {
                "id": str(item["product"]["_id"]),
                "name": item["product"]["name"],
                "price": item["product"]["price"],
                "image_url": item["product"]["image_url"]
            }
        })
    
    return cart_items

@app.delete("/api/cart/{item_id}")
async def remove_from_cart(item_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    result = await db.cart.delete_one({"_id": ObjectId(item_id), "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    return {"message": "Item removed from cart"}

@app.post("/api/payment/create-intent")
async def create_payment_intent(payment: PaymentIntent):
    try:
        intent = stripe.PaymentIntent.create(
            amount=payment.amount,
            currency=payment.currency,
            metadata={'integration_check': 'accept_a_payment'}
        )
        return {"client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/orders")
async def create_order(order_data: dict, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Get cart items
    cart_items = await get_cart(current_user)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total
    total = sum(item["product"]["price"] * item["quantity"] for item in cart_items)
    
    # Create order
    order = {
        "user_id": user_id,
        "items": cart_items,
        "total_amount": total,
        "shipping_address": order_data.get("shipping_address"),
        "payment_method": order_data.get("payment_method"),
        "status": "pending",  # All orders start as pending for admin review
        "created_at": datetime.utcnow()
    }
    
    result = await db.orders.insert_one(order)
    order_id = str(result.inserted_id)
    
    # Clear cart
    await db.cart.delete_many({"user_id": user_id})
    
    # Update product stock
    for item in cart_items:
        await db.products.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"stock": -item["quantity"]}}
        )
    
    return {"message": "Order created successfully", "order_id": order_id}

@app.get("/api/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    cursor = db.orders.find({"user_id": user_id}).sort("created_at", -1)
    orders = []
    async for order in cursor:
        order["_id"] = str(order["_id"])
        orders.append(order)
    
    return orders

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    order = await db.orders.find_one({"_id": ObjectId(order_id), "user_id": user_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order["_id"] = str(order["_id"])
    return order

# ADMIN ROUTES
@app.get("/api/admin/dashboard")
async def get_admin_dashboard(admin_user: dict = Depends(get_admin_user)):
    """Get admin dashboard statistics"""
    
    # Get order statistics
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    accepted_orders = await db.orders.count_documents({"status": "accepted"})
    processing_orders = await db.orders.count_documents({"status": "processing"})
    shipped_orders = await db.orders.count_documents({"status": "shipped"})
    delivered_orders = await db.orders.count_documents({"status": "delivered"})
    cancelled_orders = await db.orders.count_documents({"status": "cancelled"})
    
    # Get total revenue (from accepted, processing, shipped, delivered orders)
    revenue_pipeline = [
        {"$match": {"status": {"$in": ["accepted", "processing", "shipped", "delivered"]}}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    # Get user statistics
    total_users = await db.users.count_documents({})
    admin_users = await db.users.count_documents({"is_admin": True})
    
    # Get product statistics
    total_products = await db.products.count_documents({})
    low_stock_count = await db.products.count_documents({"stock": {"$lt": 10}})
    
    # Get recent orders
    recent_orders_cursor = db.orders.find().sort("created_at", -1).limit(5)
    recent_orders = []
    async for order in recent_orders_cursor:
        user = await db.users.find_one({"_id": ObjectId(order["user_id"])})
        recent_orders.append({
            "_id": str(order["_id"]),
            "customer_name": user.get("full_name", "Unknown") if user else "Unknown",
            "customer_email": user.get("email", "Unknown") if user else "Unknown",
            "total_amount": order["total_amount"],
            "status": order["status"],
            "created_at": order["created_at"]
        })
    
    # Get low stock products
    low_stock_products = []
    async for product in db.products.find({"stock": {"$lt": 10}}).limit(10):
        low_stock_products.append({
            "_id": str(product["_id"]),
            "name": product["name"],
            "stock": product["stock"],
            "category": product["category"]
        })
    
    return {
        "statistics": {
            "orders": {
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "accepted_orders": accepted_orders,
                "processing_orders": processing_orders,
                "shipped_orders": shipped_orders,
                "delivered_orders": delivered_orders,
                "cancelled_orders": cancelled_orders
            },
            "revenue": {
                "total_revenue": total_revenue
            },
            "users": {
                "total_users": total_users,
                "admin_users": admin_users,
                "regular_users": total_users - admin_users
            },
            "products": {
                "total_products": total_products,
                "low_stock_count": low_stock_count
            }
        },
        "recent_orders": recent_orders,
        "low_stock_products": low_stock_products
    }

@app.get("/api/admin/orders")
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
                "phone": user.get("phone", "") if user else "",
                "username": user.get("username", "") if user else ""
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

@app.get("/api/admin/orders/{order_id}")
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
            "address": user.get("address", "") if user else "",
            "username": user.get("username", "") if user else ""
        },
        "items": order["items"],
        "total_amount": order["total_amount"],
        "shipping_address": order.get("shipping_address"),
        "payment_method": order.get("payment_method"),
        "status": order["status"],
        "created_at": order["created_at"]
    }
    
    return order_data

@app.put("/api/admin/orders/{order_id}/status")
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
                "updated_at": datetime.now(timezone.utc),
                "updated_by": str(admin_user["_id"])
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update order status")
    
    return {"message": f"Order status updated to {status_update.status}"}

@app.get("/api/admin/users")
async def get_all_users(
    limit: int = 50,
    skip: int = 0,
    admin_user: dict = Depends(get_admin_user)
):
    """Get all users for admin management"""
    
    cursor = db.users.find().sort("created_at", -1).skip(skip).limit(limit)
    users = []
    
    async for user in cursor:
        # Get user's order count
        order_count = await db.orders.count_documents({"user_id": str(user["_id"])})
        
        users.append({
            "_id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "phone": user.get("phone", ""),
            "address": user.get("address", ""),
            "is_admin": user.get("is_admin", False),
            "created_at": user["created_at"],
            "order_count": order_count
        })
    
    # Get total user count for pagination
    total_users = await db.users.count_documents({})
    
    return {
        "users": users,
        "total": total_users,
        "has_more": (skip + limit) < total_users
    }

@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    admin_user: dict = Depends(get_admin_user)
):
    """Update user admin status"""
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from removing their own admin status
    if str(admin_user["_id"]) == user_id and not role_update.is_admin:
        raise HTTPException(status_code=400, detail="Cannot remove your own admin privileges")
    
    # Update user role
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_admin": role_update.is_admin}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update user role")
    
    role_text = "admin" if role_update.is_admin else "regular user"
    return {"message": f"User role updated to {role_text}"}

@app.get("/api/admin/products")
async def get_all_products_admin(
    category: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    admin_user: dict = Depends(get_admin_user)
):
    """Get all products for admin management"""
    query = {}
    if category:
        query["category"] = category
    
    cursor = db.products.find(query).sort("created_at", -1).skip(skip).limit(limit)
    products = []
    
    async for product in cursor:
        products.append({
            "_id": str(product["_id"]),
            "name": product["name"],
            "description": product["description"],
            "price": product["price"],
            "category": product["category"],
            "image_url": product["image_url"],
            "stock": product["stock"],
            "created_at": product.get("created_at")
        })
    
    # Get total product count
    total_products = await db.products.count_documents(query)
    
    return {
        "products": products,
        "total": total_products,
        "has_more": (skip + limit) < total_products
    }

@app.put("/api/admin/products/{product_id}")
async def update_product(
    product_id: str,
    product: Product,
    admin_user: dict = Depends(get_admin_user)
):
    """Update product information"""
    
    # Check if product exists
    existing_product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update product
    product_data = product.dict()
    product_data["updated_at"] = datetime.utcnow()
    
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": product_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update product")
    
    return {"message": "Product updated successfully"}

@app.delete("/api/admin/products/{product_id}")
async def delete_product(
    product_id: str,
    admin_user: dict = Depends(get_admin_user)
):
    """Delete a product"""
    
    # Check if product exists
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete product
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Failed to delete product")
    
    return {"message": "Product deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)