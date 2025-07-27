import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToastContext } from '../components/toast';
import { secureFetch } from '../utils/csrf';
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

      const response = await secureFetch(`${API_BASE}/auth/request-password-reset`, {
        method: 'POST',
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
            
            <button 
              type="submit" 
              disabled={loading} 
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