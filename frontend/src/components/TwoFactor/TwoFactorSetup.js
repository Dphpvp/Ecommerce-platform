// Updated TwoFactorSetup.js component
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const TwoFactorSetup = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(1); // 1: choose method, 2: setup, 3: verify, 4: complete
  const [method, setMethod] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { showToast } = useToastContext();

  const chooseMethod = async (selectedMethod) => {
    setLoading(true);
    setMethod(selectedMethod);
    
    try {
      const response = await fetch(`${API_BASE}/auth/setup-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ method: selectedMethod })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (selectedMethod === 'app') {
          setQrCode(data.qr_code);
          setSecret(data.secret);
        } else {
          showToast('Verification code sent to your email', 'success');
        }
        setStep(3); // Skip to verification
      } else {
        const data = await response.json();
        showToast(data.detail || 'Failed to setup 2FA', 'error');
      }
    } catch (error) {
      showToast('Failed to setup 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/verify-2fa-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: verificationCode })
      });

      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backup_codes);
        setStep(4);
        showToast('2FA enabled successfully!', 'success');
      } else {
        const data = await response.json();
        showToast(data.detail || 'Invalid code', 'error');
      }
    } catch (error) {
      showToast('Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resendEmailCode = async () => {
    if (method !== 'email') return;
    
    setLoading(true);
    try {
      await chooseMethod('email');
      showToast('New code sent to your email', 'success');
    } catch (error) {
      showToast('Failed to send code', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-overlay">
      <div className="auth-form" style={{ maxWidth: '500px' }}>
        <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.5rem' }}>
          ×
        </button>

        {step === 1 && (
          <>
            <h2>🔐 Enable Two-Factor Authentication</h2>
            <p>Choose your preferred 2FA method:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '2rem 0' }}>
              <button 
                onClick={() => chooseMethod('app')} 
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                📱 Authenticator App
                <small style={{ display: 'block', opacity: 0.8 }}>
                  Google Authenticator, Authy, etc.
                </small>
              </button>
              
              <button 
                onClick={() => chooseMethod('email')} 
                className="btn btn-outline"
                disabled={loading}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                📧 Email Codes
                <small style={{ display: 'block', opacity: 0.8 }}>
                  Receive codes via email
                </small>
              </button>
            </div>
          </>
        )}

        {step === 3 && method === 'app' && (
          <>
            <h2>📱 Scan QR Code</h2>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '200px' }} />
            </div>
            <p><strong>Manual entry key:</strong> <code>{secret}</code></p>
            <p>Enter the 6-digit code from your authenticator app:</p>
            <input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength="6"
            />
            <button 
              onClick={verifySetup} 
              className="btn btn-primary"
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>
          </>
        )}

        {step === 3 && method === 'email' && (
          <>
            <h2>📧 Email Verification</h2>
            <p>We've sent a 6-digit code to your email address.</p>
            <p>Enter the code below:</p>
            <input
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength="6"
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={verifySetup} 
                className="btn btn-primary"
                disabled={loading || verificationCode.length !== 6}
                style={{ flex: 1 }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button 
                onClick={resendEmailCode} 
                className="btn btn-outline"
                disabled={loading}
              >
                Resend
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
              Code expires in 5 minutes
            </p>
          </>
        )}

        {step === 4 && (
          <>
            <h2>✅ 2FA Enabled Successfully!</h2>
            <p><strong>⚠️ Save these backup codes:</strong></p>
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px', margin: '15px 0' }}>
              {backupCodes.map((code, index) => (
                <div key={index} style={{ fontFamily: 'monospace', margin: '5px 0' }}>
                  {code}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Store these codes safely. You can use them if you lose access to your {method === 'app' ? 'authenticator app' : 'email'}.
            </p>
            <button onClick={() => { onComplete(); onClose(); }} className="btn btn-primary">
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Updated TwoFactorVerification.js component
const TwoFactorVerification = ({ tempToken, onSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('app'); // Will be determined from user data
  const [emailSent, setEmailSent] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToastContext();

  const sendEmailCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/send-2fa-email`, {
        method: 'POST',
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
        </div>
      </div>
    </div>
  );
};

export { TwoFactorSetup, TwoFactorVerification };