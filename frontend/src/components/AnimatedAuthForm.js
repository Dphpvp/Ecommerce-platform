// Exact replica of animated login/signup form with Google auth only
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToastContext } from './toast';
import platformDetection from '../utils/platformDetection';
import secureAuth from '../utils/secureAuth';
import simpleFetch from '../utils/simpleFetch';
import directFetch from '../utils/directFetch';
import { debugLogin, debugLoginResponse } from '../utils/authDebug';
import './AnimatedAuthForm.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const AnimatedAuthForm = () => {
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    acceptTerms: false
  });
  const [isMobileAPK, setIsMobileAPK] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  // Detect mobile APK and set initial form based on current route
  useEffect(() => {
    // Detect if running on mobile APK
    const detectMobileAPK = () => {
      const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
      setIsMobileAPK(isCapacitor);
    };

    detectMobileAPK();
    
    if (location.pathname === '/register') {
      setIsActive(true); // Show register form
    } else {
      setIsActive(false); // Show login form
    }
  }, [location.pathname]);

  const toggleToRegister = () => {
    setIsActive(true);
    navigate('/register');
  };

  const toggleToLogin = () => {
    setIsActive(false);
    navigate('/login');
  };

  // Handle login form submission with secure JWT authentication
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!loginData.username || !loginData.password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    // Password validation
    if (loginData.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);
    let loadingIndicator = null;
    
    try {
      // Show platform-appropriate loading
      loadingIndicator = await platformDetection.showLoading('Signing in...');
      if (loadingIndicator?.present) await loadingIndicator.present();

      const formDataWithAuth = {
        identifier: loginData.username,
        password: loginData.password,
        recaptcha_response: 'NO_CAPTCHA_YET'
      };

      // Debug login attempt
      debugLogin(loginData);

      let response;
      const requestHeaders = {
        'Content-Type': 'application/json'
        // Remove security headers to avoid CORS preflight issues
      };

      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        console.log('📱 Using Capacitor HTTP for login');
        const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${API_BASE}/auth/login`,
          method: 'POST',
          headers: requestHeaders,
          data: formDataWithAuth
        });
        
        response = {
          ok: httpResponse.status >= 200 && httpResponse.status < 300,
          status: httpResponse.status,
          json: async () => httpResponse.data
        };
      } else {
        console.log('🌐 Using simple fetch for web login');
        try {
          const data = await simpleFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(formDataWithAuth)
          });
          
          response = {
            ok: true,
            status: 200,
            json: async () => data
          };
        } catch (error) {
          console.error('Simple fetch login error:', error);
          response = {
            ok: false,
            status: error.status || (error.message.includes('401') ? 401 : 500),
            json: async () => ({ 
              detail: error.data?.detail || error.message,
              message: error.data?.message || error.message,
              errors: error.data?.errors
            })
          };
        }
      }

      const data = await response.json();

      // Debug login response
      debugLoginResponse(response, data);

      if (response.ok) {
        console.log('✅ Login response received:', {
          hasUser: !!data.user,
          hasToken: !!(data.access_token || data.token),
          hasRefreshToken: !!data.refresh_token
        });

        // Handle different backend response formats
        console.log('🔍 Processing login response:', {
          hasAccessToken: !!data.access_token,
          hasToken: !!data.token,
          hasUser: !!data.user,
          hasRefreshToken: !!data.refresh_token,
          userType: data.user?.is_admin ? 'admin' : 'regular',
          requires2FA: !!data.requires_2fa
        });

        // Check if 2FA is required
        if (data.requires_2fa || data.temp_token) {
          console.log('🔐 2FA required for user');
          // Handle 2FA flow - you might need to implement this
          showToast('2FA verification required', 'info');
          // TODO: Implement 2FA flow here
          return;
        }

        // Store tokens securely using the new JWT system
        if (data.access_token || data.token) {
          const loginResponseData = {
            access_token: data.access_token || data.token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in || 3600,
            user: data.user
          };
          
          console.log('💾 Storing JWT tokens for user:', data.user?.username);
          const success = await login(loginResponseData);
          if (success) {
            showToast('Login successful!', 'success');
            await platformDetection.showToast('Welcome back!', 2000);
            navigate('/');
          } else {
            throw new Error('Failed to store authentication tokens');
          }
        } else if (data.user) {
          // Fallback for user data without explicit tokens (legacy support)
          console.log('📋 Using legacy login format for user:', data.user?.username);
          await login({ user: data.user });
          showToast('Login successful!', 'success');
          navigate('/');
        } else {
          console.error('❌ Invalid login response format:', data);
          throw new Error('Invalid response format from server');
        }
      } else {
        const errorMessage = data.detail || data.message || 'Login failed';
        console.error('🚨 Login failed:', {
          status: response.status,
          data: data,
          errorMessage
        });
        
        showToast(errorMessage, 'error');
        await platformDetection.showToast(errorMessage, 3000);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Network error. Please try again.';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Connection failed. Please check your internet connection.';
      } else if (error.message.includes('Authentication')) {
        errorMessage = 'Invalid credentials. Please try again.';
      }
      
      showToast(errorMessage, 'error');
      await platformDetection.showToast(errorMessage, 4000);
    } finally {
      setLoading(false);
      if (loadingIndicator?.dismiss) await loadingIndicator.dismiss();
    }
  };

  // Handle register form submission with secure authentication
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!registerData.username || !registerData.email || !registerData.password || 
        !registerData.confirmPassword || !registerData.firstName || !registerData.lastName) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Username validation
    if (registerData.username.length < 3 || registerData.username.length > 50) {
      showToast('Username must be 3-50 characters', 'error');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(registerData.username)) {
      showToast('Username can only contain letters, numbers, underscore, and hyphen', 'error');
      return;
    }

    // Name validation
    if (registerData.firstName.length < 2 || registerData.lastName.length < 2) {
      showToast('First and last name must be at least 2 characters', 'error');
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(registerData.firstName) || !/^[a-zA-Z\s'-]+$/.test(registerData.lastName)) {
      showToast('Names can only contain letters, spaces, hyphens, and apostrophes', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Phone validation (if provided)
    if (registerData.phone && !/^[\+]?[\d\s\-\(\)]{7,20}$/.test(registerData.phone)) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    // Password validation
    if (registerData.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    // Password strength validation
    const hasUppercase = /[A-Z]/.test(registerData.password);
    const hasLowercase = /[a-z]/.test(registerData.password);
    const hasNumbers = /\d/.test(registerData.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(registerData.password);
    
    if (!hasUppercase || !hasLowercase || !hasNumbers) {
      showToast('Password must contain uppercase, lowercase, and numbers', 'error');
      return;
    }

    // Terms acceptance validation
    if (!registerData.acceptTerms) {
      showToast('Please accept the Terms of Service and Privacy Policy', 'error');
      return;
    }

    setLoading(true);
    let loadingIndicator = null;
    
    try {
      loadingIndicator = await platformDetection.showLoading('Creating account...');
      if (loadingIndicator?.present) await loadingIndicator.present();

      // Prepare clean registration data for backend
      const cleanRegistrationData = {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        first_name: registerData.firstName,
        last_name: registerData.lastName,
        phone: registerData.phone || ''
      };

      console.log('🔍 Registration data being sent:', {
        ...cleanRegistrationData,
        password: '[HIDDEN]',
        passwordLength: registerData.password.length
      });

      const requestHeaders = {
        'Content-Type': 'application/json'
        // Remove security headers to avoid CORS preflight issues
      };

      let response;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        console.log('📱 Using Capacitor HTTP for registration');
        const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${API_BASE}/auth/register`,
          method: 'POST',
          headers: requestHeaders,
          data: cleanRegistrationData
        });
        
        response = {
          ok: httpResponse.status >= 200 && httpResponse.status < 300,
          status: httpResponse.status,
          json: async () => httpResponse.data
        };
      } else {
        console.log('🌐 Using direct fetch for web registration with CSRF handling');
        console.log('📤 About to send registration request with data:', JSON.stringify(cleanRegistrationData, null, 2));
        try {
          const data = await directFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(cleanRegistrationData)
          });
          
          response = {
            ok: true,
            status: 200,
            json: async () => data
          };
        } catch (error) {
          console.error('Direct fetch registration error:', error);
          response = {
            ok: false,
            status: error.message.includes('401') ? 401 : 500,
            json: async () => ({ detail: error.message })
          };
        }
      }

      const data = await response.json();

      if (response.ok) {
        showToast('Registration successful! Please check your email.', 'success');
        await platformDetection.showToast('Please verify your email to complete registration', 4000);
        
        // Clear registration form
        setRegisterData({ 
          username: '', 
          email: '', 
          password: '', 
          confirmPassword: '',
          firstName: '',
          lastName: '',
          phone: '',
          acceptTerms: false
        });
        
        // Switch to login form
        setIsActive(false);
        navigate('/login');
      } else {
        const errorMessage = data.detail || data.message || 'Registration failed';
        showToast(errorMessage, 'error');
        await platformDetection.showToast(errorMessage, 3000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Network error. Please try again.';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Connection failed. Please check your internet connection.';
      }
      
      showToast(errorMessage, 'error');
      await platformDetection.showToast(errorMessage, 4000);
    } finally {
      setLoading(false);
      if (loadingIndicator?.dismiss) await loadingIndicator.dismiss();
    }
  };

  // Google authentication handler
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      
      // Check if running on mobile (Capacitor)
      if (platformDetection.isMobile && window.Capacitor) {
        await handleMobileGoogleAuth();
        return;
      }

      // Web Google Auth
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
      console.error('Google auth initialization error:', error);
      showToast('Failed to initialize Google authentication', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileGoogleAuth = async () => {
    try {
      const GoogleAuth = window.Capacitor?.Plugins?.GoogleAuth;
      
      if (!GoogleAuth) {
        showToast('Google authentication not available on this device.', 'warning');
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
        showToast('Google authentication failed. No token received.', 'error');
      }
    } catch (error) {
      console.error('Mobile Google auth error:', error);
      if (error.message?.includes('cancelled')) {
        showToast('Google authentication was cancelled', 'info');
      } else {
        showToast('Google authentication failed. Please try again.', 'error');
      }
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      const requestBody = {
        token: response.credential
      };

      let result;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${API_BASE}/auth/google`,
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
        result = await fetch(`${API_BASE}/auth/google`, {
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
        showToast('Google authentication successful!', 'success');
        navigate('/');
      } else {
        const errorMessage = data.detail || data.message || 'Google authentication failed';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      showToast('Google authentication failed. Please try again.', 'error');
    }
  };

  return (
    <div className="animated-auth-page">
      <div className={`animated-container ${isActive ? 'active' : ''} ${isMobileAPK ? 'mobile-apk' : ''}`}>
        {/* Login Form */}
        <div className="form-box login">
          <form onSubmit={handleLoginSubmit}>
            <h1>Login</h1>
            <div className="input-box">
              <input
                type="text"
                placeholder="Username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                required
              />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="forgot-link">
              <Link to="/reset-password">Forgot Password?</Link>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p>or login with social platforms</p>
            <div className="social-icons">
              <button type="button" className="google-icon-btn" onClick={handleGoogleAuth} disabled={loading}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Register Form */}
        <div className="form-box register">
          <form onSubmit={handleRegisterSubmit}>
            <h1>Create Account</h1>
            
            {/* Name Fields */}
            <div className="input-row">
              <div className="input-box half">
                <input
                  type="text"
                  placeholder="First Name *"
                  value={registerData.firstName}
                  onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                  required
                />
                <i className="bx bxs-user"></i>
              </div>
              <div className="input-box half">
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={registerData.lastName}
                  onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                  required
                />
                <i className="bx bxs-user"></i>
              </div>
            </div>

            {/* Username */}
            <div className="input-box">
              <input
                type="text"
                placeholder="Username *"
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                required
                minLength="3"
                maxLength="50"
              />
              <i className="bx bxs-user-circle"></i>
            </div>

            {/* Email */}
            <div className="input-box">
              <input
                type="email"
                placeholder="Email Address *"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                required
              />
              <i className="bx bxs-envelope"></i>
            </div>

            {/* Phone */}
            <div className="input-box">
              <input
                type="tel"
                placeholder="Phone Number (optional)"
                value={registerData.phone}
                onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
              />
              <i className="bx bxs-phone"></i>
            </div>

            {/* Password */}
            <div className="input-box">
              <input
                type="password"
                placeholder="Password *"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                required
                minLength="8"
              />
              <i className="bx bxs-lock-alt"></i>
            </div>

            {/* Confirm Password */}
            <div className="input-box">
              <input
                type="password"
                placeholder="Confirm Password *"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                required
                minLength="8"
              />
              <i className="bx bxs-lock"></i>
            </div>

            {/* Terms and Conditions */}
            <div className="checkbox-box">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={registerData.acceptTerms}
                onChange={(e) => setRegisterData({ ...registerData, acceptTerms: e.target.checked })}
                required
              />
              <label htmlFor="acceptTerms">
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> *
              </label>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            <p>or register with social platforms</p>
            <div className="social-icons">
              <button type="button" className="google-icon-btn" onClick={handleGoogleAuth} disabled={loading}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Toggle Box */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button className="btn register-btn" onClick={toggleToRegister}>Register</button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button className="btn login-btn" onClick={toggleToLogin}>Login</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedAuthForm;