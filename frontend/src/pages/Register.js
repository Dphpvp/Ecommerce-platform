import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastContext } from '../components/toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countryCode, setCountryCode] = useState('+40');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhoneNumberChange = (e) => {
    // Only allow digits, max 9 digits
    const value = e.target.value.replace(/\D/g, '').substring(0, 9);
    setPhoneNumber(value);
  };

  const handleGoogleRegister = async () => {
    try {
      setLoading(true);
      // Redirect to backend Google OAuth endpoint for registration
      window.location.href = `${API_BASE}/auth/google?register=true`;
    } catch (error) {
      console.error('Google registration error:', error);
      setError('Google registration failed. Please try again.');
      setLoading(false);
    }
  };

  const getFullPhoneNumber = () => {
    return phoneNumber ? `${countryCode}${phoneNumber}` : '';
  };

  const validatePhone = (phone) => {
    // Must be country code followed by exactly 9 digits
    return /^\+\d{2,4}\d{9}$/.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Add the full phone number to form data
    const formDataWithPhone = {
      ...formData,
      phone: getFullPhoneNumber()
    };
    
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formDataWithPhone)
      });

      if (response.ok) {
        const result = await response.json();
        showToast(
          result.message ||
            'Registration successful! Please check your email to verify your account.',
          'success'
        );
        navigate('/login');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side validation function
  const validateForm = (formData) => {
    const errors = {};

    // Username validation
    if (!formData.username || formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    // Phone validation - check if we have 9 digits
    if (!phoneNumber || phoneNumber.length !== 9) {
      errors.phone = 'Phone number must be exactly 9 digits';
    }

    // Full name validation
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    return errors;
  };

  return (
    <div className="page-container">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Home
          </Link>
          <h1 className="auth-title">Join Vergi Designs</h1>
          <p className="auth-subtitle">Create your account and start shopping</p>
        </div>
        
        <div className="auth-form-container">
          {/* Google Sign Up Button */}
          <button 
            type="button" 
            className="google-auth-btn"
            onClick={handleGoogleRegister}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>
          
          {error && <div className="error-message">{error}</div>}
            
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="full_name" className="form-label">Full Name</label>
                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Create a strong password (min. 8 characters)"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="phone-input-group">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="country-select"
                >
                  <option value="+40">🇷🇴 +40</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+39">🇮🇹 +39</option>
                  <option value="+34">🇪🇸 +34</option>
                </select>
                <input
                  type="tel"
                  placeholder="723423225"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  maxLength={9}
                  className="form-input phone-input"
                  required
                />
              </div>
              <small className="form-help">Enter 9 digits (without leading 0). Example: 723423225</small>
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">Address (Optional)</label>
              <input
                id="address"
                type="text"
                name="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-full">
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          
          <div className="auth-links">
            <div className="auth-separator">
              <span>Already have an account?</span>
            </div>
            
            <Link to="/login" className="btn-secondary btn-full">
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;