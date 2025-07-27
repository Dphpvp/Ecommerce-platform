import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToastContext } from '../components/toast';

const WishlistContext = createContext();

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToastContext();

  // Fetch wishlist items
  const fetchWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.items || []);
      } else {
        console.error('Failed to fetch wishlist');
        setWishlistItems([]);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId) => {
    if (!user) {
      showToast('Please login to add items to wishlist', 'error');
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/wishlist/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.items || []);
        showToast('Item added to wishlist', 'success');
        return true;
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to add to wishlist', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      showToast('Failed to add to wishlist', 'error');
      return false;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId) => {
    if (!user) {
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/wishlist/remove`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.items || []);
        showToast('Item removed from wishlist', 'success');
        return true;
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to remove from wishlist', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showToast('Failed to remove from wishlist', 'error');
      return false;
    }
  };

  // Check if item is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product?._id === productId || item.productId === productId);
  };

  // Clear entire wishlist
  const clearWishlist = async () => {
    if (!user) {
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/wishlist/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setWishlistItems([]);
        showToast('Wishlist cleared', 'success');
        return true;
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to clear wishlist', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      showToast('Failed to clear wishlist', 'error');
      return false;
    }
  };

  // Fetch wishlist when user changes
  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    fetchWishlist,
    wishlistCount: wishlistItems.length,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};