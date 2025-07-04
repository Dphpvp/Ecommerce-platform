import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import SecureForm from '../components/SecureForm';
import { csrfManager } from '../utils/csrf';


const Register = ({ isSliderMode = false }) => {
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+40');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 9);
    setPhoneNumber(value);
  };

  const getFullPhoneNumber = () => {
    return phoneNumber ? `${countryCode}${phoneNumber}` : '';
  };

  const validatePhone = (phone) => {
    return /^\+\d{2,4}\d{9}$/.test(phone);
  };

  const handleSubmit = async (sanitizedData, csrfToken) => {
    setLoading(true);
    
    const formDataWithPhone = {
      ...sanitizedData,
      phone: getFullPhoneNumber()
    };
    
    try {
      const response = await csrfManager.makeSecureRequest(
        `${process.env.REACT_APP_API_BASE_URL}/auth/register`,
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

  // Slider mode layout
  if (isSliderMode) {
    return (
      <div className="auth-form">
        <h1>Registration</h1>
        <SecureForm onSubmit={handleSubmit} validate={validateForm}>
          <div className="form-group with-icon">
            <input
              type="text"
              name="username"
              placeholder="Username"
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z][a-zA-Z0-9_-]*$"
              title="Username must start with a letter and contain only letters, numbers, underscore, and hyphen"
              required
            />
            <i className="bx bxs-user"></i>
          </div>
          
          <div className="form-group with-icon">
            <input
              type="email"
              name="email"
              placeholder="Email"
              maxLength={254}
              required
            />
            <i className="bx bxs-envelope"></i>
          </div>
          
          <div className="form-group with-icon">
            <input
              type="password"
              name="password"
              placeholder="Password"
              minLength={8}
              maxLength={128}
              title="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
              required
            />
            <i className="bx bxs-lock-alt"></i>
          </div>

          <div className="form-group">
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="address"
              placeholder="Address (optional)"
              maxLength={500}
            />
          </div>
          
          <div className="form-group">
            <div className="phone-input-group">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
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

          <button type="submit" disabled={loading} className="btn">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </SecureForm>
        
        <p>or register with social platforms</p>
        
        <div className="social-icons">
          <a href="#"><i className="bx bxl-google"></i></a>
          <a href="#"><i className="bx bxl-facebook"></i></a>
          <a href="#"><i className="bx bxl-github"></i></a>
          <a href="#"><i className="bx bxl-linkedin"></i></a>
        </div>
      </div>
    );
  }

  // Regular standalone page layout
  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-form">
          <h1>Register</h1>
          <SecureForm onSubmit={handleSubmit} validate={validateForm}>
            <input
              type="text"
              name="username"
              placeholder="Username (3-50 characters)"
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z][a-zA-Z0-9_-]*$"
              title="Username must start with a letter and contain only letters, numbers, underscore, and hyphen"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              maxLength={254}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password (min 8 chars with uppercase, lowercase, number, special char)"
              minLength={8}
              maxLength={128}
              title="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
              required
            />
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              minLength={2}
              maxLength={100}
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Address (optional)"
              maxLength={500}
            />
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Phone Number *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    width: '120px',
                    backgroundColor: 'white'
                  }}
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
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '5px',
                    fontSize: '1rem',
                    fontFamily: 'monospace'
                  }}
                  required
                />
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.25rem 0 0 0' }}>
                📱 Enter 9 digits (without the leading 0). Example: 723423225
              </p>
              {phoneNumber && (
                <p style={{ fontSize: '0.85rem', color: '#007bff', margin: '0.25rem 0 0 0' }}>
                  Full number: <strong>{getFullPhoneNumber()}</strong>
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </SecureForm>
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;