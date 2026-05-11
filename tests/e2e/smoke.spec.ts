import { test, expect } from '@playwright/test';
test.describe('sp-ui-coding', () => {
	test('coding page loads', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('body')).toBeVisible();
	});
	test('coding placeholder visible', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText(/coming soon/i)).toBeVisible();
	});
});
