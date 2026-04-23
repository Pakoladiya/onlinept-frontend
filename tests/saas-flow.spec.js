import { test, expect } from '@playwright/test';

test.describe('SaaS Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000); // Give it a moment to render
  });

  test('should display OnlinePT branding and hero', async ({ page }) => {
    // Print logs for debugging
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    
    // Check if the page contains OnlinePT (usually in nav or logo)
    await expect(page.locator('body')).toContainText(/OnlinePT/i);
    
    // Check hero title
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toContainText(/Build Your Digital Clinic/i);
  });

  test('should show pricing section', async ({ page }) => {
    const pricingHeader = page.getByText(/Simple, Honest Pricing/i);
    await expect(pricingHeader).toBeVisible();
    
    // Check for plan names
    await expect(page.locator('body')).toContainText(/Growth/i);
    await expect(page.locator('body')).toContainText(/Starter/i);
  });
});
