import motor.motor_asyncio
import os

# MongoDB configuration - you can move this to a config file
MONGODB_URL = os.getenv("MONGODB_URL")

# MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.ecommerce