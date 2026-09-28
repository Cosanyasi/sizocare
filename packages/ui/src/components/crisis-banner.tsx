'use client';

import * as React from 'react';

export interface CrisisBannerProps {
  emergencyNumber?: string;
  helplineNumber?: string;
  helplineName?: string;
}

export function CrisisBanner({
  emergencyNumber = '112',
  helplineNumber = '14416',
  helplineName = 'Tele-MANAS',
}: CrisisBannerProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-terracotta-tint border-terracotta w-full border-b-[3px] px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Alert Icon */}
          <div
            className="bg-terracotta flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
            aria-hidden="true"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-ink text-base font-medium">Need immediate help? You are not alone.</p>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center">
          <a
            href={`tel:${emergencyNumber}`}
            className="bg-terracotta focus:ring-terracotta focus:ring-offset-terracotta-tint inline-flex min-h-[44px] items-center justify-center rounded px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label={`Call emergency services at ${emergencyNumber}`}
          >
            Emergency {emergencyNumber}
          </a>
          <a
            href={`tel:${helplineNumber}`}
            className="border-terracotta text-terracotta focus:ring-terracotta focus:ring-offset-terracotta-tint inline-flex min-h-[44px] items-center justify-center rounded border-2 bg-transparent px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2"
            aria-label={`Call ${helplineName} at ${helplineNumber}`}
          >
            {helplineName} {helplineNumber}
          </a>
        </div>
      </div>
    </div>
  );
}
