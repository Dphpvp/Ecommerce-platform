// Animated Login/Register Component - Google Only
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from './toast';
import platformDetection from '../utils/platformDetection';
import TwoFactorVerification from './TwoFactor/TwoFactorVerification';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AnimatedAuth = () => {
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState('');
  
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  // Set initial form based on current route
  useEffect(() => {
    if (location.pathname === '/register') {
      setIsActive(true); // Show register form
    } else {
      setIsActive(false); // Show login form
    }
  }, [location.pathname]);

  const toggleToRegister = () => {
    navigate('/register');
  };

  const toggleToLogin = () => {
    navigate('/login');
  };


  // Google authentication handler
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      
      // Check if running on mobile (Capacitor)
      if (platformDetection.isMobile && window.Capacitor) {
        await handleMobileGoogleAuth();
        return;
      }

      // Web Google Auth
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
      console.error('Google auth initialization error:', error);
      showToast('Failed to initialize Google authentication', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileGoogleAuth = async () => {
    try {
      const GoogleAuth = window.Capacitor?.Plugins?.GoogleAuth;
      
      if (!GoogleAuth) {
        showToast('Google authentication not available on this device.', 'warning');
        return;
      }

      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }

      if (GoogleAuth.initialize) {
        await GoogleAuth.initialize({
          clientId: clientId,
          scopes: ['profile', 'email', 'openid']
        });
      }

      const result = await GoogleAuth.signIn();
      
      let credential = null;
      if (result?.authentication?.idToken) {
        credential = result.authentication.idToken;
      } else if (result?.idToken) {
        credential = result.idToken;
      }
      
      if (credential) {
        await handleGoogleResponse({ credential });
      } else {
        showToast('Google authentication failed. No token received.', 'error');
      }
    } catch (error) {
      console.error('Mobile Google auth error:', error);
      if (error.message?.includes('cancelled')) {
        showToast('Google authentication was cancelled', 'info');
      } else {
        showToast('Google authentication failed. Please try again.', 'error');
      }
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      const requestBody = {
        token: response.credential
      };

      let result;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
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
        result = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Platform': 'web'
          },
          body: JSON.stringify(requestBody),
          credentials: 'include'
        });
      }

      const data = await result.json();

      if (result.ok) {
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        login(data.user);
        showToast('Authentication successful!', 'success');
        navigate('/');
      } else {
        const errorMessage = data.detail || data.message || 'Google authentication failed';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      showToast('Google authentication failed. Please try again.', 'error');
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

  return (
    <div className="google-auth-wrapper">
      <div className="google-auth-container">
        <div className="google-auth-card">
          <div className="auth-header">
            <h1 className="auth-title">
              {isActive ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="auth-subtitle">
              {isActive ? 'Join us with your Google account' : 'Sign in with your Google account'}
            </p>
          </div>
          
          <div className="google-auth-body">
            <button 
              type="button"
              className="google-btn-primary-large"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Authenticating...' : 'Continue with Google'}
            </button>
          </div>
          
          <div className="auth-toggle-section">
            <p>
              {isActive ? 'Already have an account?' : "Don't have an account?"}
              <button 
                className="auth-toggle-link"
                onClick={isActive ? toggleToLogin : toggleToRegister}
              >
                {isActive ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedAuth;