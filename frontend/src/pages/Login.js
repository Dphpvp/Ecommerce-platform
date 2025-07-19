// Modern Login Page - Clean and Professional
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerification from '../components/TwoFactor/TwoFactorVerification';
import { useToastContext } from '../components/toast';
import { secureFetch } from '../utils/csrf';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

// Global flag to prevent multiple reCAPTCHA renders
let recaptchaRenderInProgress = false;

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

  // Render Google reCAPTCHA when loaded - Single instance approach with global protection
  useEffect(() => {
    if (!recaptchaLoaded || !window.grecaptcha || recaptchaWidgetId !== null || recaptchaRenderInProgress) {
      return;
    }

    const renderRecaptcha = () => {
      // Safety check for ref and global flag
      if (!recaptchaRef.current || recaptchaRenderInProgress) {
        return;
      }

      recaptchaRenderInProgress = true;

      try {
        // Check if site key is available
        const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
        if (!siteKey) {
          console.error('reCAPTCHA site key not configured');
          showToast('Security verification not configured', 'error');
          return;
        }

        // Clear any existing content
        recaptchaRef.current.innerHTML = '';

        // Render directly to the ref element
        const widgetId = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: siteKey,
          theme: 'light',
          size: 'normal',
          callback: (response) => {
            setCaptchaResponse(response);
            console.log('reCAPTCHA completed successfully');
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
        console.log('reCAPTCHA rendered successfully');
      } catch (error) {
        console.error('Failed to render reCAPTCHA:', error);
        
        // Only show error to user if it's not a duplicate render issue
        if (!error.message.includes('already been rendered')) {
          showToast('Failed to load security verification', 'error');
        }
      } finally {
        recaptchaRenderInProgress = false;
      }
    };

    // Delay rendering to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (window.grecaptcha.ready) {
        window.grecaptcha.ready(renderRecaptcha);
      } else {
        renderRecaptcha();
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      recaptchaRenderInProgress = false;
    };
  }, [recaptchaLoaded, recaptchaWidgetId, showToast]);

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (recaptchaWidgetId !== null && window.grecaptcha) {
        try {
          // Reset and remove the widget
          window.grecaptcha.reset(recaptchaWidgetId);
          // Note: We don't call window.grecaptcha.remove() as it might not exist in all versions
        } catch (error) {
          console.log('reCAPTCHA cleanup error:', error);
        }
      }
      if (recaptchaRef.current) {
        recaptchaRef.current.innerHTML = '';
      }
      // Reset widget ID to ensure fresh render on next mount
      setRecaptchaWidgetId(null);
    };
  }, [recaptchaWidgetId]);

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
          try {
            window.grecaptcha.reset(recaptchaWidgetId);
          } catch (resetError) {
            console.log('reCAPTCHA reset error:', resetError);
          }
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
        try {
          window.grecaptcha.reset(recaptchaWidgetId);
        } catch (resetError) {
          console.log('reCAPTCHA reset error:', resetError);
        }
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

  // Slider mode layout - Modern & Clean
  if (isSliderMode) {
    return (
      <div className="modern-auth-form">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/images/logo.png" alt="Logo" className="logo-image" />
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              id="identifier"
              name="identifier"
              placeholder="Email or Username"
              value={formData.identifier}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-actions">
            <Link to="/reset-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>
          
          {/* Google reCAPTCHA */}
          <div className="form-group">
            <div className="captcha-container">
              <div ref={recaptchaRef} className="captcha-widget"></div>
              {!recaptchaLoaded && (
                <div className="captcha-loading">
                  <div className="spinner"></div>
                  <span>Loading security verification...</span>
                </div>
              )}
              {recaptchaLoaded && !window.grecaptcha && (
                <div className="captcha-error">
                  <span>Security verification failed to load. Please refresh the page.</span>
                </div>
              )}
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          {/* Google Login */}
          <div className="divider">
            <span>or</span>
          </div>
          
          <button 
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>
      </div>
    );
  }

  // Modern standalone page layout - Clean Experience
  return (
    <div className="modern-auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/images/logo.png" alt="Logo" className="logo-image" />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>
          
          <div className="auth-body">
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="identifier" className="form-label">Email or Username</label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  placeholder="Enter your email or username"
                  value={formData.identifier}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-actions">
                <Link to="/reset-password" className="forgot-link">
                  Forgot your password?
                </Link>
              </div>
              
              {/* Google reCAPTCHA */}
              <div className="form-group">
                <div className="captcha-container">
                  <div ref={recaptchaRef} className="captcha-widget"></div>
                  {!recaptchaLoaded && (
                    <div className="captcha-loading">
                      <div className="spinner"></div>
                      <span>Loading security verification...</span>
                    </div>
                  )}
                  {recaptchaLoaded && !window.grecaptcha && (
                    <div className="captcha-error">
                      <span>Security verification failed to load. Please refresh the page.</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="submit-btn"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              
              <div className="divider">
                <span>or</span>
              </div>
              
              <button 
                type="button"
                className="google-btn"
                onClick={handleGoogleLogin}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </form>
          </div>

          <div className="auth-footer">
            <p className="footer-text">
              Don't have an account? <Link to="/register" className="auth-link">Create one here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;