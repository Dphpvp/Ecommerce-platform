from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
import logging

from api.services.newsletter_service import NewsletterService
from api.models.newsletter import (
    NewsletterSubscribeRequest,
    NewsletterUnsubscribeRequest,
    NewsletterSendRequest,
    NewsletterStats
)
from api.dependencies.auth import get_current_user, get_admin_user
from api.models.responses import StandardResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize newsletter service
newsletter_service = NewsletterService()

# Public endpoints for newsletter subscription/unsubscription

@router.post("/subscribe", response_model=StandardResponse)
async def subscribe_to_newsletter(request: NewsletterSubscribeRequest):
    """Subscribe to newsletter (public endpoint)"""
    try:
        result = await newsletter_service.subscribe_email(
            email=request.email,
            name=request.name,
            source=request.source
        )
        
        if result["success"]:
            return StandardResponse(
                success=True,
                message=result["message"],
                data={"subscriber_id": result.get("subscriber_id")}
            )
        else:
            return StandardResponse(
                success=False,
                message=result["message"],
                error_code=result.get("code")
            )
            
    except Exception as e:
        logger.error(f"Newsletter subscription error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to subscribe to newsletter"
        )

@router.post("/unsubscribe", response_model=StandardResponse)
async def unsubscribe_from_newsletter(request: NewsletterUnsubscribeRequest):
    """Unsubscribe from newsletter (public endpoint)"""
    try:
        result = await newsletter_service.unsubscribe_email(request.email)
        
        return StandardResponse(
            success=result["success"],
            message=result["message"]
        )
        
    except Exception as e:
        logger.error(f"Newsletter unsubscription error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unsubscribe from newsletter"
        )

# Admin endpoints for managing newsletters

@router.post("/admin/send", response_model=StandardResponse)
async def send_newsletter(
    request: NewsletterSendRequest,
    admin_user: dict = Depends(get_admin_user)
):
    """Send newsletter to all subscribers and users (admin only)"""
    try:
        result = await newsletter_service.send_newsletter(
            request=request,
            admin_user_id=str(admin_user.get("_id", admin_user.get("id", "unknown")))
        )
        
        return StandardResponse(
            success=result["success"],
            message=result["message"],
            data={
                "campaign_id": result.get("campaign_id"),
                "sent_count": result.get("sent_count", 0),
                "failed_count": result.get("failed_count", 0),
                "total_recipients": result.get("total_recipients", 0)
            }
        )
        
    except Exception as e:
        logger.error(f"Newsletter send error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send newsletter"
        )

@router.get("/admin/stats", response_model=StandardResponse)
async def get_newsletter_stats(admin_user: dict = Depends(get_admin_user)):
    """Get newsletter statistics (admin only)"""
    try:
        stats = await newsletter_service.get_newsletter_stats()
        
        return StandardResponse(
            success=True,
            message="Newsletter statistics retrieved successfully",
            data=stats.dict()
        )
        
    except Exception as e:
        logger.error(f"Newsletter stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve newsletter statistics"
        )

@router.get("/admin/campaigns", response_model=StandardResponse)
async def get_recent_campaigns(
    limit: int = 10,
    admin_user: dict = Depends(get_admin_user)
):
    """Get recent newsletter campaigns (admin only)"""
    try:
        campaigns = await newsletter_service.get_recent_campaigns(limit=limit)
        
        return StandardResponse(
            success=True,
            message="Recent campaigns retrieved successfully",
            data={"campaigns": campaigns}
        )
        
    except Exception as e:
        logger.error(f"Recent campaigns error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recent campaigns"
        )

@router.get("/admin/recipients", response_model=StandardResponse)
async def get_newsletter_recipients(
    send_to_users: bool = True,
    send_to_subscribers: bool = True,
    admin_user: dict = Depends(get_admin_user)
):
    """Get newsletter recipients count (admin only)"""
    try:
        recipients, total_count = await newsletter_service.get_all_recipients(
            send_to_users=send_to_users,
            send_to_subscribers=send_to_subscribers
        )
        
        # Group by type for statistics
        user_count = len([r for r in recipients if r["type"] == "registered_user"])
        subscriber_count = len([r for r in recipients if r["type"] == "newsletter_subscriber"])
        
        return StandardResponse(
            success=True,
            message="Recipients retrieved successfully",
            data={
                "total_recipients": total_count,
                "registered_users": user_count,
                "newsletter_subscribers": subscriber_count,
                "recipients": recipients[:100]  # Limit to first 100 for performance
            }
        )
        
    except Exception as e:
        logger.error(f"Recipients error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recipients"
        )

# Convenience endpoint for getting unsubscribe page info
@router.get("/unsubscribe-info")
async def get_unsubscribe_info(email: str):
    """Get information for unsubscribe page"""
    try:
        # This is used by the frontend unsubscribe page to show subscriber info
        return StandardResponse(
            success=True,
            message="Unsubscribe information retrieved",
            data={"email": email}
        )
        
    except Exception as e:
        logger.error(f"Unsubscribe info error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve unsubscribe information"
        )