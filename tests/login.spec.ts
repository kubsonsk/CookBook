import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should fail login with incorrect credentials', async ({ page }) => {
    const randomEmail = `test-${Math.random().toString(36).substring(7)}@example.com`;
    const randomPassword = Math.random().toString(36).substring(7);

    // Listen for the dialog event and dismiss it
    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    await page.getByPlaceholder('Email').fill(randomEmail);
    await page.getByPlaceholder('Password').fill(randomPassword);
    await page.getByRole('button', { name: 'Sign In with Email' }).click();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.getByPlaceholder('Email').fill(process.env.TEST_ACCOUNT_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.TEST_ACCOUNT_PASSWORD!);
    
    await page.getByRole('button', { name: 'Sign In with Email' }).click();
    
    // Verify successful login (e.g., checking for a dashboard heading or logout button)
    await expect(page.getByRole('heading', { name: 'CookBook' })).toBeVisible();
  });
});
