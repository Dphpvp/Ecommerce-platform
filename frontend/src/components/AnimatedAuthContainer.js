import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AnimatedAuthContainer.css';

const AnimatedAuthContainer = ({ children, mode = 'login' }) => {
  const [isLoginMode, setIsLoginMode] = useState(mode === 'login');
  const [isAnimating, setIsAnimating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const newMode = location.pathname.includes('register') ? false : true;
    if (newMode !== isLoginMode) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsLoginMode(newMode);
        setTimeout(() => setIsAnimating(false), 300);
      }, 150);
    }
  }, [location.pathname, isLoginMode]);

  const handleModeSwitch = (mode) => {
    if ((mode === 'login' && !isLoginMode) || (mode === 'register' && isLoginMode)) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsLoginMode(mode === 'login');
        setTimeout(() => setIsAnimating(false), 300);
      }, 150);
    }
  };

  return (
    <div className="animated-auth-wrapper">
      {/* Animated Background */}
      <div className="auth-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
        </div>
        <div className="gradient-overlay"></div>
      </div>

      {/* Main Container */}
      <div className="animated-auth-container">
        <div className={`auth-forms-container ${isAnimating ? 'animating' : ''}`}>
          
          {/* Forms Container */}
          <div className={`forms-container ${isLoginMode ? 'login-mode' : 'register-mode'}`}>
            <div className="form-wrapper">
              <div className="form-content">
                {children}
              </div>
            </div>
          </div>

          {/* Sliding Panel */}
          <div className="sliding-panel-container">
            <div className={`sliding-panel ${isLoginMode ? 'slide-left' : 'slide-right'}`}>
              
              {/* Login Panel Content */}
              <div className={`panel-content ${isLoginMode ? 'active' : ''}`}>
                <div className="panel-text">
                  <h2 className="panel-title">Welcome Back!</h2>
                  <p className="panel-subtitle">
                    Sign in with your account to access all our amazing features
                  </p>
                  <Link 
                    to="/login" 
                    className="panel-btn"
                    onClick={() => handleModeSwitch('login')}
                  >
                    Sign In
                  </Link>
                </div>
                <div className="panel-image">
                  <div className="image-placeholder login-image">
                    <div className="login-icon">👋</div>
                  </div>
                </div>
              </div>

              {/* Register Panel Content */}
              <div className={`panel-content ${!isLoginMode ? 'active' : ''}`}>
                <div className="panel-text">
                  <h2 className="panel-title">New Here?</h2>
                  <p className="panel-subtitle">
                    Create an account and discover all the great features we have to offer
                  </p>
                  <Link 
                    to="/register" 
                    className="panel-btn"
                    onClick={() => handleModeSwitch('register')}
                  >
                    Sign Up
                  </Link>
                </div>
                <div className="panel-image">
                  <div className="image-placeholder register-image">
                    <div className="register-icon">🌟</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedAuthContainer;