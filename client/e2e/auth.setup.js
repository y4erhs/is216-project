import { test as setup } from '@playwright/test';

async function loginAndSave(page, username, password, file) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page.waitForURL((url) => url.pathname === '/');
  await page.context().storageState({ path: file });
}

setup('log in as the main account', async ({ page }) => {
  await loginAndSave(
    page,
    process.env.TEST_USER ?? 'Testuser2',
    process.env.TEST_PASS ?? 'Testuser1234.',
    'e2e/.auth/user.json'
  );
});

setup('log in as the empty account', async ({ page }) => {
  await loginAndSave(
    page,
    process.env.EMPTY_USER ?? 'testuser',
    process.env.EMPTY_PASS ?? 'Testuser1234.',
    'e2e/.auth/empty.json'
  );
});