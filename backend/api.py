from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from jose import jwt
import bcrypt
import stripe
from bson import ObjectId
import os
from google.oauth2 import id_token
from google.auth.transport import requests
import re

# Import your database connection
from database.connection import db
from dependencies import get_current_user, security

# Email imports
from utils.email import send_order_confirmation_email, send_admin_order_notification, send_contact_email

router = APIRouter()

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-key")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
stripe.api_key = STRIPE_SECRET_KEY

# Pydantic models
class User(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    address: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    identifier: str  # Can be email, username, or phone
    password: str

class GoogleLogin(BaseModel):
    token: str

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

class PaymentIntent(BaseModel):
    amount: int
    currency: str = "usd"

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

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

def get_identifier_type(identifier: str):
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    phone_pattern = r'^[\+]?[1-9][\d]{3,14}$'
    
    if re.match(email_pattern, identifier):
        return "email"
    elif re.match(phone_pattern, identifier.replace(" ", "").replace("-", "")):
        return "phone"
    else:
        return "username"

async def get_next_order_number():
    counter = await db.counters.find_one_and_update(
        {"_id": "order_number"},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=True
    )
    return counter["value"]

# Auth routes
@router.post("/auth/register")
async def register(user: User):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "full_name": user.full_name,
        "address": user.address,
        "phone": user.phone,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_data)
    token = create_jwt_token(str(result.inserted_id))
    
    return {"message": "User registered successfully", "token": token}

@router.post("/auth/login")
async def login(user_login: UserLogin):
    identifier_type = get_identifier_type(user_login.identifier)
    
    # Create query based on identifier type
    if identifier_type == "email":
        query = {"email": user_login.identifier}
    elif identifier_type == "phone":
        query = {"phone": user_login.identifier}
    else:
        query = {"username": user_login.identifier}
    
    user = await db.users.find_one(query)
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
            "is_admin": user.get("is_admin", False)
        }
    }

@router.post("/auth/google")
async def google_login(google_login: GoogleLogin):
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            google_login.token, requests.Request(), GOOGLE_CLIENT_ID
        )
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
        
        email = idinfo['email']
        name = idinfo['name']
        google_id = idinfo['sub']
        
        # Check if user exists
        user = await db.users.find_one({"email": email})
        
        if user:
            # User exists, log them in
            token = create_jwt_token(str(user["_id"]))
            return {
                "token": token,
                "user": {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "username": user["username"],
                    "full_name": user.get("full_name", ""),
                    "is_admin": user.get("is_admin", False)
                }
            }
        else:
            # Create new user
            username = email.split('@')[0]  # Use email prefix as username
            
            # Ensure username is unique
            counter = 1
            original_username = username
            while await db.users.find_one({"username": username}):
                username = f"{original_username}{counter}"
                counter += 1
            
            user_data = {
                "username": username,
                "email": email,
                "password": "",  # No password for Google users
                "full_name": name,
                "google_id": google_id,
                "is_admin": False,
                "created_at": datetime.now(timezone.utc)
            }
            
            result = await db.users.insert_one(user_data)
            token = create_jwt_token(str(result.inserted_id))
            
            return {
                "token": token,
                "user": {
                    "id": str(result.inserted_id),
                    "email": email,
                    "username": username,
                    "full_name": name,
                    "is_admin": False
                }
            }
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "address": current_user.get("address"),
        "phone": current_user.get("phone"),
        "is_admin": current_user.get("is_admin", False)
    }

# Product routes
@router.post("/products")
async def create_product(product: Product):
    product_data = product.dict()
    product_data["created_at"] = datetime.utcnow()
    result = await db.products.insert_one(product_data)
    return {"message": "Product created", "id": str(result.inserted_id)}

@router.get("/products")
async def get_products(category: Optional[str] = None, limit: int = 100, skip: int = 0):
    query = {}
    if category and category.strip():
        query["category"] = category.strip()
    
    cursor = db.products.find(query).skip(skip).limit(limit)
    products = []
    async for product in cursor:
        product["_id"] = str(product["_id"])
        products.append(product)
    
    return products

@router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product["_id"] = str(product["_id"])
    return product

# Cart routes
@router.post("/cart/add")
async def add_to_cart(cart_item: CartItem, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    product = await db.products.find_one({"_id": ObjectId(cart_item.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["stock"] < cart_item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    cart_data = {
        "user_id": user_id,
        "product_id": cart_item.product_id,
        "quantity": cart_item.quantity,
        "added_at": datetime.utcnow()
    }
    
    existing_item = await db.cart.find_one({"user_id": user_id, "product_id": cart_item.product_id})
    if existing_item:
        await db.cart.update_one(
            {"user_id": user_id, "product_id": cart_item.product_id},
            {"$inc": {"quantity": cart_item.quantity}}
        )
    else:
        await db.cart.insert_one(cart_data)
    
    return {"message": "Item added to cart"}

@router.get("/cart")
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

@router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    result = await db.cart.delete_one({"_id": ObjectId(item_id), "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    return {"message": "Item removed from cart"}

# Contact form route
@router.post("/contact")
async def submit_contact_form(contact_data: ContactForm):
    try:
        email_sent = await send_contact_email(
            name=contact_data.name,
            email=contact_data.email,
            phone=contact_data.phone,
            message=contact_data.message
        )
        
        if email_sent:
            return {"message": "Message sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
    except Exception as e:
        print(f"❌ Contact form error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")

# Payment route
@router.post("/payment/create-intent")
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

# Order routes with email notifications
@router.post("/orders")
async def create_order(order_data: dict, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Get cart items
    cart_items = await get_cart(current_user)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    total = sum(item["product"]["price"] * item["quantity"] for item in cart_items)
    
    # Get next order number
    order_number = await get_next_order_number()
    
    order = {
        "order_number": f"{order_number:05d}",
        "user_id": user_id,
        "items": cart_items,
        "total_amount": total,
        "shipping_address": order_data.get("shipping_address"),
        "payment_method": order_data.get("payment_method"),
        "status": "pending",
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
    
    # Send email notifications
    try:
        user_name = current_user.get("full_name", current_user.get("username", "Customer"))
        user_email = current_user["email"]
        
        # Send confirmation email to customer
        customer_email_sent = await send_order_confirmation_email(
            user_email=user_email,
            user_name=user_name,
            order_id=order["order_number"],
            total_amount=total,
            items=cart_items
        )
        
        # Send notification email to admin
        admin_email_sent = await send_admin_order_notification(
            order_id=order["order_number"],
            user_email=user_email,
            user_name=user_name,
            total_amount=total,
            items=cart_items
        )
            
    except Exception as e:
        print(f"❌ Email notification error for order {order['order_number']}: {str(e)}")
    
    return {"message": "Order created successfully", "order_id": order_id, "order_number": order["order_number"]}

@router.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    cursor = db.orders.find({"user_id": user_id}).sort("created_at", -1)
    orders = []
    async for order in cursor:
        order["_id"] = str(order["_id"])
        orders.append(order)
    
    return orders

@router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    order = await db.orders.find_one({"_id": ObjectId(order_id), "user_id": user_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order["_id"] = str(order["_id"])
    return order