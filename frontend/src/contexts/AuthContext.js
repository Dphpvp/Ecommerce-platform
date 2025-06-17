import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Auto-logout state
  const timeoutRef = useRef(null);
  const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  const logout = useCallback(async () => {
    try {
      // Use GET to avoid CORS preflight issues
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'GET',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if request fails
    } finally {
      setUser(null);
      setRequires2FA(false);
      setTempToken(null);
      setLoading(false);
      
      // Clear auto-logout timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, []);

  // Auto-logout functions
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

  // Activity event listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the initial timeout
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

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        // Session expired or invalid
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Don't logout on network errors, only on auth errors
    } finally {
      setLoading(false);
    }
  }, []);

  // Check user session on app load
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = (userData) => {
    setUser(userData);
    setRequires2FA(false);
    setTempToken(null);
    setLoading(false);
  };

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
      return { success: false, message: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Get token for API calls that still need it (backward compatibility)
  const getToken = useCallback(() => {
    // For session-based auth, we don't expose tokens
    // The session cookie handles authentication
    return null;
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token: null, // No longer expose token
      getToken,
      login, 
      register, 
      logout, 
      loading,
      requires2FA,
      tempToken,
      handle2FARequired,
      refetchUser: fetchUser
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