/**
 * Enhanced mobile reCAPTCHA utility for Android WebView
 * Implements WebView-specific reCAPTCHA API integration
 */
import platformDetection from './platformDetection.js';

class MobileCaptchaManager {
  constructor() {
    this.isLoaded = false;
    this.widgetId = null;
    this.hasNativeInterface = false;
    this.webViewMode = false;
    
    // Enhanced platform detection for WebView
    try {
      this.isMobile = platformDetection.isMobile;
      this.platform = platformDetection.platform;
      
      // Detect Android WebView environment
      const isCapacitor = !!window.Capacitor;
      const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // WebView specific detection
      const isWebView = navigator.userAgent.includes('wv') || 
                       window.AndroidWebView !== undefined ||
                       (isAndroid && !navigator.userAgent.includes('Chrome')) ||
                       isCapacitor;
      
      this.isActuallyMobile = isCapacitor || isMobileUA || (isTouchDevice && (isAndroid || isIOS));
      this.actualPlatform = isAndroid ? 'android' : isIOS ? 'ios' : 'mobile';
      this.webViewMode = isWebView && isAndroid;
      
      // Check for native RecaptchaInterface
      this.hasNativeInterface = !!(window.RecaptchaInterface);
      
    } catch (error) {
      console.warn('Platform detection failed, using safe fallback', error);
      this.isMobile = false;
      this.platform = 'web';
      this.isActuallyMobile = false;
      this.hasNativeInterface = false;
      this.webViewMode = false;
    }
    
    this.onLoadCallback = null;
    this.onCompleteCallback = null;
    this.onExpiredCallback = null;
    
    console.log('🔧 WebView MobileCaptcha initialized:', {
      platform: this.platform,
      actuallyMobile: this.isActuallyMobile,
      actualPlatform: this.actualPlatform,
      webViewMode: this.webViewMode,
      hasNativeInterface: this.hasNativeInterface,
      userAgent: navigator.userAgent.substring(0, 50),
      capacitor: !!window.Capacitor,
      touchDevice: 'ontouchstart' in window
    });
  }

  /**
   * Initialize captcha system with WebView-specific implementation
   */
  async initialize(config = {}) {
    console.log('🚀 Initializing WebView reCAPTCHA with config:', {
      ...config,
      webSiteKey: config.webSiteKey ? '***' + config.webSiteKey.slice(-4) : 'missing',
      mobileSiteKey: config.mobileSiteKey ? '***' + config.mobileSiteKey.slice(-4) : 'missing',
      webViewMode: this.webViewMode
    });

    const {
      onLoad = null,
      onComplete = null,
      onExpired = null,
    } = config;

    this.onLoadCallback = onLoad;
    this.onCompleteCallback = onComplete;
    this.onExpiredCallback = onExpired;

    // Determine the correct site key based on platform
    let siteKey;
    if (this.webViewMode || this.isActuallyMobile) {
      siteKey = config.mobileSiteKey || process.env.REACT_APP_RECAPTCHA_MOBILE_SITE_KEY;
      console.log('📱 Using mobile reCAPTCHA key for Android WebView');
    } else {
      siteKey = config.webSiteKey || process.env.REACT_APP_RECAPTCHA_WEB_SITE_KEY;
      console.log('🌐 Using web reCAPTCHA key for web platform');
    }

    if (!siteKey) {
      throw new Error('reCAPTCHA site key not configured for platform');
    }

    // WebView-optimized reCAPTCHA initialization
    const size = this.webViewMode ? 'compact' : (config.size || 'normal');
    return await this.initializeWebViewCaptcha(siteKey, config.theme || 'light', size);
  }

  /**
   * Initialize WebView-optimized reCAPTCHA with enhanced error handling
   */
  async initializeWebViewCaptcha(siteKey, theme, size) {
    return new Promise((resolve, reject) => {
      if (window.grecaptcha) {
        this.isLoaded = true;
        if (this.onLoadCallback) this.onLoadCallback();
        resolve(true);
        return;
      }

      // Enhanced logging for WebView debugging
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.logMessage('Loading reCAPTCHA API for WebView integration');
      }

      // Create script element with WebView-optimized settings
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onWebViewCaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      // Global callback for WebView environment
      window.onWebViewCaptchaLoad = () => {
        this.isLoaded = true;
        console.log('✅ WebView reCAPTCHA API loaded successfully');
        
        // Setup WebView-specific response handler
        this.setupWebViewResponseHandler();
        
        if (this.hasNativeInterface) {
          window.RecaptchaInterface.logMessage('WebView reCAPTCHA API loaded and configured');
        }
        
        if (this.onLoadCallback) this.onLoadCallback();
        resolve(true);
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load WebView reCAPTCHA script:', error);
        
        if (this.hasNativeInterface) {
          window.RecaptchaInterface.onRecaptchaError('WebView script load failed: ' + error.toString());
        }
        
        reject(new Error('Failed to load WebView reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Setup WebView-specific response handler for token extraction
   */
  setupWebViewResponseHandler() {
    // Override URL handling for WebView token extraction
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    const handleUrlChange = (url) => {
      if (url && url.includes('recaptcha-token=')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const token = urlParams.get('recaptcha-token');
        
        if (token && this.hasNativeInterface) {
          window.RecaptchaInterface.onRecaptchaSuccess(token);
          console.log('✅ reCAPTCHA token extracted from WebView URL');
        }
      }
    };

    // Monitor URL changes in WebView
    history.pushState = function(state, title, url) {
      handleUrlChange(url);
      return originalPushState.apply(history, arguments);
    };

    history.replaceState = function(state, title, url) {
      handleUrlChange(url);
      return originalReplaceState.apply(history, arguments);
    };

    // Monitor hash changes for token extraction
    window.addEventListener('hashchange', (event) => {
      handleUrlChange(event.newURL);
    });

    console.log('🔧 WebView response handler configured');
  }

  /**
   * Render captcha widget with WebView-specific optimizations
   */
  render(container, config = {}) {
    console.log('🎨 Rendering WebView reCAPTCHA:', {
      isLoaded: this.isLoaded,
      webViewMode: this.webViewMode,
      actuallyMobile: this.isActuallyMobile,
      hasNativeInterface: this.hasNativeInterface,
      platform: this.platform,
      containerExists: !!container
    });

    if (!this.isLoaded) {
      console.error('❌ WebView Captcha not initialized');
      throw new Error('WebView Captcha not initialized');
    }

    if (!container) {
      console.error('❌ No container provided for WebView reCAPTCHA');
      throw new Error('Container element is required for WebView reCAPTCHA');
    }

    return this.renderWebViewCaptcha(container, config);
  }

  /**
   * Render WebView-optimized reCAPTCHA with token extraction
   */
  renderWebViewCaptcha(container, config) {
    const {
      sitekey,
      theme = 'light',
      size = this.webViewMode ? 'compact' : 'normal',
      callback,
      'expired-callback': expiredCallback
    } = config;

    console.log('🎨 Rendering WebView reCAPTCHA widget:', { 
      theme, 
      size, 
      webViewMode: this.webViewMode,
      sitekey: sitekey ? '***' + sitekey.slice(-4) : 'missing' 
    });

    if (!window.grecaptcha) {
      throw new Error('WebView reCAPTCHA API not loaded');
    }

    try {
      // WebView-enhanced callback with URL token extraction
      const webViewCallback = (response) => {
        console.log('✅ WebView reCAPTCHA completed successfully');
        
        // Extract token from WebView response
        if (this.webViewMode && response) {
          // In WebView, we might need to handle response differently
          const tokenData = {
            token: response,
            timestamp: Date.now(),
            platform: 'android-webview'
          };
          
          // Notify native interface with enhanced data
          if (this.hasNativeInterface) {
            window.RecaptchaInterface.onRecaptchaSuccess(response);
            window.RecaptchaInterface.logMessage('WebView token extracted: ' + response.substring(0, 20) + '...');
          }
          
          // Store for potential URL extraction
          window.lastRecaptchaToken = response;
        }
        
        if (this.onCompleteCallback) {
          this.onCompleteCallback(response);
        }
        
        if (callback) {
          callback(response);
        }
      };

      const webViewExpiredCallback = () => {
        console.log('⚠️ WebView reCAPTCHA expired');
        
        if (this.hasNativeInterface) {
          window.RecaptchaInterface.onRecaptchaExpired();
        }
        
        if (this.onExpiredCallback) {
          this.onExpiredCallback();
        }
        
        if (expiredCallback) {
          expiredCallback();
        }
      };

      // WebView-enhanced error callback
      const webViewErrorCallback = (error) => {
        console.error('❌ WebView reCAPTCHA error:', error);
        
        if (this.hasNativeInterface) {
          window.RecaptchaInterface.onRecaptchaError('WebView error: ' + error.toString());
        }
      };

      // Render with WebView-specific configuration
      this.widgetId = window.grecaptcha.render(container, {
        sitekey,
        theme,
        size,
        callback: webViewCallback,
        'expired-callback': webViewExpiredCallback,
        'error-callback': webViewErrorCallback,
        // WebView-specific parameters
        'hl': navigator.language || 'en',
        'tabindex': 0
      });

      console.log('✅ WebView reCAPTCHA widget rendered with ID:', this.widgetId);
      
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.logMessage('WebView reCAPTCHA widget rendered and configured');
      }

      return this.widgetId;

    } catch (error) {
      console.error('❌ WebView reCAPTCHA render error:', error);
      
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.onRecaptchaError('WebView render error: ' + error.toString());
      }
      
      throw error;
    }
  }

  /**
   * Get reCAPTCHA response token from rendered widget
   */
  getResponse() {
    if (!this.isLoaded || !this.widgetId) {
      throw new Error('reCAPTCHA not initialized or rendered');
    }
    
    try {
      const response = window.grecaptcha.getResponse(this.widgetId);
      
      if (this.hasNativeInterface && response) {
        window.RecaptchaInterface.logMessage('reCAPTCHA response retrieved: ' + response.substring(0, 20) + '...');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to get reCAPTCHA response:', error);
      
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.onRecaptchaError('Failed to get response: ' + error.toString());
      }
      
      return '';
    }
  }

  /**
   * Reset reCAPTCHA widget
   */
  reset() {
    if (!this.isLoaded || !this.widgetId) {
      return;
    }
    
    try {
      window.grecaptcha.reset(this.widgetId);
      
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.logMessage('reCAPTCHA widget reset');
      }
      
      console.log('🔄 reCAPTCHA widget reset');
    } catch (error) {
      console.error('Failed to reset reCAPTCHA:', error);
      
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.onRecaptchaError('Failed to reset: ' + error.toString());
      }
    }
  }

  /**
   * Execute invisible reCAPTCHA
   */
  execute() {
    if (!this.isLoaded || !this.widgetId) {
      throw new Error('reCAPTCHA not initialized or rendered');
    }
    
    try {
      window.grecaptcha.execute(this.widgetId);
      
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.logMessage('reCAPTCHA executed');
      }
      
      console.log('▶️ reCAPTCHA executed');
    } catch (error) {
      console.error('Failed to execute reCAPTCHA:', error);
      
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.onRecaptchaError('Failed to execute: ' + error.toString());
      }
      
      throw error;
    }
  }
}

// Export singleton instance
const mobileCaptcha = new MobileCaptchaManager();
export default mobileCaptcha;