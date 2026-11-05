import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json', actionTimeout: 10_000 });

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': '*',
};

const isMocked = (url) =>
  url.pathname === '/api/notifications' ||
  url.pathname.startsWith('/api/notifications/') ||
  /^\/api\/friends\/[^/]+\/(accept|reject)$/.test(url.pathname);

let seq = 0;
const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();

const item = (over = {}) => ({
  _id: `n-${++seq}`,
  type: 'lobby_invite',
  title: 'Lobby invite',
  message: 'You were invited to Study Group',
  isRead: false,
  createdAt: minutesAgo(1),
  metadata: {},
  ...over,
});

const friendRequest = (over = {}) =>
  item({
    type: 'friend_request',
    title: 'New friend request',
    message: 'ghostuser wants to be your friend',
    metadata: { friendshipId: 'fr-1' },
    ...over,
  });

// Stateful fake backend: GET returns the current list, writes update it,
// so the store's 5-second poll never undoes a change.
async function mockApi(page, initial, { delay = 0 } = {}) {
  const items = initial.map((i) => ({ ...i }));
  const calls = [];

  await page.route(isMocked, async (route) => {
    const req = route.request();
    const { pathname } = new URL(req.url());

    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });

    if (req.method() === 'GET') {
      if (delay) await new Promise((r) => setTimeout(r, delay));
      return route.fulfill({ json: { items, total: items.length }, headers: CORS });
    }

    calls.push(`${req.method()} ${pathname}`);
    const read = pathname.match(/^\/api\/notifications\/([^/]+)\/read$/);
    if (pathname === '/api/notifications/read-all') items.forEach((i) => (i.isRead = true));
    else if (read) {
      const target = items.find((i) => i._id === read[1]);
      if (target) target.isRead = true;
    }
    return route.fulfill({ json: {}, headers: CORS });
  });

  return { calls };
}

const bell = (page) => page.getByRole('button', { name: 'Notifications', exact: true });
const panel = (page) => page.getByRole('dialog', { name: 'Notifications' });
const rows = (page) => page.locator('.notif-row');
const markAll = (page) => panel(page).getByRole('button', { name: 'Mark all read' });

async function openPanel(page) {
  await page.goto('/');
  await bell(page).click();
  await expect(panel(page)).toBeVisible();
}

test.describe('panel open and close', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, []);
  });

  test('bell toggles the panel and aria-expanded', async ({ page }) => {
    await page.goto('/');
    await expect(panel(page)).toHaveCount(0);
    await expect(bell(page)).toHaveAttribute('aria-expanded', 'false');

    await bell(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(bell(page)).toHaveAttribute('aria-expanded', 'true');

    await bell(page).click();
    await expect(panel(page)).toHaveCount(0);
  });

  test('Escape closes the panel', async ({ page }) => {
    await openPanel(page);
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
  });

  test('clicking outside closes it, clicking inside does not', async ({ page }) => {
    await openPanel(page);
    await panel(page).getByRole('heading', { name: 'Notifications' }).click();
    await expect(panel(page)).toBeVisible();

    await page.mouse.click(5, 400);
    await expect(panel(page)).toHaveCount(0);
  });
});

test.describe('list states', () => {
  test('empty list: caught-up message, no dot, Mark all read disabled', async ({ page }) => {
    await mockApi(page, []);
    await openPanel(page);

    await expect(panel(page).getByText("You're all caught up.")).toBeVisible();
    await expect(rows(page)).toHaveCount(0);
    await expect(page.locator('.notif-dot')).toHaveCount(0);
    await expect(markAll(page)).toBeDisabled();
  });

  test('shows "Loading…" while the first load is in flight', async ({ page }) => {
    await mockApi(page, [item({ title: 'Eventually here' })], { delay: 1500 });
    await openPanel(page);

    await expect(panel(page).getByText('Loading…')).toBeVisible();
    await expect(rows(page)).toHaveCount(1);
  });

  test('notifications older than a week are hidden', async ({ page }) => {
    await mockApi(page, [
      item({ title: 'Fresh one' }),
      item({ title: 'Ancient one', createdAt: minutesAgo(8 * 24 * 60) }),
    ]);
    await openPanel(page);

    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText('Fresh one');
  });
});

test.describe('with notifications', () => {
  test('each row shows title, message, type label and time', async ({ page }) => {
    await mockApi(page, [
      item({
        title: 'Lobby invite',
        message: 'You were invited to Study Group',
        sentAt: minutesAgo(5),
      }),
    ]);
    await openPanel(page);

    const row = rows(page).first();
    await expect(row).toContainText('Lobby invite');
    await expect(row).toContainText('You were invited to Study Group');
    await expect(row.locator('small')).toContainText('Lobby invite · 5m ago');
  });

  test('an unknown type falls back to the "Update" label', async ({ page }) => {
    await mockApi(page, [item({ type: 'something_new' })]);
    await openPanel(page);
    await expect(rows(page).first().locator('small')).toContainText('Update');
  });

  test('unread rows are highlighted and the bell shows a dot', async ({ page }) => {
    await mockApi(page, [
        item({ title: 'Fresh invite', isRead: false }),
        item({ title: 'Old invite', isRead: true }),
    ]);
    await page.goto('/');
    await expect(page.locator('.notif-dot')).toBeVisible();

    await bell(page).click();
    await expect(rows(page).filter({ hasText: 'Fresh invite' })).toHaveClass(/unread/);
    await expect(rows(page).filter({ hasText: 'Old invite' })).not.toHaveClass(/unread/);
    await expect(markAll(page)).toBeEnabled();
  });

  test('only read items: no dot, Mark all read disabled', async ({ page }) => {
    await mockApi(page, [item({ isRead: true })]);
    await openPanel(page);

    await expect(page.locator('.notif-dot')).toHaveCount(0);
    await expect(markAll(page)).toBeDisabled();
  });

  test('Mark all read clears the unread state', async ({ page }) => {
    const { calls } = await mockApi(page, [item(), item()]);
    await openPanel(page);
    await expect(page.locator('.notif-dot')).toBeVisible();

    await markAll(page).click();

    await expect.poll(() => calls).toContain('PUT /api/notifications/read-all');
    await expect(page.locator('.notif-dot')).toHaveCount(0);
    await expect(markAll(page)).toBeDisabled();
    await expect(page.locator('.notif-row.unread')).toHaveCount(0);
  });

  test('clicking a notification marks it read and closes the panel', async ({ page }) => {
    const n = item({ title: 'Click me' });
    const { calls } = await mockApi(page, [n]);
    await openPanel(page);

    await rows(page).first().locator('.notif-main').click();

    await expect(panel(page)).toHaveCount(0);
    await expect.poll(() => calls).toContain(`PUT /api/notifications/${n._id}/read`);

    await bell(page).click(); // reopening reloads from the (updated) fake backend
    await expect(rows(page).first()).not.toHaveClass(/unread/);
  });

  test('uses the custom avatar when the notification has one', async ({ page }) => {
    await mockApi(page, [item({ metadata: { requesterAvatar: '/uploads/ghost.png' } })]);
    await openPanel(page);

    await expect(rows(page).first().locator('img.notif-avatar')).toHaveAttribute(
      'src',
      /\/uploads\/ghost\.png$/
    );
  });
});

test.describe('friend request actions', () => {
  test('unread friend requests show Accept and Reject', async ({ page }) => {
    await mockApi(page, [friendRequest()]);
    await openPanel(page);

    await expect(page.getByRole('button', { name: 'Accept friend request' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reject friend request' })).toBeVisible();
  });

  test('no Accept/Reject on read friend requests or other types', async ({ page }) => {
    await mockApi(page, [friendRequest({ isRead: true }), item({ type: 'lobby_invite' })]);
    await openPanel(page);

    await expect(rows(page)).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Accept friend request' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reject friend request' })).toHaveCount(0);
  });

  test('Accept calls the friends API, marks it read, and keeps the panel open', async ({ page }) => {
    const n = friendRequest();
    const { calls } = await mockApi(page, [n]);
    await openPanel(page);

    await page.getByRole('button', { name: 'Accept friend request' }).click();

    await expect.poll(() => calls).toEqual(
      expect.arrayContaining(['PUT /api/friends/fr-1/accept', `PUT /api/notifications/${n._id}/read`])
    );
    await expect(panel(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept friend request' })).toHaveCount(0);
    await expect(rows(page).first()).not.toHaveClass(/unread/);
  });

  test('Reject calls the friends API and marks it read', async ({ page }) => {
    const n = friendRequest();
    const { calls } = await mockApi(page, [n]);
    await openPanel(page);

    await page.getByRole('button', { name: 'Reject friend request' }).click();

    await expect.poll(() => calls).toEqual(
      expect.arrayContaining(['DELETE /api/friends/fr-1/reject', `PUT /api/notifications/${n._id}/read`])
    );
    await expect(page.getByRole('button', { name: 'Reject friend request' })).toHaveCount(0);
  });

  test('a friend request with no friendshipId sends nothing', async ({ page }) => {
    const { calls } = await mockApi(page, [friendRequest({ metadata: {} })]);
    await openPanel(page);

    await page.getByRole('button', { name: 'Accept friend request' }).click();
    await page.waitForTimeout(500); // nothing to wait for, so give a stray request time to appear
    expect(calls).toEqual([]);
    await expect(page.getByRole('button', { name: 'Accept friend request' })).toBeVisible();
  });
});