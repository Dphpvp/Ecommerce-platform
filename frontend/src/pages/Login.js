import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
        login(data.token, data.user);
        navigate('/');
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
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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