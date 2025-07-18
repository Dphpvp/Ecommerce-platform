// Elegant Luxury Register Page - Premium Experience
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import SecureForm from '../components/SecureForm';
import { secureFetch } from '../utils/csrf';
import platformDetection from '../utils/platformDetection';

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

  // Slider mode layout - Elegant & Minimal
  if (isSliderMode) {
    return (
      <div className="elegant-auth-form">
        <div className="elegant-auth-header">
          <div className="elegant-icon">
            <img src="/images/logo.png" alt="Vergi Designs" className="elegant-icon-image" />
          </div>
          <h2 className="elegant-title">Join Us</h2>
          <p className="elegant-subtitle">Create your luxury account</p>
        </div>
        
        <SecureForm onSubmit={handleSubmit} validate={validateForm} className="elegant-form">
          <div className="elegant-form-group">
            <div className="elegant-input-wrapper">
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Username"
                minLength={3}
                maxLength={50}
                pattern="^[a-zA-Z][a-zA-Z0-9_-]*$"
                title="Username must start with a letter and contain only letters, numbers, underscore, and hyphen"
                className="elegant-input"
                required
              />
              <div className="elegant-input-border"></div>
            </div>
          </div>
          
          <div className="elegant-form-group">
            <div className="elegant-input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Email Address"
                maxLength={254}
                className="elegant-input"
                required
              />
              <div className="elegant-input-border"></div>
            </div>
          </div>
          
          <div className="elegant-form-group">
            <div className="elegant-input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                minLength={8}
                maxLength={128}
                title="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
                className="elegant-input"
                required
              />
              <div className="elegant-input-border"></div>
            </div>
          </div>

          <div className="elegant-form-group">
            <div className="elegant-input-wrapper">
              <input
                type="text"
                id="full_name"
                name="full_name"
                placeholder="Full Name"
                minLength={2}
                maxLength={100}
                className="elegant-input"
                required
              />
              <div className="elegant-input-border"></div>
            </div>
          </div>

          <div className="elegant-form-group">
            <div className="elegant-input-wrapper">
              <input
                type="text"
                id="address"
                name="address"
                placeholder="Address (Optional)"
                maxLength={500}
                className="elegant-input"
              />
              <div className="elegant-input-border"></div>
            </div>
          </div>
          
          <div className="elegant-form-group">
            <div className="elegant-phone-input">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="elegant-country-select"
              >
                <option value="+40">🇷🇴 +40</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+39">🇮🇹 +39</option>
                <option value="+34">🇪🇸 +34</option>
              </select>
              <div className="elegant-input-wrapper">
                <input
                  type="tel"
                  placeholder="723423225"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  maxLength={9}
                  className="elegant-input"
                  required
                />
                <div className="elegant-input-border"></div>
              </div>
            </div>
            <div className="elegant-phone-info">
              📱 Enter 9 digits (without the leading 0)
            </div>
            {phoneNumber && (
              <div className="elegant-phone-preview">
                Full number: <strong>{getFullPhoneNumber()}</strong>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="elegant-btn elegant-btn-primary"
          >
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            {!loading && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            )}
          </button>
        </SecureForm>
      </div>
    );
  }

  // Elegant standalone page layout - Premium Experience
  return (
    <div className="elegant-auth-page">
      {/* Elegant Fullscreen Auth Section */}
      <section className="elegant-auth-section">
        <div className="elegant-auth-background">
          <div 
            className="elegant-bg-image" 
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80)',
              transform: `translateY(${scrollY * 0.3}px)`
            }}
          ></div>
          <div className="elegant-overlay"></div>
          <div className="elegant-pattern"></div>
        </div>
        
        <div className="elegant-auth-container">
          <div className="elegant-auth-card elegant-register-card">
            <div className="elegant-card-header">
              <div className="elegant-logo">
                <img src="/images/logo.png" alt="Vergi Designs" className="elegant-logo-image" />
              </div>
              <h1 className="elegant-main-title">Join Vergi Designs</h1>
              <p className="elegant-main-subtitle">Create your luxury account today</p>
            </div>
            
            <div className="elegant-card-body">
              <SecureForm onSubmit={handleSubmit} validate={validateForm} className="elegant-form">
                <div className="elegant-form-row">
                  <div className="elegant-form-group">
                    <label htmlFor="username" className="elegant-label">Username</label>
                    <div className="elegant-input-wrapper">
                      <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Enter your username"
                        minLength={3}
                        maxLength={50}
                        pattern="^[a-zA-Z][a-zA-Z0-9_-]*$"
                        title="Username must start with a letter and contain only letters, numbers, underscore, and hyphen"
                        className="elegant-input"
                        required
                      />
                      <div className="elegant-input-border"></div>
                    </div>
                  </div>
                  
                  <div className="elegant-form-group">
                    <label htmlFor="email" className="elegant-label">Email</label>
                    <div className="elegant-input-wrapper">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter your email"
                        maxLength={254}
                        className="elegant-input"
                        required
                      />
                      <div className="elegant-input-border"></div>
                    </div>
                  </div>
                </div>

                <div className="elegant-form-row">
                  <div className="elegant-form-group">
                    <label htmlFor="password" className="elegant-label">Password</label>
                    <div className="elegant-input-wrapper">
                      <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Create a secure password"
                        minLength={8}
                        maxLength={128}
                        title="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
                        className="elegant-input"
                        required
                      />
                      <div className="elegant-input-border"></div>
                    </div>
                  </div>

                  <div className="elegant-form-group">
                    <label htmlFor="full_name" className="elegant-label">Full Name</label>
                    <div className="elegant-input-wrapper">
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        placeholder="Enter your full name"
                        minLength={2}
                        maxLength={100}
                        className="elegant-input"
                        required
                      />
                      <div className="elegant-input-border"></div>
                    </div>
                  </div>
                </div>

                <div className="elegant-form-group">
                  <label htmlFor="address" className="elegant-label">Address (Optional)</label>
                  <div className="elegant-input-wrapper">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      placeholder="Enter your address"
                      maxLength={500}
                      className="elegant-input"
                    />
                    <div className="elegant-input-border"></div>
                  </div>
                </div>
                
                <div className="elegant-form-group">
                  <label className="elegant-label">Phone Number</label>
                  <div className="elegant-phone-input">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="elegant-country-select"
                    >
                      <option value="+40">🇷🇴 +40</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+34">🇪🇸 +34</option>
                    </select>
                    <div className="elegant-input-wrapper">
                      <input
                        type="tel"
                        placeholder="723423225"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        maxLength={9}
                        className="elegant-input"
                        required
                      />
                      <div className="elegant-input-border"></div>
                    </div>
                  </div>
                  <div className="elegant-phone-info">
                    📱 Enter 9 digits (without the leading 0). Example: 723423225
                  </div>
                  {phoneNumber && (
                    <div className="elegant-phone-preview">
                      Full number: <strong>{getFullPhoneNumber()}</strong>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="elegant-btn elegant-btn-primary"
                >
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                  {!loading && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                  )}
                </button>
              </SecureForm>
            </div>

            <div className="elegant-card-footer">
              <p className="elegant-footer-text">
                Already have an account? <Link to="/login" className="elegant-link">Sign in here</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Register;

// Elegant Luxury Register Page Complete with:
// - Fullscreen elegant design with premium aesthetics
// - Sophisticated glassmorphism effects and form interactions
// - Refined phone number input with elegant styling
// - Premium visual elements and smooth animations
// - Luxury color palette and sophisticated typography
// - Enhanced mobile experience with touch-friendly design
// - Elegant form validation and error handling
// - Sophisticated parallax effects and visual depth