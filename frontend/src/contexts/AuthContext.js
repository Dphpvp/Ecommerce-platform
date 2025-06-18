import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    
    setLoading(true);
    try {
      // Try with both cookie and token
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setCartItems(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        setCartItems([]);
      } else {
        console.error('Failed to fetch cart:', response.status);
        setCartItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      console.warn('User not authenticated');
      return false;
    }

    if (!productId || quantity < 1) {
      console.error('Invalid product ID or quantity');
      return false;
    }

    try {
      // Use token from localStorage if available
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/cart/add`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ 
          product_id: productId, 
          quantity: parseInt(quantity) 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchCart();
        return true;
      } else {
        console.error('Failed to add to cart:', data.detail || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user || !itemId) {
      console.warn('User not authenticated or invalid item ID');
      return false;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      });

      if (response.ok) {
        await fetchCart();
        return true;
      } else {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to remove from cart:', error.detail);
        return false;
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      return false;
    }
  };

  const updateCartItemQuantity = async (itemId, newQuantity) => {
    if (!user || !itemId || newQuantity < 1) {
      return false;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({ quantity: parseInt(newQuantity) })
      });

      if (response.ok) {
        await fetchCart();
        return true;
      } else {
        console.error('Failed to update cart item quantity');
        return false;
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      return false;
    }
  };

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  }, [cartItems]);

  const getCartItemsCount = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
  }, [cartItems]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (!user) {
      setCartItems([]);
    }
  }, [user]);

  const contextValue = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    fetchCart,
    getCartTotal,
    getCartItemsCount,
    isAuthenticated: !!user
  };

  return (
    <CartContext.Provider value={contextValue}>
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