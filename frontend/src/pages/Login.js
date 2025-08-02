import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerification from '../components/TwoFactor/TwoFactorVerification';
import { useToastContext } from '../components/toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const Login = () => {
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
  const { login, refetchUser } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  // FIXED: Load reCAPTCHA for login
  useEffect(() => {
    const loadRecaptcha = () => {
      if (window.grecaptcha) {
        setRecaptchaLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoadLogin&render=explicit';
      script.async = true;
      script.defer = true;

      window.onRecaptchaLoadLogin = () => {
        setRecaptchaLoaded(true);
      };

      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        delete window.onRecaptchaLoadLogin;
      };
    };

    loadRecaptcha();
  }, []);

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
            showToast('reCAPTCHA expired. Please complete it again.', 'warning');
          }
        });
        setRecaptchaWidgetId(widgetId);
      } catch (error) {
        console.error('reCAPTCHA render error:', error);
        showToast('Failed to load reCAPTCHA. Please refresh the page.', 'error');
      }
    }
  }, [recaptchaLoaded, show2FA, showToast]);

  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google && process.env.REACT_APP_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin
        });
        
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: 350 }
        );
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleLogin = async (response) => {
    try {
      const apiResponse = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
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
          navigate('/');
        }
      } else {
        setError(data.detail || 'Google login failed');
      }
    } catch (error) {
      setError('Google login failed. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // FIXED: Login with reCAPTCHA
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Get reCAPTCHA response
    let recaptchaResponse = '';
    try {
      if (recaptchaWidgetId !== null) {
        recaptchaResponse = window.grecaptcha.getResponse(recaptchaWidgetId);
      }
    } catch (error) {
      console.error('reCAPTCHA error:', error);
    }

    if (!recaptchaResponse) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptcha_response: recaptchaResponse
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_2fa) {
          setTempToken(data.temp_token);
          setTwoFactorMethod(data.method || 'app');
          setShow2FA(true);
          
          if (data.method === 'email') {
            showToast('Verification code sent to your email', 'info');
          } else {
            showToast('Please enter your 2FA code', 'info');
          }
        } else {
          login(data.user);
          navigate('/');
        }
      } else {
        setError(data.detail || 'Login failed');
        if (data.detail && data.detail.includes('Email not verified')) {
          showToast('Please verify your email address', 'error');
        }
        
        // Reset reCAPTCHA on error
        if (recaptchaWidgetId !== null) {
          window.grecaptcha.reset(recaptchaWidgetId);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
      
      // Reset reCAPTCHA on error
      if (recaptchaWidgetId !== null) {
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



  // Show 2FA verification if required
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

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-form">
          <h1>Login</h1>
          
          {error && <div className="error-message">{error}</div>}
          
          {!recaptchaLoaded && (
            <div className="loading-recaptcha" style={{ margin: '10px 0' }}>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>Loading security verification...</p>
            </div>
          )}
          
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
            
            {/* reCAPTCHA */}
            <div className="form-group">
              <div 
                ref={recaptchaRef}
                style={{ margin: '10px 0' }}
              ></div>
              {!recaptchaLoaded && (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  Please wait for security verification to load...
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