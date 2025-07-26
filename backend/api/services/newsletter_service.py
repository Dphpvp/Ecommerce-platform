import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from bson import ObjectId
import logging

from api.core.database import get_database
from api.services.email_service import EmailService
from api.models.newsletter import (
    NewsletterSubscriber, 
    NewsletterCampaign, 
    NewsletterSendRequest,
    NewsletterStats
)

logger = logging.getLogger(__name__)

class NewsletterService:
    def __init__(self):
        self.db = get_database()
        self.email_service = EmailService()
        self.subscribers_collection = self.db.newsletter_subscribers
        self.campaigns_collection = self.db.newsletter_campaigns
        self.users_collection = self.db.users
        
    async def subscribe_email(self, email: str, name: Optional[str] = None, source: str = "website") -> Dict:
        """Subscribe an email to the newsletter"""
        try:
            # Check if already subscribed
            existing = await self.subscribers_collection.find_one({"email": email})
            
            if existing:
                if existing.get("is_active", True):
                    return {
                        "success": False,
                        "message": "Email is already subscribed to newsletter",
                        "code": "ALREADY_SUBSCRIBED"
                    }
                else:
                    # Reactivate subscription
                    await self.subscribers_collection.update_one(
                        {"email": email},
                        {
                            "$set": {
                                "is_active": True,
                                "subscribed_at": datetime.utcnow(),
                                "source": source,
                                "name": name
                            }
                        }
                    )
                    return {
                        "success": True,
                        "message": "Newsletter subscription reactivated successfully"
                    }
            
            # Create new subscription
            subscriber = NewsletterSubscriber(
                email=email,
                name=name,
                source=source,
                subscribed_at=datetime.utcnow(),
                is_active=True
            )
            
            result = await self.subscribers_collection.insert_one(subscriber.dict(exclude={"id"}))
            
            if result.inserted_id:
                # Send welcome email
                try:
                    await self._send_welcome_email(email, name or "Subscriber")
                except Exception as e:
                    logger.warning(f"Failed to send welcome email to {email}: {e}")
                
                return {
                    "success": True,
                    "message": "Successfully subscribed to newsletter",
                    "subscriber_id": str(result.inserted_id)
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to subscribe to newsletter"
                }
                
        except Exception as e:
            logger.error(f"Error subscribing email {email}: {e}")
            return {
                "success": False,
                "message": "An error occurred while subscribing to newsletter"
            }
    
    async def unsubscribe_email(self, email: str) -> Dict:
        """Unsubscribe an email from the newsletter"""
        try:
            result = await self.subscribers_collection.update_one(
                {"email": email},
                {"$set": {"is_active": False, "unsubscribed_at": datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                return {
                    "success": True,
                    "message": "Successfully unsubscribed from newsletter"
                }
            else:
                return {
                    "success": False,
                    "message": "Email not found in newsletter subscribers"
                }
                
        except Exception as e:
            logger.error(f"Error unsubscribing email {email}: {e}")
            return {
                "success": False,
                "message": "An error occurred while unsubscribing"
            }
    
    async def get_all_recipients(self, send_to_users: bool = True, send_to_subscribers: bool = True) -> Tuple[List[Dict], int]:
        """Get all email recipients (users + newsletter subscribers)"""
        recipients = []
        
        try:
            # Get newsletter subscribers
            if send_to_subscribers:
                subscribers_cursor = self.subscribers_collection.find({"is_active": True})
                async for subscriber in subscribers_cursor:
                    recipients.append({
                        "email": subscriber["email"],
                        "name": subscriber.get("name", "Subscriber"),
                        "type": "newsletter_subscriber"
                    })
            
            # Get registered users
            if send_to_users:
                users_cursor = self.users_collection.find({"email_verified": True})
                async for user in users_cursor:
                    # Don't duplicate if user is also a newsletter subscriber
                    if not any(r["email"] == user["email"] for r in recipients):
                        recipients.append({
                            "email": user["email"],
                            "name": user.get("full_name", user.get("username", "User")),
                            "type": "registered_user"
                        })
            
            return recipients, len(recipients)
            
        except Exception as e:
            logger.error(f"Error getting recipients: {e}")
            return [], 0
    
    async def send_newsletter(self, request: NewsletterSendRequest, admin_user_id: str) -> Dict:
        """Send newsletter to all recipients"""
        try:
            # Get recipients
            recipients, total_count = await self.get_all_recipients(
                request.send_to_users, 
                request.send_to_subscribers
            )
            
            if total_count == 0:
                return {
                    "success": False,
                    "message": "No recipients found"
                }
            
            # Create campaign record
            campaign = NewsletterCampaign(
                subject=request.subject,
                content=request.content,
                created_by=admin_user_id,
                recipients_count=total_count,
                status="sending"
            )
            
            campaign_result = await self.campaigns_collection.insert_one(campaign.dict(exclude={"id"}))
            campaign_id = str(campaign_result.inserted_id)
            
            # Send emails in batches to avoid overwhelming the email service
            batch_size = 10
            sent_count = 0
            failed_count = 0
            
            for i in range(0, len(recipients), batch_size):
                batch = recipients[i:i + batch_size]
                
                # Send batch
                tasks = []
                for recipient in batch:
                    task = self._send_newsletter_email(
                        recipient["email"],
                        recipient["name"],
                        request.subject,
                        request.content
                    )
                    tasks.append(task)
                
                # Wait for batch to complete
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for result in results:
                    if isinstance(result, Exception):
                        failed_count += 1
                        logger.error(f"Newsletter send error: {result}")
                    elif result:
                        sent_count += 1
                    else:
                        failed_count += 1
                
                # Small delay between batches
                await asyncio.sleep(1)
            
            # Update campaign status
            await self.campaigns_collection.update_one(
                {"_id": ObjectId(campaign_id)},
                {
                    "$set": {
                        "status": "sent" if failed_count == 0 else "partial",
                        "sent_at": datetime.utcnow(),
                        "sent_count": sent_count,
                        "failed_count": failed_count
                    }
                }
            )
            
            return {
                "success": True,
                "message": f"Newsletter sent to {sent_count} recipients",
                "campaign_id": campaign_id,
                "sent_count": sent_count,
                "failed_count": failed_count,
                "total_recipients": total_count
            }
            
        except Exception as e:
            logger.error(f"Error sending newsletter: {e}")
            return {
                "success": False,
                "message": "An error occurred while sending newsletter"
            }
    
    async def get_newsletter_stats(self) -> NewsletterStats:
        """Get newsletter statistics"""
        try:
            # Count newsletter subscribers
            total_subscribers = await self.subscribers_collection.count_documents({})
            active_subscribers = await self.subscribers_collection.count_documents({"is_active": True})
            
            # Count registered users
            total_users = await self.users_collection.count_documents({"email_verified": True})
            
            # Count recent campaigns (last 30 days)
            recent_date = datetime.utcnow() - timedelta(days=30)
            recent_campaigns = await self.campaigns_collection.count_documents({
                "sent_at": {"$gte": recent_date}
            })
            
            # Get last campaign date
            last_campaign = await self.campaigns_collection.find_one(
                {"sent_at": {"$exists": True}},
                sort=[("sent_at", -1)]
            )
            last_campaign_date = last_campaign.get("sent_at") if last_campaign else None
            
            return NewsletterStats(
                total_subscribers=total_subscribers,
                active_subscribers=active_subscribers,
                total_users=total_users,
                recent_campaigns=recent_campaigns,
                last_campaign_date=last_campaign_date
            )
            
        except Exception as e:
            logger.error(f"Error getting newsletter stats: {e}")
            return NewsletterStats(
                total_subscribers=0,
                active_subscribers=0,
                total_users=0,
                recent_campaigns=0,
                last_campaign_date=None
            )
    
    async def get_recent_campaigns(self, limit: int = 10) -> List[Dict]:
        """Get recent newsletter campaigns"""
        try:
            campaigns = []
            cursor = self.campaigns_collection.find().sort("created_at", -1).limit(limit)
            
            async for campaign in cursor:
                campaign["_id"] = str(campaign["_id"])
                campaigns.append(campaign)
            
            return campaigns
            
        except Exception as e:
            logger.error(f"Error getting recent campaigns: {e}")
            return []
    
    async def _send_newsletter_email(self, email: str, name: str, subject: str, content: str) -> bool:
        """Send individual newsletter email"""
        try:
            # Create unsubscribe link
            unsubscribe_url = f"https://your-domain.com/unsubscribe?email={email}"
            
            # Add unsubscribe footer to content
            email_content = f"""
            {content}
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <div style="text-align: center; color: #666; font-size: 12px; margin: 20px 0;">
                <p>You're receiving this email because you subscribed to our newsletter.</p>
                <p>
                    <a href="{unsubscribe_url}" style="color: #666; text-decoration: underline;">
                        Unsubscribe from future emails
                    </a>
                </p>
            </div>
            """
            
            return await self.email_service.send_email(email, subject, email_content)
            
        except Exception as e:
            logger.error(f"Error sending newsletter email to {email}: {e}")
            return False
    
    async def _send_welcome_email(self, email: str, name: str) -> bool:
        """Send welcome email to new newsletter subscriber"""
        subject = "Welcome to Our Newsletter! 🎉"
        content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0;">🎉 Welcome to Our Newsletter!</h1>
            </div>
            
            <div style="background: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p>Hello {name},</p>
                <p>Thank you for subscribing to our newsletter! We're excited to have you join our community.</p>
                
                <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0; color: #28a745;">What to Expect</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Latest product updates and releases</li>
                        <li>Exclusive offers and discounts</li>
                        <li>Industry news and insights</li>
                        <li>Tips and best practices</li>
                    </ul>
                </div>
                
                <p>We respect your inbox and promise to only send valuable content. You can unsubscribe at any time using the link at the bottom of our emails.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://your-domain.com/products" 
                       style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Browse Our Products
                    </a>
                </div>
                
                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Thank you for joining our newsletter community!
                </p>
            </div>
        </body>
        </html>
        """
        
        return await self.email_service.send_email(email, subject, content)