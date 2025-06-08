import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import './App.css';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './components/toast';

import Header from './components/header';
import PrivateRoute from './components/PrivateRoute';
import Profile from './components/profile';

import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';

import AdminDashboard from './components/admin/AdminDashboard';
import AdminOrders from './components/admin/AdminOrders';
import AdminUsers from './components/admin/AdminUsers';
import AdminProducts from './components/admin/AdminProducts';
import AdminRoute from './components/admin/AdminRoute';
import AdminCategories from './components/admin/AdminCategories';

<Route path="/admin/categories-list" element={<AdminRoute><AdminCategories /></AdminRoute>} />

const stripePromise = loadStripe(
  "pk_test_51RWK32RdyxKMeI2qFdwU5mx0G8jZjt1PcOYpeCILJSwVgLsh3u23xE89kRCs0uezmScF8zCQqG8culYGXpxpScNq006cWwuoGS"
);

const App = () => {
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <div className="app">
                <Header />
                <main className="main">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

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
                          <CategoryList />
                        </AdminRoute>
                      }
                    />
                  </Routes>
                </main>
              </div>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </Elements>
  );
};

export default App;