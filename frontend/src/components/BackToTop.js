import React, { useState, useEffect } from 'react';
// Styles included in main theme

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 500);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      className={`back-to-top ${isVisible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        zIndex: 99999,
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden'
      }}
    >
      <span className="back-to-top-icon">↑</span>
    </button>
  );
};

export default BackToTop;