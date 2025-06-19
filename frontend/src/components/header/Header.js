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
          {user ? (
            <>
              {isAdmin ? (
                // Admin navigation only
                <>
                  <Link to="/admin/dashboard">Dashboard</Link>
                  <Link to="/admin/categories-list">Categories</Link>
                  <Link to="/admin/orders">Orders</Link>
                  <Link to="/admin/users">Users</Link>
                  <Link to="/admin/products">Products</Link>
                  <Link to="/profile">Profile</Link>
                  
                  <button
                    onClick={logout}
                    className="nav-link logout-btn"
                  >
                    Logout ({user.username})
                  </button>
                </>
              ) : (
                // Regular user navigation
                <>
                  <Link to="/">Home</Link>
                  <Link to="/products">Products</Link>
                  <Link to="/contact">Contact Us</Link>
                  <Link to="/about">About Us</Link>
                  <Link to="/cart" className="cart-link">
                    Cart ({cartItems.length})
                  </Link>
                  <Link to="/orders">My Orders</Link>
                  <Link to="/profile">Profile</Link>
                  
                  <button
                    onClick={logout}
                    className="nav-link logout-btn"
                  >
                    Logout ({user.username})
                  </button>
                </>
              )}
            </>
          ) : (
            // Guest navigation
            <>
              <Link to="/">Home</Link>
              <Link to="/products">Products</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/about">About Us</Link>
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