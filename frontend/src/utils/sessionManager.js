/**
 * Session Management Utility
 * Handles session persistence, cleanup, and validation across page refreshes
 */

import platformDetection from './platformDetection';

class SessionManager {
  constructor() {
    this.SESSION_KEY = 'ecommerce_session';
    this.LAST_ACTIVITY_KEY = 'last_activity';
    this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    this.listeners = new Set();
  }

  /**
   * Store session data
   */
  setSessionData(userData, token = null) {
    const sessionData = {
      user: userData,
      token: token,
      timestamp: Date.now(),
      platform: platformDetection.platform,
      userAgent: navigator.userAgent.substring(0, 100)
    };

    try {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
      console.log('✅ Session data stored');
    } catch (error) {
      console.error('Failed to store session data:', error);
    }
  }

  /**
   * Get session data if valid
   */
  getSessionData() {
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
      
      if (!sessionData || !lastActivity) {
        return null;
      }

      const parsed = JSON.parse(sessionData);
      const activityTime = parseInt(lastActivity);
      const now = Date.now();

      // Check if session is expired (only for web, not mobile)
      if (!platformDetection.isMobile && (now - activityTime) > this.SESSION_TIMEOUT) {
        console.log('❌ Session expired, clearing data');
        this.clearSessionData();
        return null;
      }

      // Update last activity
      this.updateLastActivity();
      
      return parsed;
    } catch (error) {
      console.error('Failed to get session data:', error);
      this.clearSessionData();
      return null;
    }
  }

  /**
   * Clear all session data
   */
  clearSessionData() {
    console.log('🧹 Clearing all session data');
    
    // Clear all localStorage auth-related items
    const authKeys = [
      'auth_token',
      'fcm_token', 
      'mobile_login_debug',
      this.LAST_ACTIVITY_KEY
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear sessionStorage
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.clear();

    // Clear cookies by setting them to expire
    this.clearAuthCookies();

    // Notify listeners
    this.notifyListeners('session_cleared');
  }

  /**
   * Clear authentication cookies
   */
  clearAuthCookies() {
    const cookiesToClear = [
      'session_id',
      'auth_token', 
      'csrf_token',
      'user_session'
    ];

    cookiesToClear.forEach(cookieName => {
      // Clear for current domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      
      // Clear for current domain with leading dot
      const domain = window.location.hostname;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
    });
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity() {
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
  }

  /**
   * Check if session is valid
   */
  isSessionValid() {
    const sessionData = this.getSessionData();
    return sessionData !== null;
  }

  /**
   * Get remaining session time in milliseconds
   */
  getRemainingSessionTime() {
    if (platformDetection.isMobile) return Infinity; // No timeout on mobile
    
    const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
    if (!lastActivity) return 0;

    const activityTime = parseInt(lastActivity);
    const elapsed = Date.now() - activityTime;
    const remaining = this.SESSION_TIMEOUT - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Add session event listener
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove session event listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of session events
   */
  notifyListeners(event, data = null) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }

  /**
   * Initialize session manager
   */
  init() {
    console.log('🔧 Initializing session manager');
    
    // Listen for storage events (logout in other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === this.LAST_ACTIVITY_KEY && e.newValue === null) {
        console.log('🔗 Logout detected in another tab');
        this.clearSessionData();
        this.notifyListeners('logout_other_tab');
      }
    });

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible, check session validity
        const sessionData = this.getSessionData();
        if (sessionData && !this.isSessionValid()) {
          // Only fire session_invalid if we had a session that became invalid
          console.log('👁️ Page visible but session invalid');
          this.notifyListeners('session_invalid');
        } else if (sessionData) {
          this.updateLastActivity();
        }
        // Don't fire events if there was never a session to begin with
      }
    });

    // Listen for beforeunload to clean up if needed
    window.addEventListener('beforeunload', () => {
      this.updateLastActivity();
    });

    // Check session on page load
    const sessionData = this.getSessionData();
    if (sessionData) {
      console.log('🔍 Valid session found on init');
      this.notifyListeners('session_restored', sessionData);
    } else {
      console.log('❌ No valid session found on init');
      this.notifyListeners('no_session');
    }
  }

  /**
   * Force logout across all tabs
   */
  forceLogoutAllTabs() {
    // Remove the last activity key to trigger logout in other tabs
    localStorage.removeItem(this.LAST_ACTIVITY_KEY);
    
    // Clear session data
    this.clearSessionData();
    
    console.log('🚪 Forced logout across all tabs');
  }

  /**
   * Extend session (reset timeout)
   */
  extendSession() {
    if (platformDetection.isMobile) return; // No timeout on mobile
    
    this.updateLastActivity();
    console.log('⏰ Session extended');
    this.notifyListeners('session_extended');
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;