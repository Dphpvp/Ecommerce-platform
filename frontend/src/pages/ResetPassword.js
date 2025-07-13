import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import mobileCaptcha from '../utils/mobileCaptcha';
import { secureFetch } from '../utils/csrf';
import platformDetection from '../utils/platformDetection';
import '../styles/mobileCaptcha.css';

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

  // Initialize mobile captcha
  useEffect(() => {
    if (step !== 'request') return; // Only load for request step

    const initializeCaptcha = async () => {
      try {
        await mobileCaptcha.initialize({
          siteKey: process.env.REACT_APP_RECAPTCHA_SITE_KEY,
          onLoad: () => setRecaptchaLoaded(true),
          onComplete: (response) => {
            console.log('Captcha completed:', response);
          },
          onExpired: () => {
            console.log('Captcha expired');
            showToast('Security verification expired. Please complete it again.', 'warning');
          }
        });
      } catch (error) {
        console.error('Failed to initialize captcha:', error);
        showToast('Failed to load security verification. Please refresh the page.', 'error');
      }
    };

    initializeCaptcha();
  }, [step, showToast]);

  // Render captcha widget when loaded and form is shown
  useEffect(() => {
    if (recaptchaLoaded && step === 'request' && recaptchaRef.current && !recaptchaWidgetId) {
      try {
        const widgetId = mobileCaptcha.render(recaptchaRef.current, {
          sitekey: process.env.REACT_APP_RECAPTCHA_SITE_KEY,
          callback: (response) => {
            console.log('Captcha completed:', response);
          },
          'expired-callback': () => {
            console.log('Captcha expired');
            showToast('Security verification expired. Please complete it again.', 'warning');
          }
        });
        setRecaptchaWidgetId(widgetId);
      } catch (error) {
        console.error('Captcha render error:', error);
        showToast('Failed to load security verification. Please refresh the page.', 'error');
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

  // Request submit with proper captcha handling
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    if (!requestForm.email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    // Get captcha response
    let captchaResponse = '';
    try {
      captchaResponse = mobileCaptcha.getResponse(recaptchaWidgetId);
    } catch (error) {
      console.error('Captcha error:', error);
    }

    if (!captchaResponse) {
      const errorMessage = 'Please complete the security verification';
      setErrors({ captcha: errorMessage });
      await platformDetection.showToast(errorMessage, 3000);
      return;
    }
    
    setLoading(true);
    let loadingIndicator = null;
    
    try {
      // Show platform-appropriate loading
      loadingIndicator = await platformDetection.showLoading('Sending reset email...');
      if (loadingIndicator?.present) await loadingIndicator.present();

      const response = await secureFetch(`${API_BASE}/auth/request-password-reset`, {
        method: 'POST',
        body: JSON.stringify({
          email: requestForm.email,
          recaptcha_response: captchaResponse
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('Password reset email sent! Check your inbox.', 'success');
        await platformDetection.showToast('Password reset email sent! Check your inbox.', 3000);
        setStep('sent');
      } else {
        const errorMessage = data.detail || 'Failed to send reset email';
        showToast(errorMessage, 'error');
        await platformDetection.showToast(errorMessage, 3000);
        
        // Reset captcha on error
        if (recaptchaWidgetId !== null) {
          mobileCaptcha.reset(recaptchaWidgetId);
        }
      }
    } catch (error) {
      console.error('Reset request error:', error);
      
      // Enhanced mobile error handling
      let errorMessage = 'Network error. Please try again.';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Connection failed. Please check your internet connection.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      showToast(errorMessage, 'error');
      await platformDetection.showToast(errorMessage, 4000);
      
      // Reset captcha on error
      if (recaptchaWidgetId !== null) {
        mobileCaptcha.reset(recaptchaWidgetId);
      }
    } finally {
      setLoading(false);
      if (loadingIndicator?.dismiss) await loadingIndicator.dismiss();
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
            
            {/* Mobile-compatible captcha container */}
            <div className="form-group">
              <div 
                ref={recaptchaRef}
                style={{ 
                  margin: '10px 0',
                  display: 'flex',
                  justifyContent: 'center'
                }}
              ></div>
              {!recaptchaLoaded && (
                <p style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>
                  Please wait for security verification to load...
                </p>
              )}
              {errors.captcha && <span className="error-text">{errors.captcha}</span>}
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