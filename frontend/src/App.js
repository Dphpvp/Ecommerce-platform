// frontend/src/App.js - Performance Optimized with Code Splitting
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { registerSW, setCallbacks } from './utils/serviceWorker';
import { queryClient, prefetchQueries } from './utils/queryClient';

// UPDATED: New comprehensive luxury theme
import './styles/theme.css';              // Main theme entry point (imports all styles)

// Core providers and components (not lazy loaded for better UX)
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './components/toast';
import { ParallaxContainer } from './components/Parallax';
import Navigation from './components/Navigation/Navigation';
import Footer from './components/Footer/Footer';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import BackToTop from './components/BackToTop';
import LoadingSpinner, { PageSkeleton } from './components/LoadingSpinner';
import { PageSuspense, AdminSuspense, AuthSuspense } from './components/SuspenseBoundary';

// Lazy loaded page components for code splitting
const Home = React.lazy(() => import('./pages/Home'));
const Products = React.lazy(() => import('./pages/Products'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const AuthSlider = React.lazy(() => import('./components/AuthSlider'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Orders = React.lazy(() => import('./pages/Orders'));
const EmailVerification = React.lazy(() => import('./pages/EmailVerification'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));

// Lazy loaded profile component
const Profile = React.lazy(() => import('./components/profile'));

// Lazy loaded admin components (separate chunks)
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const AdminOrders = React.lazy(() => import('./components/admin/AdminOrders'));
const AdminUsers = React.lazy(() => import('./components/admin/AdminUsers'));
const AdminProducts = React.lazy(() => import('./components/admin/AdminProducts'));
const AdminRoute = React.lazy(() => import('./components/admin/AdminRoute'));
const AdminCategories = React.lazy(() => import('./components/admin/AdminCategories'));

// Lazy load Stripe to improve initial bundle size
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
);

// Loading fallback components for different route types
const PageLoadingFallback = () => (
  <div className="page-loading-container">
    <LoadingSpinner size="large" text="Loading page..." />
  </div>
);

const AdminLoadingFallback = () => (
  <div className="admin-loading-container">
    <LoadingSpinner size="medium" text="Loading admin panel..." />
  </div>
);

const AuthLoadingFallback = () => (
  <div className="auth-loading-container">
    <LoadingSpinner size="medium" text="Loading authentication..." />
  </div>
);

const App = () => {
  // Main application component with routing, context providers, and lazy loading
  // Initialize service worker
  useEffect(() => {
    const initServiceWorker = async () => {
      const registered = await registerSW();
      
      if (registered) {
        console.log('✅ Service Worker registered successfully');
        
        // Set up callbacks for SW events
        setCallbacks({
          onUpdateAvailable: () => {
            console.log('🔄 App update available');
            // You can show a toast notification here
            if (window.confirm('A new version is available. Reload to update?')) {
              window.location.reload();
            }
          },
          onOffline: () => {
            console.log('📶 App is offline');
            // Show offline indicator
          },
          onOnline: () => {
            console.log('🌐 App is back online');
            // Hide offline indicator
          }
        });
      }
    };
    
    // Only register SW in production
    if (process.env.NODE_ENV === 'production') {
      initServiceWorker();
    }
    
    // Prefetch important data
    prefetchQueries.categories();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Elements stripe={stripePromise}>
        <ErrorBoundary>
          <Router>
            <AuthProvider>
              <CartProvider>
                <ToastProvider>
                  <div className="app">
                    <Navigation />
                    <BackToTop />
                    <ParallaxContainer>
                    <main className="main">
                      <Routes>
                        {/* Public pages with enhanced Suspense */}
                        <Route path="/" element={
                          <PageSuspense title="home">
                            <Home />
                          </PageSuspense>
                        } />
                        <Route path="/products" element={
                          <PageSuspense title="products">
                            <Products />
                          </PageSuspense>
                        } />
                        <Route path="/about" element={
                          <PageSuspense title="about">
                            <About />
                          </PageSuspense>
                        } />
                        <Route path="/contact" element={
                          <PageSuspense title="contact">
                            <Contact />
                          </PageSuspense>
                        } />
                        
                        {/* Authentication routes */}
                        <Route path="/login" element={
                          <AuthSuspense>
                            <AuthSlider />
                          </AuthSuspense>
                        } />
                        <Route path="/register" element={
                          <AuthSuspense>
                            <AuthSlider />
                          </AuthSuspense>
                        } />
                        <Route path="/reset-password" element={
                          <AuthSuspense>
                            <ResetPassword />
                          </AuthSuspense>
                        } />
                        <Route path="/verify-email" element={
                          <AuthSuspense>
                            <EmailVerification />
                          </AuthSuspense>
                        } />

                        {/* Protected user routes */}
                        <Route path="/cart" element={
                          <PrivateRoute>
                            <PageSuspense title="cart">
                              <Cart />
                            </PageSuspense>
                          </PrivateRoute>
                        } />
                        <Route path="/checkout" element={
                          <PrivateRoute>
                            <PageSuspense title="checkout">
                              <Checkout />
                            </PageSuspense>
                          </PrivateRoute>
                        } />
                        <Route path="/orders" element={
                          <PrivateRoute>
                            <PageSuspense title="orders">
                              <Orders />
                            </PageSuspense>
                          </PrivateRoute>
                        } />
                        <Route path="/profile" element={
                          <PrivateRoute>
                            <PageSuspense title="profile">
                              <Profile />
                            </PageSuspense>
                          </PrivateRoute>
                        } />

                        {/* Admin routes with enhanced loading */}
                        <Route path="/admin/dashboard" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <AdminDashboard />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/orders" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <AdminOrders />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/users" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <AdminUsers />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/products" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <AdminProducts />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/categories-list" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <AdminCategories />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
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
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

export default App;