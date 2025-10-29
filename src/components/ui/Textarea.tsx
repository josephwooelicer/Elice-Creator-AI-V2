import React from 'react';

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
    <textarea {...props} className={`w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-focus focus:border-primary-focus placeholder-slate-400 ${className || ''}`} />
);
