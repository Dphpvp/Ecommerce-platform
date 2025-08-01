/**
 * Simple CSRF token utility to avoid CORS preflight issues
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

class SimpleCSRF {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  async getToken() {
    // Check if current token is still valid
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('🔒 Using cached CSRF token');
      return this.token;
    }

    try {
      console.log('🔄 Fetching new CSRF token...');
      
      // Use simple GET request to avoid CORS preflight
      const response = await fetch(`${API_BASE}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.csrf_token;
        this.tokenExpiry = Date.now() + (50 * 60 * 1000); // 50 minutes
        console.log('✅ CSRF token fetched successfully');
        return this.token;
      } else {
        console.warn('⚠️ CSRF endpoint returned:', response.status);
        // Generate fallback token
        this.token = 'fallback-' + Math.random().toString(36).substr(2, 16);
        this.tokenExpiry = Date.now() + (50 * 60 * 1000);
        return this.token;
      }
    } catch (error) {
      console.warn('⚠️ CSRF token fetch failed:', error.message);
      // Generate fallback token to prevent blocking requests
      this.token = 'fallback-' + Math.random().toString(36).substr(2, 16);
      this.tokenExpiry = Date.now() + (50 * 60 * 1000);
      return this.token;
    }
  }

  clearToken() {
    this.token = null;
    this.tokenExpiry = null;
    console.log('🧹 CSRF token cleared');
  }
}

// Create singleton instance
const simpleCSRF = new SimpleCSRF();

export default simpleCSRF;