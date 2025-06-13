import React from 'react';
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p className="footer-text">
            Made by{' '}
            <a 
              href="https://github.com/pradian" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              Petre Alexandru
            </a>{' '}
            and{' '}
            <a 
              href="https://github.com/Dphpvp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              Dph
            </a>
          </p>
          <p className="footer-copyright">
            © 2025 All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;