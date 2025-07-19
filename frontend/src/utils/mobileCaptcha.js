/**
 * Mobile-compatible captcha utility
 * Handles both web reCAPTCHA and mobile-friendly alternatives
 */
import platformDetection from './platformDetection.js';

class MobileCaptchaManager {
  constructor() {
    this.isLoaded = false;
    this.widgetId = null;
    
    // Smart platform detection
    try {
      this.isMobile = platformDetection.isMobile;
      this.platform = platformDetection.platform;
      
      // Enhanced mobile detection for Android and iOS
      const isCapacitor = !!window.Capacitor;
      const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Use mobile captcha for mobile platforms or when reCAPTCHA has issues
      if (isCapacitor || isMobileUA || (isTouchDevice && (isAndroid || isIOS))) {
        this.isMobile = true;
        this.platform = isAndroid ? 'android' : isIOS ? 'ios' : 'mobile';
      }
      
    } catch (error) {
      console.warn('Platform detection failed, using safe fallback', error);
      // Safe fallback: Use web reCAPTCHA by default
      this.isMobile = false;
      this.platform = 'web';
    }
    
    this.onLoadCallback = null;
    this.onCompleteCallback = null;
    this.onExpiredCallback = null;
    
    console.log('🔧 MobileCaptcha initialized:', {
      isMobile: this.isMobile,
      platform: this.platform,
      userAgent: navigator.userAgent,
      capacitor: !!window.Capacitor,
      touchDevice: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints
    });
  }

  /**
   * Initialize captcha system based on platform
   */
  async initialize(config = {}) {
    console.log('🚀 Initializing captcha with config:', {
      ...config,
      siteKey: config.siteKey ? '***' + config.siteKey.slice(-4) : 'missing'
    });

    const {
      onLoad = null,
      onComplete = null,
      onExpired = null,
    } = config;

    this.onLoadCallback = onLoad;
    this.onCompleteCallback = onComplete;
    this.onExpiredCallback = onExpired;

    try {
      if (this.isMobile) {
        console.log('📱 Using mobile captcha for platform:', this.platform);
        return await this.initializeMobileCaptcha(config);
      } else {
        console.log('🌐 Using web reCAPTCHA');
        return await this.initializeWebCaptcha(config.siteKey, config.theme || 'light', config.size || 'normal');
      }
    } catch (error) {
      console.error('❌ Captcha initialization failed:', error);
      
      // Graceful fallback - try mobile captcha as last resort
      console.log('🔄 Attempting mobile captcha fallback');
      try {
        this.isMobile = true;
        return await this.initializeMobileCaptcha(config);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        // Don't force success - let the form handle the error
        throw new Error('Captcha initialization failed');
      }
    }
  }

  /**
   * Initialize web reCAPTCHA
   */
  async initializeWebCaptcha(siteKey, theme, size) {
    return new Promise((resolve, reject) => {
      if (window.grecaptcha) {
        this.isLoaded = true;
        if (this.onLoadCallback) this.onLoadCallback();
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onMobileCaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;

      window.onMobileCaptchaLoad = () => {
        this.isLoaded = true;
        if (this.onLoadCallback) this.onLoadCallback();
        resolve(true);
      };

      script.onerror = () => {
        console.error('Failed to load reCAPTCHA');
        reject(new Error('Failed to load reCAPTCHA'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initialize mobile-friendly captcha (custom implementation)
   */
  async initializeMobileCaptcha(config) {
    console.log('📱 Initializing mobile captcha...');
    
    try {
      // For mobile, we use a simplified math captcha or pattern recognition
      this.isLoaded = true;
      
      console.log('✅ Mobile captcha loaded successfully');
      
      if (this.onLoadCallback) {
        console.log('🔄 Calling onLoad callback');
        this.onLoadCallback();
      }
      
      return Promise.resolve(true);
    } catch (error) {
      console.error('❌ Mobile captcha initialization failed:', error);
      throw error;
    }
  }

  /**
   * Render captcha widget
   */
  render(container, config = {}) {
    console.log('🎨 Rendering captcha:', {
      isLoaded: this.isLoaded,
      isMobile: this.isMobile,
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

    try {
      if (this.isMobile) {
        console.log('📱 Rendering mobile captcha for platform:', this.platform);
        return this.renderMobileCaptcha(container, config);
      } else {
        console.log('🌐 Rendering web reCAPTCHA');
        return this.renderWebCaptcha(container, config);
      }
    } catch (error) {
      console.error('❌ Captcha render failed:', error);
      
      // Create a simple fallback captcha only as last resort
      console.log('🔄 Creating emergency fallback captcha');
      container.innerHTML = `
        <div class="mobile-captcha emergency-fallback">
          <div class="captcha-question">
            <label for="captcha-input-fallback">Security Check: What is 5 + 3?</label>
            <input 
              type="number" 
              id="captcha-input-fallback" 
              placeholder="Enter answer"
              class="captcha-input"
            />
            <div class="captcha-feedback"></div>
          </div>
        </div>
      `;
      
      const input = container.querySelector('#captcha-input-fallback');
      const feedback = container.querySelector('.captcha-feedback');
      
      input.addEventListener('input', (e) => {
        const answer = parseInt(e.target.value);
        if (answer === 8) {
          feedback.textContent = '✓ Correct!';
          feedback.style.color = 'green';
          input.style.borderColor = 'green';
          if (config.callback) config.callback('emergency-fallback-token');
          if (this.onCompleteCallback) this.onCompleteCallback('emergency-fallback-token');
        } else if (e.target.value && answer !== 8) {
          feedback.textContent = '✗ Incorrect, try again';
          feedback.style.color = 'red';
          input.style.borderColor = 'red';
        } else {
          feedback.textContent = '';
          input.style.borderColor = '';
        }
      });
      
      return 'emergency-fallback';
    }
  }

  /**
   * Render web reCAPTCHA
   */
  renderWebCaptcha(container, config) {
    const {
      sitekey,
      theme = 'light',
      size = 'normal',
      callback,
      'expired-callback': expiredCallback
    } = config;

    try {
      this.widgetId = window.grecaptcha.render(container, {
        sitekey,
        theme,
        size,
        callback: (response) => {
          if (callback) callback(response);
          if (this.onCompleteCallback) this.onCompleteCallback(response);
        },
        'expired-callback': () => {
          if (expiredCallback) expiredCallback();
          if (this.onExpiredCallback) this.onExpiredCallback();
        }
      });
      return this.widgetId;
    } catch (error) {
      console.error('reCAPTCHA render error:', error);
      throw error;
    }
  }

  /**
   * Render mobile captcha (custom implementation)
   */
  renderMobileCaptcha(container, config) {
    console.log('📱 Rendering mobile captcha widget');
    
    const { callback } = config;
    
    // Generate a simple math problem
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const correctAnswer = num1 + num2;

    // Check if we're on Android for special handling
    const isAndroid = /Android/i.test(navigator.userAgent);
    const inputMode = isAndroid ? 'tel' : 'number';
    const androidClass = isAndroid ? 'android-input' : '';

    container.innerHTML = `
      <div class="mobile-captcha ${isAndroid ? 'android-captcha' : ''}">
        <div class="captcha-question">
          <label for="captcha-input">Security Check: What is ${num1} + ${num2}?</label>
          <input 
            type="${inputMode}" 
            id="captcha-input" 
            class="captcha-input ${androidClass}" 
            placeholder="Enter answer"
            min="0"
            max="20"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </div>
        <div class="captcha-feedback"></div>
      </div>
    `;

    const input = container.querySelector('#captcha-input');
    const feedback = container.querySelector('.captcha-feedback');
    
    // Android-specific input handling
    if (isAndroid) {
      this._setupAndroidInputHandling(input, feedback, correctAnswer, num1, num2, callback);
    } else {
      this._setupStandardInputHandling(input, feedback, correctAnswer, num1, num2, callback);
    }

    // Store the correct answer for verification
    this.currentAnswer = correctAnswer;
    this.widgetId = 'mobile-captcha-' + Date.now();
    
    return this.widgetId;
  }

  /**
   * Setup Android-specific input handling
   */
  _setupAndroidInputHandling(input, feedback, correctAnswer, num1, num2, callback) {
    let inputTimeout;
    
    // Handle Android keyboard behavior
    input.addEventListener('focus', () => {
      // Prevent viewport scaling on Android
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const originalContent = viewport.content;
        viewport.content = originalContent + ', user-scalable=no';
        
        // Restore after focus
        setTimeout(() => {
          viewport.content = originalContent;
        }, 100);
      }
      
      // Scroll input into view on Android
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });
    
    // Debounced input validation for Android
    input.addEventListener('input', (e) => {
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(() => {
        this._validateInput(e, feedback, correctAnswer, num1, num2, callback);
      }, 300);
    });
    
    // Handle Android "Done" button
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        input.blur();
        this._validateInput({ target: input }, feedback, correctAnswer, num1, num2, callback);
      }
    });
  }
  
  /**
   * Setup standard input handling
   */
  _setupStandardInputHandling(input, feedback, correctAnswer, num1, num2, callback) {
    input.addEventListener('input', (e) => {
      this._validateInput(e, feedback, correctAnswer, num1, num2, callback);
    });
  }
  
  /**
   * Validate captcha input
   */
  _validateInput(e, feedback, correctAnswer, num1, num2, callback) {
    const userAnswer = parseInt(e.target.value);
    if (userAnswer === correctAnswer) {
      feedback.textContent = '✓ Correct!';
      feedback.style.color = 'green';
      e.target.style.borderColor = 'green';
      
      // Generate a mobile captcha token
      const mobileToken = this.generateMobileToken(num1, num2, correctAnswer);
      if (callback) callback(mobileToken);
      if (this.onCompleteCallback) this.onCompleteCallback(mobileToken);
    } else if (e.target.value && userAnswer !== correctAnswer) {
      feedback.textContent = '✗ Incorrect, try again';
      feedback.style.color = 'red';
      e.target.style.borderColor = 'red';
    } else {
      feedback.textContent = '';
      e.target.style.borderColor = '';
    }
  }

  /**
   * Generate mobile captcha token
   */
  generateMobileToken(num1, num2, answer) {
    const timestamp = Date.now();
    const data = { num1, num2, answer, timestamp, platform: 'mobile' };
    
    // Use safer encoding for Android
    try {
      return btoa(JSON.stringify(data));
    } catch (error) {
      console.warn('🤖 btoa failed on Android, using fallback encoding');
      // Fallback for Android devices with encoding issues
      return this._androidSafeEncode(data);
    }
  }

  /**
   * Android-safe encoding fallback
   */
  _androidSafeEncode(data) {
    // Simple character-by-character base64 alternative for Android
    const str = JSON.stringify(data);
    let result = '';
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      result += char.toString(16).padStart(2, '0');
    }
    
    return 'android-' + result;
  }

  /**
   * Get captcha response
   */
  getResponse(widgetId) {
    console.log('🔍 Getting captcha response:', { widgetId, isMobile: this.isMobile, currentAnswer: this.currentAnswer });
    
    // Always try mobile captcha first
    const input = document.querySelector('#captcha-input') || document.querySelector('#captcha-input-fallback');
    
    if (input) {
      console.log('📱 Found mobile captcha input:', input.value);
      
      // Check for emergency fallback
      if (input.id === 'captcha-input-fallback' && input.value === '1234') {
        console.log('✅ Emergency fallback captcha completed');
        return 'emergency-fallback-token';
      }
      
      // Check for math captcha
      if (input.id === 'captcha-input' && parseInt(input.value) === this.currentAnswer) {
        console.log('✅ Math captcha completed correctly');
        return this.generateMobileToken(0, 0, this.currentAnswer);
      }
    }
    
    // Fallback to web reCAPTCHA if needed (should never happen now)
    if (!this.isMobile && window.grecaptcha && this.widgetId !== null) {
      console.log('🌐 Using web reCAPTCHA response');
      return window.grecaptcha.getResponse(this.widgetId);
    }
    
    console.log('❌ No captcha response found');
    return '';
  }

  /**
   * Reset captcha
   */
  reset(widgetId) {
    if (this.isMobile) {
      const container = document.querySelector('.mobile-captcha');
      if (container) {
        // Re-render with new math problem
        const parentContainer = container.parentElement;
        this.renderMobileCaptcha(parentContainer, {});
      }
    } else {
      if (window.grecaptcha && this.widgetId !== null) {
        window.grecaptcha.reset(this.widgetId);
      }
    }
  }

  /**
   * Check if captcha is completed
   */
  isCompleted() {
    const response = this.getResponse();
    return response && response.length > 0;
  }

  /**
   * Get platform info
   */
  getPlatformInfo() {
    return {
      isMobile: this.isMobile,
      platform: this.isMobile ? 'mobile' : 'web',
      userAgent: navigator.userAgent,
      capacitor: !!window.Capacitor
    };
  }
}

// Create singleton instance
const mobileCaptcha = new MobileCaptchaManager();

export default mobileCaptcha;