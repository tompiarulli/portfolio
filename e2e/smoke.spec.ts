import type { Page } from '@playwright/test'

import { expect, test, windowOrder } from './fixtures'

/** Opens an app from the dock. Waits for hydration first: before it, the
 *  dock's buttons do nothing. */
async function openApp(page: Page, name: string) {
  await page.waitForLoadState('networkidle')
  await page
    .getByRole('navigation', { name: 'Applications' })
    .getByRole('button', { name: new RegExp(`^${name}`) })
    .click()
}

test('/ loads with About in front of Contact', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  expect(response?.headers()['content-security-policy']).toContain(
    "default-src 'self'",
  )
  // In the prerendered HTML, before any script runs.
  const html = await response?.text()
  expect(html).toContain('data-window="about"')
  expect(html).toContain('data-window="contact"')
  await expect(page.getByRole('region', { name: 'About' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(await windowOrder(page)).toEqual(['about', 'contact'])
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
  await expect(
    page.getByRole('navigation', { name: 'Applications' }),
  ).toBeVisible()
})

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

  // The desktop has one URL; windows used to have their own.
  for (const path of ['/contact', '/terminal', '/settings', '/system'])
    test(`${path} is a 404 now`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
      await expect(
        page.getByRole('region', { name: 'File Not Found' }),
      ).toBeVisible()
    })

  test('a missing asset is a bare 404 that is never cached', async ({
    request,
  }) => {
    const response = await request.get('/assets/missing-0000.js')
    expect(response.status()).toBe(404)
    expect(response.headers()['cache-control']).toBe('no-store')
  })
})

test('the dock opens a window without changing the URL', async ({ page }) => {
  await page.goto('/')
  await openApp(page, 'Terminal')
  await expect(
    page.getByRole('textbox', { name: 'Terminal input' }),
  ).toBeFocused()
  expect((await windowOrder(page))[0]).toBe('terminal')
  await expect(page).toHaveURL('/')
})

test('the system menu opens System Info', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'System menu' }).click()
  await page.getByRole('menuitem', { name: 'System Info' }).click()
  await expect(page.getByRole('region', { name: 'System Info' })).toBeVisible()
  expect((await windowOrder(page))[0]).toBe('system')
  await expect(page).toHaveURL('/')
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
    await page.goto('/')
    await openApp(page, 'Settings')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'orbital')
    const before = await surface(page)
    await tile(page, 'White Rabbit').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'rabbit')
    expect(await surface(page)).not.toBe(before)
    // The boot script applies it before first paint on the next load.
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'rabbit')
    await openApp(page, 'Settings')
    await expect(
      page.getByRole('radio', { name: 'White Rabbit' }),
    ).toBeChecked()
  })

  test('every theme loads its backdrop without errors', async ({ page }) => {
    await page.goto('/')
    await openApp(page, 'Settings')
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
    await page.goto('/')
    await openApp(page, 'Terminal')
    const input = page.getByRole('textbox', { name: 'Terminal input' })
    await input.fill('theme  outpost   31')
    await input.press('Enter')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'outpost')
    await expect(
      page.getByRole('log', { name: 'Terminal output' }),
    ).toContainText('Outpost 31')
  })
})

test('the dock minimizes the front window and brings it back', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const about = page.getByRole('region', { name: 'About' })
  const icon = page
    .getByRole('navigation', { name: 'Applications' })
    .getByRole('button', { name: /^About/ })
  await icon.click()
  // It flies into the dock, then hides; Contact comes to the front.
  await expect(about).toBeHidden()
  await expect(icon).toContainText('minimized')
  expect((await windowOrder(page))[0]).toBe('contact')
  await icon.click()
  await expect(about).toBeVisible()
  expect((await windowOrder(page))[0]).toBe('about')
})
