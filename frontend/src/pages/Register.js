import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import SecureForm from '../components/SecureForm';
import { csrfManager } from '../utils/csrf';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+40');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const handlePhoneNumberChange = (e) => {
    // Only allow digits, max 9 digits
    const value = e.target.value.replace(/\D/g, '').substring(0, 9);
    setPhoneNumber(value);
  };

  const getFullPhoneNumber = () => {
    return phoneNumber ? `${countryCode}${phoneNumber}` : '';
  };

  const validatePhone = (phone) => {
    // Must be country code followed by exactly 9 digits
    return /^\+\d{2,4}\d{9}$/.test(phone);
  };

  const handleSubmit = async (sanitizedData, csrfToken) => {
    setLoading(true);
    
    // Add the full phone number to form data
    const formDataWithPhone = {
      ...sanitizedData,
      phone: getFullPhoneNumber()
    };
    
    try {
      const response = await csrfManager.makeSecureRequest(
        `${process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api'}/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(formDataWithPhone),
        }
      );

      if (response.ok) {
        const result = await response.json();
        showToast(
          result.message ||
            'Registration successful! Please check your email to verify your account.',
          'success'
        );
        navigate('/login');
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }
    } catch (error) {
      showToast(error.message || 'Registration failed', 'error');
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
    <div className="modern-auth-page">
      <div className="auth-container">
        <div className="auth-left-panel">
          <div className="auth-branding">
            <h1 className="brand-title">Join Our Community</h1>
            <p className="brand-subtitle">Create your account and start shopping</p>
            <div className="auth-illustration">
              <div className="floating-element"></div>
              <div className="floating-element"></div>
              <div className="floating-element"></div>
            </div>
          </div>
        </div>
        
        <div className="auth-right-panel">
          <div className="auth-form-container register">
            <div className="auth-form-header">
              <h2>Create Account</h2>
              <p>Fill in your details to get started</p>
            </div>
            
            <SecureForm onSubmit={handleSubmit} validate={validateForm} className="modern-auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">Username *</label>
                  <div className="input-wrapper">
                    <input
                      id="username"
                      type="text"
                      name="username"
                      placeholder="Choose a username"
                      minLength={3}
                      maxLength={50}
                      pattern="^[a-zA-Z][a-zA-Z0-9_-]*$"
                      title="Username must start with a letter and contain only letters, numbers, underscore, and hyphen"
                      className="form-input"
                      required
                    />
                    <i className="input-icon fas fa-user"></i>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="full_name" className="form-label">Full Name *</label>
                  <div className="input-wrapper">
                    <input
                      id="full_name"
                      type="text"
                      name="full_name"
                      placeholder="Enter your full name"
                      minLength={2}
                      maxLength={100}
                      className="form-input"
                      required
                    />
                    <i className="input-icon fas fa-id-card"></i>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address *</label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    maxLength={254}
                    className="form-input"
                    required
                  />
                  <i className="input-icon fas fa-envelope"></i>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password *</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Create a strong password"
                    minLength={8}
                    maxLength={128}
                    title="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
                    className="form-input"
                    required
                  />
                  <i className="input-icon fas fa-lock"></i>
                </div>
                <div className="password-requirements">
                  <small>Password must contain uppercase, lowercase, number, and special character</small>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
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
                  <div className="input-wrapper phone-input">
                    <input
                      type="tel"
                      placeholder="723423225"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      maxLength={9}
                      className="form-input"
                      required
                    />
                    <i className="input-icon fas fa-phone"></i>
                  </div>
                </div>
                <div className="phone-help">
                  <small>📱 Enter 9 digits (without leading 0). Example: 723423225</small>
                  {phoneNumber && (
                    <small className="phone-preview">
                      Full number: <strong>{getFullPhoneNumber()}</strong>
                    </small>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address" className="form-label">Address</label>
                <div className="input-wrapper">
                  <input
                    id="address"
                    type="text"
                    name="address"
                    placeholder="Enter your address (optional)"
                    maxLength={500}
                    className="form-input"
                  />
                  <i className="input-icon fas fa-map-marker-alt"></i>
                </div>
                <small className="field-note">This field is optional but helps with order delivery</small>
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    Create Account
                  </>
                )}
              </button>
            </SecureForm>
            
            <div className="auth-links">
              <div className="auth-divider">
                <span>Already have an account?</span>
              </div>
              
              <Link to="/login" className="login-link">
                <i className="fas fa-sign-in-alt"></i>
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;