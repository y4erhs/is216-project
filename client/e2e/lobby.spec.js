import { test, expect } from '@playwright/test';

const cards = (page) => page.locator('.grid li');
const chip = (page, label) =>
  page.getByRole('group', { name: 'Filter lobbies' }).getByRole('button', { name: new RegExp(`^${label}`) });
const chipCount = async (page, label) => Number(await chip(page, label).locator('b').innerText());
const searchBox = (page) => page.getByPlaceholder('Search by name, event, or friend');

// Wait until the lobby list has loaded: either cards or an empty state is showing
async function openLobbies(page) {
  await page.goto('/lobby');
  await expect(page.locator('.grid li, .empty-lobby').first()).toBeVisible();
}

test.describe('empty account', () => {
  test.use({ storageState: 'e2e/.auth/empty.json' });

  test.beforeEach(async ({ page }) => {
    await openLobbies(page);
  });

  test('shows the empty state and zero counts', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My lobbies' })).toBeVisible();
    await expect(page.getByRole('heading', { name: "You're not in any lobbies yet" })).toBeVisible();
    await expect(cards(page)).toHaveCount(0);

    for (const label of ['All', 'Hosting', 'Joined', 'Needs Reply']) {
      await expect(chip(page, label).locator('b')).toHaveText('0');
    }
  });

  test('has a Create lobby button in the header and in the empty state', async ({ page }) => {
    await expect(page.getByRole('button', { name: '+ Create lobby' })).toHaveCount(2);
  });
});

test.describe('account with lobbies', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await openLobbies(page);
    test.skip((await cards(page).count()) === 0, 'The main test account has no lobbies; add one or change TEST_USER');
  });

  test('"All" chip count matches the number of cards', async ({ page }) => {
    const all = await chipCount(page, 'All');
    await expect(cards(page)).toHaveCount(all);
    await expect(page.locator('p.sr')).toHaveText(`${all} lobbies shown`);
  });

  test('Hosting + Joined add up to All', async ({ page }) => {
    const [all, hosting, joined] = await Promise.all([
      chipCount(page, 'All'),
      chipCount(page, 'Hosting'),
      chipCount(page, 'Joined'),
    ]);
    expect(hosting + joined).toBe(all);
  });

  test('each filter chip shows only matching cards', async ({ page }) => {
    for (const label of ['Hosting', 'Joined', 'Needs Reply']) {
      const expected = await chipCount(page, label);
      await chip(page, label).click();
      await expect(chip(page, label)).toHaveAttribute('aria-pressed', 'true');
      await expect(chip(page, 'All')).toHaveAttribute('aria-pressed', 'false');
      await expect(cards(page)).toHaveCount(expected);
    }

    await chip(page, 'Hosting').click();
    for (const pill of await cards(page).locator('.badge-pill:first-of-type').allInnerTexts()) {
      expect(pill).toBe('Host');
    }

    await chip(page, 'All').click();
    await expect(chip(page, 'All')).toHaveAttribute('aria-pressed', 'true');
  });

  test('search finds a lobby by its name', async ({ page }) => {
    const name = (await cards(page).first().locator('.name').innerText()).trim();
    await searchBox(page).fill(name);
    await expect(cards(page).filter({ has: page.locator('.name', { hasText: name }) }).first()).toBeVisible();
  });

  test('search is case-insensitive', async ({ page }) => {
    const name = (await cards(page).first().locator('.name').innerText()).trim();
    await searchBox(page).fill(name.toUpperCase());
    await expect(cards(page).filter({ has: page.locator('.name', { hasText: name }) }).first()).toBeVisible();
  });

  test('a search with no matches shows "No lobbies match" and Clear filters restores the list', async ({ page }) => {
    const total = await cards(page).count();

    await searchBox(page).fill('zzqxjv-no-such-lobby');
    await expect(page.getByRole('heading', { name: 'No lobbies match' })).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    // chip counts ignore the search, so they should not change
    expect(await chipCount(page, 'All')).toBe(total);

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(searchBox(page)).toHaveValue('');
    await expect(chip(page, 'All')).toHaveAttribute('aria-pressed', 'true');
    await expect(cards(page)).toHaveCount(total);
  });

  test('each card shows a role badge, an event line and a member count', async ({ page }) => {
    const first = cards(page).first();
    await expect(first.locator('.badge-pill').first()).toHaveText(/^(Host|Member|Needs Reply)$/);
    await expect(first.locator('.event-line').first()).toContainText(/^(Pitched|Event|Events|No event yet)/);
    await expect(first.locator('.meta')).toContainText(/\d+ members?/);
  });
});