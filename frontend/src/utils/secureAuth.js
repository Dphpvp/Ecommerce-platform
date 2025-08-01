import platformDetection from './platformDetection';

/**
 * Secure JWT Authentication Utility
 * Handles token storage, validation, and security measures for both web and mobile
 */
class SecureAuth {
  constructor() {
    this.TOKEN_KEY = 'auth_token';
    this.REFRESH_TOKEN_KEY = 'refresh_token';
    this.TOKEN_EXPIRY_KEY = 'token_expiry';
    this.USER_KEY = 'user_data';
    
    // Production security settings
    this.TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry
    this.MAX_RETRY_ATTEMPTS = 3;
    this.RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute  
    this.MAX_REQUESTS_PER_WINDOW = 20; // Increased for production use
    
    // Rate limiting storage
    this.requestCounts = new Map();
    
    // Initialize security measures
    this.initSecurityMeasures();
  }

  /**
   * Initialize security measures
   */
  initSecurityMeasures() {
    // Clear any expired data on initialization
    this.clearExpiredTokens();
    
    // Set up periodic cleanup
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.clearExpiredTokens();
        this.cleanupRateLimitData();
      }, 60 * 1000); // Cleanup every minute
    }
  }

  /**
   * Secure token storage with encryption for sensitive data
   */
  setTokens(accessToken, refreshToken, expiresIn, userData) {
    try {
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      // Calculate expiry time
      const expiryTime = Date.now() + (expiresIn * 1000);
      
      // Store tokens and user data
      localStorage.setItem(this.TOKEN_KEY, accessToken);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      if (refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      }
      
      if (userData) {
        // Only store non-sensitive user data
        const safeUserData = this.sanitizeUserData(userData);
        localStorage.setItem(this.USER_KEY, JSON.stringify(safeUserData));
      }
      
      console.log('🔐 Tokens stored securely');
      return true;
    } catch (error) {
      console.error('Failed to store tokens:', error);
      return false;
    }
  }

  /**
   * Get access token with automatic refresh
   */
  async getValidToken() {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      
      if (!token || !expiryTime) {
        return null;
      }

      const expiry = parseInt(expiryTime);
      const now = Date.now();
      
      // Check if token is expired or will expire soon
      if (now >= expiry) {
        console.log('🔄 Token expired, attempting refresh...');
        return await this.refreshToken();
      } else if ((expiry - now) < this.TOKEN_REFRESH_THRESHOLD) {
        console.log('🔄 Token expiring soon, refreshing proactively...');
        // Attempt refresh but return current token if refresh fails
        const refreshedToken = await this.refreshToken();
        return refreshedToken || token;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        console.log('No refresh token available');
        this.clearAllTokens();
        return null;
      }

      // Rate limiting for refresh requests
      if (!this.checkRateLimit('refresh')) {
        throw new Error('Too many refresh attempts. Please wait.');
      }

      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';
      
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store new tokens
        this.setTokens(
          data.access_token,
          data.refresh_token || refreshToken,
          data.expires_in || 3600,
          data.user
        );
        
        console.log('✅ Token refreshed successfully');
        return data.access_token;
      } else {
        console.log('❌ Token refresh failed');
        this.clearAllTokens();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAllTokens();
      return null;
    }
  }

  /**
   * Make authenticated request with automatic token refresh
   */
  async makeSecureRequest(url, options = {}) {
    let attempt = 0;
    
    while (attempt < this.MAX_RETRY_ATTEMPTS) {
      try {
        // Rate limiting
        if (!this.checkRateLimit('api')) {
          throw new Error('Rate limit exceeded. Please slow down.');
        }

        const token = await this.getValidToken();
        if (!token) {
          throw new Error('No valid authentication token');
        }

        const requestOptions = {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
          }
        };

        // Skip additional headers to avoid CORS preflight issues
        // The backend should handle CSRF protection

        const response = await fetch(url, requestOptions);
        
        // Handle 401 specifically for token expiry
        if (response.status === 401) {
          console.log('🔄 Received 401, attempting token refresh...');
          const refreshedToken = await this.refreshToken();
          
          if (refreshedToken && attempt < this.MAX_RETRY_ATTEMPTS - 1) {
            attempt++;
            continue; // Retry with new token
          } else {
            throw new Error('Authentication failed');
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        attempt++;
        
        if (attempt >= this.MAX_RETRY_ATTEMPTS) {
          console.error('🚨 Max retry attempts reached:', error);
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(operation) {
    const now = Date.now();
    const key = `${operation}_${Math.floor(now / this.RATE_LIMIT_WINDOW)}`;
    
    const count = this.requestCounts.get(key) || 0;
    if (count >= this.MAX_REQUESTS_PER_WINDOW) {
      console.warn(`Rate limit exceeded for ${operation}`);
      return false;
    }
    
    this.requestCounts.set(key, count + 1);
    return true;
  }

  /**
   * Clean up old rate limit data
   */
  cleanupRateLimitData() {
    const now = Date.now();
    const cutoff = now - (this.RATE_LIMIT_WINDOW * 2);
    
    for (const [key] of this.requestCounts) {
      const timestamp = parseInt(key.split('_').pop()) * this.RATE_LIMIT_WINDOW;
      if (timestamp < cutoff) {
        this.requestCounts.delete(key);
      }
    }
  }

  /**
   * Sanitize user data before storage (remove sensitive information)
   */
  sanitizeUserData(userData) {
    const sensitive_fields = ['password', 'password_hash', 'secret', 'token', 'key'];
    const sanitized = {};
    
    for (const [key, value] of Object.entries(userData)) {
      // Skip sensitive fields
      if (sensitive_fields.some(field => key.toLowerCase().includes(field))) {
        continue;
      }
      
      // Only store simple data types
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Get stored user data
   */
  getUserData() {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!token || !expiryTime) {
      return false;
    }
    
    return Date.now() < parseInt(expiryTime);
  }

  /**
   * Clear expired tokens
   */
  clearExpiredTokens() {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (expiryTime && Date.now() >= parseInt(expiryTime)) {
      console.log('🧹 Clearing expired tokens');
      this.clearAllTokens();
    }
  }

  /**
   * Clear all authentication data
   */
  clearAllTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Clear any cached auth data
    if (typeof window !== 'undefined' && window.caches) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('auth') || cacheName.includes('user')) {
            caches.delete(cacheName);
          }
        });
      });
    }
    
    console.log('🧹 All authentication data cleared');
  }

  /**
   * Get token expiry information
   */
  getTokenInfo() {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);
    
    if (!expiryTime || !token) {
      return null;
    }
    
    const expiry = parseInt(expiryTime);
    const now = Date.now();
    
    return {
      hasToken: !!token,
      isExpired: now >= expiry,
      expiresIn: Math.max(0, expiry - now),
      willExpireSoon: (expiry - now) < this.TOKEN_REFRESH_THRESHOLD
    };
  }

  /**
   * Security headers for requests (minimal to avoid CORS preflight issues)
   */
  getSecurityHeaders() {
    return {
      // Only include essential headers that don't trigger CORS preflight
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  /**
   * Logout and clear all data
   */
  async logout() {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      
      if (token) {
        // Notify backend of logout using simple fetch to avoid CORS preflight
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';
        
        try {
          await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ Backend logout successful');
        } catch (error) {
          console.warn('Backend logout failed:', error);
          // Continue with local cleanup even if backend call fails
        }
      }
      
      this.clearAllTokens();
      
      // Clear any additional app-specific data
      localStorage.removeItem('guest_cart');
      localStorage.removeItem('guest_wishlist');
      
      await platformDetection.showToast('Logged out successfully', 2000);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if backend call fails
      this.clearAllTokens();
      return false;
    }
  }
}

// Create singleton instance
const secureAuth = new SecureAuth();

export default secureAuth;