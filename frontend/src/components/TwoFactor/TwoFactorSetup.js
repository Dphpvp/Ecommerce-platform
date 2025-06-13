// frontend/src/components/TwoFactorSetup.js
import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useToastContext } from './toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const TwoFactorSetup = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const { token } = useAuth();
  const { showToast } = useToastContext();

  const setupTwoFactor = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/setup-2fa`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qr_code);
        setSecret(data.secret);
        setStep(2);
      } else {
        const data = await response.json();
        showToast(data.detail || 'Failed to setup 2FA', 'error');
      }
    } catch (error) {
      showToast('Failed to setup 2FA', 'error');
    }
  };

  const verifySetup = async () => {
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
        setStep(3);
        showToast('2FA enabled successfully!', 'success');
      } else {
        const data = await response.json();
        showToast(data.detail || 'Invalid code', 'error');
      }
    } catch (error) {
      showToast('Verification failed', 'error');
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
            <p>Add an extra layer of security to your account with 2FA.</p>
            <p><strong>You'll need:</strong></p>
            <ul>
              <li>A smartphone with an authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Access to scan QR codes</li>
            </ul>
            <button onClick={setupTwoFactor} className="btn btn-primary">
              Start Setup
            </button>
          </>
        )}

        {step === 2 && (
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
              disabled={verificationCode.length !== 6}
            >
              Verify & Enable 2FA
            </button>
          </>
        )}

        {step === 3 && (
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
              Store these codes safely. You can use them to access your account if you lose your phone.
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

export default TwoFactorSetup;
