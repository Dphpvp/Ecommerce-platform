// Elegant Luxury Login Page - Premium Experience
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerification from '../components/TwoFactor/TwoFactorVerification';
import { useToastContext } from '../components/toast';
import { secureFetch } from '../utils/csrf';
import platformDetection from '../utils/platformDetection';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const Login = ({ isSliderMode = false }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [captchaResponse, setCaptchaResponse] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const isCapacitor = !!window.Capacitor;
      const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isWebView = window.navigator.userAgent.includes('wv');
      
      setIsMobile(isCapacitor || isWebView || isMobileUA);
    };
    
    checkMobile();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const requestBody = {
        ...formData,
        ...(captchaResponse && { recaptcha_response: captchaResponse })
      };

      const response = await secureFetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_2fa) {
          setTempToken(data.temp_token);
          setTwoFactorMethod(data.method || 'app');
          setShow2FA(true);
          
          const message = data.method === 'email' 
            ? 'Verification code sent to your email' 
            : 'Please enter your 2FA code';
          
          showToast(message, 'info');
        } else {
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
          }
          if (data.user && typeof data.user === 'object') {
            login(data.user);
          } else {
            login(null);
          }
          showToast('Login successful!', 'success');
          navigate('/');
        }
      } else {
        const errorMessage = data.detail || 'Login failed';
        setError(errorMessage);
        
        if (data.detail && data.detail.includes('Email not verified')) {
          showToast('Please verify your email address', 'error');
        } else {
          showToast(errorMessage, 'error');
        }
        
        setCaptchaResponse('');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Network error. Please try again.';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Connection failed. Please check your internet connection.';
      } else if (error.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setCaptchaResponse('');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = () => {
    setShow2FA(false);
    setTempToken('');
    setTwoFactorMethod('');
    navigate('/');
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setTempToken('');
    setTwoFactorMethod('');
  };

  if (show2FA) {
    return (
      <TwoFactorVerification 
        tempToken={tempToken}
        method={twoFactorMethod}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
      />
    );
  }

  // Slider mode layout - Elegant & Minimal
  if (isSliderMode) {
    return (
      <div className="elegant-auth-form">
        <div className="elegant-auth-header">
          <div className="elegant-icon">
            <img src="/images/logo.png" alt="Vergi Designs" className="elegant-icon-image" />
          </div>
          <h2 className="elegant-title">Welcome Back</h2>
          <p className="elegant-subtitle">Access your luxury account</p>
        </div>
        
        {error && <div className="elegant-error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="elegant-form">
          <div className="elegant-form-group">
            <div className="elegant-input-wrapper">
              <input
                type="text"
                id="identifier"
                name="identifier"
                placeholder="Email or Username"
                value={formData.identifier}
                onChange={handleChange}
                className="elegant-input"
                required
              />
              <div className="elegant-input-border"></div>
            </div>
          </div>
          
          <div className="elegant-form-group">
            <div className="elegant-input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="elegant-input"
                required
              />
              <div className="elegant-input-border"></div>
            </div>
          </div>
          
          <div className="elegant-form-actions">
            <Link to="/reset-password" className="elegant-forgot-link">
              Forgot Password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="elegant-btn elegant-btn-primary"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            {!loading && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            )}
          </button>
        </form>
      </div>
    );
  }

  // Elegant standalone page layout - Premium Experience
  return (
    <div className="elegant-auth-page">
      {/* Elegant Fullscreen Auth Section */}
      <section className="elegant-auth-section">
        <div className="elegant-auth-background">
          <div 
            className="elegant-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.3}px)`
            }}
          ></div>
          <div className="elegant-overlay"></div>
          <div className="elegant-pattern"></div>
        </div>
        
        <div className="elegant-auth-container">
          <div className="elegant-auth-card">
            <div className="elegant-card-header">
              <div className="elegant-logo">
                <img src="/images/logo.png" alt="Vergi Designs" className="elegant-logo-image" />
              </div>
              <h1 className="elegant-main-title">Welcome Back</h1>
              <p className="elegant-main-subtitle">Sign in to your luxury account</p>
            </div>
            
            <div className="elegant-card-body">
              {error && <div className="elegant-error-message">{error}</div>}
              
              <form onSubmit={handleSubmit} className="elegant-form">
                <div className="elegant-form-group">
                  <label htmlFor="identifier" className="elegant-label">Email or Username</label>
                  <div className="elegant-input-wrapper">
                    <input
                      type="text"
                      id="identifier"
                      name="identifier"
                      placeholder="Enter your email or username"
                      value={formData.identifier}
                      onChange={handleChange}
                      className="elegant-input"
                      required
                    />
                    <div className="elegant-input-border"></div>
                  </div>
                </div>
                
                <div className="elegant-form-group">
                  <label htmlFor="password" className="elegant-label">Password</label>
                  <div className="elegant-input-wrapper">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className="elegant-input"
                      required
                    />
                    <div className="elegant-input-border"></div>
                  </div>
                </div>
                
                <div className="elegant-form-actions">
                  <Link to="/reset-password" className="elegant-forgot-link">
                    Forgot your password?
                  </Link>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="elegant-btn elegant-btn-primary"
                >
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                  {!loading && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10,17 15,12 10,7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                  )}
                </button>
              </form>
            </div>

            <div className="elegant-card-footer">
              <p className="elegant-footer-text">
                Don't have an account? <Link to="/register" className="elegant-link">Create one here</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;

// Elegant Luxury Login Page Complete with:
// - Fullscreen elegant design with premium aesthetics
// - Sophisticated glassmorphism effects
// - Refined form interactions with smooth animations
// - Premium visual elements and typography
// - Elegant error handling with smooth transitions
// - Luxury color palette and spacing
// - Enhanced mobile experience with touch-friendly design
// - Sophisticated parallax effects and visual depth