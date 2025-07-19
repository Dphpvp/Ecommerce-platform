import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { secureFetch } from '../utils/csrf';
import platformDetection from '../utils/platformDetection';

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
  const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour

  const logout = useCallback(async () => {
    try {
      await secureFetch(`${API_BASE}/auth/logout`, {
        method: 'GET'
      });
      
      // Show platform-appropriate logout message
      await platformDetection.showToast('Logged out successfully', 2000);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setRequires2FA(false);
      setTempToken(null);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, []);

  const resetTimeout = useCallback(() => {
    if (!user) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('Auto-logout due to inactivity');
      logout();
    }, TIMEOUT_DURATION);
  }, [user, logout, TIMEOUT_DURATION]);

  const handleActivity = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    resetTimeout();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, handleActivity, resetTimeout]);

  // Better session fetching with proper state management
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User session found:', userData.username);
        setUser(userData);
        return userData;
      } else if (response.status === 401) {
        // 401 is expected when not logged in - no need to log as error
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

  // FIXED: Only fetch user once on initialization
  useEffect(() => {
    if (!initialized) {
      fetchUser();
    }
  }, [fetchUser, initialized]);

  const login = useCallback(async (userData) => {
    
    if (userData) {
      setUser(userData);
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 Making authenticated request to ${url}`);
      }
      
      const response = await secureFetch(url, options);
      
      if (response.status === 401) {
        console.log('🔄 Got 401, checking session...');
        
        // Check if we still have a valid session
        const sessionCheck = await secureFetch(`${API_BASE}/auth/me`, {
          method: 'GET'
        });
        
        if (sessionCheck.ok) {
          console.log('✅ Session still valid, retrying request');
          const userData = await sessionCheck.json();
          setUser(userData);
          
          // Retry original request
          const retryResponse = await secureFetch(url, options);
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
        } else {
          console.log('❌ Session invalid, logging out');
          setUser(null);
          await platformDetection.showToast('Session expired. Please login again.', 3000);
          throw new Error('Authentication required');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('🚨 Authenticated request failed:', error);
      
      // Enhanced mobile error handling
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        await platformDetection.showToast('Connection failed. Please check your internet connection.', 4000);
      }
      
      throw error;
    }
  }, []);

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
        return userData;
      } else {
        console.log('❌ Refetch failed, clearing user');
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
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
      initialized // Add this for components to check if auth is ready
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