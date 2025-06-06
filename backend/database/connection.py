import motor.motor_asyncio

# MongoDB configuration - you can move this to a config file
MONGODB_URL = "mongodb+srv://razvanmare:s6gYa6cU7Fj59Ssk@products.tijjxg2.mongodb.net/?retryWrites=true&w=majority&appName=Products"

# MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.ecommerce