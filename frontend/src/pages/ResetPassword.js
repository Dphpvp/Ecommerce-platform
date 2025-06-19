import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToastContext } from '../components/toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { showToast } = useToastContext();
  
  const [step, setStep] = useState(token ? 'reset' : 'request');
  const [loading, setLoading] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);
  const recaptchaRef = useRef(null);
  
  const [requestForm, setRequestForm] = useState({
    email: ''
  });
  
  const [resetForm, setResetForm] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});

  // FIXED: Proper reCAPTCHA loading
  useEffect(() => {
    if (step !== 'request') return; // Only load for request step

    const loadRecaptcha = () => {
      // Check if reCAPTCHA is already loaded
      if (window.grecaptcha) {
        setRecaptchaLoaded(true);
        return;
      }

      // Load reCAPTCHA script
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoadReset&render=explicit';
      script.async = true;
      script.defer = true;

      // Define the callback function globally
      window.onRecaptchaLoadReset = () => {
        setRecaptchaLoaded(true);
      };

      document.head.appendChild(script);

      return () => {
        // Cleanup
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        delete window.onRecaptchaLoadReset;
      };
    };

    loadRecaptcha();
  }, [step]);

  // FIXED: Render reCAPTCHA widget when loaded and form is shown
  useEffect(() => {
    if (recaptchaLoaded && step === 'request' && recaptchaRef.current && !recaptchaWidgetId) {
      try {
        const widgetId = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: process.env.REACT_APP_RECAPTCHA_SITE_KEY,
          callback: (response) => {
            console.log('reCAPTCHA completed:', response);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            showToast('reCAPTCHA expired. Please complete it again.', 'warning');
          }
        });
        setRecaptchaWidgetId(widgetId);
      } catch (error) {
        console.error('reCAPTCHA render error:', error);
        showToast('Failed to load reCAPTCHA. Please refresh the page.', 'error');
      }
    }
  }, [recaptchaLoaded, step, showToast]);

  const handleRequestChange = (e) => {
    setRequestForm({ ...requestForm, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleResetChange = (e) => {
    setResetForm({ ...resetForm, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateResetForm = () => {
    const newErrors = {};
    
    if (!resetForm.password) {
      newErrors.password = 'Password is required';
    } else if (resetForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!resetForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (resetForm.password !== resetForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: Request submit with proper reCAPTCHA handling
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    if (!requestForm.email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    // FIXED: Get reCAPTCHA response properly
    let recaptchaResponse = '';
    try {
      if (recaptchaWidgetId !== null) {
        recaptchaResponse = window.grecaptcha.getResponse(recaptchaWidgetId);
      }
    } catch (error) {
      console.error('reCAPTCHA error:', error);
    }

    if (!recaptchaResponse) {
      showToast('Please complete the reCAPTCHA verification', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: requestForm.email,
          recaptcha_response: recaptchaResponse
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('Password reset email sent! Check your inbox.', 'success');
        setStep('sent');
      } else {
        showToast(data.detail || 'Failed to send reset email', 'error');
        // Reset reCAPTCHA on error
        if (recaptchaWidgetId !== null) {
          window.grecaptcha.reset(recaptchaWidgetId);
        }
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
      // Reset reCAPTCHA on error
      if (recaptchaWidgetId !== null) {
        window.grecaptcha.reset(recaptchaWidgetId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateResetForm()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          new_password: resetForm.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('Password reset successfully! You can now login.', 'success');
        setStep('success');
      } else {
        showToast(data.detail || 'Failed to reset password', 'error');
      }
    } catch (error) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'sent') {
    return (
      <div className="auth-page">
        <div className="container">
          <div className="auth-form">
            <h1>Check Your Email</h1>
            <div className="success-message">
              <p>We've sent a password reset link to <strong>{requestForm.email}</strong></p>
              <p>Check your inbox and click the link to reset your password.</p>
            </div>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', padding: '12px 30px', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="auth-page">
        <div className="container">
          <div className="auth-form">
            <h1>Password Reset Complete</h1>
            <div className="success-message">
              <p>Your password has been successfully reset!</p>
            </div>
            <Link to="/login" className="btn btn-primary">Login with New Password</Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'reset' && token) {
    return (
      <div className="auth-page">
        <div className="container">
          <div className="auth-form">
            <h1>Reset Your Password</h1>
            
            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="New Password (min 6 characters)"
                  value={resetForm.password}
                  onChange={handleResetChange}
                  className={errors.password ? 'error' : ''}
                  required
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
              
              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  value={resetForm.confirmPassword}
                  onChange={handleResetChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  required
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
              
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            
            <p>
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-form">
          <h1>Reset Password</h1>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
          
          {!recaptchaLoaded && (
            <div className="loading-recaptcha" style={{ margin: '10px 0' }}>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>Loading security verification...</p>
            </div>
          )}
          
          <form onSubmit={handleRequestSubmit}>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={requestForm.email}
                onChange={handleRequestChange}
                className={errors.email ? 'error' : ''}
                required
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            {/* FIXED: reCAPTCHA container */}
            <div className="form-group">
              <div 
                ref={recaptchaRef}
                style={{ margin: '10px 0' }}
              ></div>
              {!recaptchaLoaded && (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  Please wait for security verification to load...
                </p>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !recaptchaLoaded} 
              className="btn btn-primary"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          
          <p>
            Remember your password? <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;