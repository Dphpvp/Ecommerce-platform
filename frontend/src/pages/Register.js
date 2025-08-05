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
    <div className="simple-auth-page">
      <div className="auth-form-container-centered">
        <div className="simple-auth-header">
          <Link to="/" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Home
          </Link>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join Vergi Designs community</p>
        </div>
            
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="simple-auth-form">
          <div className="form-group">
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="simple-input"
              required
            />
          </div>

          <div className="form-group">
            <input
              id="full_name"
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={handleChange}
              className="simple-input"
              required
            />
          </div>

          <div className="form-group">
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="simple-input"
              required
            />
          </div>

          <div className="form-group">
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="simple-input"
              required
            />
            <small className="field-note">Password must be at least 8 characters</small>
          </div>

          <div className="form-group">
            <div className="phone-input-simple">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="simple-select"
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
                placeholder="Phone (9 digits)"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                maxLength={9}
                className="simple-input phone-input"
                required
              />
            </div>
            {phoneNumber && (
              <small className="field-note">
                Full number: {getFullPhoneNumber()}
              </small>
            )}
          </div>

          <div className="form-group">
            <input
              id="address"
              type="text"
              name="address"
              placeholder="Address (optional)"
              value={formData.address}
              onChange={handleChange}
              className="simple-input"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn-simple">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer-links">
          <p className="signup-prompt">
            Already have an account? <Link to="/login" className="simple-link">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;