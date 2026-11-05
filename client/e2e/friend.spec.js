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

// ───────── Real data: USER_A and USER_B end up as friends again ─────────
async function switchUser(page, username, password) {
  await page.evaluate(() => localStorage.clear());
  await login(page, username, password);
}

// Clears any friendship or request between USER_A and USER_B, so the test can run again and again
async function unfriend(page) {
  await page.goto('/friends?tab=friends');
  await page.waitForLoadState('networkidle');   // wait for the lists before checking what's in them
  const removeX = page.getByRole('button', { name: `Remove ${USER_B}`, exact: true });
  if (await removeX.isVisible()) {
    await removeX.click();
    await person(page, `Remove ${USER_B}\\?`).getByRole('button', { name: 'Yes, remove' }).click();
    await expect(removeX).toHaveCount(0);
  }

  await page.goto('/friends?tab=requests');
  await page.waitForLoadState('networkidle');
  const row = person(page, USER_B);
  for (const name of ['Cancel', 'Decline']) {
    const button = row.getByRole('button', { name, exact: true });
    if (await button.isVisible()) {
      await button.click();
      await expect(row).toHaveCount(0);
    }
  }
}

test('user can send a friend request and the other user accepts it', async ({ page }) => {
  await login(page, USER_A, PASS_A);
  await unfriend(page);

  // USER_A sends the request
  await page.goto('/friends?tab=add');
  await page.getByRole('searchbox', { name: 'Search users' }).fill(USER_B);
  await person(page, USER_B).getByRole('button', { name: 'Add', exact: true }).click();
  await expect(person(page, USER_B).getByText('Sent', { exact: true })).toBeVisible();

  // USER_B accepts it
  await switchUser(page, USER_B, PASS_B);
  await page.goto('/friends?tab=requests');
  await person(page, USER_A).getByRole('button', { name: 'Accept', exact: true }).click();
  await expect(person(page, USER_A)).toHaveCount(0);

  await page.goto('/friends?tab=friends');
  await expect(page.getByRole('button', { name: `Remove ${USER_A}`, exact: true })).toBeVisible();
});