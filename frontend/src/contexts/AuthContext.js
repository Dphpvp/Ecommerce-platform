import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import platformDetection from '../utils/platformDetection';
import notificationService from '../utils/notificationService';
import sessionManager from '../utils/sessionManager';
import secureAuth from '../utils/secureAuth';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [initialized, setInitialized] = useState(false);
  
  // Auto-logout state
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  const WARNING_DURATION = 5 * 60 * 1000; // 5 minutes before logout

  const logout = useCallback(async (showMessage = true) => {
    console.log('🚪 Logging out user...');
    
    try {
      // Use secure auth logout which handles backend call and cleanup
      await secureAuth.logout();
    } catch (error) {
      console.error('Secure logout error:', error);
    }
    
    // Use session manager to clear all session data
    sessionManager.forceLogoutAllTabs();
    
    // Clear state
    setUser(null);
    setRequires2FA(false);
    setTempToken(null);
    setLoading(false);
    
    // Clear timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    
    // Show logout message if not already shown by secureAuth
    if (showMessage) {
      try {
        await platformDetection.showToast('Logged out successfully', 2000);
      } catch (error) {
        console.warn('Could not show logout toast:', error);
      }
    }
    
    console.log('✅ Logout complete');
  }, []);

  const resetTimeout = useCallback(() => {
    if (!user || platformDetection.isMobile) return; // Skip auto-logout on mobile
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Set warning timeout (5 minutes before logout)
    warningTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ Session expiring soon, showing warning');
      
      // Show warning modal/toast
      const extendSession = window.confirm(
        'Your session will expire in 5 minutes due to inactivity. ' +
        'Click OK to extend your session or Cancel to logout now.'
      );
      
      if (extendSession) {
        console.log('🔄 User chose to extend session');
        sessionManager.extendSession();
        resetTimeout(); // Reset the timeout
      } else {
        console.log('🚪 User chose to logout immediately');
        logout(true);
      }
    }, TIMEOUT_DURATION - WARNING_DURATION);
    
    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      console.log('🚪 Auto-logout due to inactivity');
      logout(true);
    }, TIMEOUT_DURATION);
    
    console.log(`⏰ Session timeout reset - will warn in ${(TIMEOUT_DURATION - WARNING_DURATION) / 60000} minutes, logout in ${TIMEOUT_DURATION / 60000} minutes`);
  }, [user, logout, TIMEOUT_DURATION, WARNING_DURATION]);

  const handleActivity = useCallback(() => {
    if (!user || platformDetection.isMobile) return;
    resetTimeout();
  }, [resetTimeout, user]);

  useEffect(() => {
    if (!user || platformDetection.isMobile) return; // Skip auto-logout setup on mobile

    console.log('🎯 Setting up auto-logout activity detection');
    
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 
      'click', 'keydown', 'mouseenter', 'focus', 'blur'
    ];
    
    // Throttle activity detection to avoid excessive calls
    let activityTimeout;
    const throttledActivity = () => {
      if (activityTimeout) return;
      activityTimeout = setTimeout(() => {
        handleActivity();
        activityTimeout = null;
      }, 1000); // Throttle to once per second
    };
    
    events.forEach(event => {
      document.addEventListener(event, throttledActivity, true);
    });

    // Set initial timeout
    resetTimeout();

    return () => {
      console.log('🧹 Cleaning up auto-logout activity detection');
      events.forEach(event => {
        document.removeEventListener(event, throttledActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [user, handleActivity, resetTimeout]);

  // Secure session fetching using JWT tokens
  const fetchUser = useCallback(async () => {
    try {
      // Check if we have a valid token
      if (!secureAuth.isAuthenticated()) {
        console.log('🔐 No valid authentication found');
        setUser(null);
        if (!initialized) {
          setLoading(false);
          setInitialized(true);
        }
        return null;
      }

      // Get user data from secure storage first
      const cachedUserData = secureAuth.getUserData();
      if (cachedUserData && !user) {
        console.log('📋 Loading cached user data');
        setUser(cachedUserData);
      }

      // Verify token with backend
      const response = await secureAuth.makeSecureRequest(`${API_BASE}/auth/me`);
      
      if (response) {
        console.log('✅ User session verified:', {
          username: response.username,
          email: response.email,
          isAdmin: response.is_admin
        });
        
        // Update stored user data
        secureAuth.setTokens(
          await secureAuth.getValidToken(),
          localStorage.getItem('refresh_token'),
          3600, // Default 1 hour expiry
          response
        );
        
        setUser(response);
        return response;
      } else {
        console.log('❌ Session verification failed');
        secureAuth.clearAllTokens();
        setUser(null);
        return null;
      }
    } catch (error) {
      console.warn('Auth fetch error:', error.message);
      
      if (error.message.includes('Authentication') || error.message.includes('401')) {
        console.log('🔐 Authentication failed, clearing tokens');
        secureAuth.clearAllTokens();
        setUser(null);
        return null;
      }
      
      // Don't change user state on network errors, return cached data
      return user || secureAuth.getUserData();
    } finally {
      if (!initialized) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [user, initialized]);

  // Initialize session manager and handle session events
  useEffect(() => {
    console.log('🔧 Initializing auth system with session manager');
    
    // Initialize session manager
    sessionManager.init();
    
    // Set up session event handlers
    const handleSessionEvent = (event, data) => {
      console.log(`📡 Session event: ${event}`, data ? data : '');
      
      switch (event) {
        case 'session_restored':
          if (data && data.user && !user) {
            console.log('🔄 Restoring session from storage');
            setUser(data.user);
            setLoading(false);
            setInitialized(true);
          }
          break;
          
        case 'logout_other_tab':
          console.log('🚪 Session invalidated in other tab, logging out');
          setUser(null);
          setRequires2FA(false);
          setTempToken(null);
          setLoading(false);
          break;
          
        case 'session_invalid':
          // Only logout if we actually had a user before
          if (user) {
            console.log('🚪 Session invalidated, logging out');
            setUser(null);
            setRequires2FA(false);
            setTempToken(null);
            setLoading(false);
          } else {
            console.log('👁️ No session found, but user was not logged in anyway');
          }
          break;
          
        case 'no_session':
          if (!initialized) {
            setLoading(false);
            setInitialized(true);
          }
          break;
          
        case 'session_extended':
          resetTimeout();
          break;
          
        default:
          break;
      }
    };
    
    sessionManager.addListener(handleSessionEvent);
    
    // Fallback: fetch user if no session was restored
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.log('⏰ No session restored, fetching user');
        fetchUser();
      }
    }, 1000);
    
    return () => {
      sessionManager.removeListener(handleSessionEvent);
      clearTimeout(timeout);
    };
  }, [user, initialized, fetchUser, resetTimeout]);

  // FIXED: Only fetch user once on initialization (backup)
  useEffect(() => {
    if (!initialized && !sessionManager.isSessionValid()) {
      console.log('🔍 No session found, fetching user from backend');
      fetchUser();
    }
  }, [fetchUser, initialized]);

  const login = useCallback(async (loginData) => {
    try {
      if (loginData && loginData.access_token) {
        // Store tokens securely
        const success = secureAuth.setTokens(
          loginData.access_token,
          loginData.refresh_token,
          loginData.expires_in || 3600,
          loginData.user
        );
        
        if (success) {
          setUser(loginData.user);
          setLoading(false);
          
          // Store session data for backward compatibility
          sessionManager.setSessionData(loginData.user, loginData.access_token);
          
          console.log('✅ Login successful with JWT tokens');
        } else {
          throw new Error('Failed to store authentication tokens');
        }
      } else if (loginData && loginData.user) {
        // Fallback for user data without explicit tokens
        setUser(loginData.user);
        setLoading(false);
      } else {
        // Fetch from session
        const freshUser = await fetchUser();
        if (!freshUser) {
          setLoading(false);
          return false;
        }
      }
      
      setRequires2FA(false);
      setTempToken(null);
      
      // Try to save FCM token if we have one stored locally
      try {
        await notificationService.retryTokenSave();
      } catch (error) {
        console.error('Failed to save FCM token on login:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  }, [fetchUser]);

  const complete2FA = useCallback(async () => {
    setRequires2FA(false);
    setTempToken(null);
    const userData = await fetchUser();
    if (userData) {
      setUser(userData);
      return true;
    }
    return false;
  }, [fetchUser]);

  const handle2FARequired = (tempToken) => {
    setRequires2FA(true);
    setTempToken(tempToken);
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        return { success: true, message: 'Registration successful! Please check your email to verify your account.' };
      } else {
        const data = await response.json();
        return { success: false, message: data.detail || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Get CSRF token helper
  const getCSRFToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/csrf-token`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        return data.csrf_token;
      }
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
    }
    return null;
  }, []);

  // Secure authenticated request using JWT tokens
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    try {
      console.log(`🌐 Making secure authenticated request to ${url}`);
      console.log('🔍 Current auth state:', {
        hasUser: !!user,
        userEmail: user?.email,
        isAdmin: user?.is_admin,
        isAuthenticated: secureAuth.isAuthenticated(),
        tokenInfo: secureAuth.getTokenInfo()
      });
      
      // Use secure auth for the request
      const response = await secureAuth.makeSecureRequest(url, options);
      
      console.log('✅ Secure request completed successfully');
      return response;
      
    } catch (error) {
      console.error('🚨 Secure authenticated request failed:', {
        message: error.message,
        url: url,
        hasUser: !!user,
        isAuthenticated: secureAuth.isAuthenticated()
      });
      
      // Handle authentication errors
      if (error.message.includes('Authentication') || error.message.includes('401')) {
        console.log('🔐 Authentication failed, clearing user state');
        secureAuth.clearAllTokens();
        setUser(null);
        await platformDetection.showToast('Session expired. Please login again.', 3000);
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        await platformDetection.showToast('Connection failed. Please check your internet connection.', 4000);
      } else if (error.message.includes('Rate limit')) {
        await platformDetection.showToast('Too many requests. Please slow down.', 3000);
      }
      
      throw error;
    }
  }, [user]);

  const checkAuthStatus = useCallback(async () => {
    try {
      // Use secure auth to check status
      return secureAuth.isAuthenticated();
    } catch (error) {
      console.error('Auth status check failed:', error);
      return false;
    }
  }, []);

  const isAuthenticated = !!user;

  const refetchUser = useCallback(async () => {
    console.log('🔄 Refetching user...');
    try {
      // Use fetchUser which handles secure authentication
      const userData = await fetchUser();
      
      if (userData) {
        console.log('✅ User refetch successful');
        return userData;
      } else {
        console.log('❌ Refetch failed, clearing user');
        setUser(null);
        sessionManager.clearSessionData();
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  }, [fetchUser]);

  // Session management helpers
  const extendSession = useCallback(() => {
    sessionManager.extendSession();
    resetTimeout();
  }, [resetTimeout]);

  const getSessionInfo = useCallback(() => {
    return {
      isValid: sessionManager.isSessionValid(),
      remainingTime: sessionManager.getRemainingSessionTime(),
      isMobile: platformDetection.isMobile
    };
  }, []);

  // Debug logging (disabled in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Auth State:', { 
        user: user?.username || 'none', 
        loading, 
        initialized, 
        isAuthenticated 
      });
    }
  }, [user, loading, initialized, isAuthenticated]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token: null,
      getToken: () => null,
      login, 
      register, 
      logout, 
      loading,
      requires2FA,
      tempToken,
      handle2FARequired,
      complete2FA,
      refetchUser,
      makeAuthenticatedRequest,
      checkAuthStatus,
      isAuthenticated,
      initialized, // Add this for components to check if auth is ready
      extendSession, // Allow manual session extension
      getSessionInfo // Get session status information
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};