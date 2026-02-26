import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-500/20 border-green-500 text-green-400',
    error: 'bg-red-500/20 border-red-500 text-red-400',
    info: 'bg-blue-500/20 border-blue-500 text-blue-400',
    warning: 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 ${
        colors[type]
      } ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
    >
      {icons[type]}
      <span className="flex-1 text-sm">{message}</span>
      <button onClick={() => onClose(id)} className="hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastProps[] }> = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
    {toasts.map(toast => (
      <Toast key={toast.id} {...toast} />
    ))}
  </div>
);

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
    duration?: number;
}

interface ToastProps {
    message: ToastMessage;
    onClose: (id: string) => void;
}

const MaterialIcon = ({ name }: { name: string }) => (
    <span className="material-symbols-outlined">{name}</span>
);

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = message.duration || 5000;
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onClose(message.id), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [message, onClose]);

    const getIcon = () => {
        switch (message.type) {
            case 'success':
                return 'check_circle';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            case 'info':
            default:
                return 'info';
        }
    };

    const getColors = () => {
        switch (message.type) {
            case 'success':
                return 'bg-teal-500/10 border-teal-500/50 text-teal-400';
            case 'error':
                return 'bg-red-500/10 border-red-500/50 text-red-400';
            case 'warning':
                return 'bg-orange-500/10 border-orange-500/50 text-orange-400';
            case 'info':
            default:
                return 'bg-blue-500/10 border-blue-500/50 text-blue-400';
        }
    };

    return (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm
        shadow-lg transition-all duration-300 min-w-[300px] max-w-[500px]
        ${getColors()}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
        >
            <MaterialIcon name={getIcon()} />
            <p className="flex-1 text-sm font-medium text-white">{message.message}</p>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => onClose(message.id), 300);
                }}
                className="text-gray-400 hover:text-white transition-colors"
            >
                <MaterialIcon name="close" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    messages: ToastMessage[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onClose }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
            {messages.map((message) => (
                <div key={message.id} className="pointer-events-auto">
                    <Toast message={message} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};
