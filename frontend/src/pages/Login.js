// Modern Login Page - Clean and Professional
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerification from '../components/TwoFactor/TwoFactorVerification';
import { useToastContext } from '../components/toast';
import { secureFetch } from '../utils/csrf';
import SecureForm from '../components/SecureForm';
import platformDetection from '../utils/platformDetection';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const Login = ({ isSliderMode = false }) => {
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

  // Initialize Google reCAPTCHA for both web and mobile
  useEffect(() => {
    const initializeRecaptcha = () => {
      // Check if reCAPTCHA is already loaded
      if (window.grecaptcha) {
        console.log('✅ reCAPTCHA already loaded');
        setRecaptchaLoaded(true);
        return;
      }

      console.log('🔄 Loading Google reCAPTCHA script...');
      
      // Load reCAPTCHA script for both web and mobile
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=en';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ reCAPTCHA script loaded successfully');
        setRecaptchaLoaded(true);
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load reCAPTCHA script:', error);
        showToast('Failed to load security verification. Please check your internet connection.', 'error');
        setRecaptchaLoaded(false);
      };
      
      // Add to document head
      document.head.appendChild(script);
    };

    initializeRecaptcha();
  }, [showToast]);

  // Render reCAPTCHA widget for both web and mobile
  useEffect(() => {
    if (!recaptchaLoaded || !window.grecaptcha || !recaptchaRef.current) {
      return;
    }

    const renderRecaptcha = async () => {
      const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
      if (!siteKey) {
        console.error('❌ reCAPTCHA site key not configured');
        showToast('reCAPTCHA not configured. Please contact support.', 'error');
        return;
      }

      try {
        // Clear any existing widget
        if (recaptchaRef.current) {
          recaptchaRef.current.innerHTML = '';
        }

        console.log('🔄 Rendering reCAPTCHA widget...');

        // Wait for grecaptcha to be ready
        window.grecaptcha.ready(() => {
          try {
            const widgetConfig = {
              sitekey: siteKey,
              theme: 'light',
              size: platformDetection.isMobile ? 'compact' : 'normal', // Use compact size for mobile
              callback: (response) => {
                setCaptchaResponse(response);
                console.log('✅ reCAPTCHA completed successfully');
              },
              'expired-callback': () => {
                setCaptchaResponse('');
                console.log('⏰ reCAPTCHA expired');
                showToast('Security verification expired. Please complete it again.', 'warning');
              },
              'error-callback': () => {
                console.error('❌ reCAPTCHA error occurred');
                showToast('Security verification failed. Please try again.', 'error');
              }
            };

            const widgetId = window.grecaptcha.render(recaptchaRef.current, widgetConfig);
            setRecaptchaWidgetId(widgetId);
            console.log('✅ reCAPTCHA widget rendered successfully');
          } catch (error) {
            console.error('❌ Failed to render reCAPTCHA widget:', error);
            showToast('Failed to render security verification. Please refresh the page.', 'error');
          }
        });
      } catch (error) {
        console.error('❌ reCAPTCHA initialization error:', error);
        showToast('Security verification initialization failed.', 'error');
      }
    };

    // Delay to ensure DOM is ready
    const timeoutId = setTimeout(renderRecaptcha, 200);
    return () => clearTimeout(timeoutId);
  }, [recaptchaLoaded, showToast]);

  const handleSubmit = async (sanitizedData, csrfToken) => {
    setLoading(true);
    
    const formDataWithAuth = {
      ...sanitizedData
    };
    
    // Validate reCAPTCHA response - required for all platforms
    if (!captchaResponse) {
      // Try to get current response from widget
      if (recaptchaWidgetId !== null && window.grecaptcha) {
        const currentResponse = window.grecaptcha.getResponse(recaptchaWidgetId);
        if (currentResponse) {
          setCaptchaResponse(currentResponse);
          formDataWithAuth.recaptcha_response = currentResponse;
          console.log('✅ Using current reCAPTCHA response');
        } else {
          showToast('Please complete the security verification (I\'m not a robot)', 'error');
          setLoading(false);
          return;
        }
      } else {
        showToast('Please complete the security verification first', 'error');
        setLoading(false);
        return;
      }
    } else {
      formDataWithAuth.recaptcha_response = captchaResponse;
      console.log('✅ Using stored reCAPTCHA response');
    }
    
    try {
      console.log('🔐 Sending login request:', {
        identifier: formDataWithAuth.identifier,
        passwordLength: formDataWithAuth.password?.length,
        isMobile: platformDetection.isMobile,
        hasCaptcha: !!formDataWithAuth.recaptcha_response,
        apiBase: API_BASE
      });

      // Use Capacitor HTTP for mobile to avoid CORS issues
      let response;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        console.log('📱 Using Capacitor HTTP for mobile request');
        
        const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${API_BASE}/auth/login`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...platformDetection.getPlatformHeaders()
          },
          data: formDataWithAuth
        });
        
        // Convert Capacitor HTTP response to fetch-like response
        response = {
          ok: httpResponse.status >= 200 && httpResponse.status < 300,
          status: httpResponse.status,
          statusText: httpResponse.status >= 200 && httpResponse.status < 300 ? 'OK' : 'Error',
          json: async () => httpResponse.data,
          url: httpResponse.url
        };
      } else {
        // Use regular fetch for web
        response = await secureFetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          body: JSON.stringify(formDataWithAuth),
        });
      }

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
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
        console.error('❌ Login failed:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          url: response.url
        });
        
        let errorMessage = data.detail || data.message || `Login failed (${response.status})`;
        
        // Handle specific error codes
        if (response.status === 500) {
          errorMessage = 'Server error. Please check admin credentials or try again later.';
        } else if (response.status === 422) {
          errorMessage = 'Invalid input data. Please check your credentials.';
        } else if (response.status === 401) {
          errorMessage = 'Invalid username or password.';
        }
        
        if (data.detail && data.detail.includes('Email not verified')) {
          showToast('Please verify your email address', 'error');
        } else {
          showToast(errorMessage, 'error');
        }
        
        // Reset reCAPTCHA on login error
        if (recaptchaWidgetId !== null && window.grecaptcha) {
          window.grecaptcha.reset(recaptchaWidgetId);
          setCaptchaResponse('');
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Network error. Please try again.';
      
      // Handle CORS errors specifically
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        errorMessage = 'Server connection blocked. Please contact support.';
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Connection failed. Please check your internet connection.';
      } else if (error.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      showToast(errorMessage, 'error');
      
      // Reset reCAPTCHA on network error
      if (recaptchaWidgetId !== null && window.grecaptcha) {
        window.grecaptcha.reset(recaptchaWidgetId);
        setCaptchaResponse('');
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (formData) => {
    const errors = {};

    if (!formData.identifier || formData.identifier.length < 3) {
      errors.identifier = 'Email or username must be at least 3 characters';
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return errors;
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
      // Check if running on mobile (Capacitor)
      if (platformDetection.isMobile && window.Capacitor) {
        await handleMobileGoogleLogin();
        return;
      }

      // Web Google Login
      if (!window.google || !window.google.accounts) {
        showToast('Google services not available. Please try again later.', 'error');
        return;
      }

      // Initialize Google OAuth for web
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

  const handleMobileGoogleLogin = async () => {
    try {
      console.log('🤖 Checking Google Auth availability...');
      
      // First check if plugin is properly loaded
      if (!window.Capacitor?.Plugins?.GoogleAuth) {
        console.warn('GoogleAuth plugin not available');
        showToast('Google login not available on this device. Please use email/password.', 'warning');
        return;
      }

      console.log('🤖 Initiating mobile Google login');
      setLoading(true);

      // Use the plugin through Capacitor.Plugins
      const GoogleAuth = window.Capacitor.Plugins.GoogleAuth;
      
      // Initialize first (this is important for the plugin)
      try {
        await GoogleAuth.initialize();
        console.log('✅ Google Auth initialized');
      } catch (initError) {
        console.warn('Google Auth initialization warning:', initError);
        // Continue anyway, some versions don't need explicit initialization
      }

      // Attempt sign in
      const result = await GoogleAuth.signIn();
      
      console.log('Google Auth result:', result);
      
      // Handle the response - the plugin returns different structures
      let credential = null;
      
      if (result?.authentication?.idToken) {
        credential = result.authentication.idToken;
        console.log('✅ Got idToken from authentication');
      } else if (result?.idToken) {
        credential = result.idToken;
        console.log('✅ Got direct idToken');
      } else if (result?.serverAuthCode) {
        credential = result.serverAuthCode;
        console.log('✅ Got serverAuthCode');
      } else if (result?.accessToken) {
        credential = result.accessToken;
        console.log('✅ Got accessToken');
      }
      
      if (credential) {
        await handleGoogleResponse({
          credential: credential
        });
      } else {
        console.error('No credential in Google Auth result:', result);
        showToast('Google login failed - no authentication data received', 'error');
      }
    } catch (error) {
      console.error('Mobile Google login error:', error);
      
      // Handle specific error types
      const errorMessage = error.message || error.toString();
      const errorCode = error.code || error.error_code;
      
      if (errorMessage.includes('cancelled') || errorMessage.includes('CANCELED') || errorCode === '12501' || errorCode === 'SIGN_IN_CANCELLED') {
        showToast('Google login was cancelled', 'info');
      } else if (errorMessage.includes('network') || errorMessage.includes('NETWORK_ERROR') || errorCode === 'NETWORK_ERROR') {
        showToast('Network error. Please check your internet connection.', 'error');
      } else if (errorMessage.includes('not installed') || errorMessage.includes('DEVELOPER_ERROR') || errorCode === '10') {
        showToast('Google Play Services not properly configured', 'error');
      } else if (errorMessage.includes('SIGN_IN_FAILED') || errorCode === '12500') {
        showToast('Google sign-in failed. Please try again.', 'error');
      } else {
        showToast('Google login failed. Please use email/password login.', 'error');
      }
      
      console.error('Detailed Google Auth error:', {
        message: errorMessage,
        code: errorCode,
        fullError: error
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      setLoading(true);

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
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = 'Google login failed. Please try again.';
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
        
        <SecureForm onSubmit={handleSubmit} validate={validateForm} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              id="identifier"
              name="identifier"
              placeholder="Email or Username"
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
              className="form-input"
              required
            />
          </div>
          
          <div className="form-actions">
            <Link to="/reset-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>
          
          {/* Security Verification - Same for Web and Mobile */}
          <div className="form-group">
            <label className="form-label">Security Verification</label>
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
              {recaptchaLoaded && window.grecaptcha && recaptchaWidgetId === null && !captchaResponse && (
                <div className="captcha-error">
                  <span>Setting up security verification...</span>
                </div>
              )}
              {captchaResponse && (
                <div className="captcha-success">
                  <span>✅ Security verification completed</span>
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
        </SecureForm>
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
            <SecureForm onSubmit={handleSubmit} validate={validateForm} className="auth-form">
              <div className="form-group">
                <label htmlFor="identifier" className="form-label">Email or Username</label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  placeholder="Enter your email or username"
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
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-actions">
                <Link to="/reset-password" className="forgot-link">
                  Forgot your password?
                </Link>
              </div>
              
              {/* Security Verification - Same for Web and Mobile */}
              <div className="form-group">
                <label className="form-label">Security Verification</label>
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
                  {recaptchaLoaded && window.grecaptcha && recaptchaWidgetId === null && !captchaResponse && (
                    <div className="captcha-error">
                      <span>Setting up security verification...</span>
                    </div>
                  )}
                  {captchaResponse && (
                    <div className="captcha-success">
                      <span>✅ Security verification completed</span>
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
            </SecureForm>
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