import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, makeAuthenticatedRequest } = useAuth(); // FIXED: Use user and makeAuthenticatedRequest

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    
    setLoading(true);
    try {
      // FIXED: Use makeAuthenticatedRequest instead of manual fetch
      const data = await makeAuthenticatedRequest(`${API_BASE}/cart`);
      setCartItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      if (error.message === 'Authentication required') {
        setCartItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user, makeAuthenticatedRequest]);

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
      // FIXED: Use makeAuthenticatedRequest
      await makeAuthenticatedRequest(`${API_BASE}/cart/add`, {
        method: 'POST',
        body: JSON.stringify({ 
          product_id: productId, 
          quantity: parseInt(quantity) 
        })
      });

      await fetchCart(); // Refresh cart after adding
      return true;
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
      // FIXED: Use makeAuthenticatedRequest
      await makeAuthenticatedRequest(`${API_BASE}/cart/${itemId}`, {
        method: 'DELETE'
      });

      await fetchCart(); // Refresh cart after removing
      return true;
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
      // FIXED: Use makeAuthenticatedRequest
      await makeAuthenticatedRequest(`${API_BASE}/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: parseInt(newQuantity) })
      });

      await fetchCart();
      return true;
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

  // Fetch cart when user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Clear cart when user logs out
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