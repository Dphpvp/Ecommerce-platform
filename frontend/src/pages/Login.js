// ASOS-Inspired Login Page - Sustainable Fashion
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerification from '../components/TwoFactor/TwoFactorVerification';
import { useToastContext } from '../components/toast';
import { secureFetch } from '../utils/csrf';
import SecureForm from '../components/SecureForm';
import AnimatedAuthContainer from '../components/AnimatedAuthContainer';
import platformDetection from '../utils/platformDetection';
import '../styles/index.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const Login = ({ isSliderMode = false }) => {
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleSubmit = async (sanitizedData, csrfToken) => {
    setLoading(true);
    
    const formDataWithAuth = {
      ...sanitizedData
    };
    
    // No captcha for now - will implement fresh web-only version later
    formDataWithAuth.recaptcha_response = 'NO_CAPTCHA_YET';
    
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
        
        // Safely extract error message and ensure it's a string
        let errorMessage = '';
        if (data.detail) {
          errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        } else if (data.message) {
          errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        } else {
          errorMessage = `Login failed (${response.status})`;
        }
        
        // Handle specific error codes
        if (response.status === 500) {
          errorMessage = 'Server error. Please check admin credentials or try again later.';
        } else if (response.status === 422) {
          errorMessage = 'Invalid input data. Please check your credentials.';
        } else if (response.status === 401) {
          errorMessage = 'Invalid username or password.';
        }
        
        if (errorMessage.includes('Email not verified')) {
          showToast('Please verify your email address', 'error');
        } else {
          showToast(errorMessage, 'error');
        }
        
        // No captcha reset needed
        
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
      
      // No captcha reset needed
      
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
      console.log('🔍 Google login attempt starting...');
      console.log('Environment check:', {
        googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
        googleServerClientId: process.env.REACT_APP_GOOGLE_SERVER_CLIENT_ID ? 'Set' : 'Not set',
        nodeEnv: process.env.NODE_ENV,
        isMobile: platformDetection.isMobile,
        hasCapacitor: !!window.Capacitor,
        hasGoogleScript: !!(window.google && window.google.accounts),
        currentUrl: window.location.href,
        currentDomain: window.location.hostname
      });

      // Check if running on mobile (Capacitor)
      if (platformDetection.isMobile && window.Capacitor) {
        console.log('📱 Using mobile Google login');
        await handleMobileGoogleLogin();
        return;
      }

      // Web Google Login - Wait for script to load if needed
      if (!window.google || !window.google.accounts) {
        console.log('⏳ Waiting for Google services to load...');
        // Wait a bit for the script to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!window.google || !window.google.accounts) {
          console.error('❌ Google services not available after waiting');
          showToast('Google services not available. Please refresh the page and try again.', 'error');
          return;
        }
      }

      const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        console.error('❌ Google Client ID not configured');
        console.error('Environment variables:', {
          NODE_ENV: process.env.NODE_ENV,
          hasGoogleClientId: !!process.env.REACT_APP_GOOGLE_CLIENT_ID,
          hasGoogleServerClientId: !!process.env.REACT_APP_GOOGLE_SERVER_CLIENT_ID
        });
        showToast('Google login not configured. Environment variables missing.', 'error');
        return;
      }
      
      console.log('🔧 Google Client ID found:', googleClientId.substring(0, 20) + '...');

      console.log('🌐 Initializing web Google login');

      // Initialize Google OAuth for web with error handling
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false
        });
        
        console.log('✅ Google OAuth initialized successfully');

        // Prompt for Google account selection
        window.google.accounts.id.prompt((notification) => {
          console.log('Google prompt notification:', notification);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Google prompt was not displayed or skipped');
            showToast('Google login prompt not available. Please try again.', 'warning');
          }
        });
      } catch (initError) {
        console.error('Google initialization error:', initError);
        showToast('Failed to initialize Google login. Please try again.', 'error');
      }
    } catch (error) {
      console.error('❌ Google login initialization error:', error);
      showToast('Failed to initialize Google login: ' + error.message, 'error');
    }
  };

  const handleMobileGoogleLogin = async () => {
    try {
      console.log('🤖 Enhanced mobile Google login starting...');
      
      // Check Capacitor availability first
      if (!window.Capacitor) {
        console.warn('Capacitor not available, falling back to web Google login');
        return await handleWebGoogleLogin();
      }
      
      // Enhanced plugin availability check
      const GoogleAuth = window.Capacitor?.Plugins?.GoogleAuth;
      if (!GoogleAuth) {
        console.warn('GoogleAuth plugin not available');
        // Try alternative authentication methods
        if (window.Capacitor?.Plugins?.Browser) {
          return await handleBrowserBasedGoogleLogin();
        }
        showToast('Google login not available on this device. Please use email/password.', 'warning');
        return;
      }

      console.log('🤖 Initiating enhanced mobile Google login');
      setLoading(true);

      // Enhanced initialization with better error handling
      try {
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        console.log('🔧 Mobile Google Client ID:', clientId ? (clientId.substring(0, 20) + '...') : 'NOT SET');
        if (!clientId) {
          throw new Error('Google Client ID not configured');
        }

        // Check if initialization is needed
        if (GoogleAuth.initialize) {
          const initConfig = {
            clientId: clientId,
            scopes: ['profile', 'email', 'openid'],
            grantOfflineAccess: true,
            forceCodeForRefreshToken: true
          };
          
          console.log('🔧 Initializing Google Auth with enhanced config');
          await GoogleAuth.initialize(initConfig);
          console.log('✅ Google Auth initialized successfully');
        }

        // Enhanced sign-in with retry logic
        let result;
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
          try {
            console.log(`🔄 Sign-in attempt ${retryCount + 1}`);
            result = await GoogleAuth.signIn();
            break; // Success, exit retry loop
          } catch (signInError) {
            retryCount++;
            if (retryCount > maxRetries) {
              throw signInError; // Re-throw after max retries
            }
            
            console.warn(`Sign-in attempt ${retryCount} failed, retrying...`, signInError);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
        
        console.log('✅ Google Auth sign-in successful, processing result...');
        console.log('Result structure:', {
          hasAuthentication: !!result?.authentication,
          hasIdToken: !!result?.idToken,
          hasServerAuthCode: !!result?.serverAuthCode,
          hasAccessToken: !!result?.accessToken,
          hasEmail: !!result?.email,
          hasName: !!result?.name,
          keys: Object.keys(result || {})
        });
        
        // Enhanced credential extraction with priority order
        let credential = null;
        let credentialType = null;
        let userInfo = {};
        
        // Extract user info
        if (result?.email) userInfo.email = result.email;
        if (result?.name) userInfo.name = result.name;
        if (result?.imageUrl) userInfo.picture = result.imageUrl;
        
        // Priority order for credentials (most secure first)
        if (result?.authentication?.idToken) {
          credential = result.authentication.idToken;
          credentialType = 'idToken';
        } else if (result?.idToken) {
          credential = result.idToken;
          credentialType = 'idToken';
        } else if (result?.serverAuthCode) {
          credential = result.serverAuthCode;
          credentialType = 'serverAuthCode';
        } else if (result?.authentication?.accessToken) {
          credential = result.authentication.accessToken;
          credentialType = 'accessToken';
        } else if (result?.accessToken) {
          credential = result.accessToken;
          credentialType = 'accessToken';
        }
        
        console.log('🔑 Using credential type:', credentialType);
        console.log('👤 User info extracted:', { ...userInfo, email: userInfo.email ? '***' : 'none' });
        
        if (credential) {
          // Enhanced response handling
          await handleEnhancedGoogleResponse({
            credential: credential,
            type: credentialType,
            userInfo: userInfo,
            platform: 'mobile'
          });
        } else {
          console.error('❌ No valid credential found in result:', result);
          showToast('Google login succeeded but no authentication token received. Please try again.', 'error');
        }
        
      } catch (initError) {
        console.error('Google Auth initialization/sign-in error:', initError);
        throw initError;
      }
      
    } catch (error) {
      console.error('Enhanced mobile Google login error:', error);
      
      // Enhanced error handling with more specific messages
      const errorMessage = error.message || error.toString();
      const errorCode = error.code || error.error_code || error.status;
      
      // User cancelled
      if (errorMessage.includes('cancelled') || errorMessage.includes('CANCELED') || 
          errorCode === '12501' || errorCode === 'SIGN_IN_CANCELLED' || errorCode === 4) {
        showToast('Google login was cancelled', 'info');
        return; // Don't treat cancellation as an error
      }
      
      // Network issues
      if (errorMessage.includes('network') || errorMessage.includes('NETWORK_ERROR') || 
          errorCode === 'NETWORK_ERROR' || errorCode === 7) {
        showToast('Network error. Please check your internet connection and try again.', 'error');
      }
      // Google Play Services issues
      else if (errorMessage.includes('not installed') || errorMessage.includes('DEVELOPER_ERROR') || 
               errorCode === '10' || errorCode === 10) {
        showToast('Google Play Services not available. Please update Google Play Services and try again.', 'error');
      }
      // Sign-in failure
      else if (errorMessage.includes('SIGN_IN_FAILED') || errorCode === '12500' || errorCode === 12500) {
        showToast('Google sign-in failed. Please try again or use email/password login.', 'error');
      }
      // API connection issues
      else if (errorMessage.includes('API_NOT_CONNECTED') || errorCode === 17) {
        showToast('Google services temporarily unavailable. Please try again later.', 'error');
      }
      // Configuration issues
      else if (errorMessage.includes('Client ID') || errorMessage.includes('configuration')) {
        showToast('Google login configuration error. Please contact support.', 'error');
      }
      // Generic error
      else {
        showToast(`Google login failed: ${errorMessage}`, 'error');
      }
      
      console.error('Detailed Google Auth error:', {
        message: errorMessage,
        code: errorCode,
        fullError: error,
        errorType: typeof error,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWebGoogleLogin = async () => {
    try {
      // Web Google Login implementation
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
      console.error('Web Google login error:', error);
      showToast('Failed to initialize Google login', 'error');
    }
  };

  const handleBrowserBasedGoogleLogin = async () => {
    try {
      console.log('🌐 Initiating browser-based Google login fallback');
      
      const Browser = window.Capacitor.Plugins.Browser;
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }
      
      // OAuth URL for Google
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`);
      const scope = encodeURIComponent('profile email openid');
      const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=code&` +
        `scope=${scope}&` +
        `access_type=offline`;
      
      await Browser.open({ 
        url: googleAuthUrl,
        windowName: '_self'
      });
      
    } catch (error) {
      console.error('Browser-based Google login error:', error);
      showToast('Browser login failed. Please use email/password.', 'error');
    }
  };

  const handleEnhancedGoogleResponse = async (response) => {
    try {
      setLoading(true);
      console.log('🔐 Processing enhanced Google authentication...');

      // Send simple request to match backend GoogleLoginRequest model
      const requestBody = {
        token: response.credential
      };

      console.log('📤 Sending Google auth request:', {
        tokenLength: requestBody.token?.length,
        platform: response.platform || 'web',
        type: response.type || 'credential',
        bodyType: typeof requestBody,
        bodyContent: JSON.stringify(requestBody).substring(0, 100) + '...'
      });

      // Use appropriate fetch method based on platform
      let result;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        console.log('📱 Using Capacitor HTTP for Google auth');
        
        const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${API_BASE}/auth/google`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Platform': 'mobile',
            ...platformDetection.getPlatformHeaders()
          },
          data: requestBody
        });
        
        result = {
          ok: httpResponse.status >= 200 && httpResponse.status < 300,
          status: httpResponse.status,
          json: async () => httpResponse.data
        };
      } else {
        console.log('🌐 Using secureFetch for Google auth');
        console.log('📦 Body being sent:', JSON.stringify(requestBody));
        
        // Use secureFetch for proper CSRF handling
        result = await secureFetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: {
            'X-Platform': response.platform || 'web'
          },
          body: JSON.stringify(requestBody)
        });
      }

      const data = await result.json();
      
      console.log('🔍 Google auth response:', {
        status: result.status,
        ok: result.ok,
        dataType: typeof data,
        hasToken: !!(data && data.token),
        hasUser: !!(data && data.user),
        dataKeys: data ? Object.keys(data) : []
      });

      if (result.ok) {
        console.log('✅ Google authentication successful');
        
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          console.log('🔑 Token stored in localStorage');
        }
        
        if (data.user) {
          login(data.user);
          console.log('👤 User logged in:', data.user.email || data.user.username || 'no identifier');
        } else {
          console.warn('⚠️ No user data in response');
        }
        
        showToast('Google login successful!', 'success');
        
        // Add haptic feedback for mobile
        if (window.Capacitor?.Plugins?.Haptics) {
          window.Capacitor.Plugins.Haptics.notification({ type: 'SUCCESS' });
        }
        
        navigate('/');
      } else {
        console.error('❌ Google authentication failed:', {
          status: result.status,
          statusText: result.statusText || 'Unknown',
          data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
        });
        
        let errorMessage = 'Google login failed';
        if (data && typeof data === 'object') {
          if (data.detail) {
            errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          } else if (data.message) {
            errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
          } else if (data.error) {
            errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          }
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
        
        // Add status-specific error messages
        if (result.status === 401) {
          errorMessage = 'Invalid Google token. Please try again.';
        } else if (result.status === 403) {
          errorMessage = 'Google login not authorized. Please contact support.';
        } else if (result.status >= 500) {
          errorMessage = 'Server error during Google login. Please try again later.';
        }
        
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Enhanced Google login error:', error?.message || error?.toString() || 'Unknown error');
      
      let errorMessage = 'Google login failed. Please try again.';
      
      if (error?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error?.message) {
        errorMessage = `Google login failed: ${error.message}`;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    // Legacy handler - redirect to enhanced version
    return await handleEnhancedGoogleResponse({
      credential: response.credential,
      type: 'idToken',
      platform: 'web'
    });
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

  // Slider mode layout - Modern & Clean (Used in AnimatedAuthContainer)
  if (isSliderMode) {
    return (
      <div className="modern-auth-form">
        <div className="auth-header">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>
        
        <div className="auth-form">
          {/* Email/Password Login Form */}
          <SecureForm
            onSubmit={handleSubmit}
            validate={validateForm}
            className="login-form"
          >
            <div className="form-group">
              <label htmlFor="identifier">Email or Username</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                placeholder="Enter your email or username"
                required
                autoComplete="username"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-btn primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </SecureForm>
          
          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>
          
          {/* Google Login - Secondary Action */}
          <button 
            type="button"
            className="google-btn-secondary"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          {/* Register Link - Enhanced for Mobile */}
          <div className="auth-register-link mobile-register-link">
            <p className="register-prompt">
              Don't have an account?{' '}
              <Link to="/register" className="register-link">
                Register here
              </Link>
            </p>
          </div>
          
          <div className="auth-note">
            <p className="auth-note-text">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Use animated container for standalone login page
  return (
    <AnimatedAuthContainer mode="login">
      <div className="modern-auth-form">
        <div className="auth-header">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>
        
        <div className="auth-form">
          {/* Email/Password Login Form */}
          <SecureForm
            onSubmit={handleSubmit}
            validate={validateForm}
            className="login-form"
          >
            <div className="form-group">
              <label htmlFor="identifier">Email or Username</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                placeholder="Enter your email or username"
                required
                autoComplete="username"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-btn primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </SecureForm>
          
          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>
          
          {/* Google Login - Secondary Action */}
          <button 
            type="button"
            className="google-btn-secondary"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          {/* Register Link - Enhanced for Mobile */}
          <div className="auth-register-link mobile-register-link">
            <p className="register-prompt">
              Don't have an account?{' '}
              <Link to="/register" className="register-link">
                Register here
              </Link>
            </p>
          </div>
          
          <div className="auth-note">
            <p className="auth-note-text">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </AnimatedAuthContainer>
  );
};

export default Login;