import { test, expect } from '@playwright/test';

test.describe('Clinic Portal Flow', () => {
  // Use ?dev=1 to force clinic portal view on localhost
  // Note: TenantLoader defaults to 'demo' on localhost, which has name 'Test Physio Clinic'
  const clinicUrl = '/?dev=1';

  test('should display clinic name and hero', async ({ page }) => {
    await page.goto(clinicUrl);
    await page.waitForTimeout(2000);
    
    // Check for clinic name (Demo clinic name used on localhost)
    await expect(page.locator('body')).toContainText(/Test Physio Clinic/i);
    
    // Check for "Book" button
    const bookButton = page.getByRole('button', { name: /Book/i }).first();
    await expect(bookButton).toBeVisible();
  });

  test('should complete service selection in booking flow', async ({ page }) => {
    await page.goto('/book?dev=1');
    await page.waitForTimeout(2000);
    
    // Check for Select Treatment or Service header
    // BookingPage.jsx uses "Select Treatment"
    await expect(page.getByText(/Select Treatment/i)).toBeVisible();
    
    // Check for a specific service (from demo config or clinicConfig)
    // clinicConfig has "Initial Consultation"
    await expect(page.getByText(/Initial Consultation/i)).toBeVisible();
    
    // Select the service
    await page.getByText(/Initial Consultation/i).click();
    
    // Should now see the calendar
    await expect(page.getByText(/Choose Your Slot/i)).toBeVisible();
  });
});
