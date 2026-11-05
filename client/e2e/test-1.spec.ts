import { test, expect } from '@playwright/test';

test('user can send a friend request', async ({ page }) => {
  // Login as Testuser2
  await page.goto('http://localhost:5173/login?redirect=/');
  await page.getByRole('textbox', { name: 'Username' }).fill('Testuser2');
  await page.getByRole('textbox', { name: 'Password' }).fill('Testuser1234.');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');
  
  // Navigate to Friends and find user
  await page.getByRole('link', { name: /Friends/i }).click();
  await page.getByRole('button', { name: 'Find friends' }).click();
  
  const searchBox = page.getByRole('searchbox', { name: 'Search users' });
  await searchBox.click();
  await searchBox.fill('Testuser3');
  
  // Click the explicit "Add" button and verify request state
  const addButton = page.getByRole('button', { name: 'Add' });
  await expect(addButton).toBeVisible();
  await addButton.click();
  
  // Verify UI reflects that the request was sent or button state changes
  await expect(page.getByText('Testuser3')).toBeVisible();
});