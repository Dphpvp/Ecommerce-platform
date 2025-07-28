import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../components/toast';
import ProductCard from '../components/ProductCard';
import '../styles/index.css';

const Wishlist = () => {
  const { wishlistItems, loading, clearWishlist } = useWishlist();
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const generateShareableLink = async () => {
    if (wishlistItems.length === 0) {
      showToast('Your wishlist is empty! Add some items first.', 'info');
      return;
    }

    setIsGeneratingLink(true);
    try {
      // Create a shareable link with wishlist items
      const shareData = {
        items: wishlistItems.map(item => ({
          id: item._id || item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url
        })),
        createdAt: new Date().toISOString(),
        createdBy: user?.username || 'Anonymous'
      };

      // Generate a unique ID for the shared wishlist
      const shareId = btoa(JSON.stringify(shareData)).replace(/[+/=]/g, (m) => ({'+': '-', '/': '_', '=': ''})[m]);
      const shareableUrl = `${window.location.origin}/shared-wishlist/${shareId}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareableUrl);
      showToast('Wishlist link copied to clipboard! Share it with friends.', 'success');
    } catch (error) {
      console.error('Error generating shareable link:', error);
      showToast('Failed to generate shareable link. Please try again.', 'error');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Allow wishlist access without authentication for guest users

  if (loading) {
    return (
      <div className="page-container">
        <div className="wishlist-page">
          <div className="wishlist-header">
            <h1 className="wishlist-title">My Wishlist</h1>
          </div>
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="wishlist-page">
        {/* Wishlist Header */}
        <div className="wishlist-header">
          <div className="wishlist-title-section">
            <h1 className="wishlist-title">
              My Wishlist
              <span className="wishlist-count">({wishlistItems.length})</span>
            </h1>
            <p className="wishlist-subtitle">
              Save items you love and shop them later
            </p>
          </div>
          {wishlistItems.length > 0 && (
            <div className="wishlist-actions">
              <button 
                className="btn btn-secondary share-wishlist-btn"
                onClick={generateShareableLink}
                disabled={isGeneratingLink}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16,6 12,2 8,6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                {isGeneratingLink ? 'Generating...' : 'Share Wishlist'}
              </button>
              <button 
                className="btn btn-ghost clear-wishlist-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
                    clearWishlist();
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                </svg>
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Content */}
        {wishlistItems.length === 0 ? (
          <div className="wishlist-empty">
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <h2>Your wishlist is empty</h2>
              <p>Start browsing and save items you love to your wishlist</p>
              <div className="empty-actions">
                <Link to="/products" className="btn btn-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  Browse Products
                </Link>
                <Link to="/" className="btn btn-secondary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlistItems.map((item) => (
              <ProductCard 
                key={item._id || item.id} 
                product={item.product || item} 
              />
            ))}
          </div>
        )}

        {/* Wishlist Features */}
        {wishlistItems.length > 0 && (
          <div className="wishlist-features">
            <div className="feature-cards">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3>Secure & Private</h3>
                <p>Your wishlist is private and secure</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                </div>
                <h3>Price Alerts</h3>
                <p>Get notified when items go on sale</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <h3>Share with Friends</h3>
                <p>Share your wishlist for gift ideas</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;