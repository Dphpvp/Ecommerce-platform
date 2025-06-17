from fastapi import APIRouter, HTTPException, Depends, Request, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, EmailStr, constr
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from jose import jwt
import bcrypt
import stripe
from bson import ObjectId
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import re
import pyotp
import qrcode
import io
import base64
import requests
import secrets
from captcha import verify_recaptcha
from middleware.rate_limiter import rate_limiter
from middleware.rate_limiter import rate_limit
from middleware.csrf import csrf_protection
from middleware.session import session_manager  
from database.connection import db
from dependencies import get_current_user, get_admin_user, security

# Email import
from utils.email import send_order_confirmation_email, send_admin_order_notification, send_verification_email, send_password_reset_email

router = APIRouter()

# Security settings
from middleware.validation import (
    SecureUser, SecureProduct, SecureContactForm, 
    SecureUserProfileUpdate, SecurityValidator, 
    rate_limiter, get_client_ip
)

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-key")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# Pydantic models
class User(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    address: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(BaseModel):
    phone: Optional[constr(strip_whitespace=True, min_length=10, max_length=20)] = None

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
    currency: str = "ron"
    
class ContactForm(BaseModel):
    name: str
    email: str
    phone: str = ""
    message: str
    
class PasswordResetRequest(BaseModel):
    email: str
    recaptcha_response: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
    
class PasswordChange(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str
    recaptcha_response: str

# Profile Update Models
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[constr(min_length=10, max_length=20)] = None
    address: Optional[str] = None
    profile_image_url: Optional[str] = None

# 2FA Models
class TwoFactorSetup(BaseModel):
    code: str
    
class TwoFactorSetupChoice(BaseModel):
    method: str
    
class TwoFactorDisable(BaseModel):
    password: str
    code: str

class EmailVerification(BaseModel):
    token: str

class ResendVerification(BaseModel):
    email: str
    
class TwoFactorVerification(BaseModel):
    code: str
        
class EmailTwoFactorCode(BaseModel):
    email: str
    code: str
    
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
    
def generate_email_2fa_code():
    """Generate 6-digit code for email 2FA"""
    return f"{secrets.randbelow(1000000):06d}"

async def send_2fa_email_code(email: str, code: str, user_name: str = "User"):
    """Send 2FA code via email"""
    subject = "🔐 Your Login Code"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🔐 Security Code</h1>
        </div>
        
        <div style="background: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p>Hello {user_name},</p>
            <p>Your login verification code is:</p>
            
            <div style="background: #f8f9fa; padding: 2rem; margin: 1.5rem 0; border-radius: 8px; text-align: center; border: 2px solid #007bff;">
                <span style="font-size: 2rem; font-weight: bold; color: #007bff; letter-spacing: 0.5rem;">{code}</span>
            </div>
            
            <p><strong>This code expires in 5 minutes.</strong></p>
            <p>If you didn't request this code, please ignore this email.</p>
            
            <hr style="margin: 2rem 0;">
            <p style="color: #666; font-size: 0.9rem; text-align: center;">
                This is an automated security message.
            </p>
        </div>
    </body>
    </html>
    """
    
    from utils.email import send_email
    return await send_email(email, subject, body)

def require_csrf_token(request: Request, x_csrf_token: str = Header(None)):
    """Validate CSRF token for state-changing operations"""
    if request.method in {"POST", "PUT", "DELETE", "PATCH"}:
        if not x_csrf_token:
            raise HTTPException(status_code=403, detail="CSRF token missing")
        
        # Get session info from JWT if available
        auth_header = request.headers.get("Authorization")
        session_id = None
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                session_id = payload.get("user_id")
            except:
                session_id = None
        
        if not csrf_protection.validate_token(x_csrf_token, session_id):
            raise HTTPException(status_code=403, detail="Invalid CSRF token")
    
    return True

async def get_next_order_number():
    counter = await db.counters.find_one_and_update(
        {"_id": "order_number"},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=True
    )
    return counter["value"]

@router.post("/auth/register")
async def register(user: SecureUser, request: Request, csrf_valid: bool = Depends(require_csrf_token)):
    client_ip = get_client_ip(request)
    if not rate_limiter.is_allowed(f"{client_ip}:register", max_requests=3, window=3600):
        raise HTTPException(status_code=429, detail="Too many registration attempts")
    
    # Additional server-side validation
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Check password complexity
    if not SecurityValidator.validate_password_complexity(user.password):
        raise HTTPException(status_code=400, detail="Password must contain uppercase, lowercase, number, and special character")
    
    # Check existing users
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    
    hashed_password = hash_password(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "full_name": user.full_name,
        "address": user.address or "",
        "phone": user.phone or "",
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
        verification_url = f"{os.getenv('FRONTEND_URL')}/verify-email?token={verification_token}"
        await send_verification_email(user.email, user.full_name, verification_url)
    except Exception as e:
        print(f"❌ Failed to send verification email: {e}")
    
    return {"message": "User registered successfully. Please check your email to verify your account."}

@router.post("/auth/verify-email")
async def verify_email(request_data: dict):
    """Verify email with token"""
    try:
        token = request_data.get("token")
        
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")
        
        user = await db.users.find_one({"verification_token": token})
        if not user:
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        # Check if already verified
        if user.get("email_verified", False):
            return {"message": "Email already verified"}
        
        # Check token expiry
        token_created = user.get("verification_token_created")
        if token_created:
            if isinstance(token_created, datetime):
                if token_created.tzinfo is None:
                    token_created = token_created.replace(tzinfo=timezone.utc)
                
                current_time = datetime.now(timezone.utc)
                expiry_time = token_created + timedelta(hours=24)
                
                if current_time > expiry_time:
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
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Verification error: {str(e)}")
        raise HTTPException(status_code=400, detail="Verification failed")

@router.post("/auth/resend-verification")
async def resend_verification(email_data: ResendVerification):
    """Resend verification email"""
    try:
        print(f"📧 Attempting to resend verification for: {email_data.email}")
        
        user = await db.users.find_one({"email": email_data.email})
        
        if not user:
            print(f"❌ User not found: {email_data.email}")
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.get("email_verified", False):
            print(f"✅ Email already verified: {email_data.email}")
            return {"message": "Email already verified"}
        
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
        frontend_url = os.getenv('FRONTEND_URL')
        verification_url = f"{frontend_url}/verify-email?token={verification_token}"
        
        await send_verification_email(email_data.email, user.get("full_name", "User"), verification_url)
        
        return {"message": "Verification email sent"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in resend_verification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send verification email: {str(e)}")

@router.get("/auth/debug-user/{email}")
async def debug_user(email: str):
    """Debug route to check user status"""
    user = await db.users.find_one({"email": email})
    if not user:
        return {"error": "User not found"}
    
    return {
        "email": user["email"],
        "email_verified": user.get("email_verified", False),
        "is_admin": user.get("is_admin", False),
        "has_verification_token": bool(user.get("verification_token")),
        "created_at": user.get("created_at")
    }
    
@router.get("/auth/debug-token/{token}")
async def debug_token(token: str):
    """Debug route to check token"""
    try:
        user = await db.users.find_one({"verification_token": token})
        if user:
            return {
                "found": True,
                "email": user["email"],
                "email_verified": user.get("email_verified", False),
                "token_created": user.get("verification_token_created"),
                "expired": (datetime.now(timezone.utc) - user.get("verification_token_created", datetime.now(timezone.utc))).days > 1 if user.get("verification_token_created") else False
            }
        else:
            return {"found": False, "token": token}
    except Exception as e:
        return {"error": str(e)}

@router.post("/auth/login")
async def login(user_login: UserLogin, request: Request, response: Response):
    client_ip = get_client_ip(request)
    
    if not rate_limiter.is_allowed(f"{client_ip}:login", max_requests=5, window=900):
        raise HTTPException(status_code=429, detail="Too many login attempts")
    
    identifier_type = get_identifier_type(user_login.identifier)
    
    if identifier_type == "email":
        user_login.identifier = SecurityValidator.validate_email_format(user_login.identifier)
        query = {"email": user_login.identifier}
    elif identifier_type == "phone":
        user_login.identifier = SecurityValidator.validate_phone(user_login.identifier)
        query = {"phone": user_login.identifier}
    else:
        user_login.identifier = SecurityValidator.validate_username(user_login.identifier)
        query = {"username": user_login.identifier}
    
    user = await db.users.find_one(query)
    if not user or not verify_password(user_login.password, user["password"]):
        print(f"Failed login attempt from {client_ip} for {user_login.identifier}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("email_verified", False):
        raise HTTPException(
            status_code=401, 
            detail="Email not verified. Please check your email and verify your account."
        )
    
    # Check if 2FA is enabled
    if user.get("two_factor_enabled"):
        temp_token = create_jwt_token(str(user["_id"]), expires_in=timedelta(minutes=10))
        
        # Auto-send email for email 2FA
        if user.get("two_factor_method") == "email":
            try:
                code = generate_email_2fa_code()
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {
                        "$set": {
                            "email_2fa_code": code,
                            "email_2fa_code_created": datetime.now(timezone.utc)
                        }
                    }
                )
                
                user_name = user.get("full_name", user.get("username", "User"))
                await send_2fa_email_code(user["email"], code, user_name)
                print(f"✅ Auto-sent 2FA code to {user['email']}")
            except Exception as e:
                print(f"❌ Failed to auto-send 2FA email: {e}")
        
        return {
            "requires_2fa": True,
            "method": user.get("two_factor_method", "app"),
            "temp_token": temp_token,
            "message": "Please enter your 2FA code",
            "email_hint": f"***{user['email'][-10:]}" if user.get("two_factor_method") == "email" else None
        }
    
    # Regular login
    token = create_jwt_token(str(user["_id"]))
    
    return {
        "success": True,
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
async def verify_2fa_login(verification_data: dict, response: Response):
    """Verify 2FA and complete login"""
    try:
        code = verification_data.get("code")
        temp_token = verification_data.get("temp_token")
        
        if not code or not temp_token:
            raise HTTPException(status_code=400, detail="Code and temp_token are required")
        
        try:
            payload = jwt.decode(temp_token, JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("user_id")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="2FA session expired. Please login again.")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user or not user.get("two_factor_enabled"):
            raise HTTPException(status_code=401, detail="Invalid 2FA state")
        
        method = user.get("two_factor_method", "app")
        verified = False
        
        if method == "app":
            secret = user.get("two_factor_secret")
            if secret:
                totp = pyotp.TOTP(secret)
                verified = totp.verify(code, valid_window=1)
        elif method == "email":
            stored_code = user.get("email_2fa_code")
            code_created = user.get("email_2fa_code_created")
            
            if stored_code and code_created:
                if isinstance(code_created, datetime):
                    if code_created.tzinfo is None:
                        code_created = code_created.replace(tzinfo=timezone.utc)
                    
                    # Check if code expired (5 minutes)
                    if datetime.now(timezone.utc) <= code_created + timedelta(minutes=5):
                        verified = (code == stored_code)
                        if verified:
                            # Clear used code
                            await db.users.update_one(
                                {"_id": user["_id"]},
                                {"$unset": {"email_2fa_code": "", "email_2fa_code_created": ""}}
                            )
        
        # Check backup codes if primary failed
        if not verified:
            backup_codes = user.get("backup_codes", [])
            if code.upper() in backup_codes:
                backup_codes.remove(code.upper())
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"backup_codes": backup_codes}}
                )
                verified = True
        
        if not verified:
            raise HTTPException(status_code=400, detail="Invalid verification code")
        
        # Create full session token
        token = create_jwt_token(str(user["_id"]))
        
        return {
            "success": True,
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
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 2FA verification error: {e}")
        raise HTTPException(status_code=500, detail="2FA verification failed")

@router.post("/auth/send-2fa-email")
async def send_2fa_email(request_data: dict):
    """Send 2FA code via email"""
    try:
        temp_token = request_data.get("temp_token")
        
        if not temp_token:
            raise HTTPException(status_code=400, detail="Temporary token is required")
        
        try:
            payload = jwt.decode(temp_token, JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("user_id")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=400, detail="Session expired. Please login again.")
        except jwt.JWTError:
            raise HTTPException(status_code=400, detail="Invalid temporary token")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        
        if not user.get("two_factor_enabled") or user.get("two_factor_method") != "email":
            raise HTTPException(status_code=400, detail="Email 2FA is not enabled")
        
        # Generate and send new code
        code = generate_email_2fa_code()
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "email_2fa_code": code,
                    "email_2fa_code_created": datetime.now(timezone.utc)
                }
            }
        )
        
        user_name = user.get("full_name", user.get("username", "User"))
        await send_2fa_email_code(user["email"], code, user_name)
        
        return {
            "message": "Verification code sent to your email",
            "email_hint": f"***{user['email'][-10:]}",
            "expires_in": 300
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Send 2FA email error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function for user response
def create_user_response(token, user):
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
            "two_factor_enabled": user.get("two_factor_enabled", False),
            "two_factor_method": user.get("two_factor_method", "app")
        }
    }

@router.post("/auth/setup-2fa")
async def setup_2fa(setup_data: TwoFactorSetupChoice, current_user: dict = Depends(get_current_user)):
    """Setup 2FA - choose between app or email - Enhanced version"""
    try:
        if not current_user.get("email_verified"):
            raise HTTPException(status_code=400, detail="Email must be verified before enabling 2FA")
        
        # Check if 2FA is already enabled
        if current_user.get("two_factor_enabled"):
            raise HTTPException(status_code=400, detail="2FA is already enabled. Please disable it first to change methods.")
        
        if setup_data.method == "app":
            # Generate QR code for authenticator app
            secret = pyotp.random_base32()
            
            try:
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
                
                # Store secret temporarily with expiration
                await db.users.update_one(
                    {"_id": current_user["_id"]},
                    {
                        "$set": {
                            "two_factor_secret_temp": secret,
                            "two_factor_method": "app",
                            "two_factor_setup_expires": datetime.now(timezone.utc) + timedelta(minutes=10)
                        }
                    }
                )
                
                return {
                    "method": "app",
                    "secret": secret,
                    "qr_code": f"data:image/png;base64,{qr_code}",
                    "expires_in": 600,  # 10 minutes
                    "instructions": "Scan this QR code with your authenticator app and enter the 6-digit code to verify."
                }
                
            except Exception as qr_error:
                print(f"❌ QR code generation error: {qr_error}")
                raise HTTPException(status_code=500, detail="Failed to generate QR code")
            
        elif setup_data.method == "email":
            # Setup email 2FA
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "two_factor_method": "email",
                        "two_factor_setup_expires": datetime.now(timezone.utc) + timedelta(minutes=10)
                    }
                }
            )
            
            # Send test code
            code = generate_email_2fa_code()
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "email_2fa_code_temp": code,
                        "email_2fa_code_created": datetime.now(timezone.utc)
                    }
                }
            )
            
            try:
                user_name = current_user.get("full_name", current_user.get("username", "User"))
                await send_2fa_email_code(current_user["email"], code, user_name)
                
                return {
                    "method": "email",
                    "message": "Verification code sent to your email",
                    "email_hint": f"***{current_user['email'][-10:]}",
                    "expires_in": 600,  # 10 minutes
                    "code_expires_in": 300  # 5 minutes
                }
                
            except Exception as email_error:
                print(f"❌ Failed to send 2FA setup email: {email_error}")
                # Clean up on email failure
                await db.users.update_one(
                    {"_id": current_user["_id"]},
                    {
                        "$unset": {
                            "two_factor_method": "",
                            "email_2fa_code_temp": "",
                            "email_2fa_code_created": "",
                            "two_factor_setup_expires": ""
                        }
                    }
                )
                raise HTTPException(status_code=500, detail="Failed to send verification email")
        else:
            raise HTTPException(status_code=400, detail="Invalid method. Choose 'app' or 'email'")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 2FA setup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to setup 2FA")

@router.post("/auth/verify-2fa-setup")
async def verify_2fa_setup(verification_data: TwoFactorSetup, current_user: dict = Depends(get_current_user)):
    """Verify and enable 2FA for both app and email - Enhanced version"""
    try:
        # Get fresh user data
        user = await db.users.find_one({"_id": current_user["_id"]})
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        
        # Check setup expiration
        setup_expires = user.get("two_factor_setup_expires")
        if setup_expires:
            if isinstance(setup_expires, datetime):
                if setup_expires.tzinfo is None:
                    setup_expires = setup_expires.replace(tzinfo=timezone.utc)
                
                if datetime.now(timezone.utc) > setup_expires:
                    # Clean up expired setup
                    await db.users.update_one(
                        {"_id": current_user["_id"]},
                        {
                            "$unset": {
                                "two_factor_secret_temp": "",
                                "two_factor_method": "",
                                "email_2fa_code_temp": "",
                                "email_2fa_code_created": "",
                                "two_factor_setup_expires": ""
                            }
                        }
                    )
                    raise HTTPException(status_code=400, detail="2FA setup expired. Please start setup again.")
        
        method = user.get("two_factor_method")
        if not method:
            raise HTTPException(status_code=400, detail="No 2FA setup in progress")
        
        # Validate code format
        if not verification_data.code or len(verification_data.code) != 6 or not verification_data.code.isdigit():
            raise HTTPException(status_code=400, detail="Please enter a valid 6-digit code")
        
        if method == "app":
            temp_secret = user.get("two_factor_secret_temp")
            if not temp_secret:
                raise HTTPException(status_code=400, detail="No app-based 2FA setup in progress")
            
            try:
                totp = pyotp.TOTP(temp_secret)
                if not totp.verify(verification_data.code, valid_window=1):
                    raise HTTPException(status_code=400, detail="Invalid 2FA code. Please check your authenticator app.")
            except Exception as totp_error:
                print(f"❌ TOTP verification error: {totp_error}")
                raise HTTPException(status_code=400, detail="Invalid 2FA code")
            
            # Generate backup codes
            backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
            
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "two_factor_enabled": True,
                        "two_factor_secret": temp_secret,
                        "two_factor_method": "app",
                        "backup_codes": backup_codes,
                        "two_factor_enabled_at": datetime.now(timezone.utc)
                    },
                    "$unset": {
                        "two_factor_secret_temp": "",
                        "two_factor_setup_expires": ""
                    }
                }
            )
            
            return {
                "success": True,
                "message": "App-based 2FA enabled successfully",
                "method": "app",
                "backup_codes": backup_codes,
                "warning": "Save these backup codes in a secure location. Each can only be used once."
            }
            
        elif method == "email":
            temp_code = user.get("email_2fa_code_temp")
            code_created = user.get("email_2fa_code_created")
            
            if not temp_code:
                raise HTTPException(status_code=400, detail="No verification code found. Please start setup again.")
            
            # Check if code expired (5 minutes)
            if code_created:
                if isinstance(code_created, datetime):
                    if code_created.tzinfo is None:
                        code_created = code_created.replace(tzinfo=timezone.utc)
                    
                    if datetime.now(timezone.utc) > code_created + timedelta(minutes=5):
                        raise HTTPException(status_code=400, detail="Verification code expired. Please start setup again.")
            
            if verification_data.code != temp_code:
                raise HTTPException(status_code=400, detail="Invalid verification code. Please check your email.")
            
            # Generate backup codes
            backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
            
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "two_factor_enabled": True,
                        "two_factor_method": "email",
                        "backup_codes": backup_codes,
                        "two_factor_enabled_at": datetime.now(timezone.utc)
                    },
                    "$unset": {
                        "email_2fa_code_temp": "",
                        "email_2fa_code_created": "",
                        "two_factor_setup_expires": ""
                    }
                }
            )
            
            return {
                "success": True,
                "message": "Email-based 2FA enabled successfully",
                "method": "email",
                "backup_codes": backup_codes,
                "warning": "Save these backup codes in a secure location. Each can only be used once."
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 2FA setup verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify 2FA setup")

@router.post("/auth/disable-2fa")
async def disable_2fa(verification_data: TwoFactorDisable, current_user: dict = Depends(get_current_user)):
    """Disable 2FA - Enhanced version"""
    try:
        # Verify password
        if not current_user.get("password"):
            raise HTTPException(status_code=400, detail="Cannot disable 2FA for OAuth accounts")
        
        if not verify_password(verification_data.password, current_user["password"]):
            raise HTTPException(status_code=400, detail="Invalid password")
        
        if not current_user.get("two_factor_enabled"):
            raise HTTPException(status_code=400, detail="2FA is not enabled")
        
        # Verify 2FA code based on method
        method = current_user.get("two_factor_method", "app")
        verified = False
        
        if method == "app":
            secret = current_user.get("two_factor_secret")
            if not secret:
                raise HTTPException(status_code=400, detail="2FA secret not found")
            
            try:
                totp = pyotp.TOTP(secret)
                verified = totp.verify(verification_data.code, valid_window=1)
            except Exception as e:
                print(f"❌ TOTP disable verification error: {e}")
                verified = False
            
            if not verified:
                # Check backup codes
                backup_codes = current_user.get("backup_codes", [])
                if verification_data.code.upper() in backup_codes:
                    verified = True
        
        elif method == "email":
            stored_code = current_user.get("disable_2fa_code")
            code_created = current_user.get("disable_2fa_code_created")
            
            if not stored_code:
                raise HTTPException(status_code=400, detail="No verification code found. Please request a code first.")
            
            # Check if code expired (5 minutes)
            if code_created:
                if isinstance(code_created, datetime):
                    if code_created.tzinfo is None:
                        code_created = code_created.replace(tzinfo=timezone.utc)
                    
                    if datetime.now(timezone.utc) > code_created + timedelta(minutes=5):
                        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new code.")
            
            verified = (verification_data.code == stored_code)
        
        if not verified:
            raise HTTPException(status_code=400, detail="Invalid verification code")
        
        # Disable 2FA
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "two_factor_enabled": False,
                    "two_factor_disabled_at": datetime.now(timezone.utc)
                },
                "$unset": {
                    "two_factor_secret": "",
                    "backup_codes": "",
                    "two_factor_method": "",
                    "disable_2fa_code": "",
                    "disable_2fa_code_created": "",
                    "two_factor_enabled_at": ""
                }
            }
        )
        
        return {"success": True, "message": "2FA disabled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Disable 2FA error: {e}")
        raise HTTPException(status_code=500, detail="Failed to disable 2FA")
    
@router.post("/auth/send-disable-2fa-code")
async def send_disable_2fa_code(request_data: dict, current_user: dict = Depends(get_current_user)):
    """Send 2FA code for disabling 2FA - Enhanced version"""
    try:
        password = request_data.get("password")
        
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        # Verify password
        if not verify_password(password, current_user["password"]):
            raise HTTPException(status_code=400, detail="Invalid password")
        
        # Check if user has email-based 2FA
        if not current_user.get("two_factor_enabled"):
            raise HTTPException(status_code=400, detail="2FA is not enabled")
        
        if current_user.get("two_factor_method") != "email":
            raise HTTPException(status_code=400, detail="Email 2FA is not enabled")
        
        # Rate limiting for disable codes
        last_sent = current_user.get("last_disable_2fa_email_sent")
        if last_sent:
            if isinstance(last_sent, datetime):
                if last_sent.tzinfo is None:
                    last_sent = last_sent.replace(tzinfo=timezone.utc)
                
                # Minimum 60 seconds between requests
                if datetime.now(timezone.utc) < last_sent + timedelta(seconds=60):
                    raise HTTPException(status_code=429, detail="Please wait before requesting another code")
        
        # Generate and send code
        code = generate_email_2fa_code()
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "disable_2fa_code": code,
                    "disable_2fa_code_created": datetime.now(timezone.utc),
                    "last_disable_2fa_email_sent": datetime.now(timezone.utc)
                }
            }
        )
        
        try:
            user_name = current_user.get("full_name", current_user.get("username", "User"))
            await send_2fa_email_code(current_user["email"], code, user_name)
            
            return {
                "message": "Verification code sent to your email",
                "email_hint": f"***{current_user['email'][-10:]}",
                "expires_in": 300
            }
            
        except Exception as email_error:
            print(f"❌ Failed to send disable 2FA email: {email_error}")
            raise HTTPException(status_code=500, detail="Failed to send verification email")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Send disable 2FA code error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process request")

# Additional utility routes
@router.get("/auth/2fa-status")
async def get_2fa_status(current_user: dict = Depends(get_current_user)):
    """Get current 2FA status"""
    try:
        user = await db.users.find_one({"_id": current_user["_id"]})
        
        return {
            "enabled": user.get("two_factor_enabled", False),
            "method": user.get("two_factor_method") if user.get("two_factor_enabled") else None,
            "backup_codes_count": len(user.get("backup_codes", [])),
            "email_verified": user.get("email_verified", False),
            "can_setup": user.get("email_verified", False) and not user.get("two_factor_enabled", False)
        }
        
    except Exception as e:
        print(f"❌ 2FA status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get 2FA status")

@router.post("/auth/generate-backup-codes")
async def generate_backup_codes(current_user: dict = Depends(get_current_user)):
    """Generate new backup codes"""
    try:
        if not current_user.get("two_factor_enabled"):
            raise HTTPException(status_code=400, detail="2FA must be enabled to generate backup codes")
        
        # Generate new backup codes
        backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
        
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"backup_codes": backup_codes}}
        )
        
        return {
            "backup_codes": backup_codes,
            "message": "New backup codes generated",
            "warning": "Save these codes securely. Your old backup codes are no longer valid."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Generate backup codes error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate backup codes")
    
@router.post("/auth/google")
async def google_login(google_login: GoogleLogin):
    """Fixed Google OAuth login"""
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            google_login.token, google_requests.Request(), GOOGLE_CLIENT_ID
        )

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        email = idinfo['email']
        name = idinfo['name']
        google_id = idinfo['sub']
        picture = idinfo.get('picture', '')

        # Check if user exists
        user = await db.users.find_one({"email": email})

        if user:
            # Check if 2FA is enabled
            if user.get("two_factor_enabled"):
                temp_token = create_jwt_token(str(user["_id"]), expires_in=timedelta(minutes=10))
                
                # Auto-send email for email 2FA
                if user.get("two_factor_method") == "email":
                    try:
                        code = generate_email_2fa_code()
                        await db.users.update_one(
                            {"_id": user["_id"]},
                            {
                                "$set": {
                                    "email_2fa_code": code,
                                    "email_2fa_code_created": datetime.now(timezone.utc)
                                }
                            }
                        )
                        
                        user_name = user.get("full_name", user.get("username", "User"))
                        await send_2fa_email_code(user["email"], code, user_name)
                    except Exception as e:
                        print(f"❌ Failed to send 2FA email: {e}")
                
                return {
                    "requires_2fa": True,
                    "method": user.get("two_factor_method", "app"),
                    "temp_token": temp_token,
                    "message": "Please enter your 2FA code",
                    "email_hint": f"***{user['email'][-10:]}" if user.get("two_factor_method") == "email" else None
                }
            
            # Update user's profile image if Google has one
            if picture and not user.get("profile_image_url"):
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"profile_image_url": picture}}
                )
                user["profile_image_url"] = picture
            
            # Regular login response
            token = create_jwt_token(str(user["_id"]))
            return {
                "success": True,
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
                    "email_verified": user.get("email_verified", True),
                    "two_factor_enabled": user.get("two_factor_enabled", False)
                }
            }
        else:
            # Create new user
            username = email.split('@')[0]
            counter = 1
            original_username = username
            
            # Ensure username is unique
            while await db.users.find_one({"username": username}):
                username = f"{original_username}{counter}"
                counter += 1

            # Generate a unique phone number for new Google users
            import secrets
            phone = f"+1-555-{secrets.randbelow(9000) + 1000:04d}"
            while await db.users.find_one({"phone": phone}):
                phone = f"+1-555-{secrets.randbelow(9000) + 1000:04d}"

            user_data = {
                "username": username,
                "email": email,
                "password": "",  # No password for OAuth users
                "full_name": name,
                "phone": phone,  # Required field
                "address": "",
                "google_id": google_id,
                "profile_image_url": picture,
                "is_admin": False,
                "email_verified": True,  # Google emails are pre-verified
                "two_factor_enabled": False,
                "two_factor_secret": None,
                "backup_codes": [],
                "created_at": datetime.now(timezone.utc)
            }

            result = await db.users.insert_one(user_data)
            token = create_jwt_token(str(result.inserted_id))

            return {
                "success": True,
                "token": token,
                "user": {
                    "id": str(result.inserted_id),
                    "email": email,
                    "username": username,
                    "full_name": name,
                    "address": "",
                    "phone": phone,
                    "profile_image_url": picture,
                    "is_admin": False,
                    "email_verified": True,
                    "two_factor_enabled": False
                }
            }

    except ValueError as e:
        print(f"Google token verification error: {e}")
        raise HTTPException(status_code=400, detail="Invalid Google token")
    except Exception as e:
        print(f"Google OAuth error: {e}")
        raise HTTPException(status_code=500, detail="Google login failed")

# FIXED: Add GET decorator to auth/me endpoint
@router.get("/auth/me")
async def get_me(request: Request):
    """Get user - try session cookie first, then token"""
    try:
        # Try session cookie first (existing logic)
        try:
            token = session_manager.get_session_token(request)
            payload = session_manager.verify_session_token(token)
        except:
            # Fallback to Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                raise HTTPException(status_code=401, detail="No authentication")
            
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        user_id = payload.get("user_id")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            # ... rest of user data
        }
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

# 🆕 NEW: Profile Update Routes
@router.put("/auth/update-profile")
async def update_profile(profile_data: SecureUserProfileUpdate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Prepare update data - only include non-None fields
    update_data = {}
    
    for field, value in profile_data.dict(exclude_unset=True).items():
        if value is not None:
            if field == "email" and value != current_user.get("email"):
                # Check if email already exists for another user
                existing_user = await db.users.find_one({
                    "email": value, 
                    "_id": {"$ne": ObjectId(user_id)}
                })
                if existing_user:
                    raise HTTPException(status_code=400, detail="Email already exists")
            
            update_data[field] = value
    
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

@router.post("/auth/request-password-reset")
@rate_limit(max_attempts=3, window_minutes=60, endpoint_name="password_reset")
async def request_password_reset(request_data: PasswordResetRequest, request: Request):
    """Request password reset with rate limiting"""
    try:
        # Verify reCAPTCHA
        if not verify_recaptcha(request_data.recaptcha_response):
            raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
        
        user = await db.users.find_one({"email": request_data.email})
        if not user:
            # Don't reveal if email exists
            return {"message": "If the email exists, a reset link has been sent"}
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        await db.password_resets.insert_one({
            "user_id": user["_id"],
            "token": reset_token,
            "expires_at": expires_at,
            "used": False,
            "created_at": datetime.now(timezone.utc)
        })
        
        # Send reset email
        reset_url = f"{os.getenv('FRONTEND_URL')}/reset-password?token={reset_token}"
        await send_password_reset_email(user["email"], user.get("full_name", ""), reset_url)
        
        return {"message": "If the email exists, a reset link has been sent"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Password reset request error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process password reset request")

@router.post("/auth/reset-password")
async def reset_password(request: PasswordResetConfirm):
    """Reset password using token"""
    
    # Find valid reset token
    reset_record = await db.password_resets.find_one({
        "token": request.token,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Validate new password
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    # Hash new password
    new_hashed_password = hash_password(request.new_password)
    
    # Update user password
    result = await db.users.update_one(
        {"_id": reset_record["user_id"]},
        {
            "$set": {
                "password": new_hashed_password,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark token as used
    await db.password_resets.update_one(
        {"_id": reset_record["_id"]},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Password reset successfully"}

@router.put("/auth/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_user)):
    """Change user password"""
    
    # Verify reCAPTCHA
    if not verify_recaptcha(password_data.recaptcha_response):
        raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
    
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
async def create_product(
    product: SecureProduct, 
    request: Request,
    current_user: dict = Depends(get_admin_user),
    csrf_valid: bool = Depends(require_csrf_token)
):
    # Additional validation
    if product.price <= 0:
        raise HTTPException(status_code=400, detail="Price must be positive")
    
    if product.stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")
    
    # Validate image URL
    if not SecurityValidator.validate_image_url(product.image_url):
        raise HTTPException(status_code=400, detail="Invalid image URL")
    
    product_data = product.dict()
    product_data["created_at"] = datetime.utcnow()
    product_data["created_by"] = str(current_user["_id"])
    
    result = await db.products.insert_one(product_data)
    return {"message": "Product created", "id": str(result.inserted_id)}

@router.get("/products")
async def get_products(category: Optional[str] = None, limit: int = 50, skip: int = 0):
    """Get products list - improved version"""
    try:
        # Build query
        query = {}
        if category and category.strip():
            query["category"] = category.strip()
        
        # Limit pagination
        limit = min(limit, 50)  # Max 50 products per request
        skip = max(skip, 0)
        
        # Get products from database
        cursor = db.products.find(query).skip(skip).limit(limit)
        products = []
        
        async for product in cursor:
            # Fix placeholder image URLs
            image_url = product.get("image_url", "")
            if "via.placeholder.com" in image_url or not image_url:
                product["image_url"] = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80"
            
            product["_id"] = str(product["_id"])
            products.append(product)
        
        return products
        
    except Exception as e:
        print(f"❌ Get products error: {e}")
        return []  # Return empty array instead of error

@router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product["_id"] = str(product["_id"])
    return product

# Cart routes
@router.post("/cart/add")
async def add_to_cart(cart_item: CartItem, request: Request):
    """Add to cart - session or token auth"""
    user = await get_current_user_flexible(request)
    user_id = str(user["_id"])
    
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

@router.get("/products/search")
async def search_products(
    q: str = "",
    category: str = "",
    min_price: float = 0,
    max_price: float = 999999,
    limit: int = 50,
    skip: int = 0
):
    # Sanitize search query
    q = SecurityValidator.sanitize_string(q, 100)
    category = SecurityValidator.sanitize_string(category, 100)
    
    # Validate price range
    if min_price < 0 or max_price < 0 or min_price > max_price:
        raise HTTPException(status_code=400, detail="Invalid price range")
    
    # Limit pagination
    limit = min(limit, 100)  # Max 100 items per request
    skip = max(skip, 0)
    
    query = {}
    
    if q:
        query["$text"] = {"$search": q}
    
    if category:
        query["category"] = category
    
    if min_price > 0 or max_price < 999999:
        query["price"] = {}
        if min_price > 0:
            query["price"]["$gte"] = min_price
        if max_price < 999999:
            query["price"]["$lte"] = max_price
    
    cursor = db.products.find(query).skip(skip).limit(limit)
    products = []
    async for product in cursor:
        product["_id"] = str(product["_id"])
        products.append(product)
    
    return {"products": products, "count": len(products)}

@router.get("/cart")
async def get_cart(request: Request):
    """Get user cart - session or token auth"""
    try:
        user = await get_current_user_flexible(request)
        user_id = str(user["_id"])
        
        cart_items = []
        async for item in db.cart.find({"user_id": user_id}):
            try:
                product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
                if product:
                    cart_items.append({
                        "id": str(item["_id"]),
                        "product_id": item["product_id"],
                        "quantity": item["quantity"],
                        "product": {
                            "id": str(product["_id"]),
                            "name": product["name"],
                            "price": product["price"],
                            "image_url": product.get("image_url", "")
                        }
                    })
            except Exception as e:
                print(f"❌ Cart item error: {e}")
                continue
        
        return cart_items
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Get cart error: {e}")
        return []


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

@router.post("/contact")
async def submit_contact_form(
    contact_data: SecureContactForm, 
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    client_ip = get_client_ip(request)
    if not rate_limiter.is_allowed(f"{client_ip}:contact", max_requests=3, window=3600):
        raise HTTPException(status_code=429, detail="Too many contact form submissions")
    
    # Additional validation
    if len(contact_data.message.strip()) < 20:
        raise HTTPException(status_code=400, detail="Message must be at least 20 characters")
    
    # Check for spam patterns
    spam_patterns = ['http://', 'https://', 'www.', '.com', '.net', '.org']
    message_lower = contact_data.message.lower()
    if sum(1 for pattern in spam_patterns if pattern in message_lower) > 2:
        raise HTTPException(status_code=400, detail="Message appears to be spam")
    
    try:
        from utils.email import send_contact_email
        
        success = await send_contact_email(
            name=contact_data.name,
            email=contact_data.email,
            phone=contact_data.phone,
            message=contact_data.message
        )
        
        if success:
            return {"message": "Message sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
    except Exception as e:
        print(f"Contact form error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.post("/auth/logout")
async def logout(response: Response):
    """Logout and clear session - No authentication required"""
    try:
        session_manager.clear_session_cookie(response)
        return {"message": "Logged out successfully"}
    except Exception as e:
        print(f"❌ Logout error: {e}")
        # Always return success for logout to prevent issues
        return {"message": "Logged out successfully"}

# Also add a GET version for easier frontend handling
@router.get("/auth/logout")
async def logout_get(response: Response):
    """Logout via GET - No authentication required"""
    try:
        session_manager.clear_session_cookie(response)
        return {"message": "Logged out successfully"}
    except Exception as e:
        print(f"❌ Logout error: {e}")
        return {"message": "Logged out successfully"}

@router.get("/csrf-token")
async def get_csrf_token(request: Request):
    """Get CSRF token for forms"""
    session_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            session_id = payload.get("user_id")
        except:
            pass
    
    csrf_token = csrf_protection.generate_token(session_id)
    return {"csrf_token": csrf_token}

@router.get("/debug")
async def debug_info():
    """Debug endpoint to check API status"""
    return {
        "api_status": "working",
        "timestamp": datetime.now().isoformat(),
        "routes": [
            "/api/auth/me",
            "/api/auth/login", 
            "/api/products",
            "/api/cart",
            "/api/orders"
        ],
        "message": "API is functioning correctly"
    }