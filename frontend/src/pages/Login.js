import React, { useState, useEffect } from 'react';
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
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await apiResponse.json();

      if (apiResponse.ok) {
        if (data.requires_2fa) {
          setTempToken(data.temp_token);
          setShow2FA(true);
        } else {
          login(data.token, data.user);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_2fa) {
          // User has 2FA enabled - show 2FA verification
          setTempToken(data.temp_token);
          setShow2FA(true);
          showToast('Please enter your 2FA code', 'info');
        } else {
          // Normal login
          login(data.token, data.user);
          navigate('/');
        }
      } else {
        setError(data.detail || 'Login failed');
        if (data.detail && data.detail.includes('Email not verified')) {
          showToast('Please verify your email address', 'error');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = () => {
    setShow2FA(false);
    navigate('/');
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setTempToken('');
  };

  // Show 2FA verification if required
  if (show2FA) {
    return (
      <TwoFactorVerification 
        tempToken={tempToken} 
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
            <button type="submit" disabled={loading} className="btn btn-primary">
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