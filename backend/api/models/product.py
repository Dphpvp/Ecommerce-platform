from pydantic import BaseModel, Field, validator
from typing import Optional
from api.utils.security import SecurityValidator

class ProductRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    price: float = Field(..., gt=0, le=999999.99)
    category: str = Field(..., min_length=1, max_length=100)
    image_url: str = Field(..., min_length=1, max_length=500)
    stock: int = Field(..., ge=0, le=999999)
    
    @validator('name')
    def validate_name(cls, v):
        return SecurityValidator.sanitize_string(v, 200)
    
    @validator('description')
    def validate_description(cls, v):
        return SecurityValidator.sanitize_html(v)
    
    @validator('category')
    def validate_category(cls, v):
        return SecurityValidator.sanitize_string(v, 100)
    
    @validator('image_url')
    def validate_image_url(cls, v):
        if not SecurityValidator.validate_image_url(v):
            raise ValueError("Invalid image URL")
        return SecurityValidator.validate_url(v)

class ProductSearchRequest(BaseModel):
    q: str = ""
    category: str = ""
    min_price: float = 0
    max_price: float = 999999
    limit: int = 50
    skip: int = 0