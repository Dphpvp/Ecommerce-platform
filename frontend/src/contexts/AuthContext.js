import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  
  // Auto-logout state
  const timeoutRef = useRef(null);
  const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour

  const logout = useCallback(async () => {
    try {
      // FIXED: Use session-based logout
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'GET',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setRequires2FA(false);
      setTempToken(null);
      setLoading(false);
      
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

  // FIXED: Enhanced fetch function with proper error handling
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include', // CRITICAL for session cookies
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return userData;
      } else if (response.status === 401) {
        // Not authenticated - this is normal
        setUser(null);
        return null;
      } else {
        console.error('Failed to fetch user:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // FIXED: Session-based login
  const login = useCallback(async (userData) => {
    if (userData) {
      setUser(userData);
    } else {
      // If no userData provided, fetch from session
      await fetchUser();
    }
    setRequires2FA(false);
    setTempToken(null);
    setLoading(false);
  }, [fetchUser]);

  // FIXED: 2FA completion handler
  const complete2FA = useCallback(async () => {
    setRequires2FA(false);
    setTempToken(null);
    // Fetch user data from established session
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

  // FIXED: Session-based registration
  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include', // Include cookies for session
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

  // FIXED: Enhanced authentication helpers
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    const defaultOptions = {
      credentials: 'include', // Always include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (response.status === 401) {
        // Session expired or invalid
        setUser(null);
        throw new Error('Authentication required');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  }, []);

  // FIXED: Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      const userData = await fetchUser();
      return !!userData;
    } catch (error) {
      console.error('Auth status check failed:', error);
      return false;
    }
  }, [fetchUser]);

  // Helper to determine if user is authenticated
  const isAuthenticated = !!user;

  // Debug function for troubleshooting
  const debugAuth = useCallback(() => {
    console.log('Auth Debug Info:', {
      user: user ? { id: user.id, email: user.email } : null,
      loading,
      requires2FA,
      tempToken: !!tempToken,
      isAuthenticated,
      cookies: document.cookie
    });
  }, [user, loading, requires2FA, tempToken, isAuthenticated]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token: null, // Session-based, no token needed
      getToken: () => null, // Session-based auth
      login, 
      register, 
      logout, 
      loading,
      requires2FA,
      tempToken,
      handle2FARequired,
      complete2FA,
      refetchUser: fetchUser,
      makeAuthenticatedRequest,
      checkAuthStatus,
      isAuthenticated,
      debugAuth // For debugging
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