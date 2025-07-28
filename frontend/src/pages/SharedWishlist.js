import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import ProductCard from '../components/ProductCard';
import '../styles/index.css';

const SharedWishlist = () => {
  const { shareId } = useParams();
  const { showToast } = useToastContext();
  const [wishlistData, setWishlistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSharedWishlist = () => {
      try {
        setLoading(true);
        
        // Decode the shared wishlist data
        const normalizedShareId = shareId.replace(/[-_]/g, (m) => ({'-': '+', '_': '/'})[m]);
        const padding = '='.repeat((4 - normalizedShareId.length % 4) % 4);
        const decodedData = JSON.parse(atob(normalizedShareId + padding));
        
        setWishlistData(decodedData);
      } catch (error) {
        console.error('Error loading shared wishlist:', error);
        setError('Invalid or corrupted wishlist link');
        showToast('Failed to load shared wishlist. The link may be invalid.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      loadSharedWishlist();
    }
  }, [shareId, showToast]);

  const copyWishlistLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Wishlist link copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy link to clipboard', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="wishlist-page">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading shared wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !wishlistData) {
    return (
      <div className="page-container">
        <div className="wishlist-page">
          <div className="wishlist-empty">
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 9v3m0 3h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <h2>Wishlist Not Found</h2>
              <p>This shared wishlist link is invalid or has expired.</p>
              <div className="empty-actions">
                <Link to="/products" className="btn btn-primary">
                  Browse Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { items, createdBy, createdAt } = wishlistData;
  const createdDate = new Date(createdAt).toLocaleDateString();

  return (
    <div className="page-container">
      <div className="wishlist-page">
        {/* Shared Wishlist Header */}
        <div className="wishlist-header">
          <div className="wishlist-title-section">
            <h1 className="wishlist-title">
              {createdBy}'s Wishlist
              <span className="wishlist-count">({items.length})</span>
            </h1>
            <p className="wishlist-subtitle">
              Shared on {createdDate} • {items.length} items
            </p>
          </div>
          <div className="wishlist-actions">
            <button 
              className="btn btn-secondary share-wishlist-btn"
              onClick={copyWishlistLink}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Link
            </button>
          </div>
        </div>

        {/* Shared Wishlist Content */}
        {items.length === 0 ? (
          <div className="wishlist-empty">
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <h2>Empty Wishlist</h2>
              <p>This shared wishlist is empty.</p>
              <div className="empty-actions">
                <Link to="/products" className="btn btn-primary">
                  Browse Products
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="wishlist-grid">
            {items.map((item, index) => (
              <div key={item.id || index} className="shared-product-card">
                <div className="product-image-container">
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = '/images/placeholder-product.jpg';
                    }}
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-name">{item.name}</h3>
                  <div className="product-price">
                    <span className="price">${item.price}</span>
                  </div>
                  <div className="product-actions">
                    <Link 
                      to="/products" 
                      className="btn btn-primary"
                      style={{ textDecoration: 'none' }}
                    >
                      View in Store
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="shared-wishlist-cta">
          <h3>Like what you see?</h3>
          <p>Create your own wishlist and start saving your favorite items</p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-primary">
              Create Account
            </Link>
            <Link to="/products" className="btn btn-secondary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedWishlist;