/**
 * Mobile-compatible captcha utility
 * Handles both web reCAPTCHA and mobile-friendly alternatives
 */
import platformDetection from './platformDetection.js';

class MobileCaptchaManager {
  constructor() {
    this.isLoaded = false;
    this.widgetId = null;
    this.isMobile = platformDetection.isMobile;
    this.platform = platformDetection.platform;
    this.onLoadCallback = null;
    this.onCompleteCallback = null;
    this.onExpiredCallback = null;
  }

  /**
   * Initialize captcha system based on platform
   */
  async initialize(config = {}) {
    const {
      siteKey,
      onLoad = null,
      onComplete = null,
      onExpired = null,
      theme = 'light',
      size = 'normal'
    } = config;

    this.onLoadCallback = onLoad;
    this.onCompleteCallback = onComplete;
    this.onExpiredCallback = onExpired;

    if (this.isMobile) {
      return this.initializeMobileCaptcha(config);
    } else {
      return this.initializeWebCaptcha(siteKey, theme, size);
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
    // For mobile, we use a simplified math captcha or pattern recognition
    this.isLoaded = true;
    if (this.onLoadCallback) this.onLoadCallback();
    return Promise.resolve(true);
  }

  /**
   * Render captcha widget
   */
  render(container, config = {}) {
    if (!this.isLoaded) {
      throw new Error('Captcha not initialized');
    }

    if (this.isMobile) {
      return this.renderMobileCaptcha(container, config);
    } else {
      return this.renderWebCaptcha(container, config);
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
    const { callback } = config;
    
    // Generate a simple math problem
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const correctAnswer = num1 + num2;

    container.innerHTML = `
      <div class="mobile-captcha">
        <div class="captcha-question">
          <label for="captcha-input">Security Check: What is ${num1} + ${num2}?</label>
          <input 
            type="number" 
            id="captcha-input" 
            class="captcha-input" 
            placeholder="Enter answer"
            min="0"
            max="20"
          />
        </div>
        <div class="captcha-feedback"></div>
      </div>
    `;

    const input = container.querySelector('#captcha-input');
    const feedback = container.querySelector('.captcha-feedback');
    
    input.addEventListener('input', (e) => {
      const userAnswer = parseInt(e.target.value);
      if (userAnswer === correctAnswer) {
        feedback.textContent = '✓ Correct!';
        feedback.style.color = 'green';
        input.style.borderColor = 'green';
        
        // Generate a mobile captcha token
        const mobileToken = this.generateMobileToken(num1, num2, correctAnswer);
        if (callback) callback(mobileToken);
        if (this.onCompleteCallback) this.onCompleteCallback(mobileToken);
      } else if (e.target.value && userAnswer !== correctAnswer) {
        feedback.textContent = '✗ Incorrect, try again';
        feedback.style.color = 'red';
        input.style.borderColor = 'red';
      } else {
        feedback.textContent = '';
        input.style.borderColor = '';
      }
    });

    // Store the correct answer for verification
    this.currentAnswer = correctAnswer;
    this.widgetId = 'mobile-captcha-' + Date.now();
    
    return this.widgetId;
  }

  /**
   * Generate mobile captcha token
   */
  generateMobileToken(num1, num2, answer) {
    const timestamp = Date.now();
    const data = { num1, num2, answer, timestamp, platform: 'mobile' };
    return btoa(JSON.stringify(data));
  }

  /**
   * Get captcha response
   */
  getResponse(widgetId) {
    if (this.isMobile) {
      const input = document.querySelector('#captcha-input');
      if (input && parseInt(input.value) === this.currentAnswer) {
        return this.generateMobileToken(0, 0, this.currentAnswer);
      }
      return '';
    } else {
      if (window.grecaptcha && this.widgetId !== null) {
        return window.grecaptcha.getResponse(this.widgetId);
      }
      return '';
    }
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