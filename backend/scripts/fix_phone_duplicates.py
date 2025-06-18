# Step 1: Create a script to fix your database
# backend/scripts/fix_phone_duplicates.py

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import secrets

async def fix_phone_duplicates():
    """Fix duplicate phone numbers in database"""
    
    # Connect to database
    MONGODB_URL = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.ecommerce
    
    try:
        print("🔍 Checking for duplicate phone numbers...")
        
        # Drop the existing phone index
        try:
            await db.users.drop_index("phone_1")
            print("✅ Dropped existing phone index")
        except Exception as e:
            print(f"⚠️ No phone index to drop: {e}")
        
        # Find users with duplicate or empty phone numbers
        pipeline = [
            {"$group": {
                "_id": "$phone",
                "users": {"$push": {"_id": "$_id", "email": "$email"}},
                "count": {"$sum": 1}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        duplicates = await db.users.aggregate(pipeline).to_list(None)
        
        print(f"📱 Found {len(duplicates)} duplicate phone groups")
        
        # Fix duplicates by giving unique phone numbers
        for dup_group in duplicates:
            phone = dup_group["_id"]
            users = dup_group["users"]
            
            print(f"🔧 Fixing duplicate phone: {phone}")
            
            # Keep first user with original phone, update others
            for i, user in enumerate(users[1:], 1):
                # Generate unique phone number
                new_phone = f"+1-555-{secrets.randbelow(9000) + 1000:04d}"
                
                # Make sure it's unique
                while await db.users.find_one({"phone": new_phone}):
                    new_phone = f"+1-555-{secrets.randbelow(9000) + 1000:04d}"
                
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"phone": new_phone}}
                )
                print(f"  📞 Updated {user['email']} to {new_phone}")
        
        # Find users with empty/null phone and give them phone numbers
        empty_phone_users = await db.users.find({
            "$or": [
                {"phone": {"$exists": False}},
                {"phone": ""},
                {"phone": None}
            ]
        }).to_list(None)
        
        print(f"📵 Found {len(empty_phone_users)} users without phone numbers")
        
        for user in empty_phone_users:
            # Generate unique phone number
            new_phone = f"+1-555-{secrets.randbelow(9000) + 1000:04d}"
            
            # Make sure it's unique
            while await db.users.find_one({"phone": new_phone}):
                new_phone = f"+1-555-{secrets.randbelow(9000) + 1000:04d}"
            
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"phone": new_phone}}
            )
            print(f"  📞 Added phone {new_phone} to {user['email']}")
        
        # Now create unique index on phone
        await db.users.create_index("phone", unique=True)
        print("✅ Created unique phone index")
        
        print("🎉 All phone duplicates fixed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_phone_duplicates())

# Step 2: Update your Pydantic models
# backend/middleware/validation.py - Update SecureUser model

class SecureUser(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=254)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(default="", max_length=500)
    phone: str = Field(..., min_length=10, max_length=20)  # Made required (removed Optional)
    
    @validator('username')
    def validate_username(cls, v):
        return SecurityValidator.validate_username(v)
    
    @validator('email')
    def validate_email(cls, v):
        return SecurityValidator.validate_email_format(v)
    
    @validator('password')
    def validate_password(cls, v):
        SecurityValidator.validate_password_strength(v)
        if not SecurityValidator.validate_password_complexity(v):
            raise ValueError("Password must contain uppercase, lowercase, number, and special character")
        return v
    
    @validator('full_name')
    def validate_full_name(cls, v):
        sanitized = SecurityValidator.sanitize_string(v, 100)
        if len(sanitized.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return sanitized
    
    @validator('address')
    def validate_address(cls, v):
        return SecurityValidator.sanitize_string(v, 500)
    
    @validator('phone')
    def validate_phone(cls, v):
        if not v or not v.strip():  # Phone is now required
            raise ValueError("Phone number is required")
        return SecurityValidator.validate_phone(v)

# Step 3: Update main User model in api.py
class User(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    address: Optional[str] = None
    phone: str  # Made required (removed Optional)

# Step 4: Update main.py index creation
@app.on_event("startup")
async def startup_event():
    print("🚀 E-commerce Backend Starting Up...")
    
    try:
        from database.connection import db
        
        # Test database connection
        await db.admin.command('ping')
        print("📡 Database connection successful")
        
        # Create indexes - phone is now unique and required
        await db.users.create_index("email", unique=True)
        await db.users.create_index("phone", unique=True)  # Now unique
        await db.products.create_index("category")
        await db.orders.create_index("user_id")
        await db.cart.create_index("user_id")
        
        print("📊 Database indexes created")
        
    except Exception as e:
        print(f"⚠️ Database setup warning: {e}")
        # Don't fail startup on index issues
    
    print("🎯 Server ready!")

# Step 5: Frontend validation update
# Add to your React registration form validation:
const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') {
    return 'Phone number is required';
  }
  
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,20}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  
  return null;
};


# Run this command to fix your database:
# python backend/scripts/fix_phone_duplicates.py