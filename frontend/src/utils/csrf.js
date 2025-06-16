// frontend/src/utils/csrf.js
const API_BASE = process.env.REACT_APP_API_BASE_URL;

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
      const response = await fetch(`${API_BASE}/csrf-token`);
      if (response.ok) {
        const data = await response.json();
        this.token = data.csrf_token;
        this.tokenExpiry = Date.now() + (50 * 60 * 1000); // 50 minutes
        return this.token;
      }
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
    }
    
    return null;
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

    // Add auth token if available
    const authToken = localStorage.getItem('token');
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }
}

// Create singleton instance
export const csrfManager = new CSRFManager();

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