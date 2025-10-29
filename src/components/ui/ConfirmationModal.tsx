import React from 'react';
import { Button } from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    variant?: 'default' | 'danger';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    const confirmClasses = variant === 'danger' 
        ? '!bg-red-600 hover:!bg-red-700 focus:ring-red-500' 
        : '';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" role="alertdialog" aria-modal="true" aria-labelledby="dialog_title" aria-describedby="dialog_desc">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
                <h3 id="dialog_title" className="text-xl font-bold text-slate-800">{title}</h3>
                <p id="dialog_desc" className="text-slate-500 mt-2 mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <Button variant="secondary" onClick={onClose} className="w-full">
                        {cancelButtonText}
                    </Button>
                    <Button variant="primary" onClick={onConfirm} className={`w-full ${confirmClasses}`}>
                        {confirmButtonText}
                    </Button>
                </div>
            </div>
        </div>
    );
};