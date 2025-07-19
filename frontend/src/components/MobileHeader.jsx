import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const MobileHeader = ({ title, subtitle, showBackButton = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header
      className={`mobile-header ${isScrolled ? 'scrolled' : 'transparent'}`}
    >
      <div className="header-content">
        <div className="header-left">
          {showBackButton && (
            <button onClick={handleBack} className="back-button" aria-label="Go back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
        </div>
        <div className="header-center">
          <h1 className="header-title">{title}</h1>
          {subtitle && <h2 className="header-subtitle">{subtitle}</h2>}
        </div>
        <div className="header-right">
          {/* Placeholder for actions like search or more options */}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
