import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const TwoFactorSetup = ({ onClose, onComplete }) => {
  const { makeAuthenticatedRequest } = useAuth();
  const { showToast } = useToastContext();
  
  const [step, setStep] = useState('method'); // method, setup, verify, complete
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState('');
  const [emailHint, setEmailHint] = useState('');

  const handleMethodSelect = async (selectedMethod) => {
    setLoading(true);
    setError('');
    
    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/auth/setup-2fa`, {
        method: 'POST',
        body: JSON.stringify({ method: selectedMethod })
      });

      setMethod(selectedMethod);
      
      if (selectedMethod === 'app') {
        setQrCode(data.qr_code);
        setSecret(data.secret);
        setStep('setup');
      } else if (selectedMethod === 'email') {
        setEmailHint(data.email_hint);
        setStep('verify');
        showToast('Verification code sent to your email', 'success');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      setError(error.message || 'Failed to setup 2FA');
      showToast(error.message || 'Failed to setup 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await makeAuthenticatedRequest(`${API_BASE}/auth/verify-2fa-setup`, {
        method: 'POST',
        body: JSON.stringify({ code })
      });

      setBackupCodes(data.backup_codes);
      setStep('complete');
      showToast(data.message || '2FA enabled successfully!', 'success');
    } catch (error) {
      console.error('2FA verification error:', error);
      setError(error.message || 'Invalid verification code');
      setCode(''); // Clear the code on error
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText).then(() => {
      showToast('Backup codes copied to clipboard', 'success');
    }).catch(() => {
      showToast('Failed to copy backup codes', 'error');
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
        <div className="modal-header">
          <h2>🔐 Enable Two-Factor Authentication</h2>
          <button className="close-button" onClick={handleCancel}>×</button>
        </div>

        <div className="modal-body">
          {step === 'method' && (
            <div>
              <p>Choose your preferred 2FA method:</p>
              
              <div className="method-options" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1.5rem 0' }}>
                <button
                  className="method-button"
                  onClick={() => handleMethodSelect('app')}
                  disabled={loading}
                  style={{
                    padding: '1rem',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    📱 Authenticator App
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    Use Google Authenticator, Authy, or similar apps
                  </div>
                </button>

                <button
                  className="method-button"
                  onClick={() => handleMethodSelect('email')}
                  disabled={loading}
                  style={{
                    padding: '1rem',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    📧 Email Verification
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    Receive codes via email
                  </div>
                </button>
              </div>

              {error && (
                <div style={{ color: '#dc3545', padding: '0.5rem', background: '#f8d7da', borderRadius: '4px', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'setup' && method === 'app' && (
            <div>
              <p>Scan this QR code with your authenticator app:</p>
              
              {qrCode && (
                <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                  <img src={qrCode} alt="2FA QR Code" style={{ maxWidth: '250px', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
              )}

              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Manual Entry Key:</p>
                <code style={{ background: '#e9ecef', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                  {secret}
                </code>
              </div>

              <div className="instructions" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                <ol style={{ paddingLeft: '1.5rem' }}>
                  <li>Open your authenticator app</li>
                  <li>Scan the QR code or enter the key manually</li>
                  <li>Enter the 6-digit code below to verify</li>
                </ol>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setStep('verify')}
                style={{ width: '100%' }}
              >
                I've Added the Account
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div>
              <p>
                Enter the 6-digit verification code 
                {method === 'email' ? ` sent to ${emailHint}` : ' from your authenticator app'}:
              </p>

              <form onSubmit={handleVerification}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="000000"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    letterSpacing: '0.5rem',
                    marginBottom: '1rem',
                    border: error ? '2px solid #dc3545' : '2px solid #ddd',
                    borderRadius: '8px'
                  }}
                  maxLength="6"
                  autoFocus
                />

                {error && (
                  <div style={{ color: '#dc3545', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setStep(method === 'app' ? 'setup' : 'method')}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || code.length !== 6}
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'complete' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                <h3>2FA Successfully Enabled!</h3>
                <p>Your account is now protected with two-factor authentication.</p>
              </div>

              <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>⚠️ Important: Save Your Backup Codes</h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#856404' }}>
                  These codes can be used if you lose access to your authenticator. Each code can only be used once.
                </p>
                
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {backupCodes.map((code, index) => (
                    <div key={index} style={{ margin: '0.25rem 0' }}>{code}</div>
                  ))}
                </div>

                <button
                  className="btn btn-outline"
                  onClick={copyBackupCodes}
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  📋 Copy Backup Codes
                </button>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#856404', textAlign: 'center' }}>
                  Store these codes in a secure location
                </p>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleComplete}
                style={{ width: '100%' }}
              >
                Complete Setup
              </button>
            </div>
          )}
        </div>

        {step !== 'complete' && (
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;