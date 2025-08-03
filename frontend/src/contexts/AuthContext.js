import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour

  const logout = useCallback(async () => {
    try {
      // Use secure auth logout
      await secureAuth.logout();
    } catch (error) {
      console.error('Secure logout error:', error);
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

  // Secure session fetching using secureAuth
  const fetchUser = useCallback(async () => {
    try {
      console.log('🔍 Fetching user session securely...');
      
      const userData = await secureAuth.getCurrentUser();
      
      if (userData) {
        console.log('✅ Secure user session found:', userData.username);
        setUser(userData);
        return userData;
      } else {
        console.log('❌ No valid session');
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('💥 Secure auth fetch error:', error);
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
    console.log('🔐 Secure login called with:', userData ? 'user data' : 'no data');
    
    if (userData) {
      // Validate user data before setting
      if (secureAuth.validateUserData(userData)) {
        setUser(userData);
        setLoading(false);
        
        // Sync with secure auth manager
        secureAuth.user = userData;
      } else {
        console.error('❌ Invalid user data structure');
        setLoading(false);
        return false;
      }
    } else {
      // Fetch from session using secure auth
      const freshUser = await secureAuth.getCurrentUser();
      if (!freshUser) {
        console.error('❌ Login failed: No user data available');
        setLoading(false);
        return false;
      }
      setUser(freshUser);
    }
    
    setRequires2FA(false);
    setTempToken(null);
    return true;
  }, []);

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

  // Secure authenticated request using secureAuth
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    try {
      console.log(`🌐 Making secure request to ${url}`);
      
      // Use secureAuth for all authenticated requests
      const response = await secureAuth.makeSecureRequest(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(secureAuth.sanitizeErrorMessage(errorData.detail || `HTTP error! status: ${response.status}`));
      }
      
      return await response.json();
    } catch (error) {
      console.error('🚨 Secure authenticated request failed:', error);
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

  // Debug logging
  useEffect(() => {
    console.log('🔍 Auth State:', { 
      user: user?.username || 'none', 
      loading, 
      initialized, 
      isAuthenticated 
    });
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