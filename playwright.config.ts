import { defineConfig, devices } from '@playwright/test';

const port = process.env.E2E_PORT ?? '3000';
const baseURL = `http://localhost:${port}`;

/**
 * Playwright E2E configuration for SizoCare MVP.
 *
 * Runs against the local Next.js dev server.
 * Tests cover: onboarding → first companion chat, crisis flow,
 * daily log → change signal, and accessibility (WCAG 2.1 AA).
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL,
    channel: 'msedge',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: `pnpm --filter @sizocare/web exec next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
