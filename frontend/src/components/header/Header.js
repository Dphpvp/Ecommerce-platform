import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import '../../styles/header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const isAdmin = user && user.is_admin;

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <img
            src="/images/logo.png"
            alt="Vergi Shop Logo"
            className="logo-img"
          />
          <span className="logo-text"></span>
        </Link>

        <nav className="nav">
          {/* Navigation in requested order */}
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/about">About Us</Link>

          {user ? (
            <>
              {/* Admin navigation */}
              {isAdmin && (
                <>
                  <Link to="/admin/dashboard" className="admin-link">Dashboard</Link>
                  <Link to="/admin/categories-list" className="admin-link">Categories</Link>
                  <Link to="/admin/orders" className="admin-link">Orders</Link>
                  <Link to="/admin/users" className="admin-link">Users</Link>
                  <Link to="/admin/products" className="admin-link">Products</Link>
                </>
              )}

              {/* Cart for regular users */}
              {!isAdmin && (
                <Link to="/cart" className="cart-link">
                  Cart ({cartItems.length})
                </Link>
              )}

              {/* User profile/logout */}
              {!isAdmin && (
                <>
                  <Link to="/orders">My Orders</Link>
                  <Link to="/profile">Profile</Link>
                </>
              )}

              <button
                onClick={logout}
                className="user-logout-btn"
                title="Click to logout"
              >
                {user.username}
                {isAdmin && <span className="admin-badge">ADMIN</span>}
              </button>
            </>
          ) : (
            <>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;