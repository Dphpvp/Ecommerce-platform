// Animated Login/Register Component - Combined Forms with Sliding Animation
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from './toast';
import { secureFetch } from '../utils/csrf';
import SecureForm from './SecureForm';
import platformDetection from '../utils/platformDetection';
import TwoFactorVerification from './TwoFactor/TwoFactorVerification';
import '../styles/index.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AnimatedAuth = () => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+40');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState('');
  
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsActive(!isActive);
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 9);
    setPhoneNumber(value);
  };

  const getFullPhoneNumber = () => {
    return phoneNumber ? `${countryCode}${phoneNumber}` : '';
  };

  // Login form submission
  const handleLoginSubmit = async (sanitizedData, csrfToken) => {
    setLoading(true);
    
    const formDataWithAuth = {
      ...sanitizedData,
      recaptcha_response: 'NO_CAPTCHA_YET'
    };
    
    try {
      let response;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${API_BASE}/auth/login`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...platformDetection.getPlatformHeaders()
          },
          data: formDataWithAuth
        });
        
        response = {
          ok: httpResponse.status >= 200 && httpResponse.status < 300,
          status: httpResponse.status,
          json: async () => httpResponse.data
        };
      } else {
        response = await secureFetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          body: JSON.stringify(formDataWithAuth),
        });
      }

      const data = await response.json();

      if (response.ok) {
        if (data.requires_2fa) {
          setTempToken(data.temp_token);
          setTwoFactorMethod(data.method || 'app');
          setShow2FA(true);
          
          const message = data.method === 'email' 
            ? 'Verification code sent to your email' 
            : 'Please enter your 2FA code';
          
          showToast(message, 'info');
        } else {
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
          }
          login(data.user || null);
          showToast('Login successful!', 'success');
          navigate('/');
        }
      } else {
        let errorMessage = data.detail || data.message || `Login failed (${response.status})`;
        
        if (response.status === 401) {
          errorMessage = 'Invalid username or password.';
        }
        
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Register form submission
  const handleRegisterSubmit = async (sanitizedData, csrfToken) => {
    setLoading(true);
    
    const formDataWithPhone = {
      ...sanitizedData,
      phone: getFullPhoneNumber()
    };
    
    try {
      const response = await secureFetch(
        `${API_BASE}/auth/register`,
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
        setIsActive(false); // Switch to login form
      } else {
        const error = await response.json();
        const errorMessage = error.detail || 'Registration failed';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast('Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateLogin = (formData) => {
    const errors = {};
    if (!formData.identifier || formData.identifier.length < 3) {
      errors.identifier = 'Email or username must be at least 3 characters';
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const validateRegister = (formData) => {
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

  const handle2FASuccess = () => {
    setShow2FA(false);
    setTempToken('');
    setTwoFactorMethod('');
    navigate('/');
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setTempToken('');
    setTwoFactorMethod('');
  };

  if (show2FA) {
    return (
      <TwoFactorVerification 
        tempToken={tempToken}
        method={twoFactorMethod}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
      />
    );
  }

  return (
    <div className="animated-auth-page">
      <div className={`animated-auth-container ${isActive ? 'active' : ''}`}>
        {/* Login Form */}
        <div className="form-box login">
          <SecureForm onSubmit={handleLoginSubmit} validate={validateLogin} className="animated-auth-form">
            <h1>Login</h1>
            <div className="input-box">
              <input 
                type="text" 
                name="identifier"
                placeholder="Username or Email" 
                required 
              />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input 
                type="password" 
                name="password"
                placeholder="Password" 
                required 
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="forgot-link">
              <Link to="/reset-password">Forgot Password?</Link>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
            <p>or login with social platforms</p>
            <div className="social-icons">
              <a href="#"><i className="bx bxl-google"></i></a>
              <a href="#"><i className="bx bxl-facebook"></i></a>
              <a href="#"><i className="bx bxl-github"></i></a>
              <a href="#"><i className="bx bxl-linkedin"></i></a>
            </div>
          </SecureForm>
        </div>

        {/* Register Form */}
        <div className="form-box register">
          <SecureForm onSubmit={handleRegisterSubmit} validate={validateRegister} className="animated-auth-form">
            <h1>Registration</h1>
            <div className="input-box">
              <input 
                type="text" 
                name="username"
                placeholder="Username" 
                required 
              />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input 
                type="email" 
                name="email"
                placeholder="Email" 
                required 
              />
              <i className="bx bxs-envelope"></i>
            </div>
            <div className="input-box">
              <input 
                type="text" 
                name="full_name"
                placeholder="Full Name" 
                required 
              />
              <i className="bx bxs-user-detail"></i>
            </div>
            <div className="input-box">
              <input 
                type="password" 
                name="password"
                placeholder="Password" 
                required 
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="input-box phone-input-animated">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="country-select-animated"
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
                required
              />
              <i className="bx bxs-phone"></i>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
            <p>or register with social platforms</p>
            <div className="social-icons">
              <a href="#"><i className="bx bxl-google"></i></a>
              <a href="#"><i className="bx bxl-facebook"></i></a>
              <a href="#"><i className="bx bxl-github"></i></a>
              <a href="#"><i className="bx bxl-linkedin"></i></a>
            </div>
          </SecureForm>
        </div>

        {/* Toggle Panel */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button className="btn register-btn" onClick={toggleForm}>Register</button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button className="btn login-btn" onClick={toggleForm}>Login</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedAuth;