import React from 'react';
import { ToastMessage } from '../../types.js';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const icons = {
          info: <Info size={18} color="#3b82f6" />,
          success: <CheckCircle size={18} color="#10b981" />,
          warning: <AlertTriangle size={18} color="#f59e0b" />,
          error: <XCircle size={18} color="#ef4444" />,
        };

        return (
          <div
            key={toast.id}
            onClick={() => onDismiss(toast.id)}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '10px 16px',
              color: '#fff',
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(12px)',
              animation: 'slideIn 0.25s ease-out',
              maxWidth: '360px',
            }}
          >
            {icons[toast.type]}
            <span>{toast.text}</span>
          </div>
        );
      })}
    </div>
  );
};
