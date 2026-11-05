import { test, expect } from '@playwright/test';

test.use({ actionTimeout: 10_000 });
const USER_A = process.env.USER_A ?? 'Testuser2';
const PASS_A = process.env.PASS_A ?? 'Testuser1234.';
const USER_B = process.env.USER_B ?? 'Testuser3';
const PASS_B = process.env.PASS_B ?? 'Testuser1234.';
const EMPTY_USER = process.env.EMPTY_USER ?? 'testuser';
const EMPTY_PASS = process.env.EMPTY_PASS ?? 'Testuser1234.';

const person = (page, name) =>
  page
    .locator('.person:visible')
    .filter({ has: page.locator('.who', { hasText: new RegExp(`^${name}$`, 'i') }) });

async function login(page, username, password) {
  await page.goto('/login?redirect=/friends');
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page.waitForURL((url) => url.pathname === '/friends');
}

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

// ───────── Mocked: no real data is touched ─────────
test.describe('add tab (mocked server)', () => {
  const ghost = { _id: 'fake-user-1', username: 'ghostuser' };
  const searchBox = (page) => page.getByPlaceholder('Type at least 2 letters');

  test.beforeEach(async ({ page }) => {
    await login(page, EMPTY_USER, EMPTY_PASS);
    await page.route('**/api/users/search**', (route) => route.fulfill({ json: [ghost] }));
  });

  test('opens the tab named in the URL', async ({ page }) => {
    await page.goto('/friends?tab=add');
    await expect(page.getByRole('heading', { name: 'Add a friend' })).toBeVisible();
  });

  test('strips a typed @ from the search box', async ({ page }) => {
    await page.goto('/friends?tab=add');
    await searchBox(page).fill('@gh');
    await expect(searchBox(page)).toHaveValue('gh');
  });

  test('shows a message when nobody matches', async ({ page }) => {
    await page.route('**/api/users/search**', (route) => route.fulfill({ json: [] }));
    await page.goto('/friends?tab=add');
    await searchBox(page).fill('zzqxjv');
    await expect(page.getByText('No one found for "@zzqxjv"')).toBeVisible();
  });

  test('Add sends the right receiver', async ({ page }) => {
    await page.route('**/api/friends/request', (route) =>
      route.fulfill({ status: 201, json: { _id: 'fake-request-1' } })
    );
    await page.goto('/friends?tab=add');
    await searchBox(page).fill('gho');

    const requestPromise = page.waitForRequest('**/api/friends/request');
    await person(page, ghost.username).getByRole('button', { name: 'Add', exact: true }).click();
    expect((await requestPromise).postDataJSON().receiverId).toBe(ghost._id);
  });

  test('shows the server error when sending fails', async ({ page }) => {
    await page.route('**/api/friends/request', (route) =>
      route.fulfill({ status: 400, json: { message: 'Request or friendship already exists' } })
    );
    await page.goto('/friends?tab=add');
    await searchBox(page).fill('gho');
    await person(page, ghost.username).getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Request or friendship already exists');
  });
});

// ───────── Empty account (read-only) ─────────
test('empty account shows the empty states', async ({ page }) => {
  await login(page, EMPTY_USER, EMPTY_PASS);

  await page.goto('/friends?tab=friends');
  await expect(page.getByText('No friends yet. Search for a classmate by username.')).toBeVisible();

  await page.goto('/friends?tab=requests');
  await expect(page.getByText("You're all caught up. New requests show up here.")).toBeVisible();
  await expect(page.getByText('No pending requests. Find people on the Add tab.')).toBeVisible();
});

test('user can send a friend request', async ({ page }) => {
  // Login as USER_A
  await page.goto('http://localhost:5173/login?redirect=/');
  await page.getByRole('textbox', { name: 'Username' }).fill(USER_A);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASS_A);
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');
  
  // Navigate to Friends and find USER_B
  await page.getByRole('link', { name: /Friends/i }).click();
  await page.getByRole('button', { name: 'Find friends' }).click();
  
  const searchBox = page.getByRole('searchbox', { name: 'Search users' });
  await searchBox.click();
  await searchBox.fill(USER_B);
  
  // Click the explicit "Add" button and verify request state
  const addButton = page.getByRole('button', { name: 'Add' });
  await expect(addButton).toBeVisible();
  await addButton.click();
  
  // Verify UI reflects USER_B
  await expect(page.getByText(USER_B)).toBeVisible();
});