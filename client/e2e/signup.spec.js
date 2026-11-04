import { test, expect } from '@playwright/test';

const PASSWORD = process.env.TEST_PASS ?? 'Testuser1234.';

function uniqueUser() {
  const username = `tu${Date.now().toString(36)}`;
  return { username, email: `${username}@smu.edu.sg` };
}

async function fillAccountStep(
  page,
  { fullName = 'Test User', email, password = PASSWORD, confirm = password }
) {
  await page.getByPlaceholder('Full Name').fill(fullName);
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password', { exact: true }).fill(password);
  await page.getByPlaceholder('Confirm Password').fill(confirm);
  await page.getByRole('button', { name: 'REGISTER' }).click();
}

async function selectOption(page, selector, option) {
  await page.locator(selector).click();
  await page.getByText(option, { exact: true }).click();
}

test.describe('account step validation', () => {
  const cases = [
    { title: 'missing field', input: { fullName: '' }, error: 'Please fill in all required fields.' },
    { title: 'non-SMU email', input: { email: 'someone@gmail.com' }, error: 'Email must end with @smu.edu.sg' },
    { title: 'password too short', input: { password: 'Ab1!' }, error: 'Password must be at least 8 characters' },
    { title: 'no capital letter', input: { password: 'testuser1234.' }, error: 'Password must include at least 1 capital letter, 1 number, and 1 special character.' },
    { title: 'no number', input: { password: 'Testuser.' }, error: 'Password must include at least 1 capital letter, 1 number, and 1 special character.' },
    { title: 'no special character', input: { password: 'Testuser1234' }, error: 'Password must include at least 1 capital letter, 1 number, and 1 special character.' },
    { title: 'passwords do not match', input: { confirm: 'Different1234.' }, error: 'Passwords do not match!' },
  ];

  for (const c of cases) {
    test(`shows error: ${c.title}`, async ({ page }) => {
      await page.goto('/signup');
      await fillAccountStep(page, { email: uniqueUser().email, ...c.input });

      await expect(page.locator('.form-error:visible')).toHaveText(c.error);
      // Still on the account step
      await expect(page.getByRole('heading', { name: 'CREATE AN ACCOUNT' })).toBeVisible();
    });
  }
});

test('Google sign-up skips the account step', async ({ page }) => {
  await page.route('**/auth/google/signin/signup-info**', route =>
    route.fulfill({
      json: { email: 'googleuser@smu.edu.sg', name: 'Google User' },
      headers: { 'access-control-allow-origin': '*' },
    })
  );

  await page.goto('/signup?googleCode=fake-code');

  await expect(page.getByRole('heading', { name: 'CREATE PROFILE' })).toBeVisible();
  await expect(page.getByPlaceholder('Display Name')).toHaveValue('Google User');
  await expect(page.getByText('ACCOUNT', { exact: true })).toHaveCount(0); // tab is hidden
  await expect(page).toHaveURL(/\/signup$/); // code stripped from the URL
});