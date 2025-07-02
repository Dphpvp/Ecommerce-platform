import motor.motor_asyncio
import os
import asyncio
from pymongo.errors import ConnectionFailure

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/ecommerce")

try:
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client.ecommerce
    print(f"✅ Connected to MongoDB: {MONGODB_URL}")
except ConnectionFailure as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    raise e

# Track if indexes are created
_indexes_created = False

async def create_indexes():
    """Create database indexes for better performance"""
    global _indexes_created
    if _indexes_created:
        return
    
    try:
        # User indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.users.create_index("phone", unique=True, sparse=True)
        await db.users.create_index("verification_token", sparse=True)
        
        # Product indexes
        await db.products.create_index("category")
        await db.products.create_index("name")
        await db.products.create_index("price")
        await db.products.create_index([("name", "text"), ("description", "text")])
        
        # Cart indexes
        await db.cart.create_index([("user_id", 1), ("product_id", 1)], unique=True)
        await db.cart.create_index("user_id")
        
        # Order indexes
        await db.orders.create_index("user_id")
        await db.orders.create_index("order_number", unique=True)
        await db.orders.create_index("status")
        await db.orders.create_index("created_at")
        
        # Password reset indexes
        await db.password_resets.create_index("token", unique=True)
        await db.password_resets.create_index("expires_at", expireAfterSeconds=0)
        await db.password_resets.create_index("user_id")
        
        _indexes_created = True
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"⚠️ Error creating indexes: {e}")

async def get_database():
    """Get database instance and ensure indexes are created"""
    if not _indexes_created:
        await create_indexes()
    return db