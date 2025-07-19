// frontend/src/components/ProductCard.js - Updated with luxury styling
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from './toast';
import Modal from './modal/modal';

const ProductCard = ({ product }) => {
  const [showModal, setShowModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToastContext();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      showToast('Please login to add items to cart', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const success = await addToCart(product._id, 1);
      if (success) {
        showToast('Added to cart successfully!', 'success');
      } else {
        showToast('Failed to add to cart', 'error');
      }
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    } finally {
      setIsAdding(false);
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

  return (
    <>
      <div 
        className="luxury-product-card-compact"
        onClick={() => setShowModal(true)}
      >
        <div className="product-image-container-compact">
          <img 
            src={product.image_url} 
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.target.src = '/images/placeholder-product.jpg';
            }}
          />
          <div className="product-overlay-compact">
            <span>View Details</span>
          </div>
        </div>

        <div className="luxury-product-info-compact">
          <h3 className="product-name-compact">{product.name}</h3>
          <p className="product-category-compact">{product.category}</p>
          
          <div className="price-stock-compact">
            <div className="price-section-compact">
              <span className="currency">$</span>
              <span className="price-amount-compact">{product.price}</span>
            </div>
            <div className={`stock-dot-compact ${getStockStatus()}`} 
                 title={getStockText()}>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="product-modal-revolutionary">
          <div className="modal-glass-container">
            <button 
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            
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
                  <button 
                    className={`btn-revolutionary btn-luxury-revolutionary ${(product.stock || product.stock_quantity || 0) <= 0 ? 'disabled' : ''}`}
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
                  <a 
                    href="/contact" 
                    className="btn-revolutionary btn-glass-revolutionary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Contact Us</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductCard;