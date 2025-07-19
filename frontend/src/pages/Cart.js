import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [isRemoving, setIsRemoving] = useState(null);

  const total = cartItems?.reduce((sum, item) => 
    sum + ((item.product?.price || 0) * (item.quantity || 0)), 0
  ) || 0;

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      return;
    }
    navigate('/checkout');
  };

  const handleRemove = async (itemId) => {
    setIsRemoving(itemId);
    setTimeout(() => {
      removeFromCart(itemId);
      setIsRemoving(null);
    }, 300);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemove(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  return (
    <div className="luxury-cart-page">
      <div className="container">
        {/* Luxury Header Section */}
        <div className="luxury-cart-header">
          <div className="cart-hero-content">
            <div className="cart-badge">Shopping Cart</div>
            <h1 className="cart-title">
              {!cartItems || cartItems.length === 0 ? 'Your Cart Awaits' : 'Your Selection'}
            </h1>
            <p className="cart-subtitle">
              {!cartItems || cartItems.length === 0 
                ? 'Ready to discover luxury pieces that define your style?' 
                : `${cartItems.length} premium ${cartItems.length === 1 ? 'item' : 'items'} selected for your collection`}
            </p>
          </div>
          <div className="cart-hero-decoration">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
        </div>

        
        {!cartItems || cartItems.length === 0 ? (
          <div className="luxury-no-cart">
            <div className="no-cart-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <h3 className="no-cart-title">Your Cart is Empty</h3>
            <p className="no-cart-text">Discover our exquisite collection of luxury items, each piece carefully curated to perfection.</p>
            <Link to="/products" className="btn-luxury-solid">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="luxury-cart-content">
            {/* Cart Items Section */}
            <div className="cart-items-section">
              <div className="section-header">
                <h2 className="section-title">Selected Items</h2>
                <p className="section-subtitle">Review your carefully selected luxury pieces</p>
              </div>
              
              <div className="luxury-cart-items">
                {cartItems?.map(item => (
                  <div 
                    key={item.id} 
                    className={`luxury-cart-item ${isRemoving === item.id ? 'removing' : ''}`}
                  >
                    <div className="cart-item-image-container">
                      <img
                        src={item.product?.image_url || '/images/placeholder-product.jpg'}
                        alt={item.product?.name}
                        className="luxury-cart-item-image"
                        onError={(e) => {
                          e.target.src = '/images/placeholder-product.jpg';
                        }}
                      />
                      <div className="cart-item-badge">Premium</div>
                    </div>
                    
                    <div className="cart-item-details">
                      <h3 className="cart-item-name">{item.product?.name}</h3>
                      <p className="cart-item-description">
                        Expertly crafted with premium materials and attention to detail
                      </p>
                      <div className="cart-item-specs">
                        <div className="spec-item">
                          <span className="spec-label">Unit Price</span>
                          <span className="spec-value">${item.product?.price?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="cart-item-quantity">
                      <label className="quantity-label">Quantity</label>
                      <div className="quantity-controls">
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14"/>
                          </svg>
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="cart-item-total">
                      <span className="total-label">Subtotal</span>
                      <span className="total-value">
                        ${((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="cart-item-remove"
                      disabled={isRemoving === item.id}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary Section */}
            <div className="cart-summary-section">
              <div className="luxury-cart-summary">
                <div className="summary-header">
                  <h3 className="summary-title">Order Summary</h3>
                  <p className="summary-subtitle">Review your order details</p>
                </div>
                
                <div className="summary-details">
                  <div className="summary-row">
                    <span className="summary-label">Items ({cartItems.length})</span>
                    <span className="summary-value">${total.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Shipping</span>
                    <span className="summary-value free">Free</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Tax</span>
                    <span className="summary-value">Calculated at checkout</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row total">
                    <span className="summary-label">Total</span>
                    <span className="summary-value">${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="summary-actions">
                  <button 
                    onClick={handleCheckout} 
                    className="btn-luxury-solid btn-full"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.66 0 3.22.45 4.56 1.24"/>
                    </svg>
                    Proceed to Checkout
                  </button>
                  <Link 
                    to="/products" 
                    className="btn-luxury-outline btn-full"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    Continue Shopping
                  </Link>
                </div>
                
                <div className="cart-benefits">
                  <div className="benefit-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Secure Checkout</span>
                  </div>
                  <div className="benefit-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    </svg>
                    <span>Free Shipping</span>
                  </div>
                  <div className="benefit-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    <span>30-Day Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;