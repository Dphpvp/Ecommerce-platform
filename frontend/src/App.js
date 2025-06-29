// frontend/src/App.js - Corrected with AuthSlider
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import './index.css';
import './styles/variables.css';
import './styles/main.css';
import './styles/layout.css';
import './styles/utilities.css';
import './styles/components.css';
import './styles/pages/contact.css';
import './styles/base.css';
import './styles/tailoring-theme.css';
import './styles/parallax-enhancements.css';
import './styles/luxury-background.css'; 
import './styles/pages/admin.css';
import './App.css';

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
                <LuxuryNavigation />
                <BackToTop />
                <ParallaxContainer>
                  <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    
                    
                    <main className="main" style={{ flex: '1' }}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        
                        {/* Auth routes using AuthSlider */}
                        <Route path="/login" element={<AuthSlider />} />
                        <Route path="/register" element={<AuthSlider />} />
                        
                        {/* Standalone auth pages */}
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/verify-email" element={<EmailVerification />} />

                        {/* Protected routes */}
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

                        {/* Admin routes */}
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
                        <Route
                          path="/admin/categories-list"
                          element={
                            <AdminRoute>
                              <AdminCategories />
                            </AdminRoute>
                          }
                        />
                      </Routes>
                    </main>
                    
                    <Footer />
                  </div>
                </ParallaxContainer>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    </Elements>
  );
};

export default App;