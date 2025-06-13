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
              {/* Admin-only navigation */}
              {isAdmin && (
                <>
                  <Link to="/admin/dashboard" className="admin-link">
                    Dashboard
                  </Link>
                  <Link to="/admin/categories-list" className="admin-link">
                    Categories
                  </Link>
                  <Link to="/admin/orders" className="admin-link">
                    Orders
                  </Link>
                  <Link to="/admin/users" className="admin-link">
                    Users
                  </Link>
                  <Link to="/admin/products" className="admin-link">
                    Products
                  </Link>
                </>
              )}

              {/* Regular user navigation */}
              {!isAdmin && (
                <>
                  <Link to="/cart" className="cart-link">
                    Cart ({cartItems.length})
                  </Link>
                  <Link to="/orders">My Orders</Link>
                  <Link to="/profile">Profile</Link>
                </>
              )}

              {/* User info and logout */}
              <button
                onClick={logout}
                className="btn btn-outline user-logout-btn"
                title="Logout"
              >
                {user.username}
                {isAdmin && <span className="admin-badge">ADMIN</span>}
              </button>
            </>
          ) : (
            /* Guest navigation */
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;