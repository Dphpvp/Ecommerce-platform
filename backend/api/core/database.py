import motor.motor_asyncio
from api.core.config import get_settings

settings = get_settings()

# Handle empty MongoDB URL for testing
if settings.MONGODB_URL:
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.ecommerce
else:
    # Create a mock database for testing without MongoDB
    print("Warning: No MongoDB URL configured, using mock database")
    client = None
    db = None

def get_database():
    if db is None:
        raise Exception("Database not configured. Set MONGODB_URL in .env file")
    return db