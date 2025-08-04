import React from 'react';
import Modal from './modal/modal';

const SuccessModal = ({ isOpen, onClose, title, message, actionText = "Continue" }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="success-modal">
        <div className="success-modal-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        </div>
        
        <div className="success-modal-content">
          <h3 className="success-modal-title">{title}</h3>
          <p className="success-modal-message">{message}</p>
          
          <button 
            className="success-modal-button"
            onClick={onClose}
          >
            {actionText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SuccessModal;