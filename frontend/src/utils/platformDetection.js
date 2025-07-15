/**
 * Platform detection utilities for Capacitor
 */

class PlatformDetectionManager {
  constructor() {
    try {
      this.platform = this.detectPlatform();
      this.isMobile = this.detectMobilePlatform();
      
      console.log('🔍 Platform detection:', {
        platform: this.platform,
        isMobile: this.isMobile,
        capacitor: !!window.Capacitor,
        isNativePlatform: window.Capacitor?.isNativePlatform?.() || false,
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('❌ Platform detection failed:', error);
      // Fallback values
      this.platform = 'web';
      this.isMobile = false;
    }
  }

  /**
   * Detect the current platform
   */
  detectPlatform() {
    try {
      // Primary: Use Capacitor API
      if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function') {
        if (window.Capacitor.isNativePlatform()) {
          return window.Capacitor.getPlatform();
        }
      }

      // Fallback: Parse user agent for Android
      const userAgent = navigator.userAgent;
      if (/Android/i.test(userAgent)) {
        // Check if it's likely a WebView (Capacitor app)
        const isWebView = /Chrome.*Version/i.test(userAgent) ||
                          /wv\)/i.test(userAgent) ||
                          window._capacitor ||
                          window.Capacitor;
        
        if (isWebView) {
          console.log('🤖 Android platform detected via user agent fallback');
          return 'android';
        }
      }

      // Check for iOS
      if (/iPhone|iPad|iPod/i.test(userAgent)) {
        const isWebView = /CriOS|FxiOS|Version.*Mobile.*Safari/i.test(userAgent) ||
                          window._capacitor ||
                          window.Capacitor;
        
        if (isWebView) {
          console.log('🍎 iOS platform detected via user agent fallback');
          return 'ios';
        }
      }
    } catch (error) {
      console.warn('Capacitor platform detection failed:', error);
    }
    return 'web';
  }

  /**
   * Check if running on mobile platform (Capacitor)
   */
  detectMobilePlatform() {
    try {
      // Primary: Check Capacitor
      if (window.Capacitor && 
          typeof window.Capacitor.isNativePlatform === 'function' && 
          window.Capacitor.isNativePlatform()) {
        return true;
      }

      // Fallback 1: Check for Android WebView patterns
      const userAgent = navigator.userAgent;
      const isAndroidWebView = /Android.*Chrome.*Version/i.test(userAgent) ||
                               /Android.*wv\)/i.test(userAgent) ||
                               /Version.*Chrome.*Mobile.*Safari/i.test(userAgent);
      
      // Fallback 2: Check for Capacitor app markers
      const hasCapacitorMarkers = window._capacitor ||
                                  window.Capacitor ||
                                  document.querySelector('meta[name="capacitor-config"]') ||
                                  /Capacitor/i.test(userAgent);

      // Fallback 3: Check for mobile platform indicators
      const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const hasTouchPoints = navigator.maxTouchPoints > 0;
      const hasTouch = 'ontouchstart' in window;

      // Android-specific detection
      if (isAndroidWebView || hasCapacitorMarkers || (isMobileUA && /Android/i.test(userAgent))) {
        console.log('🤖 Android platform detected via fallback detection');
        return true;
      }

      // General mobile detection
      if (isMobileUA && (hasTouchPoints || hasTouch)) {
        console.log('📱 Mobile platform detected via fallback detection');
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Mobile platform detection failed:', error);
      // Last resort: Assume mobile if Android is in user agent
      return /Android/i.test(navigator.userAgent);
    }
  }

  /**
   * Get platform headers for API requests
   */
  getPlatformHeaders() {
    const headers = {};
    
    if (this.isMobile) {
      headers['X-Capacitor-Platform'] = this.platform;
      headers['X-Mobile-App'] = 'true';
      
      // Add Android-specific headers for better WebView detection
      if (this.platform === 'android') {
        headers['X-Android-WebView'] = 'true';
        headers['X-Capacitor-Android'] = 'true';
        
        // Include WebView version if available
        const webViewMatch = navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
        if (webViewMatch) {
          headers['X-WebView-Version'] = webViewMatch[1];
        }
      }
      
      // Add device info for better debugging
      headers['X-Device-Info'] = JSON.stringify({
        platform: this.platform,
        userAgent: navigator.userAgent.substring(0, 100), // Truncate for header size
        screen: `${window.screen.width}x${window.screen.height}`,
        timestamp: Date.now()
      });
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
        ...this.getPlatformHeaders(),
        // Ensure proper content type for Android WebView
        'Content-Type': options.headers?.['Content-Type'] || 'application/json'
      }
    };

    // Android WebView timeout and retry logic
    if (this.platform === 'android') {
      return this._fetchWithAndroidFallback(url, enhancedOptions);
    }

    return fetch(url, enhancedOptions);
  }

  /**
   * Android-specific fetch with fallback handling
   */
  async _fetchWithAndroidFallback(url, options, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        console.warn(`🤖 Android fetch attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    const baseInfo = {
      platform: this.platform,
      isMobile: this.isMobile,
      isWeb: !this.isMobile,
      userAgent: navigator.userAgent,
      capacitorVersion: window.Capacitor?.version || null
    };

    // Add Android-specific info
    if (this.platform === 'android') {
      const androidMatch = navigator.userAgent.match(/Android\s([\d\.]+)/);
      const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
      
      baseInfo.androidVersion = androidMatch ? androidMatch[1] : 'unknown';
      baseInfo.webViewVersion = chromeMatch ? chromeMatch[1] : 'unknown';
      baseInfo.isWebView = /wv\)|Version.*Chrome/i.test(navigator.userAgent);
    }

    return baseInfo;
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