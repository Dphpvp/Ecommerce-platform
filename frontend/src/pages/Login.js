import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerification from '../components/TwoFactor/TwoFactorVerification';
import { useToastContext } from '../components/toast';
import { secureFetch } from '../utils/csrf';
import platformDetection from '../utils/platformDetection';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

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
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  // Load Google reCAPTCHA
  useEffect(() => {
    const loadRecaptcha = () => {
      if (window.grecaptcha) {
        setRecaptchaLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;

      window.onRecaptchaLoad = () => {
        console.log('reCAPTCHA loaded');
        setRecaptchaLoaded(true);
      };

      script.onerror = () => {
        console.error('Failed to load reCAPTCHA');
        showToast('Failed to load security verification', 'error');
      };

      document.head.appendChild(script);
    };

    loadRecaptcha();
  }, [showToast]);

  // Render reCAPTCHA widget
  useEffect(() => {
    if (recaptchaLoaded && recaptchaRef.current && !recaptchaWidgetId && !show2FA) {
      try {
        const widgetId = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: process.env.REACT_APP_RECAPTCHA_SITE_KEY,
          callback: (response) => {
            console.log('reCAPTCHA completed:', response);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            showToast('Security verification expired. Please complete it again.', 'warning');
          }
        });
        setRecaptchaWidgetId(widgetId);
      } catch (error) {
        console.error('reCAPTCHA render error:', error);
        showToast('Failed to load security verification', 'error');
      }
    }
  }, [recaptchaLoaded, show2FA, showToast]);

  // Load Google OAuth
  useEffect(() => {
    const loadGoogleOAuth = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google && process.env.REACT_APP_GOOGLE_CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: handleGoogleLogin
          });
          
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { 
              theme: 'outline', 
              size: 'large', 
              width: isSliderMode ? 300 : 350,
              text: 'signin_with',
              logo_alignment: 'left'
            }
          );
        }
      };

      document.head.appendChild(script);
    };

    loadGoogleOAuth();
  }, [isSliderMode]);

  const handleGoogleLogin = async (response) => {
    let loadingIndicator = null;
    
    try {
      setLoading(true);
      loadingIndicator = await platformDetection.showLoading('Authenticating with Google...');
      if (loadingIndicator?.present) await loadingIndicator.present();

      const apiResponse = await secureFetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await apiResponse.json();

      if (apiResponse.ok) {
        if (data.requires_2fa) {
          setTempToken(data.temp_token);
          setTwoFactorMethod(data.method || 'app');
          setShow2FA(true);
        } else {
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
          }
          login(data.user);
          showToast('Login successful!', 'success');
          await platformDetection.showToast('Login successful!', 2000);
          navigate('/');
        }
      } else {
        setError(data.detail || 'Google login failed');
        showToast(data.detail || 'Google login failed', 'error');
        await platformDetection.showToast(data.detail || 'Google login failed', 3000);
      }
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = 'Google login failed. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      await platformDetection.showToast(errorMessage, 3000);
    } finally {
      setLoading(false);
      if (loadingIndicator?.dismiss) await loadingIndicator.dismiss();
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Get reCAPTCHA response
    let captchaResponse = '';
    if (recaptchaWidgetId !== null) {
      captchaResponse = window.grecaptcha.getResponse(recaptchaWidgetId);
    }

    if (!captchaResponse) {
      const errorMessage = 'Please complete the security verification';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      await platformDetection.showToast(errorMessage, 3000);
      return;
    }

    setLoading(true);
    let loadingIndicator = null;

    try {
      loadingIndicator = await platformDetection.showLoading('Signing in...');
      if (loadingIndicator?.present) await loadingIndicator.present();

      const response = await secureFetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          recaptcha_response: captchaResponse
        }),
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
          await platformDetection.showToast(message, 3000);
        } else {
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
          }
          login(data.user);
          showToast('Login successful!', 'success');
          await platformDetection.showToast('Login successful!', 2000);
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
        
        await platformDetection.showToast(errorMessage, 3000);
        
        // Reset reCAPTCHA
        if (recaptchaWidgetId !== null) {
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
      await platformDetection.showToast(errorMessage, 4000);
      
      // Reset reCAPTCHA
      if (recaptchaWidgetId !== null) {
        window.grecaptcha.reset(recaptchaWidgetId);
      }
    } finally {
      setLoading(false);
      if (loadingIndicator?.dismiss) await loadingIndicator.dismiss();
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

  // Slider mode layout
  if (isSliderMode) {
    return (
      <div className="auth-form">
        <h1>Login</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group with-icon">
            <input
              type="text"
              name="identifier"
              placeholder="Email, Username, or Phone"
              value={formData.identifier}
              onChange={handleChange}
              required
            />
            <i className="bx bxs-user"></i>
          </div>
          
          <div className="form-group with-icon">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <i className="bx bxs-lock-alt"></i>
          </div>
          
          <div className="forgot-link">
            <Link to="/reset-password">Forgot Password?</Link>
          </div>
          
          <div className="form-group">
            <div 
              ref={recaptchaRef}
              style={{ 
                margin: '10px 0',
                display: 'flex',
                justifyContent: 'center',
                transform: 'scale(0.9)',
                transformOrigin: 'center'
              }}
            ></div>
            {!recaptchaLoaded && (
              <p style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>
                Loading security verification...
              </p>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !recaptchaLoaded} 
            className="btn"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="google-login">
          <div id="google-signin-button"></div>
        </div>
      </div>
    );
  }

  // Regular standalone page layout
  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-form">
          <h1>Login</h1>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="identifier"
              placeholder="Email, Username, or Phone"
              value={formData.identifier}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            
            <div className="form-group">
              <div 
                ref={recaptchaRef}
                style={{ margin: '10px 0' }}
              ></div>
              {!recaptchaLoaded && (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  Loading security verification...
                </p>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !recaptchaLoaded} 
              className="btn btn-primary"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="forgot-password">
            <Link to="/reset-password">Forgotten password? Click here to reset</Link>
          </p>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="google-login">
            <div id="google-signin-button"></div>
          </div>

          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;