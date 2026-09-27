'use client';

import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, helperText, id, onChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as any) || internalRef;
    const inputId = id || React.useId();
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
      onChange?.(e);
    };

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={inputId}
          onChange={handleInput}
          aria-invalid={!!error}
          aria-describedby={`${helperText ? helperId : ''} ${error ? errorId : ''}`}
          className={`flex min-h-[80px] w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-teal disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden ${
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

Textarea.displayName = 'Textarea';
