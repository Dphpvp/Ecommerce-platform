from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class NewsletterSubscriber(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr = Field(..., description="Subscriber email")
    name: Optional[str] = Field(None, description="Subscriber name (optional)")
    subscribed_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True, description="Whether subscription is active")
    source: str = Field(default="website", description="How they subscribed (website, checkout, etc.)")
    preferences: Optional[dict] = Field(default_factory=dict, description="Email preferences")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr = Field(..., description="Email to subscribe")
    name: Optional[str] = Field(None, max_length=100, description="Optional name")
    source: str = Field(default="website", description="Subscription source")

class NewsletterUnsubscribeRequest(BaseModel):
    email: EmailStr = Field(..., description="Email to unsubscribe")

class NewsletterCampaign(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    subject: str = Field(..., min_length=1, max_length=200, description="Email subject")
    content: str = Field(..., min_length=1, description="Email content (HTML)")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = Field(None, description="When the campaign was sent")
    created_by: str = Field(..., description="Admin user who created the campaign")
    recipients_count: int = Field(default=0, description="Number of recipients")
    sent_count: int = Field(default=0, description="Number successfully sent")
    failed_count: int = Field(default=0, description="Number that failed to send")
    status: str = Field(default="draft", description="Campaign status: draft, sending, sent, failed")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class NewsletterSendRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200, description="Email subject")
    content: str = Field(..., min_length=1, description="Email content (HTML)")
    send_to_users: bool = Field(default=True, description="Send to registered users")
    send_to_subscribers: bool = Field(default=True, description="Send to newsletter subscribers")

class NewsletterStats(BaseModel):
    total_subscribers: int = Field(..., description="Total newsletter subscribers")
    active_subscribers: int = Field(..., description="Active newsletter subscribers")
    total_users: int = Field(..., description="Total registered users")
    recent_campaigns: int = Field(..., description="Campaigns sent in last 30 days")
    last_campaign_date: Optional[datetime] = Field(None, description="Date of last campaign")