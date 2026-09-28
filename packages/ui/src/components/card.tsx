'use client';

import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-panel border-border shadow-card overflow-hidden rounded-lg border ${className}`}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';
