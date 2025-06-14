// frontend/src/pages/EmailVerification.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToastContext } from '../components/toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToastContext();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('no-token');
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        setStatus('success');
        showToast('Email verified successfully!', 'success');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const data = await response.json();
        setStatus('error');
        showToast(data.detail || 'Verification failed', 'error');
      }
    } catch (error) {
      setStatus('error');
      showToast('Verification failed', 'error');
    }
  };

  const resendVerification = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        showToast('Verification email sent!', 'success');
        setEmail('');
      } else {
        const data = await response.json();
        showToast(data.detail || 'Failed to send email', 'error');
      }
    } catch (error) {
      showToast('Failed to send email', 'error');
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-form">
          {status === 'verifying' && (
            <>
              <h1>🔐 Verifying Email...</h1>
              <p>Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1>✅ Email Verified!</h1>
              <p>Your email has been successfully verified. You can now log in to your account.</p>
              <p>Redirecting to login page...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <h1>❌ Verification Failed</h1>
              <p>The verification link is invalid or has expired.</p>
              <form onSubmit={resendVerification}>
                <input
                  type="email"
                  placeholder="Enter your email to resend verification"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  Resend Verification Email
                </button>
              </form>
            </>
          )}

          {status === 'no-token' && (
            <>
              <h1>❌ Invalid Link</h1>
              <p>No verification token found in the URL.</p>
              <form onSubmit={resendVerification}>
                <input
                  type="email"
                  placeholder="Enter your email to resend verification"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  Send Verification Email
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;


