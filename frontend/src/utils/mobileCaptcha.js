/**
 * Mobile-compatible captcha utility
 * Handles web reCAPTCHA optimized for Android WebView
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
      
      // Always prefer web reCAPTCHA for consistency across platforms
      // Only use mobile captcha as emergency fallback
      this.isMobile = false;
      this.platform = 'web';
      
      // Store mobile detection for enhanced WebView configuration
      this.isActuallyMobile = isCapacitor || isMobileUA || (isTouchDevice && (isAndroid || isIOS));
      this.actualPlatform = isAndroid ? 'android' : isIOS ? 'ios' : 'mobile';
      
    } catch (error) {
      console.warn('Platform detection failed, using safe fallback', error);
      // Safe fallback: Use web reCAPTCHA by default
      this.isMobile = false;
      this.platform = 'web';
    }
    
    this.onLoadCallback = null;
    this.onCompleteCallback = null;
    this.onExpiredCallback = null;
    
    console.log('🔧 MobileCaptcha initialized for consistent reCAPTCHA:', {
      forcedPlatform: this.platform,
      actuallyMobile: this.isActuallyMobile,
      actualPlatform: this.actualPlatform,
      userAgent: navigator.userAgent.substring(0, 50),
      capacitor: !!window.Capacitor,
      touchDevice: 'ontouchstart' in window
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

    // Determine the correct site key based on platform
    let siteKey;
    if (this.isActuallyMobile) {
      // Use mobile-specific reCAPTCHA key for Android WebView
      siteKey = config.mobileSiteKey || process.env.REACT_APP_RECAPTCHA_MOBILE_SITE_KEY;
      console.log('📱 Using mobile reCAPTCHA key for Android WebView');
    } else {
      // Use web-specific reCAPTCHA key for web deployment
      siteKey = config.webSiteKey || process.env.REACT_APP_RECAPTCHA_WEB_SITE_KEY;
      console.log('🌐 Using web reCAPTCHA key for web platform');
    }

    if (!siteKey) {
      throw new Error('reCAPTCHA site key not configured for platform');
    }

    // Use web reCAPTCHA optimized for mobile
    const size = this.isActuallyMobile ? 'compact' : (config.size || 'normal');
    return await this.initializeWebCaptcha(siteKey, config.theme || 'light', size);
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
   * Render captcha widget - web reCAPTCHA optimized for mobile
   */
  render(container, config = {}) {
    console.log('🎨 Rendering reCAPTCHA:', {
      isLoaded: this.isLoaded,
      actuallyMobile: this.isActuallyMobile,
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

    // Use web reCAPTCHA optimized for mobile
    console.log('🌐 Rendering web reCAPTCHA for platform:', this.isActuallyMobile ? 'mobile' : 'web');
    return this.renderWebCaptcha(container, config);
  }

  /**
   * Get reCAPTCHA response token from rendered widget
   */
  getResponse() {
    if (!this.isLoaded || !this.widgetId) {
      throw new Error('reCAPTCHA not initialized or rendered');
    }
    
    try {
      return window.grecaptcha.getResponse(this.widgetId);
    } catch (error) {
      console.error('Failed to get reCAPTCHA response:', error);
      return '';
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
    console.log('📱 Rendering enhanced mobile captcha widget');
    
    const { callback } = config;
    
    // Enhanced captcha types for better security
    const captchaTypes = ['math', 'pattern', 'sequence'];
    const selectedType = captchaTypes[Math.floor(Math.random() * captchaTypes.length)];
    
    // Check if we're on Android for special handling
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isCapacitor = !!window.Capacitor;
    const inputMode = isAndroid ? 'tel' : 'number';
    const androidClass = isAndroid ? 'android-input' : '';

    let captchaData = this._generateCaptchaChallenge(selectedType);

    container.innerHTML = `
      <div class="mobile-captcha enhanced-captcha ${isAndroid ? 'android-captcha' : ''} ${isCapacitor ? 'capacitor-captcha' : ''}">
        <div class="captcha-header">
          <div class="security-icon">🛡️</div>
          <span class="captcha-title">Security Verification</span>
        </div>
        <div class="captcha-question">
          <label for="captcha-input">${captchaData.question}</label>
          <input 
            type="${inputMode}" 
            id="captcha-input" 
            class="captcha-input ${androidClass}" 
            placeholder="${captchaData.placeholder}"
            min="${captchaData.min || 0}"
            max="${captchaData.max || 50}"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
          <div class="captcha-hint">${captchaData.hint}</div>
        </div>
        <div class="captcha-feedback"></div>
        <div class="captcha-actions">
          <button type="button" class="refresh-captcha" onclick="this.parentElement.parentElement.querySelector('.captcha-feedback').innerHTML = ''; this.parentElement.parentElement.parentElement.refresh();">
            🔄 New Challenge
          </button>
        </div>
      </div>
    `;

    const input = container.querySelector('#captcha-input');
    const feedback = container.querySelector('.captcha-feedback');
    const refreshBtn = container.querySelector('.refresh-captcha');
    
    // Add refresh functionality
    container.refresh = () => {
      this.renderMobileCaptcha(container, config);
    };
    
    // Enhanced input handling with better UX
    if (isAndroid) {
      this._setupEnhancedAndroidInputHandling(input, feedback, captchaData, callback);
    } else {
      this._setupEnhancedInputHandling(input, feedback, captchaData, callback);
    }

    // Store the correct answer for verification
    this.currentAnswer = captchaData.answer;
    this.captchaType = selectedType;
    this.widgetId = 'mobile-captcha-' + Date.now();
    
    return this.widgetId;
  }

  /**
   * Generate different types of captcha challenges
   */
  _generateCaptchaChallenge(type) {
    switch (type) {
      case 'math':
        const num1 = Math.floor(Math.random() * 15) + 1;
        const num2 = Math.floor(Math.random() * 15) + 1;
        const operations = ['+', '-', '×'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        let answer, question;
        switch (operation) {
          case '+':
            answer = num1 + num2;
            question = `What is ${num1} + ${num2}?`;
            break;
          case '-':
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            answer = larger - smaller;
            question = `What is ${larger} - ${smaller}?`;
            break;
          case '×':
            const small1 = Math.floor(Math.random() * 5) + 1;
            const small2 = Math.floor(Math.random() * 5) + 1;
            answer = small1 * small2;
            question = `What is ${small1} × ${small2}?`;
            break;
        }
        
        return {
          question,
          answer,
          placeholder: 'Enter the number',
          hint: 'Solve the math problem above',
          min: 0,
          max: 50
        };
        
      case 'pattern':
        const sequences = [
          { seq: [2, 4, 6, 8], next: 10, question: 'Next number in sequence: 2, 4, 6, 8, ?' },
          { seq: [1, 3, 5, 7], next: 9, question: 'Next number in sequence: 1, 3, 5, 7, ?' },
          { seq: [5, 10, 15, 20], next: 25, question: 'Next number in sequence: 5, 10, 15, 20, ?' },
          { seq: [3, 6, 9, 12], next: 15, question: 'Next number in sequence: 3, 6, 9, 12, ?' }
        ];
        const pattern = sequences[Math.floor(Math.random() * sequences.length)];
        
        return {
          question: pattern.question,
          answer: pattern.next,
          placeholder: 'Next number',
          hint: 'Look for the pattern in the sequence',
          min: 0,
          max: 100
        };
        
      case 'sequence':
        const counts = [
          { question: 'How many letters are in "MOBILE"?', answer: 6 },
          { question: 'How many vowels in "SECURITY"?', answer: 4 },
          { question: 'How many digits in "2024"?', answer: 4 },
          { question: 'How many words in "I am human"?', answer: 3 }
        ];
        const count = counts[Math.floor(Math.random() * counts.length)];
        
        return {
          question: count.question,
          answer: count.answer,
          placeholder: 'Count',
          hint: 'Count carefully',
          min: 0,
          max: 20
        };
        
      default:
        return this._generateCaptchaChallenge('math');
    }
  }

  /**
   * Setup enhanced Android-specific input handling
   */
  _setupEnhancedAndroidInputHandling(input, feedback, captchaData, callback) {
    let inputTimeout;
    let attempts = 0;
    const maxAttempts = 3;
    
    // Handle Android keyboard behavior with better UX
    input.addEventListener('focus', () => {
      // Prevent viewport scaling on Android
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const originalContent = viewport.content;
        viewport.content = originalContent + ', user-scalable=no, maximum-scale=1.0';
        
        // Restore after focus lost
        const restoreViewport = () => {
          viewport.content = originalContent;
          input.removeEventListener('blur', restoreViewport);
        };
        input.addEventListener('blur', restoreViewport);
      }
      
      // Enhanced scrolling for Android with haptic feedback
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add haptic feedback if available
        if (window.Capacitor?.Plugins?.Haptics) {
          window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' });
        }
      }, 200);
      
      // Clear any previous feedback
      feedback.innerHTML = '';
      feedback.className = 'captcha-feedback';
    });
    
    // Enhanced input validation with better feedback
    input.addEventListener('input', (e) => {
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(() => {
        attempts++;
        this._validateEnhancedInput(e, feedback, captchaData, callback, attempts, maxAttempts);
      }, 300);
    });
    
    // Handle Android "Done" button with immediate validation
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        clearTimeout(inputTimeout);
        attempts++;
        this._validateEnhancedInput({ target: input }, feedback, captchaData, callback, attempts, maxAttempts);
        input.blur();
      }
    });
    
    // Add visual feedback for Android users
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
      input.parentElement.classList.remove('focused');
    });
  }

  /**
   * Setup enhanced standard input handling
   */
  _setupEnhancedInputHandling(input, feedback, captchaData, callback) {
    let attempts = 0;
    const maxAttempts = 3;
    
    input.addEventListener('input', (e) => {
      attempts++;
      this._validateEnhancedInput(e, feedback, captchaData, callback, attempts, maxAttempts);
    });
    
    // Add visual feedback
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
      feedback.innerHTML = '';
    });
    
    input.addEventListener('blur', () => {
      input.parentElement.classList.remove('focused');
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
   * Enhanced validation with better UX
   */
  _validateEnhancedInput(e, feedback, captchaData, callback, attempts, maxAttempts) {
    const userAnswer = parseInt(e.target.value);
    const isCorrect = userAnswer === captchaData.answer;
    
    if (isCorrect) {
      feedback.innerHTML = '<span class="success-msg">✓ Correct! Security verified</span>';
      feedback.className = 'captcha-feedback success';
      e.target.style.borderColor = '#4CAF50';
      e.target.style.backgroundColor = '#f8fff8';
      
      // Add success haptic feedback if available
      if (window.Capacitor?.Plugins?.Haptics) {
        window.Capacitor.Plugins.Haptics.notification({ type: 'SUCCESS' });
      }
      
      // Generate enhanced mobile captcha token
      const mobileToken = this.generateEnhancedMobileToken(captchaData, attempts);
      if (callback) callback(mobileToken);
      if (this.onCompleteCallback) this.onCompleteCallback(mobileToken);
      
      // Disable input after success
      e.target.disabled = true;
      
    } else if (e.target.value && !isCorrect) {
      const remainingAttempts = maxAttempts - attempts;
      
      if (remainingAttempts > 0) {
        feedback.innerHTML = `<span class="error-msg">✗ Incorrect. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining</span>`;
        feedback.className = 'captcha-feedback error';
        e.target.style.borderColor = '#f44336';
        e.target.style.backgroundColor = '#fff8f8';
        
        // Add error haptic feedback if available
        if (window.Capacitor?.Plugins?.Haptics) {
          window.Capacitor.Plugins.Haptics.impact({ style: 'MEDIUM' });
        }
      } else {
        feedback.innerHTML = '<span class="error-msg">✗ Too many attempts. Generating new challenge...</span>';
        feedback.className = 'captcha-feedback error';
        
        // Auto-refresh after max attempts
        setTimeout(() => {
          const container = e.target.closest('.mobile-captcha').parentElement;
          if (container && container.refresh) {
            container.refresh();
          }
        }, 2000);
      }
    } else {
      feedback.innerHTML = '';
      feedback.className = 'captcha-feedback';
      e.target.style.borderColor = '';
      e.target.style.backgroundColor = '';
    }
  }

  /**
   * Legacy validation for backward compatibility
   */
  _validateInput(e, feedback, correctAnswer, num1, num2, callback) {
    const captchaData = { answer: correctAnswer, question: `${num1} + ${num2}` };
    this._validateEnhancedInput(e, feedback, captchaData, callback, 1, 3);
  }

  /**
   * Generate enhanced mobile captcha token
   */
  generateEnhancedMobileToken(captchaData, attempts) {
    const timestamp = Date.now();
    const data = { 
      type: this.captchaType || 'math',
      answer: captchaData.answer, 
      timestamp, 
      platform: 'mobile',
      attempts,
      userAgent: navigator.userAgent.substring(0, 50),
      version: '2.0'
    };
    
    // Use safer encoding for Android
    try {
      return btoa(JSON.stringify(data));
    } catch (error) {
      console.warn('🤖 btoa failed on Android, using fallback encoding');
      return this._androidSafeEncode(data);
    }
  }

  /**
   * Legacy mobile token generation
   */
  generateMobileToken(num1, num2, answer) {
    const timestamp = Date.now();
    const data = { num1, num2, answer, timestamp, platform: 'mobile', version: '1.0' };
    
    try {
      return btoa(JSON.stringify(data));
    } catch (error) {
      console.warn('🤖 btoa failed on Android, using fallback encoding');
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