import motor.motor_asyncio
import os
from pymongo.errors import ConnectionFailure

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/ecommerce")

try:
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client.ecommerce
    print(f"✅ Connected to MongoDB: {MONGODB_URL}")
except ConnectionFailure as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    raise e

# Create indexes for better performance
async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # User indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.users.create_index("verification_token")
        
        # Product indexes
        await db.products.create_index("category")
        await db.products.create_index("name")
        await db.products.create_index([("name", "text"), ("description", "text")])
        
        # Cart indexes
        await db.cart.create_index([("user_id", 1), ("product_id", 1)], unique=True)
        
        # Order indexes
        await db.orders.create_index("user_id")
        await db.orders.create_index("order_number", unique=True)
        await db.orders.create_index("status")
        
        # Password reset indexes
        await db.password_resets.create_index("token", unique=True)
        await db.password_resets.create_index("expires_at", expireAfterSeconds=0)
        
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"⚠️ Error creating indexes: {e}")

# Initialize on import
import asyncio
try:
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # If loop is already running, schedule the task
        asyncio.create_task(create_indexes())
    else:
        # If no loop is running, run it
        loop.run_until_complete(create_indexes())
except RuntimeError:
    # In case we're in a different context, just pass
    pass