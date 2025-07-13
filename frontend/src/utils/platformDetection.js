/**
 * Platform detection utilities for Capacitor
 */

class PlatformDetectionManager {
  constructor() {
    this.platform = this.detectPlatform();
    this.isMobile = this.detectMobilePlatform();
  }

  /**
   * Detect the current platform
   */
  detectPlatform() {
    if (window.Capacitor) {
      if (window.Capacitor.isNativePlatform()) {
        return window.Capacitor.getPlatform();
      }
    }
    return 'web';
  }

  /**
   * Check if running on mobile platform (Capacitor)
   */
  detectMobilePlatform() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform());
  }

  /**
   * Get platform headers for API requests
   */
  getPlatformHeaders() {
    const headers = {};
    
    if (this.isMobile) {
      headers['X-Capacitor-Platform'] = this.platform;
      headers['X-Mobile-App'] = 'true';
    }
    
    return headers;
  }

  /**
   * Enhanced fetch wrapper that includes platform headers
   */
  async fetch(url, options = {}) {
    const enhancedOptions = {
      ...options,
      headers: {
        ...options.headers,
        ...this.getPlatformHeaders()
      }
    };

    return fetch(url, enhancedOptions);
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    return {
      platform: this.platform,
      isMobile: this.isMobile,
      isWeb: !this.isMobile,
      userAgent: navigator.userAgent,
      capacitorVersion: window.Capacitor?.version || null
    };
  }

  /**
   * Check if device has specific capability
   */
  hasCapability(capability) {
    switch (capability) {
      case 'camera':
        return this.isMobile || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      case 'filesystem':
        return this.isMobile || ('webkitRequestFileSystem' in window);
      case 'push_notifications':
        return this.isMobile || ('Notification' in window);
      case 'geolocation':
        return 'geolocation' in navigator;
      case 'device_info':
        return this.isMobile;
      default:
        return false;
    }
  }

  /**
   * Get platform-specific configuration
   */
  getPlatformConfig() {
    const baseConfig = {
      platform: this.platform,
      isMobile: this.isMobile
    };

    if (this.isMobile) {
      return {
        ...baseConfig,
        storage: 'native',
        biometrics: true,
        haptics: true,
        statusBar: true,
        splashScreen: true
      };
    } else {
      return {
        ...baseConfig,
        storage: 'localStorage',
        biometrics: false,
        haptics: false,
        statusBar: false,
        splashScreen: false
      };
    }
  }

  /**
   * Set up platform-specific event listeners
   */
  setupPlatformListeners() {
    if (this.isMobile) {
      // Listen for app state changes
      document.addEventListener('resume', this.onAppResume.bind(this));
      document.addEventListener('pause', this.onAppPause.bind(this));
      
      // Listen for back button on Android
      if (this.platform === 'android') {
        document.addEventListener('backbutton', this.onBackButton.bind(this));
      }
    }
  }

  /**
   * Handle app resume event
   */
  onAppResume() {
    console.log('App resumed');
    // Refresh tokens, check for updates, etc.
  }

  /**
   * Handle app pause event
   */
  onAppPause() {
    console.log('App paused');
    // Save state, pause background tasks, etc.
  }

  /**
   * Handle Android back button
   */
  onBackButton(event) {
    console.log('Back button pressed');
    // Custom back button handling
    event.preventDefault();
    
    // Check if we're on the home page
    if (window.location.pathname === '/' || window.location.pathname === '/home') {
      // Exit app or show confirmation
      if (window.Capacitor && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.exitApp();
      }
    } else {
      // Navigate back in history
      window.history.back();
    }
  }

  /**
   * Show platform-appropriate loading indicator
   */
  showLoading(message = 'Loading...') {
    if (this.isMobile && window.Capacitor?.Plugins?.LoadingController) {
      return window.Capacitor.Plugins.LoadingController.create({
        message: message
      });
    } else {
      // Web fallback - you can implement your own loading component
      console.log('Loading:', message);
      return Promise.resolve({
        present: () => {},
        dismiss: () => {}
      });
    }
  }

  /**
   * Show platform-appropriate toast message
   */
  showToast(message, duration = 3000) {
    if (this.isMobile && window.Capacitor?.Plugins?.Toast) {
      return window.Capacitor.Plugins.Toast.show({
        text: message,
        duration: duration
      });
    } else {
      // Web fallback - you can implement your own toast component
      console.log('Toast:', message);
      return Promise.resolve();
    }
  }

  /**
   * Get safe area insets for mobile apps
   */
  getSafeAreaInsets() {
    if (this.isMobile && window.Capacitor?.Plugins?.StatusBar) {
      return window.Capacitor.Plugins.StatusBar.getInfo();
    }
    
    return Promise.resolve({
      statusBarHeight: 0,
      safeAreaTop: 0,
      safeAreaBottom: 0
    });
  }
}

// Create singleton instance
const platformDetection = new PlatformDetectionManager();

export default platformDetection;