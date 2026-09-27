import { test, expect } from '@playwright/test';

test('Companion supports first-run session-only AI provider setup', async ({ page }) => {
  const email = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await page.goto('/auth', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: false }).fill('Local-test-password-42');
  await page.getByLabel('I confirm that I am 18 or older.').check();
  await page.getByLabel('I am a family member or trusted supporter of the person I care for.').check();
  await page.getByRole('button', { name: 'Create my private space' }).click();
  await page.getByLabel('What should we call them?').fill('Maya');
  await page.getByLabel('Your relationship').fill('Daughter');
  await page.getByLabel('Age range').selectOption('55-64');
  await page.getByLabel('Tell their story in your own words').fill('Maya prefers calm conversations and familiar people.');
  await page.getByRole('button', { name: 'Save profile and continue' }).click();
  await expect(page).toHaveURL(/\/app\/companion$/);
  await page.getByRole('button', { name: 'I understand and consent' }).click();
  await expect(page.getByRole('heading', { name: 'Choose how Companion connects' })).toBeVisible();
  await page.route('**/functions/v1/companion-api', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { valid: true, provider: 'google' } }) }));
  await page.getByLabel('Google Gemini').check();
  await page.getByLabel('Gemini API key').fill('test-session-only-key');
  await page.getByRole('button', { name: 'Connect Google Gemini' }).click();
  await expect(page.getByText('Using Google Gemini')).toBeVisible();
  const stored = await page.evaluate(() => ({ local: localStorage.length, provider: sessionStorage.getItem('sizocare.ai.provider') }));
  expect(stored.provider).toBe('google');
});
