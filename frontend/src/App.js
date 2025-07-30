// frontend/src/App.js - Performance Optimized with Code Splitting
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { registerSW, setCallbacks } from './utils/serviceWorker';
import { queryClient, prefetchQueries } from './utils/queryClient';
import notificationService from './utils/notificationService';

// ASOS-Inspired Sustainable Fashion Theme
import './styles/index.css';              // Complete theme system with all imports

// Core providers and components (not lazy loaded for better UX)
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ToastProvider } from './components/toast';
import { ParallaxContainer } from './components/Parallax';
import Navigation from './components/Navigation';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import BackToTop from './components/BackToTop';
import LoadingSpinner, { PageSkeleton } from './components/LoadingSpinner';
import { PageSuspense, AdminSuspense, AuthSuspense } from './components/SuspenseBoundary';

// Lazy loaded page components for code splitting
const Home = React.lazy(() => import('./pages/Home'));
const Products = React.lazy(() => import('./pages/Products'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const AuthSlider = React.lazy(() => import('./components/AuthSlider'));
const AnimatedAuthForm = React.lazy(() => import('./components/AnimatedAuthForm'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Orders = React.lazy(() => import('./pages/Orders'));
const EmailVerification = React.lazy(() => import('./pages/EmailVerification'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const SharedWishlist = React.lazy(() => import('./pages/SharedWishlist'));

// Lazy loaded profile component
const Profile = React.lazy(() => import('./components/profile'));

// Lazy loaded admin components (separate chunks)
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const AdminOrders = React.lazy(() => import('./components/admin/AdminOrders'));
const AdminUsers = React.lazy(() => import('./components/admin/AdminUsers'));
const AdminProducts = React.lazy(() => import('./components/admin/AdminProducts'));
const AddProduct = React.lazy(() => import('./components/admin/AddProduct'));
const ProductImport = React.lazy(() => import('./components/admin/ProductImport'));
const AdminRoute = React.lazy(() => import('./components/admin/AdminRoute'));
const AdminCategories = React.lazy(() => import('./components/admin/AdminCategories'));

// Additional admin components
const BulkUpdateProducts = React.lazy(() => import('./components/admin/BulkUpdateProducts'));
const OrderLabels = React.lazy(() => import('./components/admin/OrderLabels'));
const OrderTracking = React.lazy(() => import('./components/admin/OrderTracking'));
const CreateAdmin = React.lazy(() => import('./components/admin/CreateAdmin'));
const ManageBans = React.lazy(() => import('./components/admin/ManageBans'));
const TaxReport = React.lazy(() => import('./components/admin/TaxReport'));
const PendingPayments = React.lazy(() => import('./components/admin/PendingPayments'));
const ReconcileReport = React.lazy(() => import('./components/admin/ReconcileReport'));
const SystemLogs = React.lazy(() => import('./components/admin/SystemLogs'));
const DailyAnalytics = React.lazy(() => import('./components/admin/DailyAnalytics'));
const ProductAnalytics = React.lazy(() => import('./components/admin/ProductAnalytics'));
const CustomerAnalytics = React.lazy(() => import('./components/admin/CustomerAnalytics'));
const SearchAnalytics = React.lazy(() => import('./components/admin/SearchAnalytics'));
const NewsletterCompose = React.lazy(() => import('./components/admin/NewsletterCompose'));

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
    
    // Initialize push notifications
    const initNotifications = async () => {
      try {
        await notificationService.initialize();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };
    
    initNotifications();
    
    // Prefetch important data
    prefetchQueries.categories();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Elements stripe={stripePromise}>
        <ErrorBoundary>
          <Router>
            <AuthProvider>
              <ToastProvider>
                <CartProvider>
                  <WishlistProvider>
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
                        <Route path="/shared-wishlist/:shareId" element={
                          <PageSuspense title="shared-wishlist">
                            <SharedWishlist />
                          </PageSuspense>
                        } />
                        
                        {/* Authentication routes */}
                        <Route path="/login" element={
                          <AuthSuspense>
                            <AnimatedAuthForm />
                          </AuthSuspense>
                        } />
                        <Route path="/register" element={
                          <AuthSuspense>
                            <AnimatedAuthForm />
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

                        {/* Public cart and wishlist routes */}
                        <Route path="/cart" element={
                          <PageSuspense title="cart">
                            <Cart />
                          </PageSuspense>
                        } />
                        <Route path="/wishlist" element={
                          <PageSuspense title="wishlist">
                            <Wishlist />
                          </PageSuspense>
                        } />
                        
                        {/* Protected user routes */}
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
                        <Route path="/admin/products/new" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <AddProduct />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/products/import" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <ProductImport />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/products/bulk-update" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <BulkUpdateProducts />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/orders/labels" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <OrderLabels />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/orders/tracking" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <OrderTracking />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/users/new" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <CreateAdmin />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/users/suspended" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <ManageBans />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/reports/tax" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <TaxReport />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/payments/pending" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <PendingPayments />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/reports/reconcile" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <ReconcileReport />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/system/logs" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <SystemLogs />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/analytics/daily" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <DailyAnalytics />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/analytics/products" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <ProductAnalytics />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/analytics/customers" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <CustomerAnalytics />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/analytics/search" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <SearchAnalytics />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                        <Route path="/admin/newsletter/compose" element={
                          <AdminSuspense>
                            <AdminRoute>
                              <NewsletterCompose />
                            </AdminRoute>
                          </AdminSuspense>
                        } />
                      </Routes>
                    </main>
                  </ParallaxContainer>
                  </div>
                  </WishlistProvider>
                </CartProvider>
              </ToastProvider>
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