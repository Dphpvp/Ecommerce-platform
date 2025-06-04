E-Commerce Platform Setup Guide
Overview
This is a full-stack e-commerce platform built with:

Backend: Python (FastAPI) with MongoDB
Frontend: React with Stripe integration
Features: User authentication, product catalog, shopping cart, checkout, order management, email notifications
Prerequisites
Python 3.8+
Node.js 16+
MongoDB (local or cloud)
Stripe account for payments
Gmail account for email notifications
Project Structure
ecommerce-platform/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── README.md
Backend Setup
1. Create Backend Directory and Files
bash
mkdir ecommerce-platform
cd ecommerce-platform
mkdir backend
cd backend
2. Create Virtual Environment
bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
3. Install Dependencies
bash
pip install -r requirements.txt
4. MongoDB Setup
Option A: Local MongoDB

Install MongoDB locally
Start MongoDB service: mongod
Option B: MongoDB Atlas (Cloud)

Create account at mongodb.com/cloud/atlas
Create cluster and get connection string
Update MONGODB_URL in main.py
5. Configure Environment Variables
Update these variables in main.py:

python
MONGODB_URL = "mongodb://localhost:27017"  # or your Atlas connection string
JWT_SECRET = "your-super-secret-jwt-key-change-this"
STRIPE_SECRET_KEY = "sk_test_your_stripe_secret_key_here"
EMAIL_USER = "your-email@gmail.com"
EMAIL_PASSWORD = "your-gmail-app-password"
6. Gmail App Password Setup
Enable 2-Factor Authentication on your Gmail account
Go to Google Account settings > Security > App passwords
Generate app password for "Mail"
Use this password in EMAIL_PASSWORD
7. Stripe Setup
Create account at stripe.com
Get your test API keys from Dashboard > Developers > API keys
Update STRIPE_SECRET_KEY in main.py
Note your publishable key for frontend
8. Run Backend
bash
python main.py
Backend will run on http://localhost:8000

Frontend Setup
1. Create Frontend Directory
bash
cd ../  # Go back to project root
npx create-react-app frontend
cd frontend
2. Install Additional Dependencies
bash
npm install @stripe/react-stripe-js @stripe/stripe-js react-router-dom
3. Replace Default Files
Replace src/App.js with the provided React code
Replace src/App.css with the provided CSS code
Update package.json with the provided configuration
4. Configure Stripe
Update the Stripe publishable key in App.js:

javascript
const stripePromise = loadStripe('pk_test_your_stripe_publishable_key_here');
5. Run Frontend
bash
npm start
Frontend will run on http://localhost:3000

Database Initialization
Add Sample Products
Use a MongoDB client or Python script to add sample products:

python
import asyncio
import motor.motor_asyncio
from datetime import datetime

async def add_sample_products():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.ecommerce
    
    products = [
        {
            "name": "Laptop Pro 15",
            "description": "High-performance laptop with 16GB RAM and 512GB SSD",
            "price": 1299.99,
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
            "stock": 25,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Wireless Headphones",
            "description": "Premium noise-canceling wireless headphones",
            "price": 299.99,
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
            "stock": 50,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Smart Watch",
            "description": "Fitness tracking smartwatch with heart rate monitor",
            "price": 199.99,
            "category": "Electronics",
            "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
            "stock": 30,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Running Shoes",
            "description": "Comfortable running shoes for all terrains",
            "price": 129.99,
            "category": "Sports",
            "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
            "stock": 40,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Coffee Maker",
            "description": "Automatic drip coffee maker with programmable timer",
            "price": 89.99,
            "category": "Home",
            "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
            "stock": 20,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.products.insert_many(products)
    print(f"Added {len(products)} sample products")

if __name__ == "__main__":
    asyncio.run(add_sample_products())
Save this as add_sample_data.py in the backend directory and run:

bash
python add_sample_data.py
API Endpoints
Authentication
POST /api/auth/register - User registration
POST /api/auth/login - User login
GET /api/auth/me - Get current user info
Products
GET /api/products - Get all products (with optional category filter)
GET /api/products/{product_id} - Get specific product
POST /api/products - Create new product (admin)
Cart
POST /api/cart/add - Add item to cart
GET /api/cart - Get user's cart items
DELETE /api/cart/{item_id} - Remove item from cart
Orders
POST /api/orders - Create new order
GET /api/orders - Get user's orders
GET /api/orders/{order_id} - Get specific order
Payment
POST /api/payment/create-intent - Create Stripe payment intent
Features
✅ User Authentication
User registration and login
JWT token-based authentication
Password hashing with bcrypt
Protected routes
✅ Product Management
Product catalog with categories
Product search and filtering
Stock management
Product images
✅ Shopping Cart
Add/remove items
Quantity management
Persistent cart (database-stored)
Cart total calculation
✅ Checkout & Payment
Stripe payment integration
Secure card processing
Payment intent creation
Order confirmation
✅ Order Management
Order creation and tracking
Order history
Order status updates
Email notifications
✅ Email Notifications
Order confirmation emails
HTML email templates
Gmail SMTP integration
✅ Responsive Design
Mobile-friendly interface
Modern CSS styling
Intuitive user experience
Testing
Test User Registration
Go to http://localhost:3000/register
Fill out the form and register
You should be automatically logged in
Test Shopping Flow
Browse products at http://localhost:3000/products
Add items to cart
View cart at http://localhost:3000/cart
Proceed to checkout
Use Stripe test card: 4242 4242 4242 4242
Complete order and check email
Test Stripe Payments
Use these test card numbers:

Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Requires Auth: 4000 0027 6000 3184
Deployment
Backend Deployment (Example with Heroku)
Create Procfile:
web: uvicorn main:app --host=0.0.0.0 --port=${PORT:-8000}
Update environment variables for production
Use MongoDB Atlas for production database
Deploy to Heroku or similar platform
Frontend Deployment (Example with Netlify)
Build the app: npm run build
Deploy the build folder to Netlify
Update API base URL for production
Configure environment variables
Security Considerations
⚠️ Important Security Updates for Production
Change JWT Secret: Use a strong, random secret key
Environment Variables: Store secrets in environment variables, not in code
CORS: Configure CORS properly for production domains
HTTPS: Use HTTPS in production
Database Security: Use MongoDB authentication and secure connection strings
Rate Limiting: Implement rate limiting for API endpoints
Input Validation: Add comprehensive input validation
Error Handling: Don't expose sensitive information in error messages
Environment Variables Setup
Create .env files for both backend and frontend:

Backend .env:

MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
Frontend .env:

REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
REACT_APP_API_BASE_URL=http://localhost:8000/api
Troubleshooting
Common Issues
MongoDB Connection Error

Ensure MongoDB is running
Check connection string
Verify network access (for Atlas)
Stripe Payment Fails

Verify API keys are correct
Check test vs live mode
Ensure proper key format
Email Not Sending

Verify Gmail app password
Check Gmail account settings
Ensure 2FA is enabled
CORS Errors

Check frontend URL in backend CORS settings
Verify API base URL in frontend
Cart Not Updating

Check authentication token
Verify API endpoints are working
Check browser console for errors
Extending the Platform
Adding Admin Panel
Create admin routes and components
Add product management interface
Implement order management system
Adding More Payment Methods
PayPal integration
Apple Pay/Google Pay
Bank transfer options
Adding Product Reviews
Review model and API endpoints
Star ratings component
Review display and filtering
Adding Inventory Tracking
Low stock alerts
Automatic reordering
Supplier management
Adding Shipping Integration
Shipping calculator
Tracking numbers
Multiple shipping options
Support
For issues or questions:

Check the troubleshooting section
Review API documentation
Check browser console for errors
Verify all configuration values
This platform provides a solid foundation for a full-featured e-commerce application with room for extensive customization and feature additions.

