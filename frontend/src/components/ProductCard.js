import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from './toast';
import '../styles/components/LuxuryProducts.css';
import '../styles/ProductForm.css';

// Random fabric/tailoring images from Unsplash
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
    <div className="luxury-product-card">
      <div className="product-image-container">
        <img 
          src={product.image_url || `https://images.unsplash.com/photo-${getRandomFabricImage()}?w=400&h=280&fit=crop&auto=format`} 
          alt={product.name}
          onError={(e) => {
            e.target.src = `https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=280&fit=crop&auto=format`;
          }}
        />
        <div className="product-overlay">
          <div className="overlay-content">
            <span className="fabric-type">{product.category}</span>
          </div>
        </div>
      </div>
      
      <div className="luxury-product-info">
        <div className="product-header">
          <h3 className="product-name">{product.name}</h3>
          <div className="product-meta">
            <span className="product-category">{product.category}</span>
          </div>
        </div>
        
        <p className="product-description">
          {product.description ? product.description.substring(0, 100) + '...' : 'Premium quality fabric for discerning clientele.'}
        </p>
        
        <div className="product-details">
          <div className="price-stock-container">
            <div className="price-section">
              <span className="currency">$</span>
              <span className="price-amount">{product.price}</span>
              <span className="price-unit">per yard</span>
            </div>
            
            <div className="stock-section">
              <div className={`stock-indicator ${product.stock > 10 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                <span className="stock-dot"></span>
                <span className="stock-text">
                  {product.stock > 10 ? 'In Stock' : 
                   product.stock > 0 ? `${product.stock} left` : 
                   'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="product-actions">
          <button 
            onClick={handleAddToCart}
            className={`btn-luxury-add-cart ${product.stock === 0 ? 'disabled' : ''}`}
            disabled={product.stock === 0}
          >
            <span className="btn-icon">
              {product.stock === 0 ? '⊘' : '🛒'}
            </span>
            <span className="btn-text">
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </span>
          </button>
          
          <button className="btn-luxury-details">
            <span className="btn-icon">👁</span>
            <span className="btn-text">View Details</span>
          </button>
        </div>
      </div>
      
      {/* Luxury corner accent */}
      <div className="luxury-corner-accent"></div>
    </div>
  );
};

export default ProductCard;