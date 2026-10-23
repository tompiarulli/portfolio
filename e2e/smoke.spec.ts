import type { Page } from '@playwright/test'

import { expect, test, windowOrder } from './fixtures'

/** Every prerendered page, with the window it opens in front. */
const PAGES = [
  { path: '/', id: 'about', title: 'About' },
  { path: '/contact', id: 'contact', title: 'Contact' },
  { path: '/terminal', id: 'terminal', title: 'Terminal' },
  { path: '/settings', id: 'settings', title: 'Settings' },
  { path: '/system', id: 'system', title: 'System Info' },
]

for (const { path, id, title } of PAGES) {
  test(`${path} loads with ${title} in front`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    expect(response?.headers()['content-security-policy']).toContain(
      "default-src 'self'",
    )
    const window = page.getByRole('region', { name: title })
    // In the prerendered HTML, before any script runs.
    expect(await response?.text()).toContain(`data-window="${id}"`)
    await expect(window).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect((await windowOrder(page))[0]).toBe(id)
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    await expect(
      page.getByRole('navigation', { name: 'Applications' }),
    ).toBeVisible()
  })
}

test.describe('not found', () => {
  // Chromium logs the page's own 404 as a failed load.
  test.use({ allowErrors: [/status of 404/] })

  test('an unknown URL gets File Not Found with a 404', async ({ page }) => {
    const response = await page.goto('/no/such/page')
    expect(response?.status()).toBe(404)
    const window = page.getByRole('region', { name: 'File Not Found' })
    await expect(window).toBeVisible()
    await expect(window).toContainText('/no/such/page')
    expect((await windowOrder(page))[0]).toBe('notfound')
    await expect(page).toHaveTitle(/^File Not Found - /)
    // Kept out of search results; Lighthouse's SEO check skips this.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    )
  })

  test('OK closes it and goes home', async ({ page }) => {
    await page.goto('/nope')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'OK' }).click()
    await expect(
      page.getByRole('region', { name: 'File Not Found' }),
    ).toHaveCount(0)
    await expect(page).toHaveURL('/')
  })

  test('a missing asset is a bare 404 that is never cached', async ({
    request,
  }) => {
    const response = await request.get('/assets/missing-0000.js')
    expect(response.status()).toBe(404)
    expect(response.headers()['cache-control']).toBe('no-store')
  })
})

test('the dock opens a window and the URL follows it', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page
    .getByRole('navigation', { name: 'Applications' })
    .getByRole('link', { name: /Terminal/ })
    .click()
  await expect(page).toHaveURL('/terminal')
  await expect(
    page.getByRole('textbox', { name: 'Terminal input' }),
  ).toBeFocused()
  expect((await windowOrder(page))[0]).toBe('terminal')
})

test.describe('themes', () => {
  // The radios are visually hidden; people click the tile around them.
  const tile = (page: Page, name: string) =>
    page.locator('label').filter({ has: page.getByRole('radio', { name }) })

  const surface = (page: Page) =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--surface')
        .trim(),
    )

  test('Settings switches theme, and it sticks', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'orbital')
    const before = await surface(page)
    await tile(page, 'White Rabbit').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'rabbit')
    expect(await surface(page)).not.toBe(before)
    // The boot script applies it before first paint on the next page.
    await page.goto('/contact')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'rabbit')
    await page.goto('/settings')
    await expect(
      page.getByRole('radio', { name: 'White Rabbit' }),
    ).toBeChecked()
  })

  test('every theme loads its backdrop without errors', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    for (const name of [
      'White Rabbit',
      'Believe',
      'Steamboat',
      'OUTATIME',
      'Outpost 31',
      'Orbital',
    ]) {
      await tile(page, name).click()
      await expect(page.getByRole('radio', { name })).toBeChecked()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'orbital')
  })

  test('the terminal switches theme', async ({ page }) => {
    await page.goto('/terminal')
    // Typing before hydration would go nowhere.
    await page.waitForLoadState('networkidle')
    const input = page.getByRole('textbox', { name: 'Terminal input' })
    await input.fill('theme  outpost   31')
    await input.press('Enter')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'outpost')
    await expect(
      page.getByRole('log', { name: 'Terminal output' }),
    ).toContainText('Outpost 31')
  })
})
