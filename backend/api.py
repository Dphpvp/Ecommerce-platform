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
import pyotp
import qrcode
import io
import base64
import secrets

# Import your database connection
from database.connection import db
from dependencies import get_current_user, security

# 🆕 ADD EMAIL IMPORT
from utils.email import send_order_confirmation_email, send_admin_order_notification, send_verification_email

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

# 🆕 NEW: Profile Update Models
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_image_url: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str

# 2FA Models
class TwoFactorVerification(BaseModel):
    code: str

class TwoFactorSetup(BaseModel):
    code: str
    
class TwoFactorDisable(BaseModel):
    password: str
    code: str

class EmailVerification(BaseModel):
    token: str

class ResendVerification(BaseModel):
    email: str

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, expires_in: timedelta = timedelta(days=7)) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + expires_in
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
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    
    hashed_password = hash_password(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "full_name": user.full_name,
        "address": user.address,
        "phone": user.phone,
        "is_admin": False,
        "email_verified": False,
        "verification_token": verification_token,
        "verification_token_created": datetime.now(timezone.utc),
        "two_factor_enabled": False,
        "two_factor_secret": None,
        "backup_codes": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.users.insert_one(user_data)
    
    # Send verification email
    try:
        verification_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={verification_token}"
        await send_verification_email(user.email, user.full_name, verification_url)
        print(f"✅ Verification email sent to {user.email}")
    except Exception as e:
        print(f"❌ Failed to send verification email: {e}")
    
    return {"message": "User registered successfully. Please check your email to verify your account."}

@router.post("/auth/verify-email")
async def verify_email(verification_data: EmailVerification):
    """Verify email with token"""
    try:
        user = await db.users.find_one({"verification_token": verification_data.token})
        if not user:
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        # Check if token is expired (24 hours)
        token_created = user.get("verification_token_created")
        if token_created:
            expiry_time = token_created + timedelta(hours=24)
            if datetime.now(timezone.utc) > expiry_time:
                raise HTTPException(status_code=400, detail="Verification token expired")
        
        # Update user as verified
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"email_verified": True},
                "$unset": {"verification_token": "", "verification_token_created": ""}
            }
        )
        
        return {"message": "Email verified successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Verification failed")

@router.post("/auth/resend-verification")
async def resend_verification(email_data: ResendVerification):
    """Resend verification email"""
    try:
        user = await db.users.find_one({"email": email_data.email, "email_verified": False})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found or already verified")
        
        # Generate new token
        verification_token = secrets.token_urlsafe(32)
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "verification_token": verification_token,
                    "verification_token_created": datetime.now(timezone.utc)
                }
            }
        )
        
        # Send new verification email
        verification_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={verification_token}"
        await send_verification_email(email_data.email, user.get("full_name", "User"), verification_url)
        
        return {"message": "Verification email sent"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to send verification email")

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
    
    # Check email verification
    if not user.get("email_verified", False):
        raise HTTPException(
            status_code=401, 
            detail="Email not verified. Please check your email and verify your account."
        )
    
    # Check if 2FA is enabled
    if user.get("two_factor_enabled"):
        # Return temporary token for 2FA verification
        temp_token = create_jwt_token(str(user["_id"]), expires_in=timedelta(minutes=5))
        return {
            "requires_2fa": True,
            "temp_token": temp_token,
            "message": "Please enter your 2FA code"
        }
    
    token = create_jwt_token(str(user["_id"]))
    return {
        "token": token, 
        "user": {
            "id": str(user["_id"]), 
            "email": user["email"], 
            "username": user["username"],
            "full_name": user.get("full_name", ""),
            "address": user.get("address"),
            "phone": user.get("phone"),
            "profile_image_url": user.get("profile_image_url"),
            "is_admin": user.get("is_admin", False),
            "email_verified": user.get("email_verified", False),
            "two_factor_enabled": user.get("two_factor_enabled", False)
        }
    }

@router.post("/auth/verify-2fa")
async def verify_2fa_login(verification_data: dict):
    """Verify 2FA during login"""
    try:
        temp_token = verification_data.get("temp_token")
        code = verification_data.get("code")
        
        payload = jwt.decode(temp_token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Verify 2FA code
        secret = user.get("two_factor_secret")
        totp = pyotp.TOTP(secret)
        
        # Check TOTP code
        if totp.verify(code, valid_window=1):
            token = create_jwt_token(str(user["_id"]))
            return {
                "token": token,
                "user": {
                    "id": str(user["_id"]), 
                    "email": user["email"], 
                    "username": user["username"],
                    "full_name": user.get("full_name", ""),
                    "address": user.get("address"),
                    "phone": user.get("phone"),
                    "profile_image_url": user.get("profile_image_url"),
                    "is_admin": user.get("is_admin", False),
                    "email_verified": user.get("email_verified", False),
                    "two_factor_enabled": user.get("two_factor_enabled", False)
                }
            }
        
        # Check backup codes
        backup_codes = user.get("backup_codes", [])
        if code.upper() in backup_codes:
            # Remove used backup code
            backup_codes.remove(code.upper())
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"backup_codes": backup_codes}}
            )
            
            token = create_jwt_token(str(user["_id"]))
            return {
                "token": token,
                "user": {
                    "id": str(user["_id"]), 
                    "email": user["email"], 
                    "username": user["username"],
                    "full_name": user.get("full_name", ""),
                    "address": user.get("address"),
                    "phone": user.get("phone"),
                    "profile_image_url": user.get("profile_image_url"),
                    "is_admin": user.get("is_admin", False),
                    "email_verified": user.get("email_verified", False),
                    "two_factor_enabled": user.get("two_factor_enabled", False)
                },
                "backup_code_used": True
            }
        
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="2FA verification expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/auth/setup-2fa")
async def setup_2fa(current_user: dict = Depends(get_current_user)):
    """Setup 2FA for user"""
    try:
        if not current_user.get("email_verified"):
            raise HTTPException(status_code=400, detail="Email must be verified before enabling 2FA")
        
        # Generate 2FA secret
        secret = pyotp.random_base32()
        
        # Generate QR code
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=current_user["email"],
            issuer_name="ECommerce App"
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        qr_code = base64.b64encode(buffer.getvalue()).decode()
        
        # Store secret temporarily (not enabled until verified)
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"two_factor_secret_temp": secret}}
        )
        
        return {
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_code}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/verify-2fa-setup")
async def verify_2fa_setup(verification_data: TwoFactorSetup, current_user: dict = Depends(get_current_user)):
    """Verify and enable 2FA"""
    try:
        user = await db.users.find_one({"_id": current_user["_id"]})
        temp_secret = user.get("two_factor_secret_temp")
        
        if not temp_secret:
            raise HTTPException(status_code=400, detail="No 2FA setup in progress")
        
        # Verify the code
        totp = pyotp.TOTP(temp_secret)
        if not totp.verify(verification_data.code, valid_window=1):
            raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
        # Generate backup codes
        backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
        
        # Enable 2FA
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "two_factor_enabled": True,
                    "two_factor_secret": temp_secret,
                    "backup_codes": backup_codes
                },
                "$unset": {"two_factor_secret_temp": ""}
            }
        )
        
        return {
            "message": "2FA enabled successfully",
            "backup_codes": backup_codes
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/disable-2fa")
async def disable_2fa(verification_data: TwoFactorDisable, current_user: dict = Depends(get_current_user)):
    """Disable 2FA"""
    try:
        # Verify password
        if not verify_password(verification_data.password, current_user["password"]):
            raise HTTPException(status_code=400, detail="Invalid password")
        
        # Verify 2FA code
        if current_user.get("two_factor_enabled"):
            secret = current_user.get("two_factor_secret")
            totp = pyotp.TOTP(secret)
            if not totp.verify(verification_data.code, valid_window=1):
                raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
        # Disable 2FA
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {"two_factor_enabled": False},
                "$unset": {
                    "two_factor_secret": "",
                    "backup_codes": ""
                }
            }
        )
        
        return {"message": "2FA disabled successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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
                    "address": user.get("address"),
                    "phone": user.get("phone"),
                    "profile_image_url": user.get("profile_image_url"),
                    "is_admin": user.get("is_admin", False),
                    "email_verified": user.get("email_verified", True),  # Google accounts are verified
                    "two_factor_enabled": user.get("two_factor_enabled", False)
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
                "email_verified": True,  # Google accounts are pre-verified
                "two_factor_enabled": False,
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
                    "address": None,
                    "phone": None,
                    "profile_image_url": None,
                    "is_admin": False,
                    "email_verified": True,
                    "two_factor_enabled": False
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
        "full_name": current_user.get("full_name", ""),
        "address": current_user.get("address"),
        "phone": current_user.get("phone"),
        "profile_image_url": current_user.get("profile_image_url"),
        "is_admin": current_user.get("is_admin", False),
        "email_verified": current_user.get("email_verified", False),
        "two_factor_enabled": current_user.get("two_factor_enabled", False)
    }

# 🆕 NEW: Profile Update Routes
@router.put("/auth/update-profile")
async def update_profile(profile_data: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update user profile information"""
    user_id = str(current_user["_id"])
    
    # Prepare update data - only include fields that were provided
    update_data = {}
    if profile_data.full_name is not None:
        update_data["full_name"] = profile_data.full_name
    if profile_data.email is not None:
        # Check if email already exists for another user
        existing_user = await db.users.find_one({
            "email": profile_data.email, 
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")
        update_data["email"] = profile_data.email
    if profile_data.phone is not None:
        update_data["phone"] = profile_data.phone
    if profile_data.address is not None:
        update_data["address"] = profile_data.address
    if profile_data.profile_image_url is not None:
        update_data["profile_image_url"] = profile_data.profile_image_url
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    # Update user in database
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return updated user data
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(updated_user["_id"]),
            "username": updated_user["username"],
            "email": updated_user["email"],
            "full_name": updated_user.get("full_name", ""),
            "address": updated_user.get("address"),
            "phone": updated_user.get("phone"),
            "profile_image_url": updated_user.get("profile_image_url"),
            "is_admin": updated_user.get("is_admin", False),
            "email_verified": updated_user.get("email_verified", False),
            "two_factor_enabled": updated_user.get("two_factor_enabled", False)
        }
    }

@router.put("/auth/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_user)):
    """Change user password"""
    user_id = str(current_user["_id"])
    
    # Validate password confirmation
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    
    # Validate password length
    if len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")
    
    # Check if user has a password (Google users might not have one)
    if not current_user.get("password"):
        raise HTTPException(status_code=400, detail="Cannot change password for Google authenticated accounts")
    
    # Verify old password
    if not verify_password(password_data.old_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Check if new password is different from old password
    if verify_password(password_data.new_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="New password must be different from current password")
    
    # Hash new password
    new_hashed_password = hash_password(password_data.new_password)
    
    # Update password in database
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": new_hashed_password, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Password changed successfully"}

@router.post("/auth/upload-avatar")
async def upload_avatar(current_user: dict = Depends(get_current_user)):
    """Handle avatar upload - simplified version using external URLs"""
    # For now, return some sample avatar URLs
    # In production, you'd implement actual file upload to cloud storage
    sample_avatars = [
        f"https://api.dicebear.com/7.x/avataaars/svg?seed={current_user['username']}1",
        f"https://api.dicebear.com/7.x/avataaars/svg?seed={current_user['username']}2", 
        f"https://api.dicebear.com/7.x/avataaars/svg?seed={current_user['username']}3",
        f"https://api.dicebear.com/7.x/avataaars/svg?seed={current_user['username']}4",
        f"https://api.dicebear.com/7.x/avataaars/svg?seed={current_user['username']}5",
        f"https://api.dicebear.com/7.x/adventurer/svg?seed={current_user['username']}1",
        f"https://api.dicebear.com/7.x/adventurer/svg?seed={current_user['username']}2",
        f"https://api.dicebear.com/7.x/adventurer/svg?seed={current_user['username']}3",
        f"https://api.dicebear.com/7.x/personas/svg?seed={current_user['username']}1",
        f"https://api.dicebear.com/7.x/personas/svg?seed={current_user['username']}2"
    ]
    
    return {
        "message": "Avatar options available",
        "avatars": sample_avatars
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

# 🆕 UPDATED ORDER ROUTES WITH EMAIL NOTIFICATIONS
@router.post("/orders")
async def create_order(order_data: dict, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Get cart items using the get_cart function
    cart_items = await get_cart(current_user)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    total = sum(item["product"]["price"] * item["quantity"] for item in cart_items)
    
    # Get next order number
    order_number = await get_next_order_number()
    
    order = {
        "order_number": f"{order_number:05d}",  # Format as 00001, 00002, etc.
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
    
    # 🆕 SEND EMAIL NOTIFICATIONS
    try:
        user_name = current_user.get("full_name", current_user.get("username", "Customer"))
        user_email = current_user["email"]
        
        print(f"📧 Sending emails for order {order['order_number']}...")
        
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
        
        if customer_email_sent and admin_email_sent:
            print(f"✅ Both emails sent successfully for order {order['order_number']}")
        elif customer_email_sent:
            print(f"✅ Customer email sent, ❌ admin email failed for order {order['order_number']}")
        elif admin_email_sent:
            print(f"❌ Customer email failed, ✅ admin email sent for order {order['order_number']}")
        else:
            print(f"❌ Both emails failed for order {order['order_number']}")
            
    except Exception as e:
        print(f"❌ Email notification error for order {order['order_number']}: {str(e)}")
        # Don't fail the order creation if email fails
    
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