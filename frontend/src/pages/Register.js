// ASOS-Inspired Register Page - Sustainable Fashion
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import SecureForm from '../components/SecureForm';
import { secureFetch } from '../utils/csrf';
import platformDetection from '../utils/platformDetection';
import '../styles/index.css';

const Register = ({ isSliderMode = false }) => {
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+40');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 9);
    setPhoneNumber(value);
  };

  const getFullPhoneNumber = () => {
    return phoneNumber ? `${countryCode}${phoneNumber}` : '';
  };

  const handleSubmit = async (sanitizedData, csrfToken) => {
    setLoading(true);
    
    const formDataWithPhone = {
      ...sanitizedData,
      phone: getFullPhoneNumber()
    };
    
    try {
      const response = await secureFetch(
        `${process.env.REACT_APP_API_BASE_URL}/auth/register`,
        {
          method: 'POST',
          body: JSON.stringify(formDataWithPhone),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const successMessage = result.message ||
          'Registration successful! Please check your email to verify your account.';
        
        showToast(successMessage, 'success');
        navigate('/login');
      } else {
        const error = await response.json();
        const errorMessage = error.detail || 'Registration failed';
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

  const validateForm = (formData) => {
    const errors = {};

    if (!formData.username || formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!phoneNumber || phoneNumber.length !== 9) {
      errors.phone = 'Phone number must be exactly 9 digits';
    }

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    return errors;
  };

  // Slider mode layout - Modern & Clean
  if (isSliderMode) {
    return (
      <div className="modern-auth-form">
        <div className="auth-header">
          <h2 className="auth-title">Join Us</h2>
          <p className="auth-subtitle">Create your account</p>
        </div>
        
        <SecureForm onSubmit={handleSubmit} validate={validateForm} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z][a-zA-Z0-9_-]*$"
              title="Username must start with a letter and contain only letters, numbers, underscore, and hyphen"
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email Address"
              maxLength={254}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              minLength={8}
              maxLength={128}
              title="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              id="full_name"
              name="full_name"
              placeholder="Full Name"
              minLength={2}
              maxLength={100}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              id="address"
              name="address"
              placeholder="Address (Optional)"
              maxLength={500}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <div className="phone-input">
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
                className="form-input"
                required
              />
            </div>
            <div className="phone-info">
              📱 Enter 9 digits (without the leading 0)
            </div>
            {phoneNumber && (
              <div className="phone-preview">
                Full number: <strong>{getFullPhoneNumber()}</strong>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="submit-btn"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </SecureForm>
      </div>
    );
  }

  // Modern standalone page layout - Clean Experience
  return (
    <div className="modern-auth-page">
      <div className="auth-container">
        <div className="auth-card register-card">
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join us today</p>
          </div>
            
          <div className="auth-body">
            <SecureForm onSubmit={handleSubmit} validate={validateForm} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    minLength={3}
                    maxLength={50}
                    pattern="^[a-zA-Z][a-zA-Z0-9_-]*$"
                    title="Username must start with a letter and contain only letters, numbers, underscore, and hyphen"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    maxLength={254}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Create a secure password"
                    minLength={8}
                    maxLength={128}
                    title="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="full_name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    placeholder="Enter your full name"
                    minLength={2}
                    maxLength={100}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address" className="form-label">Address (Optional)</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Enter your address"
                  maxLength={500}
                  className="form-input"
                />
              </div>
                
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="phone-input">
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
                    className="form-input"
                    required
                  />
                </div>
                <div className="phone-info">
                  📱 Enter 9 digits (without the leading 0). Example: 723423225
                </div>
                {phoneNumber && (
                  <div className="phone-preview">
                    Full number: <strong>{getFullPhoneNumber()}</strong>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="submit-btn"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </SecureForm>
          </div>

          <div className="auth-footer">
            <p className="footer-text">
              Already have an account? <Link to="/login" className="auth-link">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;