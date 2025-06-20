import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [csrfToken, setCsrfToken] = useState(null);
  const { token } = useAuth();

  const fetchCSRFToken = useCallback(async () => {
    if (!token) return null;
    
    try {
      const response = await fetch(`${API_BASE}/auth/csrf-token`, {
        headers: { Authorization: `Bearer ${token}` }
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
  }, [token]);

  const fetchCart = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } 
  }, [token]);

  const addToCart = async (productId, quantity = 1) => {
    if (!token) return false;

    // Ensure we have CSRF token
    let currentCsrfToken = csrfToken;
    if (!currentCsrfToken) {
      currentCsrfToken = await fetchCSRFToken();
      if (!currentCsrfToken) return false;
    }

    try {
      const response = await fetch(`${API_BASE}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': currentCsrfToken
        },
        body: JSON.stringify({ product_id: productId, quantity })
      });

      if (response.ok) {
        fetchCart();
        return true;
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
    return false;
  };

  const removeFromCart = async (itemId) => {
    if (!token) return;
    
    // Ensure we have CSRF token
    let currentCsrfToken = csrfToken;
    if (!currentCsrfToken) {
      currentCsrfToken = await fetchCSRFToken();
      if (!currentCsrfToken) return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': currentCsrfToken
        }
      });

      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  useEffect(() => {
    if (token) {
      fetchCSRFToken().then(() => {
        fetchCart();
      });
    } else {
      setCartItems([]);
      setCsrfToken(null);
    }
  }, [token, fetchCSRFToken, fetchCart]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};