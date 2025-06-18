import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const TwoFactorVerification = ({ tempToken, onSuccess, onCancel }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToastContext();

  const sendEmailCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/send-2fa-email`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: tempToken })
      });

      if (response.ok) {
        setEmailSent(true);
        showToast('Verification code sent to your email', 'success');
      } else {
        const data = await response.json();
        showToast(data.detail || 'Failed to send email', 'error');
      }
    } catch (error) {
      showToast('Failed to send email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/verify-2fa`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: tempToken, code })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage for fallback
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        login(data.token, data.user);
        
        if (data.backup_code_used) {
          showToast('Backup code used. Consider regenerating backup codes.', 'info');
        }
        
        onSuccess();
      } else {
        showToast(data.detail || '2FA verification failed', 'error');
      }
    } catch (error) {
      showToast('2FA verification failed', 'error');
    } finally {
      setLoading(false);
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