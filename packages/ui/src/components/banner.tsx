'use client';

import * as React from 'react';

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'crisis';
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

export function Banner({ variant = 'info', onDismiss, icon, className = '', children, ...props }: BannerProps) {
  const variants = {
    info: 'bg-teal-tint border-teal text-teal-deep',
    warning: 'bg-gold/10 border-gold text-ink',
    crisis: 'bg-terracotta-tint border-terracotta text-ink',
  };

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-lg border p-4 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <div className="shrink-0 pt-0.5">{icon}</div>}
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
          aria-label="Dismiss banner"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
