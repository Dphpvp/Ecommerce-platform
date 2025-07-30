/**
 * Mobile Email Verification Helper
 * Handles email verification status checking and resending for mobile users
 */

import platformDetection from './platformDetection';

class MobileEmailVerificationHelper {
  constructor() {
    this.API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';
  }

  /**
   * Check if user needs email verification guidance
   */
  showEmailVerificationGuidance(errorMessage, showToast) {
    if (!platformDetection.isMobile) return false;

    const isEmailVerificationError = 
      errorMessage.toLowerCase().includes('email') && 
      (errorMessage.toLowerCase().includes('verify') || 
       errorMessage.toLowerCase().includes('verified'));

    if (isEmailVerificationError) {
      showToast(
        'Email verification required. Please check your email for the verification link.',
        'error'
      );

      // Show additional guidance after a delay
      setTimeout(() => {
        showToast(
          'Tip: Check your spam folder if you cannot find the verification email.',
          'info'
        );
      }, 2000);

      // Show resend option after another delay
      setTimeout(() => {
        showToast(
          'Need help? Visit the registration page to resend verification email.',
          'info'
        );
      }, 4000);

      return true;
    }

    return false;
  }

  /**
   * Enhanced error detection for mobile login issues
   */
  detectMobileLoginIssue(error, response) {
    const issues = [];

    // Email verification issue
    if (error.message?.toLowerCase().includes('email') && 
        error.message?.toLowerCase().includes('verified')) {
      issues.push({
        type: 'email_verification',
        message: 'Email verification required',
        solution: 'Please verify your email address before logging in'
      });
    }

    // Network connectivity issues
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      issues.push({
        type: 'network',
        message: 'Network connection failed',
        solution: 'Check your internet connection and try again'
      });
    }

    // CORS issues (mobile specific)
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      issues.push({
        type: 'cors',
        message: 'Server connection blocked',
        solution: 'This is a network configuration issue. Please contact support.'
      });
    }

    // Authentication failures
    if (response?.status === 401) {
      issues.push({
        type: 'authentication',
        message: 'Login credentials invalid or account needs verification',
        solution: 'Verify your credentials and ensure your email is verified'
      });
    }

    return issues;
  }

  /**
   * Get user-friendly error messages for mobile users
   */
  getMobileErrorMessage(error, response) {
    const issues = this.detectMobileLoginIssue(error, response);
    
    if (issues.length === 0) {
      return 'Login failed. Please try again.';
    }

    // Prioritize email verification issues
    const emailIssue = issues.find(issue => issue.type === 'email_verification');
    if (emailIssue) {
      return emailIssue.solution;
    }

    // Return the first issue's solution
    return issues[0].solution;
  }

  /**
   * Log detailed mobile login attempt for debugging
   */
  logMobileLoginAttempt(identifier, error, response) {
    if (!platformDetection.isMobile) return;

    const logData = {
      timestamp: new Date().toISOString(),
      identifier: identifier,
      platform: platformDetection.platform,
      userAgent: navigator.userAgent,
      capacitorAvailable: !!window.Capacitor,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack?.substring(0, 200)
      },
      response: {
        status: response?.status,
        statusText: response?.statusText,
        url: response?.url
      },
      deviceInfo: platformDetection.getDeviceInfo(),
      networkInfo: {
        online: navigator.onLine,
        connection: navigator.connection?.effectiveType || 'unknown'
      }
    };

    console.group('📱 Mobile Login Attempt Failed');
    console.error('Full debug information:', logData);
    console.groupEnd();

    // Store in localStorage for support debugging (last 5 attempts)
    try {
      const attempts = JSON.parse(localStorage.getItem('mobile_login_debug') || '[]');
      attempts.unshift(logData);
      attempts.splice(5); // Keep only last 5 attempts
      localStorage.setItem('mobile_login_debug', JSON.stringify(attempts));
    } catch (e) {
      console.warn('Could not store debug info:', e);
    }
  }

  /**
   * Check if user is likely unverified based on identifier patterns
   */
  isLikelyUnverifiedUser(identifier) {
    if (!identifier) return false;

    // Admin accounts typically don't have verification issues
    if (identifier.toLowerCase().includes('admin')) {
      return false;
    }

    // Regular email addresses are more likely to need verification
    if (identifier.includes('@') && !identifier.includes('admin')) {
      return true;
    }

    return false;
  }

  /**
   * Get mobile-specific help instructions
   */
  getMobileHelpInstructions(errorType = 'general') {
    const instructions = {
      email_verification: [
        '1. Check your email inbox for a verification email',
        '2. Look in your spam/junk folder',
        '3. Click the verification link in the email',
        '4. Try logging in again',
        '5. If no email found, visit registration page to resend'
      ],
      network: [
        '1. Check your internet connection',
        '2. Try switching between WiFi and mobile data',
        '3. Clear app cache if problem persists',
        '4. Restart the app and try again'
      ],
      general: [
        '1. Ensure your email address is verified',
        '2. Check your internet connection',
        '3. Try clearing app cache',
        '4. Contact support if issue persists'
      ]
    };

    return instructions[errorType] || instructions.general;
  }
}

// Create singleton instance
const mobileEmailVerificationHelper = new MobileEmailVerificationHelper();

export default mobileEmailVerificationHelper;