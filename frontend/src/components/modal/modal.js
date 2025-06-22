import React from 'react';
import '../../styles/components/Modal.css';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="luxury-modal-overlay" onClick={onClose}>
      <div
        className="luxury-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="luxury-modal-close"
          aria-label="Close modal"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;