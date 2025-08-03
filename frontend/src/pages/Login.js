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
            <h1 className="brand-title">Welcome Back</h1>
            <p className="brand-subtitle">Sign in to continue shopping</p>
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
                <span>New to our platform?</span>
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