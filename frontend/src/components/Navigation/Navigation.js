import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <nav className={`nav-revolutionary ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container-revolutionary">
        {/* Revolutionary Brand */}
        <Link to="/" className="nav-logo-revolutionary">
          <img src="/images/logo.png" alt="Vergi Designs" className="nav-logo-image" />
          <span className="nav-logo-text">Vergi Designs</span>
        </Link>

        {/* Revolutionary Desktop Navigation */}
        <ul className="nav-menu-revolutionary">
          <li className="nav-item-revolutionary">
            <Link 
              to="/" 
              className={`nav-link-revolutionary ${isActive('/') ? 'active' : ''}`}
            >
              Home
            </Link>
          </li>
          <li className="nav-item-revolutionary">
            <Link 
              to="/products" 
              className={`nav-link-revolutionary ${isActive('/products') ? 'active' : ''}`}
            >
              Collection
            </Link>
          </li>
          <li className="nav-item-revolutionary">
            <Link 
              to="/about" 
              className={`nav-link-revolutionary ${isActive('/about') ? 'active' : ''}`}
            >
              About
            </Link>
          </li>
          <li className="nav-item-revolutionary">
            <Link 
              to="/contact" 
              className={`nav-link-revolutionary ${isActive('/contact') ? 'active' : ''}`}
            >
              Contact
            </Link>
          </li>
        </ul>

        {/* Revolutionary Actions */}
        <div className="nav-actions-revolutionary">
          {/* Revolutionary Cart */}
          <Link to="/cart" className="nav-cart-revolutionary">
            <div className="cart-icon-revolutionary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h2l.4 2m0 0L8 16h8l1.4-8.5H5.4z"/>
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
              </svg>
            </div>
            {cartItemCount > 0 && (
              <span className="nav-cart-count-revolutionary">{cartItemCount}</span>
            )}
          </Link>

          {/* Revolutionary User Menu */}
          {user ? (
            <div className="user-menu-revolutionary">
              <button
                className="user-avatar-revolutionary"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <span className="avatar-text-revolutionary">
                  {user?.full_name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
                </span>
              </button>
              
              {isUserMenuOpen && (
                <div className="user-dropdown-revolutionary open">
                  <Link to="/profile" className="dropdown-item-revolutionary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Profile
                  </Link>
                  <Link to="/orders" className="dropdown-item-revolutionary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/>
                      <path d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"/>
                    </svg>
                    Orders
                  </Link>
                  {user?.is_admin && (
                    <Link to="/admin/dashboard" className="dropdown-item-revolutionary">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                      </svg>
                      Admin
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="dropdown-item-revolutionary logout"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons-revolutionary">
              <Link to="/login" className="btn-revolutionary btn-glass-revolutionary">
                Login
              </Link>
              <Link to="/register" className="btn-revolutionary btn-luxury-revolutionary">
                Register
              </Link>
            </div>
          )}

          {/* Revolutionary Mobile Menu Toggle */}
          <button 
            className="nav-toggle-revolutionary"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Revolutionary Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-revolutionary">
          <div className="mobile-menu-content-revolutionary">
            <Link 
              to="/" 
              className={`mobile-nav-link-revolutionary ${isActive('/') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              Home
            </Link>
            <Link 
              to="/products" 
              className={`mobile-nav-link-revolutionary ${isActive('/products') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Collection
            </Link>
            <Link 
              to="/about" 
              className={`mobile-nav-link-revolutionary ${isActive('/about') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              About
            </Link>
            <Link 
              to="/contact" 
              className={`mobile-nav-link-revolutionary ${isActive('/contact') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Contact
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="mobile-nav-link-revolutionary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Profile
                </Link>
                <Link 
                  to="/orders" 
                  className="mobile-nav-link-revolutionary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/>
                    <path d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"/>
                  </svg>
                  Orders
                </Link>
                {user?.is_admin && (
                  <Link 
                    to="/admin/dashboard" 
                    className="mobile-nav-link-revolutionary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                    </svg>
                    Admin
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="mobile-nav-link-revolutionary logout"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <div className="mobile-auth-buttons-revolutionary">
                <Link 
                  to="/login" 
                  className="btn-revolutionary btn-glass-revolutionary btn-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn-revolutionary btn-luxury-revolutionary btn-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;