'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md min-w-[300px] animate-in slide-in-from-right-full fade-in duration-300
              ${toast.type === 'success' ? 'bg-[#14F195]/10 border-[#14F195]/20 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-white' : ''}
            `}
          >
            <div className={`
              p-1 rounded-full 
              ${toast.type === 'success' ? 'bg-[#14F195]/20 text-[#14F195]' : ''}
              ${toast.type === 'error' ? 'bg-red-500/20 text-red-500' : ''}
              ${toast.type === 'info' ? 'bg-blue-500/20 text-blue-500' : ''}
            `}>
              {toast.type === 'success' && <CheckCircle size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'info' && <Info size={16} />}
            </div>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
