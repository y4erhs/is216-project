import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

const EMAIL = 'testuser@smu.edu.sg';

// Fake the backend's reply to the Google status check
async function mockStatus(page, body, { delay = 0 } = {}) {
  await page.route('**/auth/google/status**', async (route) => {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({
      json: body,
      headers: { 'access-control-allow-origin': '*' },
    });
  });
}

test.beforeEach(async ({ page }) => {
  // Never hit the real Google Calendar embed; an empty page is enough for the iframe to load
  await page.route('https://calendar.google.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body>calendar</body></html>' })
  );
});

test.describe('calendar status', () => {
  test('shows "Loading calendar..." while the status check is in flight', async ({ page }) => {
    await mockStatus(page, { connected: true, googleEmail: EMAIL }, { delay: 1000 });
    await page.goto('/calendar');

    await expect(page.getByText('Loading calendar...')).toBeVisible();
    await expect(page.getByText('Loading calendar...')).toHaveCount(0);
    await expect(page.locator('iframe')).toBeVisible();
  });

  test('sends the logged-in user id with the status request', async ({ page }) => {
    await mockStatus(page, { connected: false, googleEmail: null });

    const requestPromise = page.waitForRequest('**/auth/google/status**');
    await page.goto('/calendar');
    const url = new URL((await requestPromise).url());

    expect(url.searchParams.get('userId')).toBeTruthy();
  });

  test('a linked calendar is embedded with the right address', async ({ page }) => {
    await mockStatus(page, { connected: true, googleEmail: EMAIL });
    await page.goto('/calendar');

    await expect(page.locator('iframe')).toHaveAttribute(
      'src',
      `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(EMAIL)}&ctz=Asia%2FSingapore&mode=WEEK`
    );
    await expect(page.getByText("Google Calendar isn't linked yet.")).toHaveCount(0);
  });

  test('an unlinked calendar shows the prompt and the link goes to Profile', async ({ page }) => {
    await mockStatus(page, { connected: false, googleEmail: null });
    await page.goto('/calendar');

    await expect(page.getByText("Google Calendar isn't linked yet.")).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);

    await page.getByRole('link', { name: 'Link it in Profile & Settings' }).click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('connected but with no email falls back to the unlinked prompt', async ({ page }) => {
    await mockStatus(page, { connected: true, googleEmail: null });
    await page.goto('/calendar');

    await expect(page.getByText("Google Calendar isn't linked yet.")).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('shows an error message when the status check fails', async ({ page }) => {
    await page.route('**/auth/google/status**', (route) => route.abort());
    await page.goto('/calendar');

    await expect(page.getByText('Could not check Google Calendar status.')).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
  });
});

test.describe('side panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockStatus(page, { connected: true, googleEmail: EMAIL });
    await page.goto('/calendar');
    await expect(page.locator('iframe')).toBeVisible();
  });

  test('shows the two action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Make your own plan!' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Link Calendar' })).toHaveAttribute('href', '/profile');
  });

  test('"Make your own plan!" swaps the side panel for the plan form', async ({ page }) => {
    await page.getByRole('button', { name: 'Make your own plan!' }).click();

    await expect(page.getByRole('button', { name: 'Make your own plan!' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Link Calendar' })).toHaveCount(0);
    // the calendar itself stays on screen
    await expect(page.locator('iframe')).toBeVisible();
  });

  test('"Link Calendar" goes to Profile', async ({ page }) => {
    await page.getByRole('link', { name: 'Link Calendar' }).click();
    await expect(page).toHaveURL(/\/profile/);
  });
});