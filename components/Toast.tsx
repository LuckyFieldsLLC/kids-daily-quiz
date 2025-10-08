import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, []);
  
  const handleClose = () => {
      setIsExiting(true);
      // Wait for animation to finish before calling onClose
      setTimeout(() => {
          onClose();
      }, 300);
  };

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const icon = type === 'success'
    ? <CheckCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
    : <ExclamationCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />;

  return (
    <div
      role="alert"
      className={`max-w-sm w-full ${bgColor} text-white rounded-md shadow-lg p-4 flex items-center gap-3 ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
    >
      <div>{icon}</div>
      <p className="flex-grow text-sm font-medium">{message}</p>
      <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/20" aria-label="閉じる">
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default Toast;