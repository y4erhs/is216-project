import { test, expect } from '@playwright/test';

async function fillLoginForm(page, { username = '', password = '' }) {
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'LOG IN' }).click();
}

test.describe('Login error flows', () => {
  
  test('shows error on login with wrong password', async ({ page }) => {
    await page.goto('/login');
    
    // Attempt login with incorrect credentials
    await fillLoginForm(page, { username: 'testuser', password: 'wrongpassword' });

    // Look for the error message container or text rendered by userStore.error
    // Using a regex or standard text match that handles typical backend failure messages
    const errorMessage = page.locator('p', { hasText: /invalid|failed|error|wrong|unauthorized|credential/i });
    
    await expect(errorMessage).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

});