import React from 'react';



const Footer = () => {
  return (
    <footer className="footer-compact">
      <div className="container">
        <div className="footer-compact-content">
          <p className="footer-compact-text">
            Made by{' '}
            <a 
              href="https://github.com/pradian" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-compact-link"
            >
              Petre Alexandru
            </a>{' '}
            and{' '}
            <a 
              href="https://github.com/Dphpvp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-compact-link"
            >
              Dph
            </a>
            <span className="footer-compact-separator">•</span>
            <span className="footer-compact-copyright">© 2025 All rights reserved</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;