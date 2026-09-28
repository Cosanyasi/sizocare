/**
 * Placeholder E2E test: Verify the app loads and renders correctly.
 *
 * This will be expanded in Phase 1 (Auth) with actual user flows.
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('unauthenticated visitors reach the account and disclaimer flow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/SizoCare/);
    await expect(page).toHaveURL(/\/auth$/);
    await expect(
      page.getByRole('heading', { name: 'Care starts with a steady place to think.' }),
    ).toBeVisible();
    await expect(
      page.getByText(/SizoCare is an organisational and reflective support tool/),
    ).toBeVisible();
  });
});
