"""
Push Notification Routes for Admin
Handles sending push notifications to Android app users
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import json
import httpx
from datetime import datetime

# Import admin authentication dependency
from auth.dependencies import get_admin_user

router = APIRouter()

# Firebase Cloud Messaging Configuration
# You'll need to set these environment variables
import os
FCM_SERVER_KEY = os.getenv('FCM_SERVER_KEY', '')
FCM_SENDER_ID = os.getenv('FCM_SENDER_ID', '')

class PushNotificationRequest(BaseModel):
    title: str
    body: str
    send_to_android_users: bool = True
    topic: str = "all_android_users"  # Default topic for all Android users

class PushNotificationResponse(BaseModel):
    success: bool
    message: str
    data: dict

@router.post("/admin/send-push", response_model=PushNotificationResponse)
async def send_push_notification(
    notification_data: PushNotificationRequest,
    current_admin = Depends(get_admin_user)
):
    """
    Send push notification to Android app users
    Requires admin authentication
    """
    try:
        if not FCM_SERVER_KEY:
            raise HTTPException(
                status_code=500, 
                detail="Firebase Cloud Messaging not configured. Please set FCM_SERVER_KEY environment variable."
            )
        
        # Validate notification data
        if not notification_data.title or not notification_data.body:
            raise HTTPException(
                status_code=400,
                detail="Both title and body are required for push notifications"
            )
        
        # Prepare FCM payload
        fcm_payload = {
            "to": f"/topics/{notification_data.topic}",
            "notification": {
                "title": notification_data.title,
                "body": notification_data.body,
                "icon": "ic_launcher",
                "color": "#007bff",
                "sound": "default",
                "click_action": "FLUTTER_NOTIFICATION_CLICK"
            },
            "data": {
                "type": "admin_notification",
                "timestamp": datetime.now().isoformat(),
                "title": notification_data.title,
                "body": notification_data.body
            },
            "android": {
                "notification": {
                    "channel_id": "vergishop_notifications",
                    "priority": "high",
                    "notification_priority": "PRIORITY_HIGH",
                    "visibility": "PUBLIC"
                }
            }
        }
        
        # Send to Firebase Cloud Messaging
        headers = {
            'Authorization': f'key={FCM_SERVER_KEY}',
            'Content-Type': 'application/json',
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://fcm.googleapis.com/fcm/send',
                json=fcm_payload,
                headers=headers,
                timeout=30
            )
        
        if response.status_code == 200:
            fcm_response = response.json()
            
            # Parse FCM response
            success_count = fcm_response.get('success', 0)
            failure_count = fcm_response.get('failure', 0)
            
            # Log notification for audit trail
            notification_log = {
                "admin_id": current_admin.get("id", "unknown"),
                "admin_email": current_admin.get("email", "unknown"),
                "title": notification_data.title,
                "body": notification_data.body,
                "sent_at": datetime.now().isoformat(),
                "success_count": success_count,
                "failure_count": failure_count,
                "fcm_response": fcm_response
            }
            
            # Here you could save to database if needed
            print(f"📱 Push Notification Sent: {json.dumps(notification_log, indent=2)}")
            
            return PushNotificationResponse(
                success=True,
                message=f"Push notification sent successfully!",
                data={
                    "sent_count": success_count,
                    "failed_count": failure_count,
                    "total_attempts": success_count + failure_count,
                    "fcm_message_id": fcm_response.get('message_id', 'N/A')
                }
            )
        else:
            error_detail = response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Firebase Cloud Messaging error: {error_detail}"
            )
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=408,
            detail="Timeout while sending push notification. Please try again."
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Network error while sending push notification: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Push notification error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send push notification: {str(e)}"
        )

@router.get("/admin/push-stats")
async def get_push_notification_stats(
    current_admin = Depends(get_admin_user)
):
    """
    Get push notification statistics
    This is a placeholder - you'd implement actual stats from your database
    """
    try:
        # Placeholder stats - replace with actual database queries
        stats = {
            "android_users": 0,  # Count from your user database where has_android_app = True
            "total_notifications_sent": 0,  # From notification logs
            "last_notification_sent": None,  # Last notification timestamp
            "active_topics": ["all_android_users"]
        }
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch push notification stats: {str(e)}"
        )

# Health check endpoint for FCM configuration
@router.get("/admin/fcm-health")
async def check_fcm_health(
    current_admin = Depends(get_admin_user)
):
    """
    Check Firebase Cloud Messaging configuration health
    """
    try:
        config_status = {
            "fcm_server_key_configured": bool(FCM_SERVER_KEY),
            "fcm_sender_id_configured": bool(FCM_SENDER_ID),
            "ready_to_send": bool(FCM_SERVER_KEY)
        }
        
        return {
            "success": True,
            "data": config_status
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check FCM health: {str(e)}"
        )