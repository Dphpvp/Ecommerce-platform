// Test Login Page to debug form rendering
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from '../components/toast';
import { secureFetch } from '../utils/csrf';
import SecureForm from '../components/SecureForm';
import platformDetection from '../utils/platformDetection';
import '../styles/index.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const LoginTest = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const handleSubmit = async (sanitizedData, csrfToken) => {
    setLoading(true);
    
    const formDataWithAuth = {
      ...sanitizedData
    };
    
    formDataWithAuth.recaptcha_response = 'NO_CAPTCHA_YET';
    
    try {
      const response = await secureFetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(formDataWithAuth),
      });

      const data = await response.json();

      if (response.ok) {
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
      } else {
        let errorMessage = data.detail || data.message || `Login failed (${response.status})`;
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (formData) => {
    const errors = {};

    if (!formData.identifier || formData.identifier.length < 3) {
      errors.identifier = 'Email or username must be at least 3 characters';
    }

    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    return errors;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Test Login Form</h1>
      
      <SecureForm onSubmit={handleSubmit} validate={validateForm}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email or Username:</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            placeholder="Enter your email or username"
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '12px', marginBottom: '10px' }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </SecureForm>
      
      <hr />
      
      <button 
        type="button"
        style={{ width: '100%', padding: '12px' }}
        onClick={() => showToast('Google login would go here', 'info')}
      >
        Continue with Google
      </button>
    </div>
  );
};

export default LoginTest;