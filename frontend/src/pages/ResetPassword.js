import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import platformDetection from '../utils/platformDetection';
import '../styles/index.css';
// Styles included in main theme

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { showToast } = useToastContext();
  
  const [step, setStep] = useState(token ? 'reset' : 'request');
  const [loading, setLoading] = useState(false);
  
  const [requestForm, setRequestForm] = useState({
    email: ''
  });
  
  const [resetForm, setResetForm] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});


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
    } else if (resetForm.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!resetForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (resetForm.password !== resetForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Request submit handler
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    if (!requestForm.email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    // No captcha for now - will implement fresh web-only version later
    
    setLoading(true);
    let loadingIndicator = null;
    
    try {
      // Show platform-appropriate loading
      loadingIndicator = await platformDetection.showLoading('Sending reset email...');
      if (loadingIndicator?.present) await loadingIndicator.present();

      const response = await fetch(`${API_BASE}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: requestForm.email,
          recaptcha_response: 'NO_CAPTCHA_YET'
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
        
        // No captcha reset needed
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
      
      // No captcha reset needed
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
      <div className="simple-auth-page">
        <div className="auth-form-container-centered">
          <div className="simple-auth-header">
            <h2 className="auth-title">Check Your Email</h2>
            <p className="auth-subtitle">We've sent you a reset link</p>
          </div>
          <div className="success-message">
            <p>We've sent a password reset link to <strong>{requestForm.email}</strong></p>
            <p>Check your inbox and click the link to reset your password.</p>
          </div>
          <Link to="/login" className="submit-btn-simple" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', marginTop: '1rem' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="simple-auth-page">
        <div className="auth-form-container-centered">
          <div className="simple-auth-header">
            <h2 className="auth-title">Password Reset Complete</h2>
            <p className="auth-subtitle">Your password has been successfully reset!</p>
          </div>
          <Link to="/login" className="submit-btn-simple" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', marginTop: '1rem' }}>
            Login with New Password
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'reset' && token) {
    return (
      <div className="simple-auth-page">
        <div className="auth-form-container-centered">
          <div className="simple-auth-header">
            <h2 className="auth-title">Reset Your Password</h2>
            <p className="auth-subtitle">Enter your new password</p>
          </div>
          
          <form onSubmit={handleResetSubmit} className="simple-auth-form">
            <div className="form-group">
              <input
                type="password"
                name="password"
                placeholder="New Password (min 8 characters)"
                value={resetForm.password}
                onChange={handleResetChange}
                className={`simple-input ${errors.password ? 'error' : ''}`}
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
                className={`simple-input ${errors.confirmPassword ? 'error' : ''}`}
                required
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
            
            <button type="submit" disabled={loading} className="submit-btn-simple">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          
          <div className="auth-footer-links">
            <Link to="/login" className="simple-link">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="simple-auth-page">
      <div className="auth-form-container-centered">
        <div className="simple-auth-header">
          <Link to="/login" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Login
          </Link>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your email address and we'll send you a link to reset your password</p>
        </div>
        
        <form onSubmit={handleRequestSubmit} className="simple-auth-form">
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={requestForm.email}
              onChange={handleRequestChange}
              className={`simple-input ${errors.email ? 'error' : ''}`}
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="submit-btn-simple"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="auth-footer-links">
          <p className="signup-prompt">
            Remember your password? <Link to="/login" className="simple-link">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;