import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, makeAuthenticatedRequest } = useAuth();
  
  // Load cart from localStorage for guest users
  const loadGuestCart = useCallback(() => {
    try {
      const guestCart = localStorage.getItem('guest_cart');
      return guestCart ? JSON.parse(guestCart) : [];
    } catch (error) {
      console.error('Failed to load guest cart:', error);
      return [];
    }
  }, []);
  
  // Save cart to localStorage for guest users
  const saveGuestCart = useCallback((items) => {
    try {
      localStorage.setItem('guest_cart', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save guest cart:', error);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (!user) {
      // Load guest cart from localStorage
      const guestCart = loadGuestCart();
      setCartItems(guestCart);
      return;
    }
    
    setLoading(true);
    try {
      // For authenticated users, fetch from server
      const data = await makeAuthenticatedRequest(`${API_BASE}/cart`);
      setCartItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      if (error.message === 'Authentication required') {
        // Fall back to guest cart
        const guestCart = loadGuestCart();
        setCartItems(guestCart);
      }
    } finally {
      setLoading(false);
    }
  }, [user, makeAuthenticatedRequest, loadGuestCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!productId || quantity < 1) {
      console.error('Invalid product ID or quantity');
      return false;
    }

    try {
      if (user) {
        // Authenticated user - save to server
        await makeAuthenticatedRequest(`${API_BASE}/cart/add`, {
          method: 'POST',
          body: JSON.stringify({ 
            product_id: productId, 
            quantity: parseInt(quantity) 
          })
        });
        await fetchCart();
      } else {
        // Guest user - save to localStorage
        const currentCart = loadGuestCart();
        const existingItemIndex = currentCart.findIndex(item => 
          (item.product?._id || item.product_id) === productId
        );
        
        if (existingItemIndex > -1) {
          // Update existing item quantity
          currentCart[existingItemIndex].quantity += parseInt(quantity);
        } else {
          // Add new item - we'll need to fetch product details
          try {
            let productData;
            
            // Use Capacitor HTTP for mobile to avoid CORS issues
            if (window.Capacitor?.Plugins?.CapacitorHttp) {
              console.log('📱 Using Capacitor HTTP for product details request');
              
              const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
                url: `${API_BASE}/products/${productId}`,
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                }
              });
              
              if (httpResponse.status >= 200 && httpResponse.status < 300) {
                productData = httpResponse.data;
              } else {
                throw new Error(`HTTP Error: ${httpResponse.status}`);
              }
            } else {
              // Use regular fetch for web
              console.log('🌐 Using regular fetch for product details request');
              const productResponse = await fetch(`${API_BASE}/products/${productId}`);
              productData = await productResponse.json();
            }
            currentCart.push({
              _id: `guest_${Date.now()}`,
              product: productData,
              product_id: productId,
              quantity: parseInt(quantity)
            });
          } catch (productError) {
            console.error('Failed to fetch product details:', productError);
            // Add minimal item if product fetch fails
            currentCart.push({
              _id: `guest_${Date.now()}`,
              product: { _id: productId, name: 'Unknown Product', price: 0 },
              product_id: productId,
              quantity: parseInt(quantity)
            });
          }
        }
        
        saveGuestCart(currentCart);
        setCartItems(currentCart);
      }
      return true;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    if (!itemId) {
      console.warn('Invalid item ID');
      return false;
    }

    try {
      if (user) {
        // Authenticated user
        await makeAuthenticatedRequest(`${API_BASE}/cart/${itemId}`, {
          method: 'DELETE'
        });
        await fetchCart();
      } else {
        // Guest user
        const currentCart = loadGuestCart();
        const updatedCart = currentCart.filter(item => item._id !== itemId);
        saveGuestCart(updatedCart);
        setCartItems(updatedCart);
      }
      return true;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      return false;
    }
  };

  const updateCartItemQuantity = async (itemId, newQuantity) => {
    if (!itemId || newQuantity < 1) {
      return false;
    }

    try {
      if (user) {
        // Authenticated user
        await makeAuthenticatedRequest(`${API_BASE}/cart/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity: parseInt(newQuantity) })
        });
        await fetchCart();
      } else {
        // Guest user
        const currentCart = loadGuestCart();
        const itemIndex = currentCart.findIndex(item => item._id === itemId);
        if (itemIndex > -1) {
          currentCart[itemIndex].quantity = parseInt(newQuantity);
          saveGuestCart(currentCart);
          setCartItems(currentCart);
        }
      }
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

  // Handle cart when user authentication changes
  useEffect(() => {
    if (!user) {
      // User logged out - load guest cart
      const guestCart = loadGuestCart();
      setCartItems(guestCart);
    } else {
      // User logged in - fetch server cart and potentially merge with guest cart
      const mergeGuestCart = async () => {
        const guestCart = loadGuestCart();
        if (guestCart.length > 0) {
          // Add guest items to server cart
          for (const item of guestCart) {
            try {
              await makeAuthenticatedRequest(`${API_BASE}/cart/add`, {
                method: 'POST',
                body: JSON.stringify({ 
                  product_id: item.product?._id || item.product_id, 
                  quantity: parseInt(item.quantity) 
                })
              });
            } catch (error) {
              console.error('Failed to merge guest cart item:', error);
            }
          }
          // Clear guest cart after merging
          localStorage.removeItem('guest_cart');
        }
        // Fetch updated cart from server
        fetchCart();
      };
      mergeGuestCart();
    }
  }, [user, loadGuestCart, fetchCart, makeAuthenticatedRequest]);

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