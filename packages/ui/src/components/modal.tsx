'use client';

import * as React from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose} />
      
      {/* TODO: Add proper focus trap implementation */}
      <div className="relative w-full max-w-lg rounded-xl bg-panel p-6 shadow-card transform transition-all">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-serif font-semibold text-ink">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-soft hover:bg-bg focus:outline-none focus:ring-2 focus:ring-teal"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-2 text-ink">
          {children}
        </div>
      </div>
    </div>
  );
}
