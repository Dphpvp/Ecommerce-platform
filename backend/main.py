from fastapi import APIRouter
from api.routes import auth, products, cart, orders, contact, profile

router = APIRouter(prefix="/api")

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(products.router, prefix="/products", tags=["products"])
router.include_router(cart.router, prefix="/cart", tags=["cart"])
router.include_router(orders.router, prefix="/orders", tags=["orders"])
router.include_router(contact.router, prefix="/contact", tags=["contact"])
router.include_router(profile.router, prefix="/profile", tags=["profile"])