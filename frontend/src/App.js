// frontend/src/App.js - Updated with proper luxury theme imports
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// UPDATED: Comprehensive CSS imports for luxury theme
import './styles/variables.css';           // CSS variables first
import './styles/main.css';               // Core styles
import './styles/styles.css'              // Main style
import './App.css';                       // App-specific styles

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './components/toast';
import { ParallaxContainer } from './components/Parallax';

import LuxuryNavigation from './components/LuxuryNavigation/LuxuryNavigation';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import Profile from './components/profile';
import ErrorBoundary from './components/ErrorBoundary';
import BackToTop from './components/BackToTop';

import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AuthSlider from './components/AuthSlider';
import ResetPassword from './pages/ResetPassword';
import Orders from './pages/Orders';
import EmailVerification from './pages/EmailVerification';
import About from './pages/About';
import Contact from './pages/Contact';

import AdminDashboard from './components/admin/AdminDashboard';
import AdminOrders from './components/admin/AdminOrders';
import AdminUsers from './components/admin/AdminUsers';
import AdminProducts from './components/admin/AdminProducts';
import AdminRoute from './components/admin/AdminRoute';
import AdminCategories from './components/admin/AdminCategories';

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
);

const App = () => {
  return (
    <Elements stripe={stripePromise}>
      <ErrorBoundary>
        <Router>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <div className="app">
                  <LuxuryNavigation />
                  <BackToTop />
                  <ParallaxContainer>
                    <main className="main">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        
                        <Route path="/login" element={<AuthSlider />} />
                        <Route path="/register" element={<AuthSlider />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/verify-email" element={<EmailVerification />} />

                        <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
                        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

                        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                        <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
                        <Route path="/admin/categories-list" element={<AdminRoute><AdminCategories /></AdminRoute>} />
                      </Routes>
                    </main>
                    <Footer />
                  </ParallaxContainer>
                </div>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    </Elements>
  );
};

export default App;