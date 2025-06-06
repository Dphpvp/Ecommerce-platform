import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './App.css';

// Import Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';

// Import Components
import Header from './components/header';
import Profile from './components/profile';

// Import Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminOrders from './components/admin/AdminOrders';
import AdminUsers from './components/admin/AdminUsers';
import AdminProducts from './components/admin/AdminProducts';
import AdminRoute from './components/admin/AdminRoute';

// Stripe setup
const stripePromise = loadStripe('pk_test_51RWK32RdyxKMeI2qFdwU5mx0G8jZjt1PcOYpeCILJSwVgLsh3u23xE89kRCs0uezmScF8zCQqG8culYGXpxpScNq006cWwuoGS');

// API base URL
const API_BASE = 'https://ecommerce-platform-nizy.onrender.com/api' || 'http://localhost:8000/api';

// Page Components
const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products?limit=8`);
      const data = await response.json();
      setFeaturedProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <h1>Welcome to E-Shop</h1>
          <p>Discover amazing products at great prices</p>
          <Link to="/products" className="btn btn-primary">Shop Now</Link>
        </div>
      </section>

      <section className="featured-products">
        <div className="container">
          <h2>Featured Products</h2>
          <div className="product-grid">
            {featuredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }
    
    const success = await addToCart(product._id);
    if (success) {
      alert('Added to cart!');
    } else {
      alert('Failed to add to cart');
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

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const url = selectedCategory 
        ? `${API_BASE}/products?category=${selectedCategory}`
        : `${API_BASE}/products`;
      
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data);

      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="products">
      <div className="container">
        <div className="products-header">
          <h1>Products</h1>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const { cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="cart">
      <div className="container">
        <h1>Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.product.image_url} alt={item.product.name} />
                  <div className="item-details">
                    <h3>{item.product.name}</h3>
                    <p>Price: ${item.product.price}</p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Subtotal: ${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="btn btn-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Total: ${total.toFixed(2)}</h3>
              <button onClick={handleCheckout} className="btn btn-primary">
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { cartItems, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
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
      // Create payment intent
      const intentResponse = await fetch(`${API_BASE}/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100) })
      });

      const { client_secret } = await intentResponse.json();

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (error) {
        alert('Payment failed: ' + error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Create order
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
          alert('Order placed successfully!');
          navigate('/orders');
        } else {
          alert('Failed to create order');
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed');
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

const Checkout = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-form">
          <h1>Login</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    address: '',
    phone: ''
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(formData);
    if (success) {
      navigate('/');
    } else {
      alert('Registration failed');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-form">
          <h1>Register</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <button type="submit" className="btn btn-primary">Register</button>
          </form>
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const { token } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="orders">
      <div className="container">
        <h1>My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="no-orders">
            <p>You haven't placed any orders yet.</p>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <h3>Order #{order._id}</h3>
                  <span className={`status ${order.status}`}>{order.status}</span>
                </div>
                <div className="order-details">
                  <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  <p>Total: ${order.total_amount.toFixed(2)}</p>
                  <div className="order-items">
                    <h4>Items:</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <span>{item.product.name} x {item.quantity}</span>
                        <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Main App Component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app">
            <Header />
            <main className="main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Regular User Routes */}
                <Route 
                  path="/cart" 
                  element={
                    <PrivateRoute>
                      <Cart />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/checkout" 
                  element={
                    <PrivateRoute>
                      <Checkout />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/orders" 
                  element={
                    <PrivateRoute>
                      <Orders />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } 
                />

                {/* Admin Routes */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/orders" 
                  element={
                    <AdminRoute>
                      <AdminOrders />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/products" 
                  element={
                    <AdminRoute>
                      <AdminProducts />
                    </AdminRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;