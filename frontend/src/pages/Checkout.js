import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../components/toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const Checkout = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { cartItems, clearCart } = useCart();
  const { user, makeAuthenticatedRequest, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      showToast('Please log in to complete your order', 'error');
      navigate('/login?redirect=/checkout');
    }
  }, [user, authLoading, navigate, showToast]);

  const total = cartItems?.reduce((sum, item) => 
    sum + ((item.product?.price || 0) * (item.quantity || 0)), 0
  ) || 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    
    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    if (!user) {
      setError('Please log in to complete your order');
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setError('Your cart is empty');
      navigate('/cart');
      return;
    }
    
    setProcessing(true);

    try {
      // FIXED: Use correct payment endpoint path
      const intentData = await makeAuthenticatedRequest(`${API_BASE}/orders/payment/create-intent`, {
        method: 'POST',
        body: JSON.stringify({ amount: Math.round(total * 100) })
      });

      const { client_secret } = intentData;

      if (!client_secret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment with Stripe
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order with proper authentication
        try {
          const orderData = await makeAuthenticatedRequest(`${API_BASE}/orders`, {
            method: 'POST',
            body: JSON.stringify({
              shipping_address: shippingAddress,
              payment_method: 'card',
              payment_intent_id: paymentIntent.id
            })
          });

          // Success - clear cart and redirect
          clearCart();
          showToast('Order placed successfully!', 'success');
          navigate(`/orders`);
          
        } catch (orderError) {
          console.error('Order creation failed:', orderError);
          setError(`Order creation failed: ${orderError.message}`);
          
          // Payment succeeded but order failed - show specific error
          showToast('Payment processed but order creation failed. Please contact support.', 'error');
        }
      } else {
        throw new Error('Payment was not completed successfully');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.message || 'Checkout failed. Please try again.');
      showToast(error.message || 'Checkout failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="checkout">
        <div className="container">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="checkout">
        <div className="container">
          <h1>Redirecting to login...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-checkout-page">
      <div className="container">
        <div className="checkout-header">
          <h1 className="checkout-title">Checkout</h1>
          <p className="checkout-description">Complete your order securely</p>
        </div>
        
        {error && (
          <div className="error-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}
        
        <div className="checkout-layout">
          {/* Order Summary */}
          <div className="order-summary-section">
            <div className="summary-card">
              <div className="summary-header">
                <h3>Order Summary</h3>
                <span className="item-count">{cartItems.length} items</span>
              </div>
              
              <div className="summary-items">
                {cartItems.map(item => (
                  <div key={item.id} className="summary-item">
                    <div className="item-image">
                      <img
                        src={item.product?.image_url || '/images/placeholder-product.jpg'}
                        alt={item.product?.name}
                        onError={(e) => {
                          e.target.src = '/images/placeholder-product.jpg';
                        }}
                      />
                    </div>
                    <div className="item-details">
                      <h4>{item.product.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                    </div>
                    <div className="item-price">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="summary-totals">
                <div className="total-line">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Shipping</span>
                  <span className="free">Free</span>
                </div>
                <div className="total-line">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="total-line final">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-section">
                <div className="section-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <h3>Shipping Address</h3>
                </div>
                
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Street Address</label>
                    <input
                      type="text"
                      placeholder="Enter your street address"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      placeholder="Zip Code"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      placeholder="Country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  <h3>Payment Information</h3>
                </div>
                
                <div className="payment-card">
                  <label>Card Details</label>
                  <div className="card-element-wrapper">
                    <CardElement 
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#374151',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            '::placeholder': {
                              color: '#9ca3af',
                            },
                          },
                          invalid: {
                            color: '#ef4444',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="checkout-actions">
                <button 
                  type="submit" 
                  disabled={!stripe || processing || !cartItems || cartItems.length === 0}
                  className="checkout-btn"
                >
                  {processing ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      Complete Order • ${total.toFixed(2)}
                    </>
                  )}
                </button>
                
                <div className="security-notice">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.66 0 3.22.45 4.56 1.24"/>
                  </svg>
                  <span>Secured by Stripe • Your payment information is encrypted</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;