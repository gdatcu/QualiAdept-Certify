import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E User Journeys', () => {
  test('should load landing page and display QualiAdept LMS branding', async ({ page }) => {
    await page.goto('/en');

    // Verify main brand heading
    await expect(page).toHaveTitle(/QualiAdept/i);
    await expect(page.locator('body')).toBeVisible();
  });
});
