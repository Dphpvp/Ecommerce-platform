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
  
  // Load wishlist from localStorage for guest users
  const loadGuestWishlist = () => {
    try {
      const guestWishlist = localStorage.getItem('guest_wishlist');
      return guestWishlist ? JSON.parse(guestWishlist) : [];
    } catch (error) {
      console.error('Failed to load guest wishlist:', error);
      return [];
    }
  };
  
  // Save wishlist to localStorage for guest users
  const saveGuestWishlist = (items) => {
    try {
      localStorage.setItem('guest_wishlist', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save guest wishlist:', error);
    }
  };

  // Fetch wishlist items
  const fetchWishlist = async () => {
    if (!user) {
      // Load guest wishlist from localStorage
      const guestWishlist = loadGuestWishlist();
      setWishlistItems(guestWishlist);
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
        // Fall back to guest wishlist
        const guestWishlist = loadGuestWishlist();
        setWishlistItems(guestWishlist);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      // Fall back to guest wishlist
      const guestWishlist = loadGuestWishlist();
      setWishlistItems(guestWishlist);
    } finally {
      setLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId) => {
    try {
      if (user) {
        // Authenticated user - save to server
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
      } else {
        // Guest user - save to localStorage
        const currentWishlist = loadGuestWishlist();
        const existingItem = currentWishlist.find(item => 
          (item.product?._id || item.productId) === productId
        );
        
        if (!existingItem) {
          // Fetch product details
          try {
            let productData;
            
            // Use Capacitor HTTP for mobile to avoid CORS issues
            if (window.Capacitor?.isNativePlatform?.()) {
              console.log('📱 Using Capacitor HTTP for wishlist product details request');
              
              const { CapacitorHttp } = window.Capacitor;
              
              const httpResponse = await CapacitorHttp.request({
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
              console.log('🌐 Using regular fetch for wishlist product details request');
              const productResponse = await fetch(`${API_BASE}/products/${productId}`);
              productData = await productResponse.json();
            }
            const newItem = {
              _id: `guest_${Date.now()}`,
              product: productData,
              productId: productId
            };
            currentWishlist.push(newItem);
          } catch (productError) {
            console.error('Failed to fetch product details:', productError);
            // Add minimal item if product fetch fails
            const newItem = {
              _id: `guest_${Date.now()}`,
              product: { _id: productId, name: 'Unknown Product', price: 0 },
              productId: productId
            };
            currentWishlist.push(newItem);
          }
          
          saveGuestWishlist(currentWishlist);
          setWishlistItems(currentWishlist);
          showToast('Item added to wishlist', 'success');
        } else {
          showToast('Item already in wishlist', 'info');
        }
        return true;
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      showToast('Failed to add to wishlist', 'error');
      return false;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId) => {
    try {
      if (user) {
        // Authenticated user
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
      } else {
        // Guest user
        const currentWishlist = loadGuestWishlist();
        const updatedWishlist = currentWishlist.filter(item => 
          (item.product?._id || item.productId) !== productId
        );
        saveGuestWishlist(updatedWishlist);
        setWishlistItems(updatedWishlist);
        showToast('Item removed from wishlist', 'success');
        return true;
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

  // Handle wishlist when user authentication changes
  useEffect(() => {
    if (user) {
      // User logged in - fetch server wishlist and potentially merge with guest wishlist
      const mergeGuestWishlist = async () => {
        const guestWishlist = loadGuestWishlist();
        if (guestWishlist.length > 0) {
          // Add guest items to server wishlist
          for (const item of guestWishlist) {
            try {
              const token = localStorage.getItem('token');
              await fetch(`${API_BASE}/wishlist/add`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId: item.product?._id || item.productId }),
              });
            } catch (error) {
              console.error('Failed to merge guest wishlist item:', error);
            }
          }
          // Clear guest wishlist after merging
          localStorage.removeItem('guest_wishlist');
        }
        // Fetch updated wishlist from server
        fetchWishlist();
      };
      mergeGuestWishlist();
    } else {
      // User logged out - load guest wishlist
      const guestWishlist = loadGuestWishlist();
      setWishlistItems(guestWishlist);
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