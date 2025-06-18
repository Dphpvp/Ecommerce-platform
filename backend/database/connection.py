import motor.motor_asyncio
import os

# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL")

# MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.ecommerce