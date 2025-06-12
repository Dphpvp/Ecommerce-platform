import React, { useState } from 'react';
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
  const { token } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [processing, setProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const total = cartItems.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    setProcessing(true);

    try {
      const intentResponse = await fetch(`${API_BASE}/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100) })
      });

      const { client_secret } = await intentResponse.json();

      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (error) {
        showToast('Payment failed: ' + error.message, 'error');
      } else if (paymentIntent.status === 'succeeded') {
        const orderResponse = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            shipping_address: shippingAddress,
            payment_method: 'card'
          })
        });

        if (orderResponse.ok) {
          clearCart();
          showToast('Order placed successfully!', 'success');
          navigate('/orders');
        } else {
          showToast('Failed to create order', 'error');
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('Checkout failed', 'error');
    }

    setProcessing(false);
  };

  return (
    <div className="checkout">
      <div className="container">
        <h1>Checkout</h1>
        
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
              disabled={!stripe || processing}
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