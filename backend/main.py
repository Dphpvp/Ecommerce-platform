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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from bson import ObjectId
import asyncio

# Configuration
MONGODB_URL = "mongodb+srv://razvanmare:s6gYa6cU7Fj59Ssk@products.tijjxg2.mongodb.net/?retryWrites=true&w=majority&appName=Products"
JWT_SECRET = "your-jwt-secret-key"
STRIPE_SECRET_KEY = "sk_test_your_stripe_secret_key"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USER = "your-email@gmail.com"
EMAIL_PASSWORD = "your-app-password"

# Initialize FastAPI
app = FastAPI(title="E-commerce API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

# Pydantic models
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

async def send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_USER, to_email, text)
        server.quit()
    except Exception as e:
        print(f"Email sending failed: {e}")

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
    return {"token": token, "user": {"id": str(user["_id"]), "email": user["email"], "username": user["username"]}}

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "address": current_user.get("address"),
        "phone": current_user.get("phone")
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
    
    # Send confirmation email
    email_body = f"""
    <h2>Order Confirmation</h2>
    <p>Thank you for your order!</p>
    <p>Order ID: {order_id}</p>
    <p>Total Amount: ${total:.2f}</p>
    <h3>Items:</h3>
    <ul>
    """
    
    for item in cart_items:
        email_body += f"<li>{item['product']['name']} - Quantity: {item['quantity']} - ${item['product']['price']:.2f}</li>"
    
    email_body += "</ul><p>We'll send you tracking information once your order ships.</p>"
    
    await send_email(current_user["email"], f"Order Confirmation - {order_id}", email_body)
    
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)