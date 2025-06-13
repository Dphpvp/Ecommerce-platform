// frontend/src/components/TwoFactorVerification.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from './toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const TwoFactorVerification = ({ tempToken, onSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToastContext();

  const verify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: tempToken, code })
      });

      const data = await response.json();

      if (response.ok) {
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
          <p>Enter the 6-digit code from your authenticator app or use a backup code:</p>
          
          <form onSubmit={verify2FA}>
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
          
          <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
            Lost your device? Use one of your backup codes to sign in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerification;