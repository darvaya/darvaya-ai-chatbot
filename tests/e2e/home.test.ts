import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Darvaya AI/);
  });

  test('should have chat input', async ({ page }) => {
    await page.goto('/');
    const chatInput = page.getByPlaceholder(/Type your message/i);
    await expect(chatInput).toBeVisible();
  });

  test('should send a message', async ({ page }) => {
    await page.goto('/');
    const chatInput = page.getByPlaceholder(/Type your message/i);
    await chatInput.fill('Hello');
    await chatInput.press('Enter');

    // Wait for response
    await expect(page.getByText('Hello')).toBeVisible();
    await expect(page.getByRole('status')).toBeVisible();
  });
});
