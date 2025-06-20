import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import '../../styles/header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isAdmin = user && user.is_admin;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const adminMenuItems = [
    { path: '/admin/dashboard', label: '📊 Dashboard', icon: '📊' },
    { path: '/admin/categories-list', label: '📂 Categories', icon: '📂' },
    { path: '/admin/orders', label: '📦 Orders', icon: '📦' },
    { path: '/admin/users', label: '👥 Users', icon: '👥' },
    { path: '/admin/products', label: '🛍️ Products', icon: '🛍️' }
  ];

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
              {/* Admin dropdown */}
              {isAdmin && (
                <div className="admin-dropdown" ref={dropdownRef}>
                  <button
                    className="admin-dropdown-toggle"
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                    aria-expanded={adminDropdownOpen}
                  >
                    Admin ⚙️
                    <span className={`dropdown-arrow ${adminDropdownOpen ? 'open' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {adminDropdownOpen && (
                    <div className="admin-dropdown-menu">
                      {adminMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="admin-dropdown-item"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <span className="dropdown-icon">{item.icon}</span>
                          {item.label.replace(/^📊|📂|📦|👥|🛍️\s/, '')}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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