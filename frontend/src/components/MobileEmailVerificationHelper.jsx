import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import platformDetection from '../utils/platformDetection';

const MobileEmailVerificationHelper = ({ 
  show = false, 
  onClose, 
  identifier = '',
  errorMessage = '' 
}) => {
  const [isVisible, setIsVisible] = useState(show);

  if (!platformDetection.isMobile || !isVisible) {
    return null;
  }

  const isEmailVerificationError = 
    errorMessage.toLowerCase().includes('email') && 
    (errorMessage.toLowerCase().includes('verify') || 
     errorMessage.toLowerCase().includes('verified'));

  if (!isEmailVerificationError) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className="mobile-email-verification-helper">
      <div className="verification-card">
        <div className="verification-header">
          <h3>Email Verification Required</h3>
          <button 
            className="close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="verification-content">
          <div className="verification-icon">
            📧
          </div>
          
          <p className="verification-message">
            Your account <strong>{identifier}</strong> needs email verification before you can login.
          </p>
          
          <div className="verification-steps">
            <h4>What to do:</h4>
            <ol>
              <li>Check your email inbox for a verification email</li>
              <li>Look in your spam/junk folder if you don't see it</li>
              <li>Click the verification link in the email</li>
              <li>Return here and try logging in again</li>
            </ol>
          </div>
          
          <div className="verification-actions">
            <Link 
              to="/register"
              className="resend-btn"
              onClick={handleClose}
            >
              Need to resend verification email?
            </Link>
          </div>
          
          <div className="verification-note">
            <small>
              <strong>Note:</strong> Admin accounts may not require email verification. 
              If you're having trouble, contact support.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileEmailVerificationHelper;