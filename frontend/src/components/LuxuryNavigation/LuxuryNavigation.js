// frontend/src/components/LuxuryNavigation/LuxuryNavigation.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import '../../styles/components/LuxuryNavigation.css';

const LuxuryNavigation = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const location = useLocation();

  // Load Ionicons
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js';
    document.head.appendChild(script);

    const nomoduleScript = document.createElement('script');
    nomoduleScript.noModule = true;
    nomoduleScript.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js';
    document.head.appendChild(nomoduleScript);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(nomoduleScript);
    };
  }, []);

  const getNavigationItems = () => {
    const baseItems = [
      { path: '/', icon: 'home-outline', text: 'Home' },
      { path: '/products', icon: 'bag-outline', text: 'Shop' },
      { path: '/about', icon: 'information-circle-outline', text: 'About' },
      { path: '/contact', icon: 'mail-outline', text: 'Contact' }
    ];

    if (user) {
      if (user.is_admin) {
        return [
          ...baseItems,
          { path: '/admin/dashboard', icon: 'settings-outline', text: 'Admin' }
        ];
      } else {
        return [
          ...baseItems,
          { path: '/cart', icon: 'basket-outline', text: 'Cart', badge: cartItems.length }
        ];
      }
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  useEffect(() => {
    const currentIndex = navigationItems.findIndex(item => 
      item.path === location.pathname || 
      (item.path !== '/' && location.pathname.startsWith(item.path))
    );
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname, navigationItems]);

  const handleNavClick = (index) => {
    setActiveIndex(index);
  };

  return (
    <div className="luxury-navigation-wrapper">
      {/* Logo Section */}
      <div className="luxury-nav-logo">
        <Link to="/">
          <div className="nav-logo-text">
            <span className="logo-letter">B</span>
            <span className="logo-letter">T</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="luxury-navigation">
        <ul>
          {navigationItems.map((item, index) => (
            <li key={item.path} className={`list ${activeIndex === index ? 'active' : ''}`}>
              <Link 
                to={item.path}
                onClick={() => handleNavClick(index)}
              >
                <span className="icon">
                  <ion-icon name={item.icon}></ion-icon>
                  {item.badge && item.badge > 0 && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </span>
                <span className="text">{item.text}</span>
              </Link>
            </li>
          ))}
          <div className="indicator"></div>
        </ul>
      </div>

      {/* User Actions */}
      {user && (
        <div className="luxury-nav-user">
          <div className="user-menu">
            <div className="user-avatar">
              <img 
                src={user.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt="User Avatar"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="avatar-fallback" style={{ display: 'none' }}>
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
            <div className="user-dropdown">
              <Link to="/profile" className="dropdown-item">
                <ion-icon name="person-outline"></ion-icon>
                Profile
              </Link>
              {!user.is_admin && (
                <Link to="/orders" className="dropdown-item">
                  <ion-icon name="receipt-outline"></ion-icon>
                  Orders
                </Link>
              )}
              <button onClick={logout} className="dropdown-item logout-btn">
                <ion-icon name="log-out-outline"></ion-icon>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Buttons for non-logged users */}
      {!user && (
        <div className="luxury-nav-auth">
          <Link to="/login" className="auth-btn login-btn">
            <ion-icon name="log-in-outline"></ion-icon>
          </Link>
          <Link to="/register" className="auth-btn register-btn">
            <ion-icon name="person-add-outline"></ion-icon>
          </Link>
        </div>
      )}
    </div>
  );
};

export default LuxuryNavigation;