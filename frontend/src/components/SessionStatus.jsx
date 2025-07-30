import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import platformDetection from '../utils/platformDetection';

const SessionStatus = () => {
  const { getSessionInfo, extendSession } = useAuth();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Don't show session status on mobile
    if (platformDetection.isMobile) return;

    const updateSessionInfo = () => {
      const info = getSessionInfo();
      setSessionInfo(info);

      // Show warning when less than 10 minutes remaining
      const tenMinutes = 10 * 60 * 1000;
      if (info.isValid && info.remainingTime < tenMinutes && info.remainingTime > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // Initial update
    updateSessionInfo();

    // Update every minute
    const interval = setInterval(updateSessionInfo, 60000);

    return () => clearInterval(interval);
  }, [getSessionInfo, platformDetection.isMobile]);

  const handleExtendSession = () => {
    extendSession();
    setShowWarning(false);
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  // Don't render on mobile or if no session info
  if (platformDetection.isMobile || !sessionInfo || !sessionInfo.isValid) {
    return null;
  }

  return (
    <>
      {/* Session Warning Modal */}
      {showWarning && (
        <div className="session-warning-overlay">
          <div className="session-warning-modal">
            <div className="session-warning-icon">⚠️</div>
            <h3>Session Expiring Soon</h3>
            <p>
              Your session will expire in {formatTime(sessionInfo.remainingTime)} due to inactivity.
            </p>
            <div className="session-warning-actions">
              <button 
                className="extend-session-btn"
                onClick={handleExtendSession}
              >
                Extend Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Info in Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="session-debug-info">
          <small>
            Session: {formatTime(sessionInfo.remainingTime)} remaining
          </small>
        </div>
      )}
    </>
  );
};

export default SessionStatus;