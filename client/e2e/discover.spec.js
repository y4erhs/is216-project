import { test, expect } from '@playwright/test';

const PASSWORD = process.env.TEST_PASS ?? 'Testuser1234.';

async function ensureLoggedIn(page) {
  await page.goto('/');
  
  if (page.url().includes('/login')) {
    await page.getByPlaceholder('Username').fill('testuser');
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'LOG IN' }).click();
    await page.waitForURL('http://localhost:5173/');
  }
}

test.describe('Home / Discover Page Frontend Interactions', () => {

  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test('shows alert when FROM date is later than TO date', async ({ page }) => {
    const fromInput = page.getByRole('textbox', { name: 'FROM' });
    const toInput = page.getByRole('textbox', { name: 'TO' });
    
    // Set From date later than To date to trigger alert
    await fromInput.fill('2026-11-18');
    await toInput.fill('2026-11-06');

    // Intercept dialog using your exact pattern
    page.once('dialog', dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      expect(dialog.message()).toBe('The FROM date cannot be later than the TO date.');
      dialog.dismiss().catch(() => {});
    });

    await page.getByRole('button', { name: 'APPLY' }).click();
  });

  test('navigates to profile page via edit interest link', async ({ page }) => {
    await page.getByRole('link', { name: '+ EDIT INTEREST' }).click();
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('navigates to calendar page via view calendar button', async ({ page }) => {
    await page.getByRole('button', { name: 'VIEW MY CALENDAR' }).click();
    await expect(page).toHaveURL(/\/calendar$/);
  });

  test('clicking an event card opens the detail info view', async ({ page }) => {
    const eventCard = page.locator('.folder-cards-grid > *').first();
    
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await expect(page.locator('.card-info-wrapper')).toBeVisible();
    }
  });

});