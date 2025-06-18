import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import SecureForm from '../components/SecureForm';
import { csrfManager } from '../utils/csrf';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const handleSubmit = async (sanitizedData, csrfToken) => {
    setLoading(true);
    try {
      const response = await csrfManager.makeSecureRequest(
        `${process.env.REACT_APP_API_BASE_URL}/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(sanitizedData),
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

    // Phone validation - NOW REQUIRED
    if (!formData.phone || formData.phone.trim() === '') {
      errors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    // Full name validation
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    return errors;
  };

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
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number (required)"
              maxLength={20}
              pattern="^[\+]?[1-9][\d\s\-\(\)]{7,20}$"
              title="Please enter a valid phone number"
              required
            />

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