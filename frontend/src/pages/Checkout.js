import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../components/toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

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
      const intentData = await makeAuthenticatedRequest(`${API_BASE}/payment/create-intent`, {
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
    <div className="checkout">
      <div className="container">
        <h1>Checkout</h1>
        
        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        
        <div className="checkout-content">
          <div className="order-summary">
            <h3>Order Summary</h3>
            {cartItems.map(item => (
              <div key={item.id} className="order-item">
                <span>{item.product.name} x {item.quantity}</span>
                <span>${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="order-total">
              <strong>Total: ${total.toFixed(2)}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="shipping-section">
              <h3>Shipping Address</h3>
              <input
                type="text"
                placeholder="Street Address"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="City"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="State"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Zip Code"
                value={shippingAddress.zipCode}
                onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Country"
                value={shippingAddress.country}
                onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                required
              />
            </div>

            <div className="payment-section">
              <h3>Payment Information</h3>
              <div className="card-element">
                <CardElement 
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!stripe || processing || !cartItems || cartItems.length === 0}
              className="btn btn-primary"
            >
              {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;