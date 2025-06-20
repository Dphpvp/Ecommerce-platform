import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from './toast';

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
    <div className="product-card">
      <img src={product.image_url} alt={product.name} />
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">${product.price}</p>
        <p className="stock">Stock: {product.stock}</p>
        <button 
          onClick={handleAddToCart}
          className="btn btn-primary"
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;