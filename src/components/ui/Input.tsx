import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
  required?: boolean;
}
// FIX: Converted to a forwardRef component to accept a ref.
// FIX: Made the `label` prop optional and conditionally rendered it.
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, containerClassName, required, ...props }, ref) => (
  <div className={containerClassName}>
    {label && <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">
      {label}{required && <span className="text-primary ml-1">*</span>}
    </label>}
    <input ref={ref} id={id} {...props} className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-0 focus:ring-primary-focus focus:border-primary-focus placeholder-slate-400" />
  </div>
));