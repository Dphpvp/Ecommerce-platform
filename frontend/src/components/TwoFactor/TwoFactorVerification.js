import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';
import platformDetection from '../../utils/platformDetection';
import secureAuth from '../../utils/secureAuth';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://ecommerce-platform-nizy.onrender.com/api';

const TwoFactorVerification = ({ tempToken, onSuccess, onCancel }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { login, makeAuthenticatedRequest } = useAuth(); // ✅ Use session auth
  const { showToast } = useToastContext();

  const sendEmailCode = async () => {
    setLoading(true);
    let loadingIndicator = null;
    
    try {
      // Show platform-appropriate loading
      loadingIndicator = await platformDetection.showLoading('Sending verification code...');
      if (loadingIndicator?.present) await loadingIndicator.present();

      const requestHeaders = {
        'Content-Type': 'application/json'
        // Remove security headers to avoid CORS preflight issues
      };

      let response;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        console.log('📱 Using Capacitor HTTP for 2FA email send');
        const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${API_BASE}/auth/send-2fa-email`,
          method: 'POST',
          headers: requestHeaders,
          data: { temp_token: tempToken }
        });
        
        response = {
          ok: httpResponse.status >= 200 && httpResponse.status < 300,
          status: httpResponse.status,
          json: async () => httpResponse.data
        };
      } else {
        console.log('🌐 Using fetch for web 2FA email send');
        response = await fetch(`${API_BASE}/auth/send-2fa-email`, {
          method: 'POST',
          headers: requestHeaders,
          credentials: 'include',
          body: JSON.stringify({ temp_token: tempToken })
        });
      }

      if (response.ok) {
        setEmailSent(true);
        showToast('Verification code sent to your email', 'success');
        await platformDetection.showToast('Verification code sent to your email', 3000);
      } else {
        const data = await response.json();
        const errorMessage = data.detail || 'Failed to send email';
        showToast(errorMessage, 'error');
        await platformDetection.showToast(errorMessage, 3000);
      }
    } catch (error) {
      console.error('Email send error:', error);
      
      let errorMessage = 'Failed to send email. Please try again.';
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

  const verify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    let loadingIndicator = null;

    try {
      // Show platform-appropriate loading
      loadingIndicator = await platformDetection.showLoading('Verifying code...');
      if (loadingIndicator?.present) await loadingIndicator.present();

      const requestHeaders = {
        'Content-Type': 'application/json'
        // Remove security headers to avoid CORS preflight issues
      };

      let response;
      if (platformDetection.isMobile && window.Capacitor?.Plugins?.CapacitorHttp) {
        console.log('📱 Using Capacitor HTTP for 2FA verification');
        const httpResponse = await window.Capacitor.Plugins.CapacitorHttp.request({
          url: `${API_BASE}/auth/verify-2fa`,
          method: 'POST',
          headers: requestHeaders,
          data: { temp_token: tempToken, code }
        });
        
        response = {
          ok: httpResponse.status >= 200 && httpResponse.status < 300,
          status: httpResponse.status,
          json: async () => httpResponse.data
        };
      } else {
        console.log('🌐 Using fetch for web 2FA verification');
        response = await fetch(`${API_BASE}/auth/verify-2fa`, {
          method: 'POST',
          headers: requestHeaders,
          credentials: 'include',
          body: JSON.stringify({ temp_token: tempToken, code })
        });
      }

      const data = await response.json();

      if (response.ok) {
        console.log('✅ 2FA verification successful');
        
        // Store tokens securely using the new JWT system
        if (data.access_token || data.token) {
          const loginData = {
            access_token: data.access_token || data.token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in || 3600,
            user: data.user
          };
          
          const success = await login(loginData);
          if (!success) {
            throw new Error('Failed to store authentication tokens');
          }
        } else {
          // Fallback for user data without explicit tokens
          await login({ user: data.user });
        }
        
        if (data.backup_code_used) {
          showToast('Backup code used. Consider regenerating backup codes.', 'info');
          await platformDetection.showToast('Backup code used. Consider regenerating backup codes.', 4000);
        }
        
        await platformDetection.showToast('Verification successful!', 2000);
        onSuccess();
      } else {
        const errorMessage = data.detail || '2FA verification failed';
        showToast(errorMessage, 'error');
        await platformDetection.showToast(errorMessage, 3000);
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      
      let errorMessage = '2FA verification failed. Please try again.';
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

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-form">
          <h1>🔐 Two-Factor Authentication</h1>
          
          <form onSubmit={verify2FA}>
            <p>Enter your verification code:</p>
            <input
              type="text"
              placeholder="000000 or backup code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
            <button type="submit" disabled={loading || !code} className="btn btn-primary">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
          
          <div style={{ margin: '1rem 0', textAlign: 'center' }}>
            <button 
              onClick={sendEmailCode}
              className="btn btn-outline"
              disabled={loading || emailSent}
              style={{ fontSize: '0.9rem' }}
            >
              {emailSent ? 'Email Sent ✓' : '📧 Send Code to Email'}
            </button>
          </div>
          
          <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
            Lost access? Use a backup code to sign in.
          </p>
          
          {onCancel && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button 
                onClick={onCancel}
                className="btn btn-outline"
                style={{ fontSize: '0.9rem' }}
              >
                ← Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerification;