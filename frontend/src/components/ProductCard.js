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
    if (product.stock_quantity > 10) return 'in-stock';
    if (product.stock_quantity > 0) return 'low-stock';
    return 'out-of-stock';
  };

  const getStockText = () => {
    if (product.stock_quantity > 10) return 'In Stock';
    if (product.stock_quantity > 0) return `${product.stock_quantity} Left`;
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
        <div className="product-modal-content">
          <div className="product-modal-image">
            <img 
              src={product.image_url} 
              alt={product.name}
              onError={(e) => {
                e.target.src = '/images/placeholder-product.jpg';
              }}
            />
          </div>

          <div className="product-modal-details">
            <div className="modal-header">
              <h2 className="modal-product-name">{product.name}</h2>
              <span className="modal-category">{product.category}</span>
            </div>

            {product.description && (
              <p className="modal-description">{product.description}</p>
            )}

            <div className="modal-specifications">
              <div className="spec-item">
                <span className="spec-label">Price</span>
                <span className="spec-value">${product.price}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Category</span>
                <span className="spec-value">{product.category}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Availability</span>
                <span className={`spec-value ${
                  product.stock_quantity > 10 ? 'text-green' :
                  product.stock_quantity > 0 ? 'text-yellow' : 'text-red'
                }`}>
                  {getStockText()}
                </span>
              </div>
              {product.material && (
                <div className="spec-item">
                  <span className="spec-label">Material</span>
                  <span className="spec-value">{product.material}</span>
                </div>
              )}
              {product.origin && (
                <div className="spec-item">
                  <span className="spec-label">Origin</span>
                  <span className="spec-value">{product.origin}</span>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className={`btn-modal-add-cart ${product.stock_quantity <= 0 ? 'disabled' : ''}`}
                onClick={handleAddToCart}
                disabled={isAdding || product.stock_quantity <= 0}
              >
                {isAdding ? 'Adding...' : 
                 product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <a 
                href="/contact" 
                className="btn-modal-contact"
                onClick={(e) => e.stopPropagation()}
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductCard;