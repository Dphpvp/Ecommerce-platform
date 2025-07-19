/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import MobileNavigation from '../MobileNavigation'; // Import the new MobileNavigation component

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    setIsScrolled(scrollTop > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Optionally: show a toast notification for the error
    }
  };

  const isActive = (path) => location.pathname === path;

  const cartItemCount = useMemo(() => {
    return cartItems?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
  }, [cartItems]);

  const navLinks = useMemo(() => [
    { to: '/', text: 'Home' },
    { to: '/products', text: 'Collection' },
    { to: '/about', text: 'About' },
    { to: '/contact', text: 'Contact' },
  ], []);

  const renderUserAvatar = () => {
    if (!user) return null;
    const initials = (user.full_name || user.name || user.email || '?').charAt(0).toUpperCase();
    return (
      <button
        className="user-avatar-revolutionary"
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        aria-label="User menu"
      >
        <span className="avatar-text-revolutionary">{initials}</span>
      </button>
    );
  };

  const renderUserDropdown = () => {
    if (!isUserMenuOpen) return null;

    const dropdownItems = [
      { to: '/profile', text: 'Profile', icon: 'user' },
      { to: '/orders', text: 'Orders', icon: 'box' },
      ...(user?.is_admin ? [{ to: '/admin/dashboard', text: 'Admin', icon: 'settings' }] : []),
    ];

    return (
      <div className="user-dropdown-revolutionary open">
        {dropdownItems.map(item => (
          <Link key={item.to} to={item.to} className="dropdown-item-revolutionary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {/* SVG paths would be dynamic based on item.icon */}
              {item.icon === 'user' && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
              {item.icon === 'box' && <><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/><path d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"/></>}
              {item.icon === 'settings' && <><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></>}
            </svg>
            {item.text}
          </Link>
        ))}
        <button onClick={handleLogout} className="dropdown-item-revolutionary logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Logout
        </button>
      </div>
    );
  };

  const renderAuthButtons = () => {
    if (user) return null;
    return (
      <div className="auth-buttons-revolutionary">
        <Link to="/login" className="btn-revolutionary btn-glass-revolutionary">Login</Link>
        <Link to="/register" className="btn-revolutionary btn-luxury-revolutionary">Register</Link>
      </div>
    );
  };

  const renderMobileMenu = () => {
    if (!isMobileMenuOpen) return null;
    return (
      <div className="mobile-menu-revolutionary">
        <div className="mobile-menu-content-revolutionary">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`mobile-nav-link-revolutionary ${isActive(link.to) ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {/* SVG icons can be added here */}
              {link.text}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/profile" className="mobile-nav-link-revolutionary" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
              <Link to="/orders" className="mobile-nav-link-revolutionary" onClick={() => setIsMobileMenuOpen(false)}>Orders</Link>
              {user.is_admin && <Link to="/admin/dashboard" className="mobile-nav-link-revolutionary" onClick={() => setIsMobileMenuOpen(false)}>Admin</Link>}
              <button onClick={handleLogout} className="mobile-nav-link-revolutionary logout">Logout</button>
            </>
          ) : (
            <div className="mobile-auth-buttons-revolutionary">
              <Link to="/login" className="btn-revolutionary btn-glass-revolutionary btn-full" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn-revolutionary btn-luxury-revolutionary btn-full" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <nav className={`nav-revolutionary ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container-revolutionary">
          <Link to="/" className="nav-logo-revolutionary">
            <img src="/images/logo.png" alt="Vergi Designs" className="nav-logo-image" />
            <span className="nav-logo-text">Vergi Designs</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="nav-menu-revolutionary desktop-only">
            {navLinks.map(link => (
              <li key={link.to} className="nav-item-revolutionary">
                <Link to={link.to} className={`nav-link-revolutionary ${isActive(link.to) ? 'active' : ''}`}>
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-actions-revolutionary">
            <Link to="/cart" className="nav-cart-revolutionary">
              <div className="cart-icon-revolutionary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                </svg>
              </div>
              {cartItemCount > 0 && <span className="nav-cart-count-revolutionary">{cartItemCount}</span>}
            </Link>

            {user ? (
              <div className="user-menu-revolutionary">
                {renderUserAvatar()}
                {renderUserDropdown()}
              </div>
            ) : (
              <div className="desktop-only">
                {renderAuthButtons()}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="nav-toggle-revolutionary mobile-only"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
        {renderMobileMenu()}
      </nav>
      <MobileNavigation />
    </>
  );
};

export default Navigation;