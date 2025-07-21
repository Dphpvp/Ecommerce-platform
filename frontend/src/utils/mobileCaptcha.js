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
   * Initialize captcha system - DISABLED for mobile devices
   */
  async initialize(config = {}) {
    console.log('🚀 Initializing captcha system:', {
      webViewMode: this.webViewMode,
      isActuallyMobile: this.isActuallyMobile,
      mobileBypass: this.webViewMode || this.isActuallyMobile
    });

    const {
      onLoad = null,
      onComplete = null,
      onExpired = null,
    } = config;

    this.onLoadCallback = onLoad;
    this.onCompleteCallback = onComplete;
    this.onExpiredCallback = onExpired;

    // BYPASS reCAPTCHA for mobile devices
    if (this.webViewMode || this.isActuallyMobile) {
      console.log('📱 BYPASSING reCAPTCHA for mobile device');
      this.isLoaded = true;
      if (this.onLoadCallback) this.onLoadCallback();
      return Promise.resolve(true);
    }

    // Only load reCAPTCHA for web platforms
    const siteKey = config.webSiteKey || process.env.REACT_APP_RECAPTCHA_WEB_SITE_KEY;
    console.log('🌐 Using web reCAPTCHA key for web platform');

    if (!siteKey) {
      throw new Error('reCAPTCHA site key not configured for web platform');
    }

    // Web-only reCAPTCHA initialization
    const size = config.size || 'normal';
    return await this.initializeWebCaptcha(siteKey, config.theme || 'light', size);
  }

  /**
   * Initialize web reCAPTCHA (web-only, not for mobile)
   */
  async initializeWebCaptcha(siteKey, theme, size) {
    return new Promise((resolve, reject) => {
      if (window.grecaptcha) {
        this.isLoaded = true;
        if (this.onLoadCallback) this.onLoadCallback();
        resolve(true);
        return;
      }

      // Create script element for web reCAPTCHA
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onWebCaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;

      // Global callback for web environment
      window.onWebCaptchaLoad = () => {
        this.isLoaded = true;
        console.log('✅ Web reCAPTCHA API loaded successfully');
        
        if (this.onLoadCallback) this.onLoadCallback();
        resolve(true);
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load web reCAPTCHA script:', error);
        reject(new Error('Failed to load web reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Setup WebView-specific response handler for token extraction
   */
  setupWebViewResponseHandler() {
    // Override URL handling for WebView token extraction
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
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
    window.history.pushState = function(state, title, url) {
      handleUrlChange(url);
      return originalPushState.apply(window.history, arguments);
    };

    window.history.replaceState = function(state, title, url) {
      handleUrlChange(url);
      return originalReplaceState.apply(window.history, arguments);
    };

    // Monitor hash changes for token extraction
    window.addEventListener('hashchange', (event) => {
      handleUrlChange(event.newURL);
    });

    console.log('🔧 WebView response handler configured');
  }

  /**
   * Render captcha widget - BYPASSED for mobile devices
   */
  render(container, config = {}) {
    console.log('🎨 Rendering captcha widget:', {
      isLoaded: this.isLoaded,
      webViewMode: this.webViewMode,
      actuallyMobile: this.isActuallyMobile,
      platform: this.platform,
      containerExists: !!container,
      mobileBypass: this.webViewMode || this.isActuallyMobile
    });

    // BYPASS reCAPTCHA rendering for mobile devices
    if (this.webViewMode || this.isActuallyMobile) {
      console.log('📱 BYPASSING reCAPTCHA render for mobile device');
      if (container) {
        container.innerHTML = '<div style="display:none;">Mobile reCAPTCHA bypassed</div>';
      }
      return 'mobile-bypass';
    }

    if (!this.isLoaded) {
      console.error('❌ Captcha not initialized');
      throw new Error('Captcha not initialized');
    }

    if (!container) {
      console.error('❌ No container provided');
      throw new Error('Container element is required');
    }

    return this.renderWebCaptcha(container, config);
  }

  /**
   * Render web reCAPTCHA (web-only, not for mobile)
   */
  renderWebCaptcha(container, config) {
    const {
      sitekey,
      theme = 'light',
      size = 'normal',
      callback,
      'expired-callback': expiredCallback
    } = config;

    console.log('🎨 Rendering web reCAPTCHA widget:', { 
      theme, 
      size, 
      sitekey: sitekey ? '***' + sitekey.slice(-4) : 'missing' 
    });

    if (!window.grecaptcha) {
      throw new Error('Web reCAPTCHA API not loaded');
    }

    // Check if container already has a reCAPTCHA widget
    if (container.hasChildNodes() && container.children.length > 0) {
      const existingWidget = container.querySelector('.g-recaptcha, [data-widget-id]');
      if (existingWidget) {
        console.log('🔄 Container already has reCAPTCHA widget, clearing it first');
        container.innerHTML = '';
      }
    }

    try {
      // Web callback
      const webCallback = (response) => {
        console.log('✅ Web reCAPTCHA completed successfully');
        
        if (this.onCompleteCallback) {
          this.onCompleteCallback(response);
        }
        
        if (callback) {
          callback(response);
        }
      };

      const webExpiredCallback = () => {
        console.log('⚠️ Web reCAPTCHA expired');
        
        if (this.onExpiredCallback) {
          this.onExpiredCallback();
        }
        
        if (expiredCallback) {
          expiredCallback();
        }
      };

      // Web error callback
      const webErrorCallback = (error) => {
        console.error('❌ Web reCAPTCHA error:', error);
      };

      // Render with web configuration
      this.widgetId = window.grecaptcha.render(container, {
        sitekey,
        theme,
        size,
        callback: webCallback,
        'expired-callback': webExpiredCallback,
        'error-callback': webErrorCallback
      });

      console.log('✅ Web reCAPTCHA widget rendered with ID:', this.widgetId);
      return this.widgetId;

    } catch (error) {
      console.error('❌ Web reCAPTCHA render error:', error);
      throw error;
    }
  }

  /**
   * Get reCAPTCHA response token - BYPASSED for mobile devices
   */
  getResponse() {
    // BYPASS reCAPTCHA for mobile devices
    if (this.webViewMode || this.isActuallyMobile) {
      console.log('📱 BYPASSING reCAPTCHA token for mobile device');
      return 'mobile-bypass-token';
    }

    if (!this.isLoaded || !this.widgetId) {
      throw new Error('reCAPTCHA not initialized or rendered');
    }
    
    try {
      const response = window.grecaptcha.getResponse(this.widgetId);
      return response;
    } catch (error) {
      console.error('Failed to get reCAPTCHA response:', error);
      return '';
    }
  }

  /**
   * Reset reCAPTCHA widget - BYPASSED for mobile devices
   */
  reset() {
    // BYPASS reCAPTCHA for mobile devices
    if (this.webViewMode || this.isActuallyMobile) {
      console.log('📱 BYPASSING reCAPTCHA reset for mobile device');
      return;
    }

    if (!this.isLoaded || !this.widgetId) {
      return;
    }
    
    try {
      window.grecaptcha.reset(this.widgetId);
      console.log('🔄 reCAPTCHA widget reset');
    } catch (error) {
      console.error('Failed to reset reCAPTCHA:', error);
    }
  }

  /**
   * Execute invisible reCAPTCHA - BYPASSED for mobile devices
   */
  execute() {
    // BYPASS reCAPTCHA for mobile devices
    if (this.webViewMode || this.isActuallyMobile) {
      console.log('📱 BYPASSING reCAPTCHA execute for mobile device');
      return;
    }

    if (!this.isLoaded || !this.widgetId) {
      throw new Error('reCAPTCHA not initialized or rendered');
    }
    
    try {
      window.grecaptcha.execute(this.widgetId);
      console.log('▶️ reCAPTCHA executed');
    } catch (error) {
      console.error('Failed to execute reCAPTCHA:', error);
      throw error;
    }
  }
}

// Export singleton instance
const mobileCaptcha = new MobileCaptchaManager();
export default mobileCaptcha;