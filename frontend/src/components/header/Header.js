import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import '../../styles/components/header.css'; 

const Header = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const location = useLocation();
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const isAdmin = user && user.is_admin;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAdminDropdownOpen(false);
  }, [location]);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/products', label: 'Collection', icon: '👔' },
    { path: '/about', label: 'Heritage', icon: '🏛️' },
    { path: '/contact', label: 'Atelier', icon: '📍' }
  ];

  const adminMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/categories-list', label: 'Categories', icon: '📂' },
    { path: '/admin/orders', label: 'Orders', icon: '📦' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/products', label: 'Products', icon: '🛍️' }
  ];

  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className={`luxury-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <img
            src="/images/logo.png"
            alt="Bespoke Tailoring"
            className="logo-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span className="logo-text" style={{ display: 'none' }}>
            Bespoke Tailoring
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Desktop User Actions */}
        <div className="desktop-actions">
          {user ? (
            <>
              {/* Admin Dropdown */}
              {isAdmin && (
                <div className="admin-dropdown" ref={dropdownRef}>
                  <button
                    className="admin-toggle"
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                    aria-expanded={adminDropdownOpen}
                  >
                    <span className="admin-icon">⚙️</span>
                    <span>Admin</span>
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
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* User Menu */}
              {!isAdmin && (
                <>
                  <Link to="/cart" className="cart-button">
                    <span className="cart-icon">🛒</span>
                    <span className="cart-text">Cart</span>
                    {cartItems.length > 0 && (
                      <span className="cart-badge">{cartItems.length}</span>
                    )}
                  </Link>

                  <Link to="/orders" className="nav-action">
                    <span className="action-icon">📋</span>
                    <span>Orders</span>
                  </Link>

                  <Link to="/profile" className="nav-action">
                    <span className="action-icon">👤</span>
                    <span>Profile</span>
                  </Link>
                </>
              )}

              <button onClick={handleLogout} className="logout-button">
                <span className="logout-icon">👋</span>
                <span>{user.username}</span>
                {isAdmin && <span className="admin-badge">Admin</span>}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="auth-button">
                <span className="auth-icon">🔑</span>
                <span>Login</span>
              </Link>
              <Link to="/register" className="auth-button primary">
                <span className="auth-icon">✨</span>
                <span>Register</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className="menu-line"></span>
          <span className="menu-line"></span>
          <span className="menu-line"></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
        ref={mobileMenuRef}
      >
        <div className="mobile-menu-content">
          {/* Mobile Navigation */}
          <nav className="mobile-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${isActiveRoute(item.path) ? 'active' : ''}`}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-text">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile User Actions */}
          <div className="mobile-actions">
            {user ? (
              <>
                {/* Admin Menu */}
                {isAdmin && (
                  <div className="mobile-admin-section">
                    <h3 className="mobile-section-title">
                      <span className="section-icon">⚙️</span>
                      Administration
                    </h3>
                    {adminMenuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="mobile-admin-link"
                      >
                        <span className="mobile-admin-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* User Menu */}
                {!isAdmin && (
                  <div className="mobile-user-section">
                    <Link to="/cart" className="mobile-cart-link">
                      <span className="mobile-cart-icon">🛒</span>
                      <span>Shopping Cart</span>
                      {cartItems.length > 0 && (
                        <span className="mobile-cart-badge">{cartItems.length}</span>
                      )}
                    </Link>

                    <Link to="/orders" className="mobile-action-link">
                      <span className="mobile-action-icon">📋</span>
                      <span>My Orders</span>
                    </Link>

                    <Link to="/profile" className="mobile-action-link">
                      <span className="mobile-action-icon">👤</span>
                      <span>Profile</span>
                    </Link>
                  </div>
                )}

                <div className="mobile-user-info">
                  <div className="user-display">
                    <span className="user-avatar">👤</span>
                    <div className="user-details">
                      <span className="user-name">{user.full_name || user.username}</span>
                      {isAdmin && <span className="mobile-admin-badge">Administrator</span>}
                    </div>
                  </div>
                  <button onClick={handleLogout} className="mobile-logout">
                    <span className="logout-icon">👋</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="mobile-auth-section">
                <Link to="/login" className="mobile-auth-button">
                  <span className="mobile-auth-icon">🔑</span>
                  <span>Sign In</span>
                </Link>
                <Link to="/register" className="mobile-auth-button primary">
                  <span className="mobile-auth-icon">✨</span>
                  <span>Create Account</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;