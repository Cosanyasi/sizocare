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
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-ink text-sm font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={`${helperText ? helperId : ''} ${error ? errorId : ''}`}
          className={`border-border bg-panel text-ink placeholder:text-ink-soft focus:ring-teal flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-terracotta focus:ring-terracotta' : ''
          } ${className}`}
          {...props}
        />
        {helperText && !error && (
          <p id={helperId} className="text-ink-soft text-sm">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-terracotta text-sm">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
