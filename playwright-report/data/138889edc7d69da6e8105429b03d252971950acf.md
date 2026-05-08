# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recipe-lifecycle.spec.ts >> Recipe Lifecycle >> should create, edit, and delete a recipe
- Location: tests/recipe-lifecycle.spec.ts:15:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.waitFor: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Edit' }).or(getByRole('link', { name: 'Edit' })) to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - main [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - button [ref=e7]:
          - img [ref=e8]
        - generic [ref=e11]:
          - link [ref=e12] [cursor=pointer]:
            - /url: /edit/OOqv24ZcrGdk7iiQKSyi
            - img [ref=e13]
          - button [ref=e16]:
            - img [ref=e17]
      - img [ref=e25]
      - heading "Recipe 0tlzaa" [level=1] [ref=e32]
      - generic [ref=e33]:
        - generic [ref=e34]:
          - img [ref=e35]
          - paragraph [ref=e38]: Time
          - paragraph [ref=e39]: 30m
        - generic [ref=e41]:
          - img [ref=e42]
          - paragraph [ref=e47]: Servings
          - generic [ref=e48]:
            - button "-" [ref=e49]
            - generic [ref=e50]: "2"
            - button "+" [ref=e51]
      - generic [ref=e52]:
        - generic [ref=e53]:
          - heading "Ingredients" [level=2] [ref=e54]
          - button "Send to Reminders" [ref=e55]:
            - img [ref=e56]
            - text: Send to Reminders
        - generic [ref=e64]: 0 g
      - generic [ref=e65]:
        - heading "Steps" [level=2] [ref=e66]
        - generic [ref=e70]:
          - generic [ref=e71]: "1"
          - paragraph
      - button "I'm done cooking!" [ref=e73]:
        - img [ref=e74]
        - text: I'm done cooking!
  - navigation [ref=e77]:
    - generic [ref=e78]:
      - link "Recipes" [ref=e79] [cursor=pointer]:
        - /url: /
        - img [ref=e80]
        - generic [ref=e83]: Recipes
      - link "Add" [ref=e84] [cursor=pointer]:
        - /url: /add
        - img [ref=e85]
        - generic [ref=e89]: Add
      - link "Settings" [ref=e90] [cursor=pointer]:
        - /url: /settings
        - img [ref=e91]
        - generic [ref=e94]: Settings
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Recipe Lifecycle', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Perform authentication
  6  |     await page.goto('/');
  7  |     await page.getByPlaceholder('Email').fill(process.env.TEST_ACCOUNT_EMAIL!);
  8  |     await page.getByPlaceholder('Password').fill(process.env.TEST_ACCOUNT_PASSWORD!);
  9  |     await page.getByRole('button', { name: 'Sign In with Email' }).click();
  10 |     
  11 |     // Wait for authentication and redirect to home
  12 |     await expect(page.getByRole('heading', { name: 'CookBook' })).toBeVisible();
  13 |   });
  14 | 
  15 |   test('should create, edit, and delete a recipe', async ({ page }) => {
  16 |     // Debug: Catch console errors
  17 |     page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  18 |     page.on('pageerror', exception => console.log('BROWSER ERROR:', exception));
  19 | 
  20 |     const recipeTitle = `Recipe ${Math.random().toString(36).substring(7)}`;
  21 |     const updatedTitle = `Updated ${recipeTitle}`;
  22 | 
  23 |     // 1. Create
  24 |     await page.getByRole('link', { name: 'Add' }).click();
  25 |     await page.getByLabel('Title').fill(recipeTitle);
  26 |     await page.getByRole('button', { name: 'Save' }).click();
  27 |     await expect(page.getByText(recipeTitle).first()).toBeVisible();
  28 | 
  29 |     // 2. Edit
  30 |     await page.getByText(recipeTitle).first().click();
  31 |     
  32 |     // Debug: Log URL
  33 |     console.log('CURRENT URL:', page.url());
  34 |     
  35 |     // Wait for the navigation to complete to the detail route
  36 |     await page.waitForURL(/\/recipe\/.+/);
  37 | 
  38 |     // Wait for the detail page content to appear instead of waiting for full network idle
  39 |     await expect(page.getByText(recipeTitle, { exact: true })).toBeVisible({ timeout: 20000 });
  40 |     
  41 |     // Use a more flexible locator if there's uncertainty between button/link
  42 |     const editAction = page.getByRole('button', { name: 'Edit' }).or(page.getByRole('link', { name: 'Edit' }));
> 43 |     await editAction.waitFor({ state: 'visible' });
     |                      ^ Error: locator.waitFor: Test timeout of 30000ms exceeded.
  44 |     await editAction.click();
  45 |     
  46 |     // Explicitly wait for the form to be ready
  47 |     const titleInput = page.getByLabel('Title');
  48 |     await titleInput.waitFor({ state: 'visible' });
  49 |     await titleInput.fill(updatedTitle);
  50 |     
  51 |     await page.getByRole('button', { name: 'Save' }).click();
  52 |     await expect(page.getByText(updatedTitle).first()).toBeVisible();
  53 | 
  54 |     // 3. Delete
  55 |     await page.getByText(updatedTitle).first().click();
  56 |     await page.getByRole('button', { name: 'Delete' }).click();
  57 |     await page.getByRole('button', { name: 'Confirm' }).click();
  58 |     await expect(page.getByText(updatedTitle)).not.toBeVisible();
  59 |   });
  60 | });
  61 | 
```