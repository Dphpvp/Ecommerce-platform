import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import platformDetection from './platformDetection';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.permissionStatus = 'prompt';
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('🔔 Initializing notification service');

    // Only initialize on mobile platforms
    if (!platformDetection.isMobile || !Capacitor.isNativePlatform()) {
      console.log('📱 Not a mobile platform, skipping push notification setup');
      return;
    }

    try {
      // Request permission to use push notifications
      await this.requestPermissions();

      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  async requestPermissions() {
    try {
      const result = await PushNotifications.requestPermissions();
      this.permissionStatus = result.receive;
      
      console.log('🔔 Notification permission status:', result.receive);
      
      if (result.receive === 'granted') {
        console.log('✅ Push notification permissions granted');
        return true;
      } else {
        console.log('❌ Push notification permissions denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  setupEventListeners() {
    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', (token) => {
      console.log('✅ Push registration success, token: ' + token.value);
      this.saveTokenToServer(token.value);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Push registration error:', error);
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('🔔 Push notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('🔔 Push notification action performed:', notification);
      this.handleNotificationTapped(notification);
    });
  }

  async saveTokenToServer(token) {
    try {
      console.log('💾 Saving FCM token to server:', token);
      
      // Get auth token if user is logged in
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        console.log('👤 User not logged in, storing token locally for later');
        localStorage.setItem('fcm_token', token);
        return;
      }

      // Send token to your backend
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';
      
      let response;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        response = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${API_BASE}/users/fcm-token`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...platformDetection.getPlatformHeaders()
          },
          data: { fcm_token: token }
        });
      } else {
        response = await fetch(`${API_BASE}/users/fcm-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ fcm_token: token }),
          credentials: 'include'
        });
      }

      if (response.ok || (response.status >= 200 && response.status < 300)) {
        console.log('✅ FCM token saved to server successfully');
        localStorage.removeItem('fcm_token'); // Remove local storage after successful save
      } else {
        console.error('❌ Failed to save FCM token to server');
        localStorage.setItem('fcm_token', token); // Keep for retry
      }
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
      localStorage.setItem('fcm_token', token); // Keep for retry
    }
  }

  async retryTokenSave() {
    const token = localStorage.getItem('fcm_token');
    if (token) {
      await this.saveTokenToServer(token);
    }
  }

  handleNotificationReceived(notification) {
    // Handle foreground notification display
    console.log('📱 Notification received in foreground:', notification);
    
    // You can show a custom toast or modal here
    if (window.showToast) {
      window.showToast(notification.body || 'New notification received', 'info');
    }
  }

  handleNotificationTapped(notification) {
    // Handle notification tap - navigate to appropriate page
    console.log('👆 Notification tapped:', notification);
    
    const data = notification.notification?.data;
    if (data?.type === 'order' && data?.orderId) {
      // Navigate to order details
      window.location.href = `/orders/${data.orderId}`;
    } else if (data?.type === 'promotion' && data?.url) {
      // Navigate to promotion page
      window.location.href = data.url;
    } else {
      // Default navigation to home or notifications page
      window.location.href = '/';
    }
  }

  async checkPermissions() {
    if (!platformDetection.isMobile || !Capacitor.isNativePlatform()) {
      return 'not-supported';
    }

    try {
      const result = await PushNotifications.checkPermissions();
      this.permissionStatus = result.receive;
      return result.receive;
    } catch (error) {
      console.error('❌ Error checking notification permissions:', error);
      return 'error';
    }
  }

  getPermissionStatus() {
    return this.permissionStatus;
  }

  isSupported() {
    return platformDetection.isMobile && Capacitor.isNativePlatform();
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;