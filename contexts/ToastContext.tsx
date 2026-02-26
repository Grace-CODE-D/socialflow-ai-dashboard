import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, ToastMessage } from '../components/ui/Toast';

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning', duration?: number) => void;
    hideToast: (id: string) => void;
    clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((
        message: string,
        type: 'success' | 'info' | 'error' | 'warning' = 'info',
        duration?: number
    ) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: ToastMessage = {
            id,
            message,
            type,
            duration
        };

        setToasts((prev) => [...prev, newToast]);
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast, clearAllToasts }}>
            {children}
            <ToastContainer messages={toasts} onClose={hideToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
