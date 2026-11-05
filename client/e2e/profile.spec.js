import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json', actionTimeout: 10_000 });

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': '*',
};

const PROFILE = {
  _id: '6aec04c1990ae760b3610837',
  username: 'Testuser2',
  fullName: 'testuser2',
  displayName: 'Testuser2',
  major: 'Business Management (BBM)',
  year: 'Year 2',
  graduationYear: '2028',
  interests: ['wellness', 'food', 'workshops', 'talks'],
  ccas: [],
};

const ALERTS = {
  upcomingEvents: true,
  lobbyActivity: false,
  plans: true,
  remindMinutesBefore: 15,
};

// Only the calls the Profile page makes. Everything else goes through untouched.
const MOCKED = [
  /^\/api\/users\/[^/]+$/,
  /^\/api\/users\/[^/]+\/preferences$/,
  /^\/api\/users\/[^/]+\/images$/,
  /^\/api\/activities\/[^/]+$/,
  /^\/api\/friends\/[^/]+\/accepted$/,
  /^\/api\/notifications\/preferences$/,
];

// Stateful fake backend: saved alert settings stick, so reloads show them.
async function mockProfileApi(
  page,
  {
    failAlertSave = false,
    failProfileLoad = false,
    activities = [],
    friends = [],
    interests = ['wellness', 'food'],
    profile = {},
  } = {}
) {
  const me = { ...PROFILE, ...profile };
  const state = { alerts: { ...ALERTS }, alertPuts: [], alertQueries: [], profilePuts: [], imageUploads: 0 };

  await page.route(
    (url) => MOCKED.some((re) => re.test(url.pathname)),
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const method = req.method();
      const reply = (status, json) => route.fulfill({ status, json, headers: CORS });

      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });

      if (url.pathname === '/api/notifications/preferences') {
        if (method === 'GET') return reply(200, state.alerts);
        if (failAlertSave) return reply(500, { message: 'nope' });
        const body = req.postDataJSON();
        state.alertPuts.push(body);
        state.alertQueries.push(url.searchParams.get('userId'));
        Object.assign(state.alerts, body);
        return reply(200, state.alerts);
      }

      if (url.pathname.endsWith('/images')) {
        state.imageUploads++;
        return reply(200, { user: me });
      }
      if (url.pathname.endsWith('/preferences')) return reply(200, interests);
      if (url.pathname.startsWith('/api/activities/')) return reply(200, activities);
      if (url.pathname.endsWith('/accepted')) return reply(200, friends);

      // /api/users/:id
      if (method === 'GET') return failProfileLoad ? reply(500, { message: 'boom' }) : reply(200, me);
      if (method === 'PUT') {
        state.profilePuts.push(req.postDataJSON());
        return reply(200, { ...me, ...req.postDataJSON() });
      }
      return route.fallback();
    }
  );

  // Don't touch the real Google link status either
  await page.route('**/auth/google/status**', (route) =>
    route.fulfill({ json: { connected: false, googleEmail: null }, headers: CORS })
  );

  return state;
}

// Register AFTER mockProfileApi: it runs first and swallows every DELETE,
// whatever path the store uses, so the real account can never be deleted.
async function guardDeletes(page, { fail = false } = {}) {
  const deletes = [];
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const req = route.request();
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      if (req.method() !== 'DELETE') return route.fallback();

      deletes.push(`DELETE ${new URL(req.url()).pathname}`);
      return fail
        ? route.fulfill({ status: 500, json: { message: 'Server said no' }, headers: CORS })
        : route.fulfill({ json: {}, headers: CORS });
    }
  );
  return deletes;
}

// ───────── Shared helpers ─────────
const toggle = (page, name) => page.getByRole('checkbox', { name, exact: true });
// The checkbox itself is 0x0 and transparent, so click the switch around it
const clickToggle = (page, name) =>
  page.locator('.toggle-switch').filter({ has: toggle(page, name) }).click();

// Two role="status" elements exist on the page, so scope them
const alertStatus = (page) => page.locator('.settings-card').getByRole('status');
const cardStatus = (page) => page.locator('.profile-card').getByRole('status');

const logoutDialog = (page) => page.getByRole('alertdialog', { name: 'Log Out?' });
const deleteDialog = (page) => page.getByRole('alertdialog', { name: 'Delete Account?' });

// ───────── Page ─────────
test.describe('page', () => {
  test('shows the heading and both account buttons', async ({ page }) => {
    await mockProfileApi(page);
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'PROFILE & ALERTS' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'DELETE ACCOUNT', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'LOG OUT', exact: true })).toBeVisible();
  });

  test('shows an error when the profile fails to load', async ({ page }) => {
    await mockProfileApi(page, { failProfileLoad: true });
    await page.goto('/profile');

    await expect(page.getByText('Could not load your profile. Please refresh and try again.')).toBeVisible();
  });

  test('does not save anything just because the page loaded', async ({ page }) => {
    const state = await mockProfileApi(page);
    await page.goto('/profile');
    await expect(page.getByRole('checkbox', { name: 'Upcoming events', exact: true })).toBeChecked();

    await page.waitForTimeout(1500); // nothing to wait for; give a stray auto-save time to fire
    expect(state.profilePuts).toEqual([]);
  });
});

// ───────── Alert settings ─────────
test.describe('alert settings', () => {
  test('toggles reflect what the server has saved', async ({ page }) => {
    await mockProfileApi(page);
    await page.goto('/profile');

    await expect(toggle(page, 'Upcoming events')).toBeChecked();
    await expect(toggle(page, 'Lobby activity')).not.toBeChecked();
    await expect(toggle(page, 'Plans')).toBeChecked();
  });

  test('flipping a toggle saves only that setting', async ({ page }) => {
    const state = await mockProfileApi(page);
    await page.goto('/profile');
    await expect(toggle(page, 'Lobby activity')).not.toBeChecked();

    await clickToggle(page, 'Lobby activity');

    await expect(toggle(page, 'Lobby activity')).toBeChecked();
    await expect(alertStatus(page)).toHaveText('Settings saved!');
    expect(state.alertPuts).toEqual([{ lobbyActivity: true }]);
    expect(state.alertQueries[0]).toBeTruthy(); // the user id is sent along
  });

  test('turning a setting off and on again saves both changes', async ({ page }) => {
    const state = await mockProfileApi(page);
    await page.goto('/profile');

    await clickToggle(page, 'Plans');
    await expect(toggle(page, 'Plans')).not.toBeChecked();
    await clickToggle(page, 'Plans');
    await expect(toggle(page, 'Plans')).toBeChecked();

    await expect.poll(() => state.alertPuts).toEqual([{ plans: false }, { plans: true }]);
  });

  test('a failed save puts the toggle back and says so', async ({ page }) => {
    await mockProfileApi(page, { failAlertSave: true });
    await page.goto('/profile');
    await expect(toggle(page, 'Upcoming events')).toBeChecked();

    await clickToggle(page, 'Upcoming events');

    await expect(alertStatus(page)).toHaveText('Could not save setting.');
    await expect(toggle(page, 'Upcoming events')).toBeChecked(); // reverted
  });

  test('a saved setting is still there after a reload', async ({ page }) => {
    await mockProfileApi(page);
    await page.goto('/profile');
    await clickToggle(page, 'Lobby activity');
    await expect(alertStatus(page)).toHaveText('Settings saved!');

    await page.reload();
    await expect(toggle(page, 'Lobby activity')).toBeChecked();
  });
});

// ───────── Log out ─────────
test.describe('log out', () => {
  test.beforeEach(async ({ page }) => {
    await mockProfileApi(page);
    await page.goto('/profile');
    await page.getByRole('button', { name: 'LOG OUT', exact: true }).click();
    await expect(logoutDialog(page)).toBeVisible();
  });

  test('Cancel closes the dialog and stays on the page', async ({ page }) => {
    await logoutDialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(logoutDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/profile/);
  });

  test('clicking outside the dialog closes it', async ({ page }) => {
    await page.mouse.click(5, 5);
    await expect(logoutDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/profile/);
  });

  test('Yes, Log Out goes to the login page and ends the session', async ({ page }) => {
    await logoutDialog(page).getByRole('button', { name: 'Yes, Log Out' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/); // protected page sends you back
  });
});

// ───────── Delete account (every DELETE is faked) ─────────
test.describe('delete account (all DELETE calls are faked)', () => {
  test.beforeEach(async ({ page }) => {
    await mockProfileApi(page);
    await page.goto('/profile');
  });

  test('asks for confirmation and Cancel deletes nothing', async ({ page }) => {
    const deletes = await guardDeletes(page);

    await page.getByRole('button', { name: 'DELETE ACCOUNT', exact: true }).click();
    await expect(deleteDialog(page)).toBeVisible();
    await expect(deleteDialog(page)).toContainText('This action cannot be undone');

    await deleteDialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(deleteDialog(page)).toHaveCount(0);
    expect(deletes).toEqual([]);
  });

  test('Yes, Delete sends one delete request and goes to the login page', async ({ page }) => {
    const deletes = await guardDeletes(page);

    await page.getByRole('button', { name: 'DELETE ACCOUNT', exact: true }).click();
    await deleteDialog(page).getByRole('button', { name: 'Yes, Delete' }).click();

    await expect(page).toHaveURL(/\/login/);
    expect(deletes).toHaveLength(1);
    expect(deletes[0]).toMatch(/^DELETE \/api\/users\/.+/);
  });

  test('a failed delete shows an alert and keeps you on the page', async ({ page }) => {
    await guardDeletes(page, { fail: true });
    const alerts = [];
    page.on('dialog', (d) => {
      alerts.push(d.message());
      d.accept();
    });

    await page.getByRole('button', { name: 'DELETE ACCOUNT', exact: true }).click();
    await deleteDialog(page).getByRole('button', { name: 'Yes, Delete' }).click();

    await expect.poll(() => alerts.length).toBe(1);
    await expect(page).toHaveURL(/\/profile/);
    await expect(deleteDialog(page).getByRole('button', { name: 'Yes, Delete' })).toBeEnabled();
  });
});

// ───────── Profile card ─────────
const lastPut = (state) => state.profilePuts.at(-1);

// BaseInput: find a dropdown by its label, open it, pick an option
const field = (page, label) =>
  page.locator('.base-input-group').filter({
    has: page.locator('label.input-label', { hasText: new RegExp(`^${label}$`) }),
  });
async function pick(page, label, option) {
  await field(page, label).locator('.dropdown-trigger').click();
  await field(page, label).locator('.dropdown-option-item', { hasText: option }).click();
}

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

test.describe('profile card', () => {
  test('shows name, username and stats from the server', async ({ page }) => {
    await mockProfileApi(page, {
      activities: [
        { sessions: [{ going: 'attended' }] },
        { sessions: [{ going: 'going' }] },
        { sessions: [{ going: 'attended' }, { going: 'attended' }] }, // counts once
      ],
      friends: [{}, {}, {}],
    });
    await page.goto('/profile');

    await expect(page.locator('.full-name')).toHaveText('Testuser2');
    await expect(page.locator('.username')).toHaveText('@Testuser2');
    await expect(page.locator('.stat-item').filter({ hasText: 'EVENTS ATTENDED' }).locator('.stat-number')).toHaveText('2');
    await expect(page.locator('.stat-item').filter({ hasText: 'FRIENDS' }).locator('.stat-number')).toHaveText('3');
  });

  test('shows initials when there is no avatar, and the saved dropdown values', async ({ page }) => {
    await mockProfileApi(page, { profile: { displayName: 'Ada Lovelace' } });
    await page.goto('/profile');

    await expect(page.locator('.avatar p.header-style')).toHaveText('AL');
    await expect(field(page, 'Course').locator('.dropdown-trigger')).toContainText('Business Management');
    await expect(field(page, 'Year of Study').locator('.dropdown-trigger')).toHaveText('Year 2');
    await expect(field(page, 'Graduation').locator('.dropdown-trigger')).toHaveText('2028');
  });

  test('changing the year auto-saves it', async ({ page }) => {
    const state = await mockProfileApi(page);
    await page.goto('/profile');

    await pick(page, 'Year of Study', 'Year 3');

    await expect(cardStatus(page)).toHaveText('All changes saved automatically!');
    expect(lastPut(state)).toMatchObject({ year: 'Year 3', graduationYear: '2028' });
  });

  test('changing course and graduation saves both', async ({ page }) => {
    const state = await mockProfileApi(page);
    await page.goto('/profile');

    await pick(page, 'Course', 'Accountancy (BAcc)');
    await pick(page, 'Graduation', '2030');

    await expect.poll(() => lastPut(state)).toMatchObject({
      major: 'Accountancy (BAcc)',
      graduationYear: '2030',
    });
  });

  test('a failed save shows the server message', async ({ page }) => {
    await mockProfileApi(page);
    await page.route(/\/api\/users\/[^/]+$/, (route) =>
      route.request().method() === 'PUT'
        ? route.fulfill({ status: 400, json: { message: 'Bad year' }, headers: CORS })
        : route.fallback()
    );
    await page.goto('/profile');

    await pick(page, 'Year of Study', 'Year 4');
    await expect(cardStatus(page)).toHaveText('Could not save: Bad year');
  });
});

// ───────── Clubs ─────────
test.describe('clubs', () => {
  const open = (page) => page.locator('.club-dropdown-container button').first().click();
  const items = (page) => page.locator('.club-dropdown-container .dropdown-item');
  const input = (page) => page.getByLabel('Add a club');

  async function addClub(page, name) {
    await input(page).fill(name);
    await input(page).press('Enter');
  }

  test.beforeEach(async ({ page }) => {
    page.state = await mockProfileApi(page, { profile: { ccas: [] } });
    await page.goto('/profile');
    // wait for the profile to load, not for a club
    await expect(field(page, 'Course').locator('.dropdown-trigger')).toContainText('Business Management');
  });

  test('opens and closes the dropdown', async ({ page }) => {
    await open(page);
    await expect(input(page)).toBeVisible();

    await page.getByRole('heading', { name: 'PROFILE & ALERTS' }).click();
    await expect(input(page)).toHaveCount(0);
  });

  test('adding a club with Enter lists it and saves it', async ({ page }) => {
    await open(page);
    await addClub(page, 'Robotics Club');

    await expect(items(page)).toHaveCount(1);
    await expect(items(page).first()).toContainText('Robotics Club');
    await expect.poll(() => lastPut(page.state)?.ccas).toEqual(['Robotics Club']);
  });

  test('a duplicate club (any capitalisation) is ignored', async ({ page }) => {
    await open(page);
    await addClub(page, 'Chess Club');
    await expect(items(page)).toHaveCount(1);

    await addClub(page, 'chess club');
    await expect(items(page)).toHaveCount(1);
  });

  test('unticking a club removes it and saves', async ({ page }) => {
    await open(page);
    await addClub(page, 'Chess Club');
    await expect(items(page)).toHaveCount(1);

    await items(page).first().locator('input').click();
    await expect(items(page)).toHaveCount(0);
    await expect.poll(() => lastPut(page.state)?.ccas).toEqual([]);
  });
});

// ───────── Interests ─────────
test.describe('interests', () => {
  const open = (page) => page.locator('.interest-dropdown-container button').first().click();
  const items = (page) => page.locator('.interest-dropdown-container .dropdown-item');

  test('ticking an interest adds it and saves', async ({ page }) => {
    const state = await mockProfileApi(page);
    await page.goto('/profile');
    await open(page);

    await items(page).filter({ has: page.locator('input:not(:checked)') }).first().locator('input').click();
    await expect.poll(() => lastPut(state)?.interests).toHaveLength(3);
  });

  test('unticking an interest removes it and saves', async ({ page }) => {
    const state = await mockProfileApi(page);
    await page.goto('/profile');
    await open(page);

    await items(page).filter({ has: page.locator('input:checked') }).first().locator('input').click();
    await expect.poll(() => lastPut(state)?.interests).toHaveLength(1);
  });

  test('you cannot pick more than the maximum', async ({ page }) => {
    await mockProfileApi(page);
    await page.goto('/profile');
    await open(page);

    const unchecked = items(page).filter({ has: page.locator('input:not(:checked)') });
    while (await unchecked.count()) {
      const before = await unchecked.count();
      await unchecked.first().locator('input').click();
      if (await cardStatus(page).filter({ hasText: /You can pick up to \d+ interests\./ }).count()) break;
      await expect(unchecked).toHaveCount(before - 1);
    }
    await expect(cardStatus(page)).toHaveText(/You can pick up to \d+ interests\./);
  });
});

// ───────── Images ─────────
test.describe('images', () => {
  test('choosing an avatar previews it and uploads on auto-save', async ({ page }) => {
    const state = await mockProfileApi(page);
    await page.goto('/profile');

    await page.locator('.avatar-container input[type="file"]').setInputFiles({
      name: 'me.png', mimeType: 'image/png', buffer: PNG,
    });

    await expect(page.locator('.avatar img')).toHaveAttribute('src', /^blob:/);
    await expect.poll(() => state.imageUploads).toBe(1);
  });

  test('choosing a banner previews it', async ({ page }) => {
    await mockProfileApi(page);
    await page.goto('/profile');

    await page.locator('.banner-container input[type="file"]').setInputFiles({
      name: 'banner.png', mimeType: 'image/png', buffer: PNG,
    });
    await expect(page.locator('.profile-banner img')).toHaveAttribute('src', /^blob:/);
  });
});

// ───────── Reminder dropdown ─────────
test.describe('default reminder time', () => {
  const trigger = (page) => page.locator('.setting-reminder-input .dropdown-trigger');

  test('shows the saved value and saves a new one', async ({ page }) => {
    const state = await mockProfileApi(page);
    await page.goto('/profile');
    await expect(trigger(page)).toHaveText('15 minutes before');

    await trigger(page).click();
    await page.locator('.setting-reminder-input .dropdown-option-item', { hasText: '1 hour before' }).click();

    await expect(trigger(page)).toHaveText('1 hour before');
    await expect(alertStatus(page)).toHaveText('Settings saved!');
    expect(state.alertPuts).toEqual([{ remindMinutesBefore: 60 }]);
  });
});

// ───────── Google Calendar card ─────────
async function mockGoogle(page, status, { syncReply, syncFail, patchFail, deleteFail } = {}) {
  const calls = { patch: [], sync: [], deletes: 0, statusQueries: [] };

  await page.route(
    (url) => url.pathname.startsWith('/auth/google') || url.pathname === '/api/plans/sync',
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const method = req.method();
      const reply = (s, json) => route.fulfill({ status: s, json, headers: CORS });

      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });

      if (url.pathname === '/auth/google/status') {
        calls.statusQueries.push(url.searchParams.get('userId'));
        return reply(200, status);
      }
      if (url.pathname === '/auth/google/settings') {
        if (patchFail) return reply(500, {});
        calls.patch.push(req.postDataJSON());
        return reply(200, {});
      }
      if (url.pathname === '/api/plans/sync') {
        calls.sync.push(req.postDataJSON());
        return syncFail ? reply(500, { message: 'no' }) : reply(200, syncReply ?? { added: 0, updated: 0, deleted: 0 });
      }
      if (url.pathname === '/auth/google' && method === 'DELETE') {
        if (deleteFail) return reply(500, {});
        calls.deletes++;
        return reply(200, {});
      }
      if (url.pathname === '/auth/google' && method === 'GET') {
        return reply(200, { url: 'http://localhost:5173/fake-google' });
      }
      return route.fallback();
    }
  );
  return calls;
}

const LINKED = {
  connected: true,
  googleEmail: 'test.user@smu.edu.sg',
  connectedAt: '2026-11-01T00:00:00.000Z',
  includePersonal: false,
};
const card = (page) => page.locator('.calendar-card');
const personalToggle = (page) => card(page).locator('.cal-toggle-row .toggle-switch');
const personalBox = (page) => card(page).locator('.cal-toggle-row input');

test.describe('google calendar card', () => {
  test('sends the logged-in user id with the status request', async ({ page }) => {
    await mockProfileApi(page);
    const calls = await mockGoogle(page, { connected: false });
    await page.goto('/profile');
    await expect(card(page)).toBeVisible();

    await expect.poll(() => calls.statusQueries.length).toBeGreaterThan(0);
    expect(calls.statusQueries[0]).toBeTruthy();
    expect(calls.statusQueries[0]).not.toBe('undefined');
  });

  test('unlinked: shows the badge and a Link button, no sync controls', async ({ page }) => {
    await mockProfileApi(page);
    await mockGoogle(page, { connected: false });
    await page.goto('/profile');

    await expect(card(page).getByText('Unlinked')).toBeVisible();
    await expect(card(page).getByRole('button', { name: 'Link', exact: true })).toBeVisible();
    await expect(card(page).getByRole('button', { name: 'Sync now' })).toHaveCount(0);
  });

  test('linked: shows the email, connection date and controls', async ({ page }) => {
    await mockProfileApi(page);
    await mockGoogle(page, LINKED);
    await page.goto('/profile');

    await expect(card(page).locator('.cal-email')).toHaveText('test.user@smu.edu.sg');
    await expect(card(page).getByText('Linked · Preview connection')).toBeVisible();
    await expect(card(page).getByText(/Connected on .+2026\./)).toBeVisible();
    await expect(card(page).getByRole('button', { name: 'Sync now' })).toBeVisible();
    await expect(card(page).getByRole('button', { name: 'Unlink' })).toBeVisible();
  });

  test('Link starts the Google flow', async ({ page }) => {
    await mockProfileApi(page);
    await mockGoogle(page, { connected: false });
    await page.route('**/fake-google', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<html><body>google</body></html>' })
    );
    await page.goto('/profile');

    await card(page).getByRole('button', { name: 'Link', exact: true }).click();
    await expect(page).toHaveURL(/\/fake-google$/);
  });

  test('coming back from Google shows a message and cleans the address bar', async ({ page }) => {
    await mockProfileApi(page);
    await mockGoogle(page, LINKED);
    await page.goto('/profile?google=connected');

    await expect(card(page).getByText('Google Calendar connected!')).toBeVisible();
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('"denied" shows the cancelled message', async ({ page }) => {
    await mockProfileApi(page);
    await mockGoogle(page, { connected: false });
    await page.goto('/profile?google=denied');
    await expect(card(page).getByText('Connection cancelled.')).toBeVisible();
  });

  test('the personal commitments toggle saves its value', async ({ page }) => {
    await mockProfileApi(page);
    const calls = await mockGoogle(page, LINKED);
    await page.goto('/profile');

    await personalToggle(page).click();
    await expect(personalBox(page)).toBeChecked();
    expect(calls.patch).toEqual([{ includePersonal: true }]);
  });

  test('a failed toggle save puts it back and says so', async ({ page }) => {
    await mockProfileApi(page);
    await mockGoogle(page, LINKED, { patchFail: true });
    await page.goto('/profile');

    await personalToggle(page).click();
    await expect(card(page).getByText('Could not save that setting. Please try again.')).toBeVisible();
    await expect(personalBox(page)).not.toBeChecked();
  });

  test('Sync now reports what changed', async ({ page }) => {
    await mockProfileApi(page);
    const calls = await mockGoogle(page, LINKED, { syncReply: { added: 2, updated: 1, deleted: 0 } });
    await page.goto('/profile');

    await card(page).getByRole('button', { name: 'Sync now' }).click();
    await expect(card(page).getByText('Synced: 2 added, 1 updated, 0 removed.')).toBeVisible();
    expect(calls.sync[0].userId).toBeTruthy();
  });

  test('Sync now with nothing to do says everything is up to date', async ({ page }) => {
    await mockProfileApi(page);
    await mockGoogle(page, LINKED);
    await page.goto('/profile');

    await card(page).getByRole('button', { name: 'Sync now' }).click();
    await expect(card(page).getByText('Everything is up to date.')).toBeVisible();
  });

  test('a failed sync shows an error', async ({ page }) => {
    await mockProfileApi(page);
    await mockGoogle(page, LINKED, { syncFail: true });
    await page.goto('/profile');

    await card(page).getByRole('button', { name: 'Sync now' }).click();
    await expect(card(page).getByText('Sync failed. Please try again.')).toBeVisible();
    await expect(card(page).getByRole('button', { name: 'Sync now' })).toBeEnabled();
  });

  test('Unlink asks first, and cancelling does nothing', async ({ page }) => {
    await mockProfileApi(page);
    const calls = await mockGoogle(page, LINKED);
    page.once('dialog', (d) => d.dismiss());
    await page.goto('/profile');

    await card(page).getByRole('button', { name: 'Unlink' }).click();
    await expect(card(page).getByText('Linked · Preview connection')).toBeVisible();
    expect(calls.deletes).toBe(0);
  });

  test('confirming Unlink disconnects', async ({ page }) => {
    await mockProfileApi(page);
    const calls = await mockGoogle(page, LINKED);
    page.once('dialog', (d) => d.accept());
    await page.goto('/profile');

    await card(page).getByRole('button', { name: 'Unlink' }).click();
    await expect(card(page).getByText('Google Calendar disconnected.')).toBeVisible();
    await expect(card(page).getByText('Unlinked')).toBeVisible();
    expect(calls.deletes).toBe(1);
  });

  test('a failed Unlink keeps it linked and says so', async ({ page }) => {
    await mockProfileApi(page);
    await mockGoogle(page, LINKED, { deleteFail: true });
    page.once('dialog', (d) => d.accept());
    await page.goto('/profile');

    await card(page).getByRole('button', { name: 'Unlink' }).click();
    await expect(card(page).getByText('Could not disconnect. Please try again.')).toBeVisible();
    await expect(card(page).getByText('Linked · Preview connection')).toBeVisible();
  });
});