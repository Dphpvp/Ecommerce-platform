# backend/api.py (or wherever your routes are)

from fastapi import APIRouter
from database.connection import db  # adjust import based on your structure

router = APIRouter()

@router.get("/products")
async def get_products():
    products = []
    cursor = db.products.find({})  # replace 'products' with your collection name
    async for document in cursor:
        document["_id"] = str(document["_id"])  # convert ObjectId to string
        products.append(document)
    return products
