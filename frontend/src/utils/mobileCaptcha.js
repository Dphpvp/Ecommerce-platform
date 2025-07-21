/**
 * Enhanced mobile reCAPTCHA utility for Android WebView
 * Implements hybrid approach with native Android integration
 */
import platformDetection from './platformDetection.js';

class MobileCaptchaManager {
  constructor() {
    this.isLoaded = false;
    this.widgetId = null;
    this.hasNativeInterface = false;
    
    // Enhanced platform detection
    try {
      this.isMobile = platformDetection.isMobile;
      this.platform = platformDetection.platform;
      
      // Detect Android WebView with native interface
      const isCapacitor = !!window.Capacitor;
      const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      this.isActuallyMobile = isCapacitor || isMobileUA || (isTouchDevice && (isAndroid || isIOS));
      this.actualPlatform = isAndroid ? 'android' : isIOS ? 'ios' : 'mobile';
      
      // Check for native RecaptchaInterface
      this.hasNativeInterface = !!(window.RecaptchaInterface);
      
    } catch (error) {
      console.warn('Platform detection failed, using safe fallback', error);
      this.isMobile = false;
      this.platform = 'web';
      this.isActuallyMobile = false;
      this.hasNativeInterface = false;
    }
    
    this.onLoadCallback = null;
    this.onCompleteCallback = null;
    this.onExpiredCallback = null;
    
    console.log('🔧 Enhanced MobileCaptcha initialized:', {
      platform: this.platform,
      actuallyMobile: this.isActuallyMobile,
      actualPlatform: this.actualPlatform,
      hasNativeInterface: this.hasNativeInterface,
      userAgent: navigator.userAgent.substring(0, 50),
      capacitor: !!window.Capacitor,
      touchDevice: 'ontouchstart' in window
    });
  }

  /**
   * Initialize captcha system with enhanced Android support
   */
  async initialize(config = {}) {
    console.log('🚀 Initializing enhanced reCAPTCHA with config:', {
      ...config,
      webSiteKey: config.webSiteKey ? '***' + config.webSiteKey.slice(-4) : 'missing',
      mobileSiteKey: config.mobileSiteKey ? '***' + config.mobileSiteKey.slice(-4) : 'missing'
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
    if (this.isActuallyMobile) {
      siteKey = config.mobileSiteKey || process.env.REACT_APP_RECAPTCHA_MOBILE_SITE_KEY;
      console.log('📱 Using mobile reCAPTCHA key for Android WebView');
    } else {
      siteKey = config.webSiteKey || process.env.REACT_APP_RECAPTCHA_WEB_SITE_KEY;
      console.log('🌐 Using web reCAPTCHA key for web platform');
    }

    if (!siteKey) {
      throw new Error('reCAPTCHA site key not configured for platform');
    }

    // Enhanced web reCAPTCHA with Android optimizations
    const size = this.isActuallyMobile ? 'compact' : (config.size || 'normal');
    return await this.initializeWebCaptcha(siteKey, config.theme || 'light', size);
  }

  /**
   * Initialize web reCAPTCHA with Android optimizations
   */
  async initializeWebCaptcha(siteKey, theme, size) {
    return new Promise((resolve, reject) => {
      if (window.grecaptcha) {
        this.isLoaded = true;
        if (this.onLoadCallback) this.onLoadCallback();
        resolve(true);
        return;
      }

      // Log to native interface if available
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.logMessage('Loading reCAPTCHA script for Android WebView');
      }

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onMobileCaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;

      window.onMobileCaptchaLoad = () => {
        this.isLoaded = true;
        console.log('✅ reCAPTCHA script loaded successfully');
        
        if (this.hasNativeInterface) {
          window.RecaptchaInterface.logMessage('reCAPTCHA script loaded successfully');
        }
        
        if (this.onLoadCallback) this.onLoadCallback();
        resolve(true);
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load reCAPTCHA script:', error);
        
        if (this.hasNativeInterface) {
          window.RecaptchaInterface.onRecaptchaError('Failed to load reCAPTCHA script: ' + error.toString());
        }
        
        reject(new Error('Failed to load reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Render captcha widget with enhanced Android support
   */
  render(container, config = {}) {
    console.log('🎨 Rendering enhanced reCAPTCHA:', {
      isLoaded: this.isLoaded,
      actuallyMobile: this.isActuallyMobile,
      hasNativeInterface: this.hasNativeInterface,
      platform: this.platform,
      containerExists: !!container
    });

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
   * Render web reCAPTCHA with Android optimizations
   */
  renderWebCaptcha(container, config) {
    const {
      sitekey,
      theme = 'light',
      size = this.isActuallyMobile ? 'compact' : 'normal',
      callback,
      'expired-callback': expiredCallback
    } = config;

    console.log('🎨 Rendering reCAPTCHA widget:', { theme, size, sitekey: sitekey ? '***' + sitekey.slice(-4) : 'missing' });

    if (!window.grecaptcha) {
      throw new Error('reCAPTCHA not loaded');
    }

    try {
      // Enhanced callback with native interface integration
      const enhancedCallback = (response) => {
        console.log('✅ reCAPTCHA completed successfully');
        
        // Notify native interface
        if (this.hasNativeInterface && response) {
          window.RecaptchaInterface.onRecaptchaSuccess(response);
        }
        
        if (this.onCompleteCallback) {
          this.onCompleteCallback(response);
        }
        
        if (callback) {
          callback(response);
        }
      };

      const enhancedExpiredCallback = () => {
        console.log('⚠️ reCAPTCHA expired');
        
        // Notify native interface
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

      // Enhanced error callback
      const enhancedErrorCallback = (error) => {
        console.error('❌ reCAPTCHA error:', error);
        
        // Notify native interface
        if (this.hasNativeInterface) {
          window.RecaptchaInterface.onRecaptchaError(error.toString());
        }
      };

      this.widgetId = window.grecaptcha.render(container, {
        sitekey,
        theme,
        size,
        callback: enhancedCallback,
        'expired-callback': enhancedExpiredCallback,
        'error-callback': enhancedErrorCallback
      });

      console.log('✅ reCAPTCHA widget rendered with ID:', this.widgetId);
      
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.logMessage('reCAPTCHA widget rendered successfully');
      }

      return this.widgetId;

    } catch (error) {
      console.error('❌ reCAPTCHA render error:', error);
      
      if (this.hasNativeInterface) {
        window.RecaptchaInterface.onRecaptchaError('Render error: ' + error.toString());
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