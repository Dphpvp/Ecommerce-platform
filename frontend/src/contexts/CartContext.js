import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
console.log('Cart API_BASE:', API_BASE);

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { token } = useAuth();

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
}, [token]); // Add missing closing parenthesis and dependency array

  const addToCart = async (productId, quantity = 1) => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
  try {
    const response = await fetch(`${API_BASE}/cart/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
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
  fetchCart();
}, [fetchCart]); 

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