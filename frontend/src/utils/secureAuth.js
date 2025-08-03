/**
 * Secure Authentication Utility for E-commerce Platform
 * Implements defense-in-depth security measures
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

class SecureAuthManager {
  constructor() {
    this.user = null;
    this.csrfToken = null;
    this.tokenRefreshPromise = null;
    this.isRefreshing = false;
    
    // Security configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      tokenRefreshBuffer: 300000, // 5 minutes before expiry
      maxConcurrentRequests: 10,
      rateLimitWindow: 60000, // 1 minute
      maxRequestsPerWindow: 100
    };
    
    // Rate limiting
    this.requestCount = 0;
    this.windowStart = Date.now();
    
    // Request queue for token refresh
    this.pendingRequests = [];
  }

  /**
   * Secure login with comprehensive validation
   */
  async login(credentials) {
    try {
      // Input validation and sanitization
      const sanitizedCredentials = this.sanitizeLoginInput(credentials);
      
      // Get CSRF token before login
      await this.refreshCSRFToken();
      
      const response = await this.makeSecureRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(sanitizedCredentials)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Security validation of response
        if (!this.validateAuthResponse(data)) {
          throw new Error('Invalid authentication response');
        }
        
        this.user = data.user;
        return { success: true, data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: this.sanitizeErrorMessage(errorData.detail || 'Login failed'),
          status: response.status
        };
      }
    } catch (error) {
      console.error('Secure login error:', error.message);
      return { 
        success: false, 
        error: 'Network error. Please try again.',
        status: 0
      };
    }
  }

  /**
   * Secure logout with session cleanup
   */
  async logout() {
    try {
      await this.makeSecureRequest('/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all client-side data
      this.user = null;
      this.csrfToken = null;
      this.clearSensitiveData();
    }
  }

  /**
   * Get current user with session validation
   */
  async getCurrentUser() {
    try {
      const response = await this.makeSecureRequest('/auth/me', {
        method: 'GET'
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Validate user data structure
        if (this.validateUserData(userData)) {
          this.user = userData;
          return userData;
        } else {
          console.warn('Invalid user data structure received');
          return null;
        }
      } else if (response.status === 401) {
        this.user = null;
        return null;
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      console.error('Get current user error:', error.message);
      return null;
    }
  }

  /**
   * Make secure authenticated request with CSRF protection
   */
  async makeSecureRequest(endpoint, options = {}) {
    // Rate limiting check
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    
    // Ensure CSRF token for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
      await this.ensureCSRFToken();
    }

    const secureOptions = {
      credentials: 'include', // Include httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        ...options.headers
      },
      ...options
    };

    // Add CSRF token for state-changing requests
    if (this.csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
      secureOptions.headers['X-CSRF-Token'] = this.csrfToken;
    }

    // Add security headers
    secureOptions.headers = {
      ...secureOptions.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };

    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      try {
        const response = await fetch(url, secureOptions);
        
        // Handle 401 with token refresh
        if (response.status === 401 && attempt === 0) {
          console.log('Received 401, attempting session refresh...');
          const refreshed = await this.refreshSession();
          if (refreshed) {
            attempt++;
            continue; // Retry with refreshed session
          }
        }
        
        // Handle CSRF token refresh
        if (response.status === 403 && response.headers.get('X-CSRF-Error')) {
          console.log('CSRF token invalid, refreshing...');
          await this.refreshCSRFToken();
          if (attempt < this.config.maxRetries - 1) {
            secureOptions.headers['X-CSRF-Token'] = this.csrfToken;
            attempt++;
            continue;
          }
        }

        return response;
      } catch (error) {
        attempt++;
        if (attempt >= this.config.maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await this.delay(this.config.retryDelay * Math.pow(2, attempt - 1));
      }
    }
  }

  /**
   * Refresh CSRF token
   */
  async refreshCSRFToken() {
    try {
      const response = await fetch(`${API_BASE}/csrf-token`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrf_token;
        console.log('CSRF token refreshed');
      } else {
        console.warn('Failed to refresh CSRF token');
      }
    } catch (error) {
      console.error('CSRF token refresh error:', error);
    }
  }

  /**
   * Ensure CSRF token is available
   */
  async ensureCSRFToken() {
    if (!this.csrfToken) {
      await this.refreshCSRFToken();
    }
  }

  /**
   * Refresh session/tokens
   */
  async refreshSession() {
    if (this.isRefreshing) {
      // Wait for ongoing refresh
      return new Promise((resolve) => {
        this.pendingRequests.push(resolve);
      });
    }

    this.isRefreshing = true;
    
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        console.log('Session refreshed successfully');
        
        // Resolve pending requests
        this.pendingRequests.forEach(resolve => resolve(true));
        this.pendingRequests = [];
        
        return true;
      } else {
        console.log('Session refresh failed');
        this.user = null;
        
        // Resolve pending requests with failure
        this.pendingRequests.forEach(resolve => resolve(false));
        this.pendingRequests = [];
        
        return false;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      
      // Resolve pending requests with failure
      this.pendingRequests.forEach(resolve => resolve(false));
      this.pendingRequests = [];
      
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Input sanitization for login
   */
  sanitizeLoginInput(credentials) {
    return {
      identifier: this.sanitizeString(credentials.identifier, 254),
      password: credentials.password // Don't modify password
    };
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
  }

  /**
   * Validate authentication response
   */
  validateAuthResponse(data) {
    return (
      data &&
      typeof data === 'object' &&
      data.user &&
      typeof data.user === 'object' &&
      typeof data.user.username === 'string' &&
      typeof data.user.email === 'string'
    );
  }

  /**
   * Validate user data structure
   */
  validateUserData(userData) {
    return (
      userData &&
      typeof userData === 'object' &&
      typeof userData.username === 'string' &&
      typeof userData.email === 'string' &&
      userData.username.length > 0 &&
      userData.email.includes('@')
    );
  }

  /**
   * Sanitize error messages to prevent information disclosure
   */
  sanitizeErrorMessage(message) {
    // Remove sensitive information from error messages
    const sensitivePatterns = [
      /password/gi,
      /token/gi,
      /session/gi,
      /database/gi,
      /sql/gi,
      /server/gi,
      /internal/gi
    ];

    let sanitized = typeof message === 'string' ? message : 'An error occurred';
    
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    });

    return sanitized.substring(0, 200); // Limit length
  }

  /**
   * Rate limiting check
   */
  checkRateLimit() {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.windowStart > this.config.rateLimitWindow) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    this.requestCount++;
    
    if (this.requestCount > this.config.maxRequestsPerWindow) {
      console.warn('Rate limit exceeded');
      return false;
    }
    
    return true;
  }

  /**
   * Clear sensitive data from memory
   */
  clearSensitiveData() {
    // Clear any sensitive data that might be lingering
    if (window.performance && window.performance.clearResourceTimings) {
      window.performance.clearResourceTimings();
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.user;
  }

  /**
   * Get current user data (safe copy)
   */
  getUser() {
    return this.user ? { ...this.user } : null;
  }
}

// Export singleton instance
export default new SecureAuthManager();