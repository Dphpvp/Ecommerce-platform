// Elegant Luxury Login Page - Premium Experience
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerification from '../components/TwoFactor/TwoFactorVerification';
import { useToastContext } from '../components/toast';
import { secureFetch } from '../utils/csrf';

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
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Initialize Google reCAPTCHA
  useEffect(() => {
    const initializeRecaptcha = () => {
      if (window.grecaptcha) {
        setRecaptchaLoaded(true);
      } else {
        // Wait for reCAPTCHA to load
        window.addEventListener('load', () => {
          if (window.grecaptcha) {
            setRecaptchaLoaded(true);
          }
        });
      }
    };

    initializeRecaptcha();
  }, []);

  // Render Google reCAPTCHA when loaded
  useEffect(() => {
    if (recaptchaLoaded && recaptchaRef.current && !recaptchaWidgetId && window.grecaptcha) {
      try {
        const widgetId = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: process.env.REACT_APP_RECAPTCHA_SITE_KEY,
          theme: 'light',
          size: 'normal',
          callback: (response) => {
            setCaptchaResponse(response);
            console.log('reCAPTCHA completed:', response);
          },
          'expired-callback': () => {
            setCaptchaResponse('');
            showToast('Security verification expired. Please complete it again.', 'warning');
          },
          'error-callback': () => {
            console.error('reCAPTCHA error occurred');
            showToast('Security verification failed. Please try again.', 'error');
          }
        });
        setRecaptchaWidgetId(widgetId);
      } catch (error) {
        console.error('Failed to render reCAPTCHA:', error);
        showToast('Failed to load security verification', 'error');
      }
    }
  }, [recaptchaLoaded, recaptchaWidgetId, showToast]);

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

    // Validate Google reCAPTCHA
    if (!captchaResponse) {
      const currentCaptchaResponse = window.grecaptcha ? window.grecaptcha.getResponse(recaptchaWidgetId) : '';
      if (!currentCaptchaResponse) {
        setError('Please complete the security verification');
        setLoading(false);
        return;
      }
      setCaptchaResponse(currentCaptchaResponse);
    }

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
        // Reset reCAPTCHA
        if (window.grecaptcha && recaptchaWidgetId !== null) {
          window.grecaptcha.reset(recaptchaWidgetId);
        }
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
      // Reset reCAPTCHA on error
      if (window.grecaptcha && recaptchaWidgetId !== null) {
        window.grecaptcha.reset(recaptchaWidgetId);
      }
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

  const handleGoogleLogin = async () => {
    try {
      if (!window.google || !window.google.accounts) {
        showToast('Google services not available. Please try again later.', 'error');
        return;
      }

      // Initialize Google OAuth
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Prompt for Google account selection
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error('Google login initialization error:', error);
      showToast('Failed to initialize Google login', 'error');
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      setLoading(true);
      setError('');

      const result = await secureFetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        body: JSON.stringify({
          token: response.credential
        }),
      });

      const data = await result.json();

      if (result.ok) {
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        login(data.user);
        showToast('Google login successful!', 'success');
        navigate('/');
      } else {
        const errorMessage = data.detail || 'Google login failed';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = 'Google login failed. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
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
          
          {/* Google reCAPTCHA */}
          <div className="elegant-form-group">
            <div className="elegant-captcha-container">
              <div ref={recaptchaRef} className="elegant-captcha-widget"></div>
              {!recaptchaLoaded && (
                <div className="elegant-captcha-loading">
                  <div className="elegant-spinner"></div>
                  <span>Loading Google reCAPTCHA...</span>
                </div>
              )}
              {recaptchaLoaded && !window.grecaptcha && (
                <div className="elegant-captcha-error">
                  <span>reCAPTCHA failed to load. Please refresh the page.</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Google Login */}
          <div className="elegant-form-group">
            <div className="elegant-social-login">
              <div className="elegant-divider">
                <span>Or continue with</span>
              </div>
              <button 
                type="button"
                className="elegant-btn elegant-btn-google"
                onClick={handleGoogleLogin}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
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
                
                {/* Google reCAPTCHA */}
                <div className="elegant-form-group">
                  <div className="elegant-captcha-container">
                    <div ref={recaptchaRef} className="elegant-captcha-widget"></div>
                    {!recaptchaLoaded && (
                      <div className="elegant-captcha-loading">
                        <div className="elegant-spinner"></div>
                        <span>Loading Google reCAPTCHA...</span>
                      </div>
                    )}
                    {recaptchaLoaded && !window.grecaptcha && (
                      <div className="elegant-captcha-error">
                        <span>reCAPTCHA failed to load. Please refresh the page.</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Google Login */}
                <div className="elegant-form-group">
                  <div className="elegant-social-login">
                    <div className="elegant-divider">
                      <span>Or continue with</span>
                    </div>
                    <button 
                      type="button"
                      className="elegant-btn elegant-btn-google"
                      onClick={handleGoogleLogin}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </div>
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