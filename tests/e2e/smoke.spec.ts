import { test, expect } from '@playwright/test';
test.describe('sp-ui-coding', () => {
	test('coding page loads', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('body')).toBeVisible();
	});
	test('monaco editor visible', async ({ page }) => {
		await page.goto('/');
		// Monaco editor container is a div with class 'monaco-editor'
		await expect(page.locator('.monaco-editor')).toBeVisible();
	});
});
