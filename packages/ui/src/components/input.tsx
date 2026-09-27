'use client';

import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={`${helperText ? helperId : ''} ${error ? errorId : ''}`}
          className={`flex h-10 w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-teal disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-terracotta focus:ring-terracotta' : ''
          } ${className}`}
          {...props}
        />
        {helperText && !error && (
          <p id={helperId} className="text-sm text-ink-soft">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-terracotta">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
