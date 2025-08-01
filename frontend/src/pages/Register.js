import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import { useAuth } from '../contexts/AuthContext';
import { secureFetch, sanitizeInput, validateInput } from '../utils/csrf';
import platformDetection from '../utils/platformDetection';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    address: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  
  const { showToast } = useToastContext();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    const usernameValidation = validateInput.username(formData.username);
    if (!usernameValidation.valid) {
      newErrors.username = usernameValidation.message;
    }

    // Email validation
    if (!validateInput.email(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    const passwordValidation = validateInput.password(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Full name validation
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && !validateInput.phone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Terms validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sanitize form data
      const sanitizedData = {
        username: sanitizeInput.text(formData.username, 50),
        email: sanitizeInput.email(formData.email),
        password: formData.password, // Don't sanitize password
        full_name: sanitizeInput.text(formData.full_name, 100),
        phone: sanitizeInput.phone(formData.phone),
        address: sanitizeInput.text(formData.address, 200)
      };

      // Temporarily use direct fetch instead of secureFetch to test CORS
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(sanitizedData)
      });

      if (response.ok) {
        const result = await response.json();
        showToast(result.message || 'Registration successful! Please check your email to verify your account.', 'success');
        navigate('/login');
      } else {
        const error = await response.json();
        const errorMessage = error.detail || error.message || 'Registration failed';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Connection failed. Please check your internet connection.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleMobileGoogleRegister = async () => {
    try {
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
        showToast('Registration successful! Welcome!', 'success');
        navigate('/');
      } else {
        const errorMessage = data.detail || data.message || 'Google registration failed';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Google registration error:', error);
      showToast('Google registration failed. Please try again.', 'error');
    }
  };

  return (
    <div className="google-auth-container">
      <div className="google-auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join our community</p>
        </div>
        
        <div className="auth-form">
          {/* Google Registration Button */}
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
          
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="auth-form-fields">
            <div className="form-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                className={`professional-form-input ${errors.username ? 'error' : ''}`}
                required
              />
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className={`professional-form-input ${errors.email ? 'error' : ''}`}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={`professional-form-input ${errors.full_name ? 'error' : ''}`}
                required
              />
              {errors.full_name && <span className="error-message">{errors.full_name}</span>}
            </div>

            <div className="form-group">
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number (optional)"
                value={formData.phone}
                onChange={handleInputChange}
                className={`professional-form-input ${errors.phone ? 'error' : ''}`}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="address"
                placeholder="Address (optional)"
                value={formData.address}
                onChange={handleInputChange}
                className="professional-form-input"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className={`professional-form-input ${errors.password ? 'error' : ''}`}
                required
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`professional-form-input ${errors.confirmPassword ? 'error' : ''}`}
                required
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                I agree to the <Link to="/terms" className="link">Terms of Service</Link> and <Link to="/privacy" className="link">Privacy Policy</Link>
              </label>
              {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}
            </div>

            <button 
              type="submit" 
              className="auth-btn primary"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="auth-register-link">
            <p className="register-prompt">
              Already have an account?{' '}
              <Link to="/login" className="register-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;