# backend/captcha/verification.py - Fix async function
import httpx
import os
from typing import Optional

RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

# Fixed: Make this function sync since it's called from sync context
def verify_recaptcha(captcha_response: str, remote_ip: Optional[str] = None) -> bool:
    """
    Verify reCAPTCHA response with Google's API (synchronous version)
    """
    secret_key = os.getenv("RECAPTCHA_SECRET_KEY")
    
    if not secret_key:
        print("⚠️ RECAPTCHA_SECRET_KEY not configured")
        return True  # Allow in development if not configured
    
    if not captcha_response:
        return False
    
    try:
        import requests
        
        data = {
            "secret": secret_key,
            "response": captcha_response
        }
        
        if remote_ip:
            data["remoteip"] = remote_ip
        
        response = requests.post(
            RECAPTCHA_VERIFY_URL,
            data=data,
            timeout=10.0
        )
        
        if response.status_code != 200:
            print(f"❌ reCAPTCHA API error: {response.status_code}")
            return False
        
        result = response.json()
        success = result.get("success", False)
        
        if not success:
            error_codes = result.get("error-codes", [])
            print(f"❌ reCAPTCHA verification failed: {error_codes}")
        
        return success
        
    except Exception as e:
        print(f"❌ reCAPTCHA verification error: {str(e)}")
        return False

# backend/utils/email.py - Fix EMAIL_PORT type conversion
import os

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))  # Fixed: provide default
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", EMAIL_USER)

# backend/routes/admin_routes.py - Fix missing import
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from datetime import datetime
import re
from urllib.parse import unquote
from dependencies import get_current_user  # Fixed: correct import
from database.connection import db  # Fixed: correct import

# backend/middleware/validation.py - Fix phone validation
@validator('phone')
def validate_phone(cls, v):
    if v and v.strip():  # Fixed: check if not empty
        return SecurityValidator.validate_phone(v)
    return ""

# backend/api.py - Add missing routes (truncated version shown)
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

# Cart routes implementation
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