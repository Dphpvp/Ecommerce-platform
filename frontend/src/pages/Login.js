import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerification from '../components/TwoFactor/TwoFactorVerification';
import { useToastContext } from '../components/toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

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
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      // Redirect to backend Google OAuth endpoint
      window.location.href = `${API_BASE}/auth/google`;
    } catch (error) {
      console.error('Google login error:', error);
      setError('Google login failed. Please try again.');
      setLoading(false);
    }
  };

  // Simple login implementation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        
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
          const loginSuccess = await login(data.user);
          if (loginSuccess) {
            showToast('Login successful!', 'success');
            navigate('/');
          } else {
            setError('Authentication failed. Please try again.');
          }
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Login failed');
        
        if (errorData.detail && errorData.detail.includes('Email not verified')) {
          showToast('Please verify your email address', 'error');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
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
    <div className="modern-auth-page">
      <div className="auth-container">
        <div className="auth-left-panel">
          <div className="auth-branding">
            <Link to="/" className="auth-back-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Back to Home
            </Link>
            <h1 className="brand-title">Welcome Back</h1>
            <p className="brand-subtitle">Sign in to continue shopping with Vergi Designs</p>
            <div className="auth-illustration">
              <div className="floating-element"></div>
              <div className="floating-element"></div>
              <div className="floating-element"></div>
            </div>
          </div>
        </div>
        
        <div className="auth-right-panel">
          <div className="auth-form-container">
            <div className="auth-form-header">
              <h2>Sign In</h2>
              <p>Enter your credentials to access your account</p>
            </div>
            
            {/* Google Sign In Button */}
            <button 
              type="button" 
              className="google-auth-btn modern-google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider">
              <span>or sign in with email</span>
            </div>
            
            {error && <div className="error-message modern">{error}</div>}
            
            <form onSubmit={handleSubmit} className="modern-auth-form">
              <div className="form-group">
                <label htmlFor="identifier" className="form-label">Email, Username, or Phone</label>
                <div className="input-wrapper">
                  <input
                    id="identifier"
                    type="text"
                    name="identifier"
                    placeholder="Enter your email, username, or phone"
                    value={formData.identifier}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                  <i className="input-icon fas fa-user"></i>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                  <i className="input-icon fas fa-lock"></i>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="auth-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="auth-links">
              <Link to="/reset-password" className="forgot-link">
                <i className="fas fa-key"></i>
                Forgot your password?
              </Link>
              
              <div className="auth-divider">
                <span>New to Vergi Designs?</span>
              </div>
              
              <Link to="/register" className="register-link">
                <i className="fas fa-user-plus"></i>
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;