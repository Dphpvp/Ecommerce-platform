import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCsrfToken(null);
    setLoading(false);
  }, []);

  const fetchCSRFToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/csrf-token`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrf_token);
        return data.csrf_token;
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
    return null;
  }, []);

  const apiRequest = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
      let currentCsrfToken = csrfToken;
      if (!currentCsrfToken) {
        currentCsrfToken = await fetchCSRFToken();
      }
      if (currentCsrfToken) {
        headers['X-CSRF-Token'] = currentCsrfToken;
      }
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
  }, [token, csrfToken, fetchCSRFToken]);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching user with token:', token);
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User data received:', userData);
        setUser(userData);
      } else {
        console.log('Auth failed, logging out');
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    fetchUser();
    fetchCSRFToken();
  }, [fetchUser, fetchCSRFToken]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    setLoading(false);
    fetchCSRFToken(); // Get CSRF token after login
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await apiRequest(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
        }
        return true;
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
    setLoading(false);
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      loading, 
      apiRequest,
      csrfToken,
      fetchCSRFToken
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