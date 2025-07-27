import React, { useEffect, useState } from 'react';
import '../../styles/index.css';

const Modal = ({ isOpen, onClose, children }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${show ? 'active' : ''}`} onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;