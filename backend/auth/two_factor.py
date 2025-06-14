# backend/auth/two_factor.py
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timezone
import secrets

def generate_2fa_secret():
    """Generate a new 2FA secret"""
    return pyotp.random_base32()

def generate_qr_code(user_email, secret, app_name="ECommerce"):
    """Generate QR code for 2FA setup"""
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user_email,
        issuer_name=app_name
    )
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode()

def verify_totp_code(secret, code):
    """Verify TOTP code"""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)

def generate_backup_codes():
    """Generate backup codes for 2FA"""
    return [secrets.token_hex(4).upper() for _ in range(8)]

# backend/auth/email_verification.py
import secrets
from datetime import datetime, timezone, timedelta

def generate_verification_token():
    """Generate email verification token"""
    return secrets.token_urlsafe(32)

def is_token_expired(created_at, expiry_hours=24):
    """Check if verification token is expired"""
    if not created_at:
        return True
    expiry_time = created_at + timedelta(hours=expiry_hours)
    return datetime.now(timezone.utc) > expiry_time

# Updated backend/api.py - Add these imports
import pyotp
import qrcode
import io
import base64
import secrets
from datetime import timedelta

# Add these new routes to your existing api.py

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
        verification_url = f"{os.getenv('FRONTEND_URL')}/verify-email?token={verification_token}"
        await send_verification_email(user.email, user.full_name, verification_url)
        print(f"✅ Verification email sent to {user.email}")
    except Exception as e:
        print(f"❌ Failed to send verification email: {e}")
    
    return {"message": "User registered successfully. Please check your email to verify your account."}

@router.post("/auth/verify-email")
async def verify_email(token_data: dict):
    token = token_data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token required")
    
    user = await db.users.find_one({"verification_token": token})
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

@router.post("/auth/resend-verification")
async def resend_verification(email_data: dict):
    email = email_data.get("email")
    user = await db.users.find_one({"email": email, "email_verified": False})
    
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
    verification_url = f"{os.getenv('FRONTEND_URL')}/verify-email?token={verification_token}"
    await send_verification_email(email, user["full_name"], verification_url)
    
    return {"message": "Verification email sent"}

@router.post("/auth/setup-2fa")
async def setup_2fa(current_user: dict = Depends(get_current_user)):
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

@router.post("/auth/verify-2fa-setup")
async def verify_2fa_setup(verification_data: dict, current_user: dict = Depends(get_current_user)):
    code = verification_data.get("code")
    secret = await db.users.find_one({"_id": current_user["_id"]})
    temp_secret = secret.get("two_factor_secret_temp")
    
    if not temp_secret:
        raise HTTPException(status_code=400, detail="No 2FA setup in progress")
    
    # Verify the code
    totp = pyotp.TOTP(temp_secret)
    if not totp.verify(code, valid_window=1):
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

@router.post("/auth/disable-2fa")
async def disable_2fa(verification_data: dict, current_user: dict = Depends(get_current_user)):
    code = verification_data.get("code")
    password = verification_data.get("password")
    
    # Verify password
    if not verify_password(password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid password")
    
    # Verify 2FA code
    if current_user.get("two_factor_enabled"):
        secret = current_user.get("two_factor_secret")
        totp = pyotp.TOTP(secret)
        if not totp.verify(code, valid_window=1):
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

# Update login route to handle 2FA
@router.post("/auth/login")
async def login(user_login: UserLogin):
    identifier_type = get_identifier_type(user_login.identifier)
    
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
            "is_admin": user.get("is_admin", False),
            "email_verified": user.get("email_verified", False),
            "two_factor_enabled": user.get("two_factor_enabled", False)
        }
    }

@router.post("/auth/verify-2fa")
async def verify_2fa_login(verification_data: dict):
    temp_token = verification_data.get("temp_token")
    code = verification_data.get("code")
    
    try:
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

# Helper function to create JWT with custom expiry
def create_jwt_token(user_id: str, expires_in: timedelta = timedelta(days=7)) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + expires_in
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")