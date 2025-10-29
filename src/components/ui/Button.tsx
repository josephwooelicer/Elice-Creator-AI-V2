import React from 'react';
import { isMac } from '../../utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'text';
    children: React.ReactNode;
    icon?: React.ElementType;
    shortcut?: string;
}

const baseClasses = "flex items-center justify-center font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus transition-colors disabled:cursor-not-allowed text-sm";

const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary-focus/20 disabled:bg-slate-400 disabled:shadow-none',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-semibold focus:!ring-slate-700',
    text: 'text-primary-text hover:underline p-0 font-semibold !rounded-none !shadow-none !ring-offset-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'primary', children, icon: Icon, className, shortcut, ...props }, ref) => {
    
    const getShortcut = () => {
        if (!shortcut) return null;
        
        const onMac = isMac();
        const keys = shortcut.split('+');
        
        const formattedKeys = keys.map(key => {
            if (key.toLowerCase() === 'mod') return onMac ? '⌘' : 'Ctrl';
            if (key.toLowerCase() === 'enter') return '↵';
            return key.toUpperCase();
        });

        const kbdVariantClasses = {
            primary: 'bg-black/20 text-white/90 border-b-2 border-black/40',
            secondary: 'bg-slate-100 text-slate-600 border border-slate-200 border-b-2 border-b-slate-300',
            text: 'bg-slate-100 text-slate-600 border border-slate-200 border-b-2 border-b-slate-300',
        };
        
        const separatorVariantClasses = {
            primary: 'text-white/60',
            secondary: 'text-slate-400',
            text: 'text-slate-400',
        };

        return (
            <span className="ml-2 flex items-center gap-1">
                {formattedKeys.map((key, index) => (
                    <React.Fragment key={index}>
                        <kbd className={`px-1.5 py-0.5 text-xs font-sans font-semibold rounded-md ${kbdVariantClasses[variant]}`}>
                            {key}
                        </kbd>
                        {index < formattedKeys.length - 1 && <span className={`text-xs font-medium ${separatorVariantClasses[variant]}`}>+</span>}
                    </React.Fragment>
                ))}
            </span>
        );
    };
    
    return (
        <button
            ref={ref}
            className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
            {...props}
        >
            {Icon && <Icon className="w-5 h-5 mr-2" />}
            <span className="flex items-center">
                {children}
                {getShortcut()}
            </span>
        </button>
    );
});