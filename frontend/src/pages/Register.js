// ASOS-Inspired Register Page - Sustainable Fashion
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import { useAuth } from '../contexts/AuthContext';
import platformDetection from '../utils/platformDetection';
import '../styles/index.css';

const Register = ({ isSliderMode = false }) => {
  const [loading, setLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { showToast } = useToastContext();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGoogleRegister = async () => {
    try {
      // Check if running on mobile (Capacitor)
      if (platformDetection.isMobile && window.Capacitor) {
        await handleMobileGoogleRegister();
        return;
      }

      // Web Google Registration
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
      console.error('Google registration initialization error:', error);
      showToast('Failed to initialize Google registration', 'error');
    }
  };

  const handleMobileGoogleRegister = async () => {
    try {
      setLoading(true);
      const GoogleAuth = window.Capacitor?.Plugins?.GoogleAuth;
      
      if (!GoogleAuth) {
        showToast('Google registration not available on this device.', 'warning');
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
        showToast('Google registration failed. No authentication token received.', 'error');
      }
    } catch (error) {
      console.error('Mobile Google registration error:', error);
      if (error.message?.includes('cancelled')) {
        showToast('Google registration was cancelled', 'info');
      } else {
        showToast('Google registration failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      setLoading(true);
      
      const requestBody = {
        token: response.credential
      };

      let result;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${process.env.REACT_APP_API_BASE_URL}/auth/google`,
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
        result = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/google`, {
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
        showToast('Registration successful! Welcome!', 'success');
        navigate('/');
      } else {
        const errorMessage = data.detail || data.message || 'Google registration failed';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Google registration error:', error);
      showToast('Google registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Slider mode layout - Google Only
  if (isSliderMode) {
    return (
      <div className="modern-auth-form">
        <div className="auth-header">
          <h2 className="auth-title">Join Us</h2>
          <p className="auth-subtitle">Create account with Google</p>
        </div>
        
        <div className="google-auth-container">
          <button 
            type="button"
            className="google-btn-primary"
            onClick={handleGoogleRegister}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? 'Creating Account...' : 'Continue with Google'}
          </button>
        </div>
      </div>
    );
  }

  // Modern standalone page layout - Google Only
  return (
    <div className="modern-auth-page">
      <div className="auth-container">
        <div className="auth-card register-card">
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join us with your Google account</p>
          </div>
            
          <div className="auth-body">
            <div className="google-auth-container">
              <button 
                type="button"
                className="google-btn-primary"
                onClick={handleGoogleRegister}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {loading ? 'Creating Account...' : 'Continue with Google'}
              </button>
            </div>
          </div>

          <div className="auth-footer">
            <p className="footer-text">
              Already have an account? <Link to="/login" className="auth-link">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;