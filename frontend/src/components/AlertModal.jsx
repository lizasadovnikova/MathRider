import React from 'react';
import '../styles/AlertModal.css';

export default function AlertModal({ isOpen, title, message, type = 'info', onClose }) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content border-${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">{getIcon()}</div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <button className={`modal-btn btn-${type}`} onClick={onClose}>
          Продовжити
        </button>
      </div>
    </div>
  );
}