import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Toast } from '../components/ui/Toast';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export interface ToastMessage {
    id: number;
    message: string;
    action?: ToastAction;
    type?: 'default' | 'error';
}

interface ToastContextType {
    addToast: (message: string, options?: { action?: ToastAction; type?: 'default' | 'error' }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- ToastContainer Component (Internal) ---
const ToastContainer: React.FC<{
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
}> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-8 right-8 z-[100] space-y-3">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};


export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, options?: { action?: ToastAction; type?: 'default' | 'error' }) => {
        const id = Date.now() + Math.random();
        setToasts(prevToasts => [...prevToasts, { id, message, action: options?.action, type: options?.type || 'default' }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};