import asyncio
import motor.motor_asyncio
from datetime import datetime
import bcrypt

# MongoDB connection
MONGODB_URL = "mongodb+srv://razvanmare:s6gYa6cU7Fj59Ssk@products.tijjxg2.mongodb.net/?retryWrites=true&w=majority&appName=Products"
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.ecommerce

async def add_sample_products():
    """Add sample products to the database"""
    
    products = [
        {
            "name": "MacBook Pro 16-inch",
            "description": "Apple MacBook Pro with M2 Pro chip, 16GB RAM, 512GB SSD. Perfect for professional work and creative tasks.",
            "price": 2499.99,
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
            "stock": 15,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Sony WH-1000XM5 Headphones",
            "description": "Industry-leading noise canceling wireless headphones with exceptional sound quality and 30-hour battery life.",
            "price": 399.99,
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
            "stock": 45,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Apple Watch Series 9",
            "description": "Advanced health and fitness tracking with GPS, cellular connectivity, and comprehensive workout tracking.",
            "price": 429.99,
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
            "stock": 32,
            "created_at": datetime.utcnow()
        },
        {
            "name": "iPhone 15 Pro",
            "description": "Latest iPhone with titanium design, A17 Pro chip, Pro camera system with 5x telephoto lens.",
            "price": 1199.99,
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop",
            "stock": 28,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Nike Air Max 270",
            "description": "Comfortable running shoes with Max Air unit for exceptional cushioning and all-day comfort.",
            "price": 159.99,
            "category": "Sports",
            "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
            "stock": 67,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Adidas Ultraboost 22",
            "description": "Premium running shoes with responsive Boost midsole and Primeknit upper for ultimate performance.",
            "price": 189.99,
            "category": "Sports",
            "image_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop",
            "stock": 41,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Yoga Mat Premium",
            "description": "High-quality non-slip yoga mat with excellent grip and cushioning. Perfect for all yoga practices.",
            "price": 49.99,
            "category": "Sports",
            "image_url": "https://images.unsplash.com/photo-1506629905607-c28cb75bb3f1?w=400&h=300&fit=crop",
            "stock": 85,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Breville Espresso Machine",
            "description": "Professional-grade espresso machine with precise temperature control and steam wand for perfect coffee.",
            "price": 699.99,
            "category": "Home",
            "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
            "stock": 12,
            "created_at": datetime.utcnow()
        },
        {
            "name": "KitchenAid Stand Mixer",
            "description": "Iconic stand mixer with 10 speeds and multiple attachments. Essential for baking enthusiasts.",
            "price": 449.99,
            "category": "Home",
            "image_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
            "stock": 19,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Dyson V15 Detect",
            "description": "Powerful cordless vacuum with laser dust detection and intelligent suction adjustment.",
            "price": 549.99,
            "category": "Home",
            "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
            "stock": 23,
            "created_at": datetime.utcnow()
        },
        {
            "name": "The North Face Jacket",
            "description": "Waterproof and breathable outdoor jacket perfect for hiking, camping, and everyday wear.",
            "price": 279.99,
            "category": "Clothing",
            "image_url": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
            "stock": 34,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Levi's 501 Original Jeans",
            "description": "Classic straight-leg jeans made from premium denim. Timeless style that never goes out of fashion.",
            "price": 89.99,
            "category": "Clothing",
            "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop",
            "stock": 76,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Organic Cotton T-Shirt",
            "description": "Soft and comfortable organic cotton t-shirt available in multiple colors. Sustainable and ethically made.",
            "price": 29.99,
            "category": "Clothing",
            "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop",
            "stock": 124,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Gaming Mechanical Keyboard",
            "description": "RGB backlit mechanical keyboard with tactile switches. Perfect for gaming and professional typing.",
            "price": 149.99,
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300&fit=crop",
            "stock": 38,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Wireless Gaming Mouse",
            "description": "High-precision wireless gaming mouse with customizable buttons and long-lasting battery.",
            "price": 79.99,
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop",
            "stock": 52,
            "created_at": datetime.utcnow()
        }
    ]
    
    # Clear existing products (optional)
    await db.products.delete_many({})
    
    # Insert new products
    result = await db.products.insert_many(products)
    print(f"✅ Successfully added {len(result.inserted_ids)} products to the database")
    
    # Print summary by category
    categories = {}
    for product in products:
        category = product['category']
        if category not in categories:
            categories[category] = 0
        categories[category] += 1
    
    print("\n📊 Products by category:")
    for category, count in categories.items():
        print(f"  {category}: {count} products")

async def create_admin_user():
    """Create admin user if it doesn't exist"""
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"email": "admin@eshop.com"})
    if existing_admin:
        # Update existing user to be admin
        await db.users.update_one(
            {"email": "admin@eshop.com"},
            {"$set": {"is_admin": True}}
        )
        print("✅ Updated existing user to admin status")
        return
    
    # Create new admin user
    password = "admin123"
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    admin_user = {
        "username": "admin",
        "email": "admin@eshop.com",
        "password": hashed_password,
        "full_name": "Admin User",
        "address": "123 Admin Street, Admin City, AC 12345",
        "phone": "+1-555-0123",
        "is_admin": True,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(admin_user)
    print(f"✅ Created admin user:")
    print(f"   Email: admin@eshop.com")
    print(f"   Password: {password}")
    print(f"   ID: {str(result.inserted_id)}")

async def create_sample_customer():
    """Create a sample customer for testing"""
    
    # Check if customer already exists
    existing_customer = await db.users.find_one({"email": "customer@example.com"})
    if existing_customer:
        print("⚠️ Sample customer already exists")
        return
    
    password = "customer123"
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    customer_user = {
        "username": "customer",
        "email": "customer@example.com",
        "password": hashed_password,
        "full_name": "John Customer",
        "address": "456 Customer Ave, Customer City, CC 67890",
        "phone": "+1-555-0456",
        "is_admin": False,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(customer_user)
    print(f"✅ Created sample customer:")
    print(f"   Email: customer@example.com")
    print(f"   Password: {password}")

async def create_indexes():
    """Create database indexes for better performance"""
    
    # Products indexes
    await db.products.create_index("category")
    await db.products.create_index("name")
    await db.products.create_index("price")
    
    # Users indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    
    # Cart indexes
    await db.cart.create_index([("user_id", 1), ("product_id", 1)], unique=True)
    
    # Orders indexes
    await db.orders.create_index("user_id")
    await db.orders.create_index("created_at")
    await db.orders.create_index("status")
    
    print("✅ Database indexes created successfully")

async def main():
    """Main function to set up the database"""
    print("🚀 Setting up E-commerce database with Admin functionality...")
    print("=" * 60)
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully")
        
        # Create indexes
        await create_indexes()
        
        # Add sample data
        await add_sample_products()
        await create_admin_user()
        await create_sample_customer()
        
        print("\n" + "=" * 60)
        print("🎉 Database setup completed successfully!")
        print("\n📋 Account Information:")
        print("   👑 Admin Access:")
        print("      Email: admin@eshop.com")
        print("      Password: admin123")
        print("   👤 Sample Customer:")
        print("      Email: customer@example.com") 
        print("      Password: customer123")
        
        print("\n🌐 URLs:")
        print("   Frontend: http://localhost:3000")
        print("   Admin Dashboard: http://localhost:3000/admin/dashboard")
        print("   Admin Orders: http://localhost:3000/admin/orders")
        
        print("\n🚀 Next Steps:")
        print("1. Start the backend: python main.py")
        print("2. Start the frontend: npm start")
        print("3. Login as admin to access admin panel")
        print("4. Test ordering with customer account")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())