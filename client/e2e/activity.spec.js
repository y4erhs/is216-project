import { test, expect } from '@playwright/test';
test.use({ storageState: 'e2e/.auth/user.json', actionTimeout: 10_000 });

test.describe('My Activity Page', () => {

  test.beforeEach(async ({ page }) => {

  await page.route('**/api/activities/**', async route => {

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      {
        _id: 'activity1',
        interested: true,
        note: 'Bring laptop',

        event: {
          _id: 'event1',
          title: 'Hackathon',
          venue: 'SMU',

          sessions: [
            {
              startTime: '2026-12-01T09:00:00Z',
              endTime: '2026-12-01T12:00:00Z'
            }
          ]
        },

        sessions: [
          {
            startTime: '2026-12-01T09:00:00Z',
            endTime: '2026-12-01T12:00:00Z',
            going: 'attending'
          }
        ]
      }
    ])
  })
})
   
    await page.goto('/activity-tracking')
  })

  test('displays activity tabs', async ({ page }) => {

  await expect(
    page.getByRole('button', {
      name: /ATTENDING/
    })
  ).toBeVisible()

  await expect(
    page.getByRole('button', {
      name: /INTERESTED/
    })
  ).toBeVisible()

  await expect(
    page.getByRole('button', {
      name: /ATTENDED/
    })
  ).toBeVisible()

})

  test('switches tabs', async ({ page }) => {

    await page.getByRole('button', {
        name: /INTERESTED/
    }).click()

    await expect(
      page.getByRole('button', {
        name: /INTERESTED/
        })
    ).toBeVisible()

    await page.getByRole('button', {
        name: /ATTENDED/
    }).click()

    await expect(
      page.getByRole('button', {
        name: /INTERESTED/
      })
    ).toBeVisible()

  })

  test('opens event details', async ({ page }) => {

  await page.locator('.event-card').first().click()

  await expect(
    page.getByRole('heading', {
      name: 'Hackathon'
    })
  ).toBeVisible()

  await expect(
    page.getByRole('button', {
      name: 'SAVE'
    })
  ).toBeVisible()

})

  test('closes event details', async ({ page }) => {

    await page.locator('.event-card').first().click()

    await page.locator('.card-info-wrapper .close-btn').first().click()

    await expect(
      page.locator('.card-info-wrapper').first()
    ).not.toBeVisible()

  })

  test('changing tabs closes card detail panel', async ({ page }) => {

    await page.locator('.event-card').first().click()

    await expect(
      page.locator('.card-info-wrapper').first()
    ).toBeVisible()

    await page.getByRole('button', {
        name: /INTERESTED/
    }).click()

    await expect(
      page.locator('.card-info-wrapper').first()
    ).not.toBeVisible()

  })

  test('user can save note', async ({ page }) => {

    await page.locator('.event-card').first().click()

    const noteField = page.locator('textarea').first()

    await noteField.fill('Bring charger')

    await page.getByRole('button', {
    name: 'SAVE'
    }).first().click()

  })

  test('user can toggle interested', async ({ page }) => {

    const interestedBtn = page
      .getByRole('button', {
        name: /interested/i
      })
      .first()

    await interestedBtn.click()

  })

  test('user can remove activity history', async ({ page }) => {

  const removeBtn = page.getByRole('button', {
    name: /remove/i
  })

  await expect(removeBtn).toBeVisible()

  await removeBtn.click()

})

  test('calendar button navigates correctly', async ({ page }) => {

    await page.getByRole('button', {
      name: /VIEW MY CALENDAR/i
    }).click()

    await expect(page)
      .toHaveURL(/calendar/)

  })

  test('invite friends button works', async ({ page }) => {

  await page.getByRole('button', {
    name: /INTERESTED/
  }).click()

  await expect(
    page.getByText('Invite friends!')
  ).toBeVisible()

  await page.getByText('Invite friends!').click()
})

})