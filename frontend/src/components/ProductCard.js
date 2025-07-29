// ASOS-Inspired ProductCard Component - Sustainable Fashion
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useToastContext } from './toast';
import Modal from './modal/modal';
import StarRating from './StarRating';
import '../styles/index.css';

const ProductCard = ({ product, viewMode = 'grid' }) => {
  const [showModal, setShowModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToastContext();

  const handleAddToCart = async (e) => {
    e.stopPropagation();

    setIsAdding(true);
    try {
      const success = await addToCart(product._id, 1);
      if (success) {
        setShowCartPopup(true);
        setShowModal(false); // Close product modal if it's open
      } else {
        showToast('Failed to add to cart', 'error');
      }
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();

    setIsAddingToWishlist(true);
    try {
      const productId = product._id || product.id;
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const getStockStatus = () => {
    const stock = product.stock || product.stock_quantity || 0;
    if (stock > 10) return 'in-stock';
    if (stock > 0) return 'low-stock';
    return 'out-of-stock';
  };

  const getStockText = () => {
    const stock = product.stock || product.stock_quantity || 0;
    if (stock > 10) return 'In Stock';
    if (stock > 0) return `${stock} Left`;
    return 'Out of Stock';
  };

  if (viewMode === 'list') {
    return (
      <>
        <div 
          className="product-list-item"
          onClick={() => setShowModal(true)}
        >
          <div className="product-list-image">
            <img 
              src={product.image_url} 
              alt={product.name}
              loading="lazy"
              onError={(e) => {
                e.target.src = '/images/placeholder-product.jpg';
              }}
            />
          </div>

          <div className="product-list-content">
            <div className="product-list-main">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-category">{product.category}</p>
              
              <div className="product-rating">
                <StarRating rating={product.rating || 0} readonly={true} />
                <span className="rating-text">
                  {(product.rating || 0).toFixed(1)} ({product.review_count || 0})
                </span>
              </div>
              
              {product.description && (
                <p className="product-description">{product.description.substring(0, 120)}...</p>
              )}
            </div>
            
            <div className="product-list-price">
              <span className="price">${product.price}</span>
              <span className={`stock-status ${getStockStatus()}`}>
                {getStockText()}
              </span>
            </div>
            
            <div className="product-list-actions">
              <button 
                className={`add-to-cart-btn ${(product.stock || product.stock_quantity || 0) <= 0 ? 'disabled' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(e);
                }}
                disabled={isAdding || (product.stock || product.stock_quantity || 0) <= 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                </svg>
                {isAdding ? 'Adding...' : 
                 (product.stock || product.stock_quantity || 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
              <button 
                className={`add-to-wishlist-btn ${isInWishlist(product._id || product.id) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleWishlistToggle(e);
                }}
                disabled={isAddingToWishlist}
                title={isInWishlist(product._id || product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isInWishlist(product._id || product.id) ? "#e53e3e" : "none"} stroke={isInWishlist(product._id || product.id) ? "#e53e3e" : "currentColor"} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div 
        className="product-card"
        onClick={() => setShowModal(true)}
      >
        <div className="product-image-container">
          <img 
            src={product.image_url} 
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.target.src = '/images/placeholder-product.jpg';
            }}
          />
        </div>

        {/* Product details */}
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-category">{product.category}</p>
          
          <div className="product-rating">
            <StarRating rating={product.rating || 0} readonly={true} />
            <span className="rating-text">
              {(product.rating || 0).toFixed(1)} ({product.review_count || 0})
            </span>
          </div>
          
          <div className="product-price">
            <span className="price">${product.price}</span>
            <span className={`stock-status ${getStockStatus()}`}>
              {getStockText()}
            </span>
          </div>
          
          {/* Action buttons at the bottom of the card */}
          <div className="product-actions">
            <button 
              className={`add-to-cart-btn ${(product.stock || product.stock_quantity || 0) <= 0 ? 'disabled' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(e);
              }}
              disabled={isAdding || (product.stock || product.stock_quantity || 0) <= 0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
              </svg>
              {isAdding ? 'Adding...' : 
               (product.stock || product.stock_quantity || 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            
            <button 
              className={`add-to-wishlist-btn ${isInWishlist(product._id || product.id) ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleWishlistToggle(e);
              }}
              disabled={isAddingToWishlist}
              title={isInWishlist(product._id || product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isInWishlist(product._id || product.id) ? "#e53e3e" : "none"} stroke={isInWishlist(product._id || product.id) ? "#e53e3e" : "currentColor"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {isInWishlist(product._id || product.id) ? 'Wishlist' : 'Wishlist'}
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="modal-glass-container">
          <div className="modal-content-grid">
              <div className="modal-image-section">
                <div className="modal-image-container">
                  <img 
                    src={product.image_url || `https://images.unsplash.com/photo-${1594938328870 + Math.floor(Math.random() * 100)}-${Math.random().toString(36).substr(2, 9)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1594938328870-28d8b92e2c8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="modal-image-overlay"></div>
                </div>
              </div>

              <div className="modal-details-section">
                <div className="modal-header">
                  <div className="modal-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Premium
                  </div>
                  <h2 className="modal-title">{product.name}</h2>
                  <p className="modal-category">{product.category}</p>
                </div>

                {product.description && (
                  <p className="modal-description">{product.description}</p>
                )}

                <div className="modal-specs">
                  <div className="spec-row">
                    <span className="spec-label">Price:</span>
                    <span className="spec-value price">${product.price}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Stock:</span>
                    <span className={`spec-value stock ${getStockStatus()}`}>
                      {getStockText()}
                    </span>
                  </div>
                  {product.material && (
                    <div className="spec-row">
                      <span className="spec-label">Material:</span>
                      <span className="spec-value">{product.material}</span>
                    </div>
                  )}
                  {product.origin && (
                    <div className="spec-row">
                      <span className="spec-label">Origin:</span>
                      <span className="spec-value">{product.origin}</span>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <div className="modal-primary-actions">
                    <button 
                      className={`btn btn-primary ${(product.stock || product.stock_quantity || 0) <= 0 ? 'disabled' : ''}`}
                      onClick={handleAddToCart}
                      disabled={isAdding || (product.stock || product.stock_quantity || 0) <= 0}
                    >
                      <span>{isAdding ? 'Adding...' : 
                       (product.stock || product.stock_quantity || 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                      {!isAdding && (product.stock || product.stock_quantity || 0) > 0 && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                          <circle cx="9" cy="21" r="1"/>
                          <circle cx="20" cy="21" r="1"/>
                        </svg>
                      )}
                    </button>
                    
                    <button 
                      className={`btn btn-secondary wishlist-modal-btn ${isInWishlist(product._id || product.id) ? 'active' : ''}`}
                      onClick={handleWishlistToggle}
                      disabled={isAddingToWishlist}
                    >
                      <span>{isAddingToWishlist ? 'Updating...' : 
                       isInWishlist(product._id || product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isInWishlist(product._id || product.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>
                  
                  <button 
                    className="btn btn-ghost modal-close-btn"
                    onClick={() => setShowModal(false)}
                  >
                    <span>Close</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
        </div>
      </Modal>

      {/* Cart Success Popup */}
      <Modal isOpen={showCartPopup} onClose={() => setShowCartPopup(false)}>
        <div className="cart-popup-container">
          <div className="cart-popup-content">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            
            <h3 className="popup-title">Added to Cart!</h3>
            <p className="popup-message">
              <strong>{product.name}</strong> has been added to your cart successfully.
            </p>
            
            <div className="popup-actions">
              <button 
                className="btn-popup btn-checkout"
                onClick={() => {
                  setShowCartPopup(false);
                  window.location.href = '/checkout';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                </svg>
                Proceed to Checkout
              </button>
              
              <button 
                className="btn-popup btn-continue"
                onClick={() => setShowCartPopup(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductCard;