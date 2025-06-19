import motor.motor_asyncio
from api.core.config import get_settings

settings = get_settings()
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client.ecommerce

def get_database():
    return db