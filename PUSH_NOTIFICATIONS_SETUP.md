# 📱 Push Notifications Setup Guide

## Overview
Your admin dashboard now includes push notification functionality to send notifications to Android app users. This guide explains how to set up Firebase Cloud Messaging (FCM) for the backend.

## ✅ Frontend Implementation Completed

### Admin Dashboard Updates:
- **Button Updated**: "📧📱 Newsletter / Notifications" in admin dashboard
- **New Interface**: `/admin/newsletter/compose` now supports both email and push notifications
- **Three Send Modes**:
  - 📧 Email Newsletter only
  - 📱 Push Notification only  
  - 📧📱 Both Newsletter & Notification

### Features Added:
- **Mode Selection**: Toggle between newsletter, notification, or both
- **Character Limits**: Title (65 chars), Body (240 chars) - optimized for Android
- **Live Preview**: See how notification will appear on mobile device
- **Validation**: Separate validation for each communication type
- **Success Tracking**: Shows delivery counts for both email and push

## 🔧 Backend Setup Required

### 1. Firebase Cloud Messaging Configuration

You need to configure FCM server key and sender ID:

```bash
# Set environment variables
export FCM_SERVER_KEY="your_firebase_server_key_here"
export FCM_SENDER_ID="your_firebase_sender_id_here"
```

### 2. Get Firebase Credentials

#### Step 1: Go to Firebase Console
1. Visit https://console.firebase.google.com/
2. Select your project or create a new one
3. Go to Project Settings (gear icon)

#### Step 2: Get Server Key
1. Navigate to "Cloud Messaging" tab
2. Copy the "Server key" (legacy)
3. Set as `FCM_SERVER_KEY` environment variable

#### Step 3: Get Sender ID
1. In the same Cloud Messaging tab
2. Copy the "Sender ID" 
3. Set as `FCM_SENDER_ID` environment variable

### 3. Backend Dependencies

Add to `requirements.txt`:
```
httpx>=0.24.1
```

Install:
```bash
pip install httpx
```

## 📱 Android App Configuration

### 1. Firebase Configuration
Your Android app already has Firebase configured with:
- `google-services.json` file
- Firebase SDK dependencies
- Notification channels setup

### 2. Topic Subscription
Add to your Android MainActivity.java or a startup service:

```java
FirebaseMessaging.getInstance().subscribeToTopic("all_android_users")
    .addOnCompleteListener(task -> {
        if (task.isSuccessful()) {
            Log.d(TAG, "Subscribed to notifications topic");
        }
    });
```

## 🚀 How It Works

### 1. Admin Sends Notification
1. Admin goes to `/admin/newsletter/compose`
2. Selects "Push Notification" or "Both" mode
3. Fills notification title and body
4. Clicks "Send Push Notification"

### 2. Backend Processing
1. Validates notification data
2. Creates FCM payload with Android-specific settings
3. Sends to Firebase Cloud Messaging API
4. Returns success/failure count

### 3. Android Delivery
1. FCM delivers to all subscribed Android devices
2. Notification appears in system tray
3. Uses app icon and configured colors
4. Includes notification channel for proper categorization

## 🧪 Testing Push Notifications

### 1. Test FCM Health
```bash
curl -X GET "https://your-backend.onrender.com/api/notifications/admin/fcm-health" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2. Send Test Notification
```bash
curl -X POST "https://your-backend.onrender.com/api/notifications/admin/send-push" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test push notification from admin dashboard",
    "send_to_android_users": true
  }'
```

## 📊 Notification Best Practices

### 1. Content Guidelines
- **Title**: Keep under 50 characters for best display
- **Body**: Keep under 150 characters for single-line display
- **Timing**: Avoid sending during night hours (10 PM - 8 AM)

### 2. Frequency Limits
- **Marketing**: Maximum 2-3 per week
- **Transactional**: No limits (order updates, etc.)
- **Emergency**: Use sparingly for critical issues

### 3. Personalization
- Segment users by preferences
- Use dynamic content when possible
- A/B test different message formats

## ⚠️ Important Notes

### 1. Environment Variables
Make sure to set these in your deployment environment:
- Render: Set in Environment Variables section
- Local: Use `.env` file or export commands

### 2. Security
- Never expose FCM server key in frontend code
- Keep server key in backend environment variables only
- Rotate keys periodically for security

### 3. Rate Limits
- FCM has rate limits (1 million messages per minute)
- Implement queuing for large user bases
- Monitor delivery success rates

## 🔍 Troubleshooting

### Common Issues:

1. **"FCM not configured" error**
   - Check FCM_SERVER_KEY environment variable is set
   - Verify server key is correct in Firebase console

2. **Notifications not received on Android**
   - Ensure app subscribes to "all_android_users" topic
   - Check notification permissions are granted
   - Verify google-services.json is correct

3. **Backend timeout errors**
   - FCM requests timeout after 30 seconds
   - Check network connectivity to FCM servers
   - Verify server key permissions

### Debug Commands:
```bash
# Check environment variables
echo $FCM_SERVER_KEY
echo $FCM_SENDER_ID

# Test FCM health endpoint
curl -X GET "your-backend-url/api/notifications/admin/fcm-health"
```

Your push notification system is now ready! Admin users can send notifications directly from the dashboard to all Android app users.