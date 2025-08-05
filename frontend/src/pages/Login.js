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
    <div className="simple-auth-page">
      <div className="auth-form-container-centered">
        <div className="simple-auth-header">
          <Link to="/" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Home
          </Link>
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Welcome back to Vergi Designs</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="simple-auth-form">
          <div className="form-group">
            <label htmlFor="identifier">Email, Username, or Phone</label>
            <input
              id="identifier"
              type="text"
              name="identifier"
              placeholder="Enter your credential"
              value={formData.identifier}
              onChange={handleChange}
              className="form-input-simple"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="form-input-simple"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="submit-btn-simple"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/reset-password" className="simple-link">
            Forgot your password?
          </Link>
          
          <p className="signup-prompt">
            New to Vergi Designs? <Link to="/register" className="simple-link">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;