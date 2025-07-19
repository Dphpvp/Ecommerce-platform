// frontend/src/utils/csrf.js - Updated for new auth.py
import platformDetection from './platformDetection.js';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

class CSRFManager {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  async getToken() {
    // Check if current token is still valid
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      // Try to get CSRF token from API
      const response = await fetch(`${API_BASE}/csrf-token`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          ...platformDetection.getPlatformHeaders()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.csrf_token;
        this.tokenExpiry = Date.now() + (50 * 60 * 1000); // 50 minutes
        return this.token;
      } else if (response.status === 404) {
        // CSRF endpoint doesn't exist, generate a simple token
        console.warn('CSRF endpoint not found, using fallback token');
        this.token = 'fallback-' + Math.random().toString(36).substr(2, 9);
        this.tokenExpiry = Date.now() + (50 * 60 * 1000);
        return this.token;
      }
    } catch (error) {
      console.warn('⚠️ CSRF token not available:', error.message);
      // Generate fallback token to prevent blocking requests
      this.token = 'fallback-' + Math.random().toString(36).substr(2, 9);
      this.tokenExpiry = Date.now() + (50 * 60 * 1000);
      return this.token;
    }
    
    return 'fallback-token';
  }

  async makeSecureRequest(url, options = {}) {
    const token = await this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['X-CSRF-Token'] = token;
    }

    // Add request signing for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await requestSigner.signRequest(
        options.method || 'POST',
        new URL(url).pathname,
        options.body || '',
        timestamp
      );
      
      headers['X-Request-Signature'] = signature;
      headers['X-Request-Timestamp'] = timestamp.toString();
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Always include cookies for session
    });
  }

  clearToken() {
    this.token = null;
    this.tokenExpiry = null;
  }
}

// Request signing implementation
class RequestSigner {
  constructor() {
    // In production, this would be derived from a secure key exchange
    // For now, using a placeholder that matches backend
    this.secret = process.env.REACT_APP_SESSION_SECRET || 'default-secret';
  }

  async signRequest(method, path, body, timestamp) {
    const message = `${method}|${path}|${body}|${timestamp}`;
    
    // Use Web Crypto API for HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(message)
    );
    
    // Convert to hex string
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  verifyTimestamp(timestamp) {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - timestamp);
    // Allow 5 minutes time difference
    return timeDiff <= 300;
  }
}

// Create singleton instances
export const csrfManager = new CSRFManager();
export const requestSigner = new RequestSigner();

// Updated secure fetch wrapper
export const secureFetch = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...platformDetection.getPlatformHeaders(),
      ...options.headers,
    },
  };

  // Get CSRF token for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
    try {
      const token = await csrfManager.getToken();
      if (token) {
        defaultOptions.headers['X-CSRF-Token'] = token;
      }
    } catch (error) {
      console.warn('Could not get CSRF token, proceeding without it');
    }

    // Add request signing
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await requestSigner.signRequest(
      options.method,
      new URL(url).pathname,
      options.body || '',
      timestamp
    );
    
    defaultOptions.headers['X-Request-Signature'] = signature;
    defaultOptions.headers['X-Request-Timestamp'] = timestamp.toString();
  }

  return fetch(url, { ...defaultOptions, ...options });
};

// Input sanitization utilities
export const sanitizeInput = {
  text: (input, maxLength = 1000) => {
    if (!input) return '';
    
    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Limit length
    sanitized = sanitized.substring(0, maxLength);
    
    // Trim whitespace
    return sanitized.trim();
  },

  email: (email) => {
    if (!email) return '';
    return email.toLowerCase().trim();
  },

  phone: (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters except + and common separators
    return phone.replace(/[^\d\+\s\-\(\)]/g, '');
  },

  html: (input) => {
    if (!input) return '';
    
    // Basic HTML escaping
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  url: (url) => {
    if (!url) return '';
    
    try {
      const parsed = new URL(url);
      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }
};

// Mobile captcha utilities for platforms without reCAPTCHA
export const mobileCaptcha = {
  /**
   * Generate mobile captcha token for authentication
   */
  generateToken() {
    const isMobile = platformDetection.isMobile;
    
    if (!isMobile) {
      console.warn('Mobile captcha requested but not on mobile platform');
      return null;
    }
    
    const tokenData = {
      platform: 'mobile',
      timestamp: Date.now(),
      deviceId: this._getDeviceId(),
      userAgent: navigator.userAgent.substring(0, 100)
    };
    
    try {
      // Use Android-safe encoding for Android platforms
      if (platformDetection.platform === 'android') {
        return this._encodeAndroidSafe(tokenData);
      } else {
        // Standard base64 encoding for other platforms
        const jsonStr = JSON.stringify(tokenData);
        return btoa(jsonStr);
      }
    } catch (error) {
      console.error('Failed to generate mobile captcha token:', error);
      return 'emergency-fallback-token';
    }
  },
  
  /**
   * Android-safe encoding that avoids base64 padding issues
   */
  _encodeAndroidSafe(data) {
    const jsonStr = JSON.stringify(data);
    let hexString = '';
    
    for (let i = 0; i < jsonStr.length; i++) {
      const hex = jsonStr.charCodeAt(i).toString(16).padStart(2, '0');
      hexString += hex;
    }
    
    return 'android-' + hexString;
  },
  
  /**
   * Get a device identifier for mobile captcha
   */
  _getDeviceId() {
    // Try to get a consistent device identifier
    let deviceId = localStorage.getItem('mobile_device_id');
    
    if (!deviceId) {
      // Generate a new device ID
      deviceId = 'mobile_' + Math.random().toString(36).substr(2, 12) + '_' + Date.now();
      localStorage.setItem('mobile_device_id', deviceId);
    }
    
    return deviceId;
  },
  
  /**
   * Check if mobile captcha is available/needed
   */
  isAvailable() {
    return platformDetection.isMobile;
  }
};

// Client-side validation
export const validateInput = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phone: (phone) => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
    return phoneRegex.test(phone);
  },

  password: (password) => {
    if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
    if (password.length > 128) return { valid: false, message: 'Password too long' };
    
    const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (weakPasswords.includes(password.toLowerCase())) {
      return { valid: false, message: 'Password is too weak' };
    }
    
    return { valid: true };
  },

  username: (username) => {
    if (!username) return { valid: false, message: 'Username is required' };
    if (username.length < 3 || username.length > 50) {
      return { valid: false, message: 'Username must be 3-50 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { valid: false, message: 'Username can only contain letters, numbers, underscore, and hyphen' };
    }
    return { valid: true };
  },

  url: (url) => {
    if (!url) return { valid: false, message: 'URL is required' };
    
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, message: 'URL must use http or https' };
      }
      return { valid: true };
    } catch {
      return { valid: false, message: 'Invalid URL format' };
    }
  },

  number: (value, min = 0, max = Infinity) => {
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, message: 'Must be a valid number' };
    if (num < min) return { valid: false, message: `Must be at least ${min}` };
    if (num > max) return { valid: false, message: `Must be at most ${max}` };
    return { valid: true };
  }
};