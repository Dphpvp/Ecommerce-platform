import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Changed from token to user for session auth

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/cart`, {
        credentials: 'include', // Use session cookies
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCartItems(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        // User not authenticated
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
      const response = await fetch(`${API_BASE}/cart/add`, {
        method: 'POST',
        credentials: 'include', // Use session cookies
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          product_id: productId, 
          quantity: parseInt(quantity) 
        })
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart after adding
        return true;
      } else {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to add to cart:', error.detail);
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
      const response = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'DELETE',
        credentials: 'include', // Use session cookies
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart after removing
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
      const response = await fetch(`${API_BASE}/cart/${itemId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
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