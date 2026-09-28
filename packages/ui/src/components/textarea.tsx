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
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-ink text-sm font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={inputId}
          onChange={handleInput}
          aria-invalid={!!error}
          aria-describedby={`${helperText ? helperId : ''} ${error ? errorId : ''}`}
          className={`border-border bg-panel text-ink placeholder:text-ink-soft focus:ring-teal flex min-h-[80px] w-full resize-none overflow-hidden rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
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

Textarea.displayName = 'Textarea';
