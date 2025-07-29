// ASOS-Inspired Register Page - Sustainable Fashion
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import { useAuth } from '../contexts/AuthContext';
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
  const { login } = useAuth();
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

  const handleGoogleRegister = async () => {
    try {
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
    }
  };

  const handleMobileGoogleRegister = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      setLoading(true);
      
      const requestBody = {
        token: response.credential
      };

      let result;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${process.env.REACT_APP_API_BASE_URL}/auth/google`,
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
        result = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/google`, {
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
    } finally {
      setLoading(false);
    }
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

          {/* Google Registration */}
          <div className="divider">
            <span>or</span>
          </div>
          
          <button 
            type="button"
            className="google-btn"
            onClick={handleGoogleRegister}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
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

              <div className="divider">
                <span>or</span>
              </div>
              
              <button 
                type="button"
                className="google-btn"
                onClick={handleGoogleRegister}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
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