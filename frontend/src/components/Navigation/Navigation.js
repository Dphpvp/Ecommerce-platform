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
    <nav className={`app-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="nav-container">
          {/* Brand */}
          <Link to="/" className="nav-brand">
            Luxe Store
          </Link>

          {/* Desktop Navigation */}
          <ul className="nav-menu">
            <li className="nav-item">
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/products" 
                className={`nav-link ${isActive('/products') ? 'active' : ''}`}
              >
                Products
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/about" 
                className={`nav-link ${isActive('/about') ? 'active' : ''}`}
              >
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/contact" 
                className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
              >
                Contact
              </Link>
            </li>
          </ul>

          {/* Actions */}
          <div className="nav-actions">
            {/* Cart */}
            <Link to="/cart" className="nav-cart">
              <span>🛒</span>
              {cartItemCount > 0 && (
                <span className="nav-cart-count">{cartItemCount}</span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="user-menu">
                <button
                  className="user-avatar"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <span className="avatar-fallback">
                    {user.full_name?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                  </span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="user-dropdown open">
                    <Link to="/profile" className="dropdown-item">
                      👤 Profile
                    </Link>
                    <Link to="/orders" className="dropdown-item">
                      📦 Orders
                    </Link>
                    {user.is_admin && (
                      <Link to="/admin/dashboard" className="dropdown-item">
                        ⚙️ Admin
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="dropdown-item logout"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline">
                  Login
                </Link>
                <Link to="/register" className="btn btn-luxury">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="nav-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            <Link 
              to="/" 
              className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={`mobile-nav-link ${isActive('/products') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              to="/about" 
              className={`mobile-nav-link ${isActive('/about') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`mobile-nav-link ${isActive('/contact') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="mobile-nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  👤 Profile
                </Link>
                <Link 
                  to="/orders" 
                  className="mobile-nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  📦 Orders
                </Link>
                {user.isAdmin && (
                  <Link 
                    to="/admin/dashboard" 
                    className="mobile-nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ⚙️ Admin
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="mobile-nav-link logout"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <div className="mobile-auth-buttons">
                <Link 
                  to="/login" 
                  className="btn btn-outline btn-block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-luxury btn-block"
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