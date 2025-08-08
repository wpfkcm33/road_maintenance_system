// frontend/src/components/common/Modal.tsx
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
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

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-white rounded-lg shadow-xl w-full mx-4
        ${sizeClasses[size]}
        max-h-[90vh] overflow-hidden
        animate-slideUp
      `}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;