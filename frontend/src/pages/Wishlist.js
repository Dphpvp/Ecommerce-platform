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
      <div className="modern-wishlist-page">
        <div className="container">
          <div className="wishlist-loading">
            <div className="loading-heart">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h2>Loading Your Wishlist</h2>
            <p>Fetching your favorite items...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalValue = wishlistItems.reduce((sum, item) => {
    const product = item.product || item;
    return sum + (product.price || 0);
  }, 0);

  return (
    <div className="modern-wishlist-page">
      <div className="container">
        {/* Hero Header */}
        <div className="wishlist-hero">
          <div className="hero-content">
            <div className="hero-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="hero-text">
              <h1 className="wishlist-title-modern">
                My Wishlist
                <span className="item-count-badge">{wishlistItems.length}</span>
              </h1>
              <p className="wishlist-subtitle-modern">
                Curate your perfect collection • Save for later • Share with loved ones
              </p>
            </div>
          </div>
          
          {wishlistItems.length > 0 && (
            <div className="wishlist-stats">
              <div className="stat-item">
                <span className="stat-number">{wishlistItems.length}</span>
                <span className="stat-label">Items Saved</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">${totalValue.toFixed(0)}</span>
                <span className="stat-label">Total Value</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        {wishlistItems.length > 0 && (
          <div className="wishlist-actions-bar">
            <div className="actions-left">
              <button className="action-btn primary" onClick={generateShareableLink} disabled={isGeneratingLink}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16,6 12,2 8,6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                {isGeneratingLink ? 'Creating Link...' : 'Share Collection'}
              </button>
              <button className="action-btn secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
                </svg>
                Create List
              </button>
            </div>
            <div className="actions-right">
              <button 
                className="action-btn danger"
                onClick={() => {
                  if (window.confirm('Remove all items from your wishlist? This action cannot be undone.')) {
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
          </div>
        )}

        {/* Main Content */}
        {wishlistItems.length === 0 ? (
          <div className="wishlist-empty-modern">
            <div className="empty-state-modern">
              <div className="empty-illustration">
                <div className="floating-hearts">
                  <div className="heart heart-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                  <div className="heart heart-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                  <div className="heart heart-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                </div>
                <div className="empty-main-icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
              </div>
              <div className="empty-content">
                <h2>Your Heart's Empty</h2>
                <p>Start building your dream collection by saving items you absolutely love</p>
                <div className="empty-features">
                  <div className="feature-tag">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Private & Secure</span>
                  </div>
                  <div className="feature-tag">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    </svg>
                    <span>Price Tracking</span>
                  </div>
                  <div className="feature-tag">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    <span>Easy Sharing</span>
                  </div>
                </div>
                <div className="empty-actions-modern">
                  <Link to="/products" className="cta-btn primary-cta">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <line x1="9" y1="9" x2="9.01" y2="9"/>
                      <line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                    Discover Amazing Products
                  </Link>
                  <Link to="/" className="cta-btn secondary-cta">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    </svg>
                    Browse Homepage
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="wishlist-grid-modern">
              {wishlistItems.map((item, index) => (
                <div key={item._id || item.id} className="wishlist-item-wrapper" style={{animationDelay: `${index * 100}ms`}}>
                  <ProductCard product={item.product || item} />
                </div>
              ))}
            </div>

            {/* Enhanced Features Section */}
            <div className="wishlist-features-modern">
              <div className="features-header">
                <h3>Why You'll Love Your Wishlist</h3>
                <p>More than just saving items - it's your personal style curator</p>
              </div>
              <div className="features-grid">
                <div className="feature-card-modern">
                  <div className="feature-icon-modern">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <h4>Private & Secure</h4>
                  <p>Your wishlist is completely private. Only you can see what you've saved unless you choose to share.</p>
                </div>
                <div className="feature-card-modern">
                  <div className="feature-icon-modern">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 01-3.46 0"/>
                    </svg>
                  </div>
                  <h4>Smart Price Alerts</h4>
                  <p>Get notified when your wishlist items go on sale. Never miss a deal on something you love.</p>
                </div>
                <div className="feature-card-modern">
                  <div className="feature-icon-modern">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </div>
                  <h4>Share & Collaborate</h4>
                  <p>Share your wishlist with friends and family. Perfect for gift occasions and style inspiration.</p>
                </div>
                <div className="feature-card-modern">
                  <div className="feature-icon-modern">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 19c-5 0-8-2.6-8-5.5C1 11 3 9 5 9c.6 0 1.2.1 1.8.3C7.5 6.4 9.6 4 12 4s4.5 2.4 5.2 5.3c.6-.2 1.2-.3 1.8-.3 2 0 4 2 4 4.5C23 16.4 20 19 15 19H9z"/>
                    </svg>
                  </div>
                  <h4>Cloud Sync</h4>
                  <p>Access your wishlist from any device. Your saved items are always with you, wherever you shop.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;