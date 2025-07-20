/**
 * Native Android reCAPTCHA implementation using Capacitor plugin
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import platformDetection from './platformDetection';

// Register the native plugin
const NativeRecaptchaPlugin = registerPlugin('NativeRecaptcha');

class NativeRecaptcha {
  constructor() {
    this.isInitialized = false;
    this.isNativeAvailable = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  /**
   * Initialize native reCAPTCHA client
   */
  async initialize(siteKey) {
    if (!this.isNativeAvailable) {
      throw new Error('Native reCAPTCHA only available on Android platform');
    }

    if (!siteKey) {
      throw new Error('Site key is required for reCAPTCHA initialization');
    }

    try {
      console.log('🔧 Initializing native Android reCAPTCHA with environment key...');
      
      const result = await NativeRecaptchaPlugin.initialize({ siteKey });
      
      this.isInitialized = true;
      console.log('✅ Native reCAPTCHA initialized successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Native reCAPTCHA initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute reCAPTCHA action and get token
   */
  async execute(action = 'login', timeout = 10000) {
    if (!this.isNativeAvailable) {
      throw new Error('Native reCAPTCHA only available on Android platform');
    }

    if (!this.isInitialized) {
      throw new Error('Native reCAPTCHA not initialized. Call initialize() first.');
    }

    try {
      console.log(`🔐 Executing native reCAPTCHA action: ${action}`);
      
      const result = await NativeRecaptchaPlugin.execute({ action, timeout });
      
      console.log(`✅ Native reCAPTCHA token generated for action: ${action}`);
      return result.token;
      
    } catch (error) {
      console.error(`❌ Native reCAPTCHA execution failed for action ${action}:`, error);
      throw error;
    }
  }

  /**
   * Check if native reCAPTCHA client is ready
   */
  async isReady() {
    if (!this.isNativeAvailable) {
      return false;
    }

    try {
      const result = await NativeRecaptchaPlugin.isReady();
      return result.ready;
    } catch (error) {
      console.warn('Failed to check native reCAPTCHA readiness:', error);
      return false;
    }
  }

  /**
   * Check if native reCAPTCHA is available on this platform
   */
  isAvailable() {
    return this.isNativeAvailable;
  }
}

// Export singleton instance
const nativeRecaptcha = new NativeRecaptcha();
export default nativeRecaptcha;