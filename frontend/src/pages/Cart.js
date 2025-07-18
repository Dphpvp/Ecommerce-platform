// Revolutionary Cart Page - Spectacular Shopping Experience
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [isRemoving, setIsRemoving] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="cart-page">
      {/* Revolutionary Cart Hero Section */}
      <section className="hero-revolutionary cart-hero">
        <div className="hero-bg-revolutionary">
          <div 
            className="hero-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1578662996443-48f949d9e1cc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.5}px)`
            }}
          ></div>
          <div className="hero-overlay-revolutionary"></div>
        </div>
        <div className="hero-content-revolutionary">
          <div className="hero-glass-card">
            <div className="hero-badge-revolutionary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
              </svg>
              Your Selection
            </div>
            <h1 className="hero-title-revolutionary">
              {!cartItems || cartItems.length === 0 ? 'Your Cart Awaits' : 'Shopping Cart'}
            </h1>
            <p className="hero-subtitle-revolutionary">
              {!cartItems || cartItems.length === 0 
                ? 'Ready to discover luxury pieces that define your style?' 
                : `${cartItems.length} premium ${cartItems.length === 1 ? 'item' : 'items'} selected for your collection`}
            </p>
          </div>
        </div>
      </section>

      {/* Cart Content Section */}
      <section className="cart-content-revolutionary">
        <div className="container">
          {!cartItems || cartItems.length === 0 ? (
            <div className="empty-cart-revolutionary">
              <div className="empty-cart-icon-revolutionary">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                </svg>
              </div>
              <h2 className="empty-cart-title-revolutionary">Your Cart Awaits</h2>
              <p className="empty-cart-subtitle-revolutionary">
                Discover our exquisite collection of luxury items, each piece carefully curated to perfection.
              </p>
              <div className="empty-cart-actions-revolutionary">
                <Link to="/products" className="btn-revolutionary btn-luxury-revolutionary">
                  <span>Explore Collection</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link to="/" className="btn-revolutionary btn-glass-revolutionary">
                  <span>Return Home</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className="cart-content-grid-revolutionary">
              {/* Cart Items */}
              <div className="cart-items-revolutionary">
                <div className="cart-header-revolutionary">
                  <h2 className="cart-title-revolutionary">Selected Items</h2>
                  <p className="cart-subtitle-revolutionary">
                    Review your carefully selected luxury pieces
                  </p>
                </div>
                
                <div className="cart-items-list-revolutionary">
                  {cartItems?.map(item => (
                    <div 
                      key={item.id} 
                      className={`cart-item-revolutionary ${isRemoving === item.id ? 'removing' : ''}`}
                    >
                      <div className="cart-item-image-revolutionary">
                        <div 
                          className="cart-item-image-bg"
                          style={{
                            backgroundImage: `url(${item.product?.image_url || `https://images.unsplash.com/photo-${1594938328870 + Math.floor(Math.random() * 100)}-${Math.random().toString(36).substr(2, 9)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80`})`
                          }}
                        ></div>
                        <div className="cart-item-badge-revolutionary">
                          Premium
                        </div>
                      </div>
                      
                      <div className="cart-item-details-revolutionary">
                        <h3 className="cart-item-name-revolutionary">{item.product?.name}</h3>
                        <p className="cart-item-description-revolutionary">
                          Expertly crafted with premium materials and attention to detail
                        </p>
                        <div className="cart-item-price-revolutionary">
                          <span className="cart-item-price-label">Unit Price:</span>
                          <span className="cart-item-price-value">${item.product?.price}</span>
                        </div>
                      </div>
                      
                      <div className="cart-item-quantity-revolutionary">
                        <label className="quantity-label-revolutionary">Quantity</label>
                        <div className="quantity-controls-revolutionary">
                          <button 
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="quantity-btn-revolutionary"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14"/>
                            </svg>
                          </button>
                          <span className="quantity-value-revolutionary">{item.quantity}</span>
                          <button 
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="quantity-btn-revolutionary"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="cart-item-total-revolutionary">
                        <span className="cart-item-total-label">Subtotal:</span>
                        <span className="cart-item-total-value">
                          ${((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleRemove(item.id)}
                        className="cart-item-remove-revolutionary"
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

              {/* Cart Summary */}
              <div className="cart-summary-revolutionary">
                <div className="cart-summary-card-revolutionary">
                  <h3 className="cart-summary-title-revolutionary">Order Summary</h3>
                  
                  <div className="cart-summary-details-revolutionary">
                    <div className="summary-row-revolutionary">
                      <span className="summary-label-revolutionary">Items ({cartItems.length}):</span>
                      <span className="summary-value-revolutionary">${total.toFixed(2)}</span>
                    </div>
                    <div className="summary-row-revolutionary">
                      <span className="summary-label-revolutionary">Shipping:</span>
                      <span className="summary-value-revolutionary free">Free</span>
                    </div>
                    <div className="summary-row-revolutionary">
                      <span className="summary-label-revolutionary">Tax:</span>
                      <span className="summary-value-revolutionary">Calculated at checkout</span>
                    </div>
                    <div className="summary-divider-revolutionary"></div>
                    <div className="summary-row-revolutionary total">
                      <span className="summary-label-revolutionary">Total:</span>
                      <span className="summary-value-revolutionary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="cart-summary-actions-revolutionary">
                    <button 
                      onClick={handleCheckout} 
                      className="btn-revolutionary btn-luxury-revolutionary btn-full"
                    >
                      <span>Proceed to Checkout</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                    <Link 
                      to="/products" 
                      className="btn-revolutionary btn-glass-revolutionary btn-full"
                    >
                      <span>Continue Shopping</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                      </svg>
                    </Link>
                  </div>
                  
                  <div className="cart-benefits-revolutionary">
                    <div className="benefit-item-revolutionary">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      <span>Secure Checkout</span>
                    </div>
                    <div className="benefit-item-revolutionary">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      </svg>
                      <span>Free Shipping</span>
                    </div>
                    <div className="benefit-item-revolutionary">
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
      </section>
    </div>
  );
};

export default Cart;

// Revolutionary Cart Page Complete with:
// - Spectacular hero section with parallax effects
// - Elegant cart items with premium styling
// - Interactive quantity controls
// - Luxury order summary with glassmorphism
// - Professional empty cart state
// - Smooth animations and transitions
// - Mobile-responsive design
// - High-quality stock imagery integration