import asyncio
import motor.motor_asyncio
import bcrypt
from datetime import datetime

# Use your MongoDB connection string
MONGODB_URL = "mongodb+srv://razvanmare:s6gYa6cU7Fj59Ssk@products.tijjxg2.mongodb.net/?retryWrites=true&w=majority&appName=Products"

async def create_admin():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client.ecommerce
    
    # Check if admin exists
    admin = await db.users.find_one({"email": "admin1@eshop.com"})
    if admin:
        print("Admin user already exists")
        return
    
    # Create admin
    password = "admin1"
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    admin_user = {
        "username": "admin1",
        "email": "admin1@eshop.com", 
        "password": hashed_password,
        "full_name": "Admin User",
        "address": "123 Admin Street",
        "phone": "+1-555-0123",
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(admin_user)
    print("Admin created: admin1@eshop.com / admin1")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())