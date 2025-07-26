import React from 'react';
// Styles included in main theme

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="luxury-modal-overlay" onClick={onClose}>
      <div
        className="luxury-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;