import { test, expect } from '@playwright/test';

test('caregiver can create a profile, log an observation, and add medication', async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await page.goto('/auth', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: false }).fill('Local-test-password-42');
  await page.getByLabel('I confirm that I am 18 or older.').check();
  await page
    .getByLabel('I am a family member or trusted supporter of the person I care for.')
    .check();
  await page.getByRole('button', { name: 'Create my private space' }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByLabel('What should we call them?').fill('Priya');
  await page.getByLabel('Your relationship').fill('Sister');
  await page.getByLabel('Age range').selectOption('25-34');
  await page
    .getByLabel('Tell their story in your own words')
    .fill('Priya values familiar routines and quiet mornings.');
  await page.getByRole('button', { name: 'Save profile and continue' }).click();
  await expect(page).toHaveURL(/\/app\/companion$/);
  await expect(
    page.getByRole('heading', { name: /What would help you think this through/ }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Daily log' }).first().click();
  await page.getByRole('button', { name: 'Sleep' }).click();
  await page.getByLabel('Add a note').fill('Slept later than usual after a busy day.');
  await page.getByRole('button', { name: 'Save observation' }).click();
  await expect(page.getByText('Observation saved.')).toBeVisible();

  await page.goto('/app/medications');
  await page.getByRole('button', { name: 'Add medication' }).click();
  await page.getByLabel('Medication name').fill('Medication A');
  await page.getByLabel('Schedule as you understand it').fill('As directed each evening');
  await page.getByLabel('Start date').fill('2026-09-01');
  await page.getByRole('button', { name: 'Add medication record' }).click();
  await expect(page.getByRole('heading', { name: 'Medication A' })).toBeVisible();
  await expect(page.getByText('SizoCare does not give medication advice.')).toBeVisible();
});

test('persistent crisis help exposes India resources', async ({ page }) => {
  const email = `help-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await page.goto('/auth', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: false }).fill('Local-test-password-42');
  await page.getByLabel('I confirm that I am 18 or older.').check();
  await page
    .getByLabel('I am a family member or trusted supporter of the person I care for.')
    .check();
  await page.getByRole('button', { name: 'Create my private space' }).click();
  await page.getByLabel('What should we call them?').fill('Aman');
  await page.getByLabel('Your relationship').fill('Brother');
  await page.getByLabel('Age range').selectOption('35-44');
  await page
    .getByLabel('Tell their story in your own words')
    .fill('Aman prefers predictable routines and quiet spaces.');
  await page.getByRole('button', { name: 'Save profile and continue' }).click();
  await page.getByRole('button', { name: 'Get help now' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('112');
  await expect(page.getByRole('dialog')).toContainText('14416');
});
