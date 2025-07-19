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
    <div className="modern-cart-page">
      <div className="container">
        {/* Header Section */}
        <div className="cart-header">
          <h1 className="cart-main-title">Shopping Cart</h1>
          <p className="cart-description">
            {cartItems && cartItems.length > 0 
              ? `${cartItems.length} item${cartItems.length === 1 ? '' : 's'} in your cart`
              : 'Your cart is currently empty'
            }
          </p>
        </div>

        {!cartItems || cartItems.length === 0 ? (
          <div className="empty-cart-container">
            <div className="empty-cart-content">
              <div className="empty-cart-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                </svg>
              </div>
              <h2>Your cart is empty</h2>
              <p>Add some products to get started with your order</p>
              <Link to="/products" className="btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div className="cart-items-container">
              <div className="cart-items-header">
                <h2>Items in your cart</h2>
              </div>
              
              <div className="cart-items-list">
                {cartItems?.map(item => (
                  <div 
                    key={item.id} 
                    className={`cart-item ${isRemoving === item.id ? 'removing' : ''}`}
                  >
                    <div className="item-image">
                      <img
                        src={item.product?.image_url || '/images/placeholder-product.jpg'}
                        alt={item.product?.name}
                        onError={(e) => {
                          e.target.src = '/images/placeholder-product.jpg';
                        }}
                      />
                    </div>
                    
                    <div className="item-info">
                      <h3 className="item-name">{item.product?.name}</h3>
                      <p className="item-price">${item.product?.price?.toFixed(2)} each</p>
                    </div>
                    
                    <div className="item-quantity">
                      <button 
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="quantity-btn"
                        aria-label="Decrease quantity"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14"/>
                        </svg>
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="quantity-btn"
                        aria-label="Increase quantity"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="item-total">
                      <span className="total-price">
                        ${((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="remove-btn"
                      disabled={isRemoving === item.id}
                      aria-label="Remove item"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <div className="summary-card">
                <h3 className="summary-title">Order Summary</h3>
                
                <div className="summary-details">
                  <div className="summary-line">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="summary-line">
                    <span>Shipping</span>
                    <span className="free">Free</span>
                  </div>
                  <div className="summary-line">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-line total">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleCheckout} 
                  className="checkout-btn"
                >
                  Proceed to Checkout
                </button>
                
                <Link 
                  to="/products" 
                  className="continue-shopping"
                >
                  Continue Shopping
                </Link>
                
                <div className="trust-badges">
                  <div className="badge">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Secure checkout</span>
                  </div>
                  <div className="badge">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    </svg>
                    <span>Free shipping</span>
                  </div>
                  <div className="badge">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    <span>Easy returns</span>
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