import React from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'warning' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">warning</span>;
      case 'warning':
        return <span className="material-symbols-outlined text-[#d0bcff] text-[18px]">notifications_active</span>;
      case 'info':
        return <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">info</span>;
      default:
        return <span className="material-symbols-outlined text-[#4edea3] text-[18px]">verified_user</span>;
    }
  };

  return (
    <div
      role="alert"
      className="fixed top-16 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded bg-[#262a33] text-[#dfe2ee] shadow-2xl border border-[#3d494c] font-code-metric text-[12px] animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {getIcon()}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-[#869397] hover:text-[#dfe2ee] focus:outline-none"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[14px]">close</span>
      </button>
    </div>
  );
};
