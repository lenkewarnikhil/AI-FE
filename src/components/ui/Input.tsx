import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && <label className="text-xs font-medium text-slate-300 tracking-wide">{label}</label>}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3 text-slate-400 pointer-events-none">{icon}</div>}
          <input
            ref={ref}
            className={`w-full glass-input px-3.5 py-2.5 rounded-xl text-sm transition-all placeholder:text-slate-500 ${
              icon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${error ? 'border-rose-500 focus:border-rose-500' : ''} ${className}`}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 flex items-center">{rightIcon}</div>}
        </div>
        {error && <span className="text-xs text-rose-400 mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
