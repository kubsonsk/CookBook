import { test, expect } from '@playwright/test';

test.describe('Recipe Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Perform authentication
    await page.goto('/');
    await page.getByPlaceholder('Email').fill(process.env.TEST_ACCOUNT_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.TEST_ACCOUNT_PASSWORD!);
    await page.getByRole('button', { name: 'Sign In with Email' }).click();
    
    // Wait for authentication and redirect to home
    await expect(page.getByRole('heading', { name: 'CookBook' })).toBeVisible();
  });

  test('should create, edit, and delete a recipe', async ({ page }) => {
    // Debug: Catch console errors
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', exception => console.log('BROWSER ERROR:', exception));

    const recipeTitle = `Recipe ${Math.random().toString(36).substring(7)}`;
    const updatedTitle = `Updated ${recipeTitle}`;

    // 1. Create
    await page.getByRole('link', { name: 'Add' }).click();
    await page.getByLabel('Title').fill(recipeTitle);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(recipeTitle).first()).toBeVisible();

    // 2. Edit
    await page.getByText(recipeTitle).first().click();
    
    // Debug: Log URL
    console.log('CURRENT URL:', page.url());
    
    // Wait for the navigation to complete to the detail route
    await page.waitForURL(/\/recipe\/.+/);

    // Wait for the detail page content to appear instead of waiting for full network idle
    await expect(page.getByText(recipeTitle, { exact: true })).toBeVisible({ timeout: 20000 });
    
    // Use a more flexible locator if there's uncertainty between button/link
    const editAction = page.getByRole('button', { name: 'Edit' }).or(page.getByRole('link', { name: 'Edit' }));
    await editAction.waitFor({ state: 'visible' });
    await editAction.click();
    
    // Explicitly wait for the form to be ready
    const titleInput = page.getByLabel('Title');
    await titleInput.waitFor({ state: 'visible' });
    await titleInput.fill(updatedTitle);
    
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(updatedTitle).first()).toBeVisible();

    // 3. Delete
    await page.getByText(updatedTitle).first().click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText(updatedTitle)).not.toBeVisible();
  });
});
