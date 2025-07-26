from fastapi import APIRouter
from api.routes import auth, products, cart, orders, contact, profile, debug, uploads, newsletter
from api.routes import admin_routes

# Main API router
router = APIRouter(prefix="/api")

# Include all route modules
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(products.router, prefix="/products", tags=["products"])
router.include_router(cart.router, prefix="/cart", tags=["cart"])
router.include_router(orders.router, prefix="/orders", tags=["orders"])
router.include_router(contact.router, prefix="/contact", tags=["contact"])
router.include_router(profile.router, prefix="/profile", tags=["profile"])
router.include_router(debug.router, prefix="/debug", tags=["debug"])
router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
router.include_router(newsletter.router, prefix="/newsletter", tags=["newsletter"])
router.include_router(admin_routes.router, prefix="/admin", tags=["admin"])