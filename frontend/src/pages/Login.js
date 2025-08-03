import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TwoFactorVerification from '../components/TwoFactor/TwoFactorVerification';
import { useToastContext } from '../components/toast';
import secureAuth from '../utils/secureAuth';
import inputValidator from '../utils/inputValidation';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState('');
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Secure login implementation with input validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    console.log('🔍 Secure login attempt starting...');

    setLoading(true);

    try {
      // Validate and sanitize input first
      const validation = inputValidator.validateLoginCredentials(formData);
      
      if (!validation.valid) {
        const firstError = Object.values(validation.errors)[0];
        setError(firstError);
        setLoading(false);
        return;
      }

      console.log('✅ Input validation passed');

      // Use secure authentication with sanitized data
      const result = await secureAuth.login(validation.sanitized);

      console.log('Secure login result:', { success: result.success, status: result.status });

      if (result.success) {
        console.log('✅ Secure login successful!');
        
        if (result.data.requires_2fa) {
          console.log('2FA required');
          setTempToken(result.data.temp_token);
          setTwoFactorMethod(result.data.method || 'app');
          setShow2FA(true);
          
          if (result.data.method === 'email') {
            showToast('Verification code sent to your email', 'info');
          } else {
            showToast('Please enter your 2FA code', 'info');
          }
        } else {
          console.log('No 2FA required, logging in user');
          
          // Secure login - user data is already validated
          const loginSuccess = await login(result.data.user);
          if (loginSuccess) {
            showToast('Login successful!', 'success');
            navigate('/');
          } else {
            setError('Authentication failed. Please try again.');
          }
        }
      } else {
        console.error('❌ Secure login failed:', result.error);
        setError(result.error);
        
        // Handle specific error cases
        if (result.error.includes('Email not verified')) {
          showToast('Please verify your email address', 'error');
        }
      }
    } catch (error) {
      console.error('Secure login error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
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



  // Show 2FA verification if required
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
    <div className="auth-page">
      <div className="container">
        <div className="auth-form">
          <h1>Login</h1>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="identifier"
              placeholder="Email, Username, or Phone"
              value={formData.identifier}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            
            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="forgot-password">
            <Link to="/reset-password">Forgotten password? Click here to reset</Link>
          </p>

          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;