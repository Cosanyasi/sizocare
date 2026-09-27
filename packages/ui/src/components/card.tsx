'use client';

import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-panel rounded-lg border border-border shadow-card overflow-hidden ${className}`}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
