import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { secureFetch } from '../utils/csrf';
import platformDetection from '../utils/platformDetection';
import notificationService from '../utils/notificationService';
import sessionManager from '../utils/sessionManager';

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
      // Call backend logout endpoint
      await secureFetch(`${API_BASE}/auth/logout`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Backend logout error:', error);
      // Continue with local cleanup even if backend call fails
    }
    
    // Use session manager to clear all session data
    sessionManager.forceLogoutAllTabs();
    
    // Clear any cached auth data
    try {
      // Clear service worker cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
    } catch (error) {
      console.warn('Cache clearing failed:', error);
    }
    
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
    
    // Show logout message
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

  // Better session fetching with proper state management
  const fetchUser = useCallback(async () => {
    try {
      // Check both localStorage token and session cookies
      const authToken = localStorage.getItem('auth_token');
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: headers,
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User session found:', {
          username: userData.username,
          email: userData.email,
          isAdmin: userData.is_admin
        });
        
        // Store token if provided in response
        if (userData.token) {
          localStorage.setItem('auth_token', userData.token);
        }
        
        setUser(userData);
        return userData;
      } else if (response.status === 401) {
        // 401 is expected when not logged in - clear any stale tokens
        console.log('🔐 No valid session found, clearing auth data');
        localStorage.removeItem('auth_token');
        setUser(null);
        return null;
      } else {
        console.warn('Unexpected auth response:', response.status);
        // Don't change user state on unexpected errors
        return user;
      }
    } catch (error) {
      console.warn('Auth fetch error:', error.message);
      // Don't change user state on network errors
      return user;
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
        case 'session_invalid':
          console.log('🚪 Session invalidated, logging out');
          setUser(null);
          setRequires2FA(false);
          setTempToken(null);
          setLoading(false);
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

  const login = useCallback(async (userData) => {
    
    if (userData) {
      setUser(userData);
      setLoading(false);
      
      // Store session data
      const authToken = localStorage.getItem('auth_token');
      sessionManager.setSessionData(userData, authToken);
    } else {
      // Fetch from session
      const freshUser = await fetchUser();
      if (!freshUser) {
        setLoading(false);
        return false;
      }
      
      // Store session data
      const authToken = localStorage.getItem('auth_token');
      sessionManager.setSessionData(freshUser, authToken);
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

  // Enhanced authenticated request using secureFetch with platform support
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    try {
      console.log(`🌐 Making authenticated request to ${url}`);
      console.log('🔍 Current auth state:', {
        hasUser: !!user,
        userEmail: user?.email,
        isAdmin: user?.is_admin,
        hasToken: !!localStorage.getItem('auth_token')
      });
      
      // First, try with auth token if available
      let requestOptions = { ...options };
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${authToken}`
        };
      }
      
      const response = await secureFetch(url, requestOptions);
      
      if (response.status === 401) {
        console.log('🔄 Got 401, checking session and token...');
        
        // Clear potentially expired token
        localStorage.removeItem('auth_token');
        
        // Check if we still have a valid session with cookies
        let sessionCheck;
        try {
          sessionCheck = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } catch (sessionError) {
          console.error('Session check failed:', sessionError);
          setUser(null);
          throw new Error('Network error during authentication check');
        }
        
        if (sessionCheck.ok) {
          console.log('✅ Session still valid, updating user and retrying request');
          const userData = await sessionCheck.json();
          setUser(userData);
          
          // Update token if provided in response
          if (userData.token) {
            localStorage.setItem('auth_token', userData.token);
            requestOptions.headers = {
              ...requestOptions.headers,
              'Authorization': `Bearer ${userData.token}`
            };
          }
          
          // Retry original request with updated credentials
          const retryResponse = await secureFetch(url, requestOptions);
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            console.error('❌ Retry request failed:', { status: retryResponse.status, error: errorData });
            
            if (retryResponse.status === 401) {
              setUser(null);
              localStorage.removeItem('auth_token');
              throw new Error('Authentication required');
            }
            
            throw new Error(errorData.detail || `HTTP error! status: ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
        } else {
          console.log('❌ Session invalid, logging out');
          console.log('Session check response:', {
            status: sessionCheck.status,
            statusText: sessionCheck.statusText
          });
          
          setUser(null);
          localStorage.removeItem('auth_token');
          await platformDetection.showToast('Session expired. Please login again.', 3000);
          throw new Error('Authentication required');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Request failed:', { status: response.status, error: errorData });
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('🚨 Authenticated request failed:', {
        message: error.message,
        url: url,
        hasUser: !!user,
        hasToken: !!localStorage.getItem('auth_token')
      });
      
      // Enhanced mobile error handling
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        await platformDetection.showToast('Connection failed. Please check your internet connection.', 4000);
      }
      
      throw error;
    }
  }, [user]);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.error('Auth status check failed:', error);
      return false;
    }
  }, []);

  const isAuthenticated = !!user;

  const refetchUser = useCallback(async () => {
    console.log('🔄 Refetching user...');
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Update session data
        const authToken = localStorage.getItem('auth_token');
        sessionManager.setSessionData(userData, authToken);
        
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
  }, []);

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