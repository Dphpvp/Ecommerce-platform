import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import '../../styles/index.css';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const { wishlistCount } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const adminMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setIsAdminMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsAdminMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const cartItemCount = cartItems?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Brand */}
        <Link to="/" className="header-brand">
          <img src="/images/logo.png" alt="Vergi Shop" className="header-logo" />
          <span className="brand-text">Vergi Shop</span>
        </Link>

        {/* Main Navigation */}
        <ul className={`nav-main ${isMobileMenuOpen ? 'active' : ''}`}>
          <li>
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/products" 
              className={`nav-link ${isActive('/products') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Products
            </Link>
          </li>
          <li>
            <Link 
              to="/about" 
              className={`nav-link ${isActive('/about') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
          </li>
          <li>
            <Link 
              to="/contact" 
              className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </li>
        </ul>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Search */}
          <button className="search-toggle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* Wishlist */}
          <Link to="/wishlist" className="search-toggle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wishlistCount > 0 && (
              <span className="wishlist-count">{wishlistCount}</span>
            )}
          </Link>

          {/* Admin Dashboard Dropdown (only for admin users) */}
          {user && user.is_admin && (
            <div className={`admin-dropdown ${isAdminMenuOpen ? 'active' : ''}`} ref={adminMenuRef}>
              <button 
                className="admin-dashboard-button" 
                title="Admin Dashboard"
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <rect x="9" y="9" width="6" height="6"/>
                  <path d="M3 9h6"/>
                  <path d="M9 21V9"/>
                </svg>
              </button>
              
              <div className="admin-dropdown-content">
                <div className="admin-dropdown-header">
                  <h3 className="admin-dropdown-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <rect x="9" y="9" width="6" height="6"/>
                      <path d="M3 9h6"/>
                      <path d="M9 21V9"/>
                    </svg>
                    Admin Dashboard
                  </h3>
                  <p className="admin-dropdown-subtitle">Management Tools & Analytics</p>
                </div>

                <div className="admin-menu-section">
                  <h4 className="admin-section-title">Overview</h4>
                  <Link to="/admin/dashboard" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <rect x="9" y="9" width="6" height="6"/>
                      <path d="M3 9h6"/>
                      <path d="M9 21V9"/>
                    </svg>
                    <span className="admin-menu-text">Dashboard</span>
                  </Link>
                </div>

                <div className="admin-menu-section">
                  <h4 className="admin-section-title">Management</h4>
                  <Link to="/admin/orders" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                    </svg>
                    <span className="admin-menu-text">Orders</span>
                  </Link>
                  <Link to="/admin/products" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    <span className="admin-menu-text">Products</span>
                  </Link>
                  <Link to="/admin/users" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span className="admin-menu-text">Users</span>
                  </Link>
                  <Link to="/admin/categories-list" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                    <span className="admin-menu-text">Categories</span>
                  </Link>
                </div>

                <div className="admin-menu-section">
                  <h4 className="admin-section-title">Products</h4>
                  <Link to="/admin/products/new" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span className="admin-menu-text">Add Product</span>
                  </Link>
                  <Link to="/admin/products/import" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span className="admin-menu-text">Import Products</span>
                  </Link>
                  <Link to="/admin/products/bulk-update" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16,18 22,12 16,6"/>
                      <polyline points="8,6 2,12 8,18"/>
                    </svg>
                    <span className="admin-menu-text">Bulk Update</span>
                  </Link>
                </div>

                <div className="admin-menu-section">
                  <h4 className="admin-section-title">Operations</h4>
                  <Link to="/admin/orders/labels" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                      <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                    <span className="admin-menu-text">Order Labels</span>
                  </Link>
                  <Link to="/admin/orders/tracking" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 2v20M14 2v20M4 7l1-3M20 7l-1-3"/>
                    </svg>
                    <span className="admin-menu-text">Order Tracking</span>
                  </Link>
                  <Link to="/admin/users/new" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <line x1="19" y1="8" x2="19" y2="14"/>
                      <line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    <span className="admin-menu-text">Create Admin</span>
                  </Link>
                  <Link to="/admin/users/suspended" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                    <span className="admin-menu-text">Manage Bans</span>
                  </Link>
                </div>

                <div className="admin-menu-section">
                  <h4 className="admin-section-title">Reports</h4>
                  <Link to="/admin/reports/tax" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <span className="admin-menu-text">Tax Reports</span>
                  </Link>
                  <Link to="/admin/payments/pending" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <span className="admin-menu-text">Pending Payments</span>
                  </Link>
                  <Link to="/admin/reports/reconcile" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                    </svg>
                    <span className="admin-menu-text">Reconcile Report</span>
                  </Link>
                </div>

                <div className="admin-menu-section">
                  <h4 className="admin-section-title">Analytics</h4>
                  <Link to="/admin/analytics/daily" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                    </svg>
                    <span className="admin-menu-text">Daily Analytics</span>
                  </Link>
                  <Link to="/admin/analytics/products" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    <span className="admin-menu-text">Product Analytics</span>
                  </Link>
                  <Link to="/admin/analytics/customers" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span className="admin-menu-text">Customer Analytics</span>
                  </Link>
                  <Link to="/admin/analytics/search" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <span className="admin-menu-text">Search Analytics</span>
                  </Link>
                </div>

                <div className="admin-menu-section">
                  <h4 className="admin-section-title">System</h4>
                  <Link to="/admin/system/logs" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <span className="admin-menu-text">System Logs</span>
                  </Link>
                  <Link to="/admin/newsletter/compose" className="admin-menu-item" onClick={() => setIsAdminMenuOpen(false)}>
                    <svg className="admin-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span className="admin-menu-text">Newsletter</span>
                  </Link>
                </div>

                <div className="admin-quick-actions">
                  <div className="admin-quick-grid">
                    <Link to="/admin/products/new" className="admin-quick-btn" onClick={() => setIsAdminMenuOpen(false)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Product
                    </Link>
                    <Link to="/admin/orders" className="admin-quick-btn" onClick={() => setIsAdminMenuOpen(false)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                      </svg>
                      Orders
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account */}
          <Link to={user ? "/profile" : "/login"} className="account-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>

          {/* Cart */}
          <Link to="/cart" className="cart-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
            </svg>
            {cartItemCount > 0 && (
              <span className="cart-count">{cartItemCount}</span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;