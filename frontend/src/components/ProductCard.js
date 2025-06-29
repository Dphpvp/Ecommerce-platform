import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from './toast';
import Modal from './modal/modal';
import '../styles/components/LuxuryProducts.css';
import '../styles/pages/products.css'; 

const fabricImages = [
  '1594736797933-d0401ba2fe65', // Fabric rolls
  '1566146340949-72de7aa8ed26', // Tailoring workspace
  '1581833971358-2c8b550f87b3', // Sewing machine
  '1578662996443-48f949d9e1cc', // Fabric textures
  '1560472354-bb2ecca2c5c9', // Luxury fabrics
  '1558618666-fcd25c85cd64', // Wool fabric
  '1573855619003-a1d7d9c6d2d5', // Cotton fabric
  '1593062096033-9a26b2ae0d4c', // Silk fabric
  '1566207732320-45beff2f7ad0', // Leather texture
  '1582542021108-bdb97845f21b', // Denim fabric
  '1504594843904-e4b2a3ed1ff0', // Linen fabric
  '1566156596628-24ad1d6e03de'  // Velvet fabric
];

const getRandomFabricImage = () => {
  return fabricImages[Math.floor(Math.random() * fabricImages.length)];
};

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please login to add items to cart', 'error');
      return;
    }
    
    try {
      const success = await addToCart(product._id, 1);
      if (success) {
        showToast('Added to cart!', 'success');
      } else {
        showToast('Failed to add to cart', 'error');
      }
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    }
  };

  return (
    <>
      <div className="luxury-product-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="product-image-container-compact">
          <img 
            src={product.image_url || `https://images.unsplash.com/photo-${getRandomFabricImage()}?w=300&h=200&fit=crop&auto=format`} 
            alt={product.name}
            onError={(e) => {
              e.target.src = `https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&auto=format`;
            }}
          />
          <div className="product-overlay-compact">
            <span className="view-details">👁 View Details</span>
          </div>
        </div>
        
        <div className="luxury-product-info-compact">
          <h3 className="product-name-compact">{product.name}</h3>
          <span className="product-category-compact">{product.category}</span>
          
          <div className="price-stock-compact">
            <div className="price-section-compact">
              <span className="currency">$</span>
              <span className="price-amount-compact">{product.price}</span>
            </div>
            
            <div className={`stock-dot-compact ${product.stock > 10 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock'}`}></div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="product-modal-content">
          <div className="product-modal-image">
            <img 
              src={product.image_url || `https://images.unsplash.com/photo-${getRandomFabricImage()}?w=500&h=400&fit=crop&auto=format`} 
              alt={product.name}
            />
          </div>
          
          <div className="product-modal-details">
            <div className="modal-header">
              <h2 className="modal-product-name">{product.name}</h2>
              <span className="modal-category">{product.category}</span>
            </div>
            
            <p className="modal-description">
              {product.description || 'Premium quality fabric for discerning clientele. Expertly crafted with attention to detail and superior materials.'}
            </p>
            
            <div className="modal-specifications">
              <div className="spec-item">
                <span className="spec-label">Material:</span>
                <span className="spec-value">{product.category}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Price:</span>
                <span className="spec-value">${product.price} per yard</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Availability:</span>
                <span className={`spec-value ${product.stock > 10 ? 'text-green' : product.stock > 0 ? 'text-yellow' : 'text-red'}`}>
                  {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `${product.stock} yards left` : 'Out of Stock'}
                </span>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
                className={`btn-modal-add-cart ${product.stock === 0 ? 'disabled' : ''}`}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
              <button className="btn-modal-contact">
                Contact for Custom Order
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductCard;