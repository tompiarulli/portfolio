import AxeBuilder from '@axe-core/playwright'
import { devices } from '@playwright/test'
import type { Page } from '@playwright/test'

import { expect, test, windowOrder } from './fixtures'

// A small phone: 375px wide, touch, mobile user agent.
test.use({ ...devices['Pixel 5'], viewport: { width: 375, height: 667 } })

test('the desktop fits a 375px phone', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const about = page.getByRole('region', { name: 'About' })
  await expect(about).toBeVisible()

  // Nothing scrolls sideways.
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(375)

  // Every open window sits inside the screen.
  for (const id of await windowOrder(page)) {
    const box = await page.locator(`[data-window="${id}"]`).boundingBox()
    expect(box, id).not.toBeNull()
    expect(box?.x, id).toBeGreaterThanOrEqual(0)
    expect((box?.x ?? 0) + (box?.width ?? 0), id).toBeLessThanOrEqual(375)
  }

  // The dock fits too, and every icon can be tapped.
  const dock = page.getByRole('navigation', { name: 'Applications' })
  const dockBox = await dock.boundingBox()
  expect((dockBox?.x ?? -1) >= 0).toBe(true)
  expect((dockBox?.x ?? 0) + (dockBox?.width ?? 0)).toBeLessThanOrEqual(375)
})

test('tapping the dock opens a window', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page
    .getByRole('navigation', { name: 'Applications' })
    .getByRole('button', { name: /^Terminal/ })
    .tap()
  const terminal = page.getByRole('region', { name: 'Terminal' })
  await expect(terminal).toBeVisible()
  expect((await windowOrder(page))[0]).toBe('terminal')
  await terminal.getByRole('button', { name: 'Close Terminal' }).tap()
  await expect(terminal).toHaveCount(0)
  await expect(page).toHaveURL('/')
})

/** Windows showing on screen, front to back. */
const visibleWindows = (page: Page) =>
  page
    .locator('section[data-window]')
    .evaluateAll((els) =>
      els
        .filter((el) => getComputedStyle(el).visibility === 'visible')
        .map((el) => (el as HTMLElement).dataset.window),
    )

const dockIcon = (page: Page, name: string) =>
  page
    .getByRole('navigation', { name: 'Applications' })
    .getByRole('button', { name: new RegExp(`^${name}`) })

test('a phone shows one window at a time, filling the screen', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // Contact is open too, waiting behind About.
  expect(await visibleWindows(page)).toEqual(['about'])
  const about = await page.locator('[data-window="about"]').boundingBox()
  const dock = await page
    .getByRole('navigation', { name: 'Applications' })
    .boundingBox()
  // Between the menu bar and the dock, edge to edge but for the margins.
  expect(about?.y).toBeGreaterThanOrEqual(32)
  expect((about?.y ?? 0) + (about?.height ?? 0)).toBeLessThanOrEqual(
    dock?.y ?? 0,
  )
  expect(about?.width).toBeGreaterThan(375 - 24)
})

test('the dock switches windows, and minimizing or closing shows the next', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await dockIcon(page, 'Terminal').tap()
  await expect(page.getByRole('region', { name: 'Terminal' })).toBeVisible()
  expect(await visibleWindows(page)).toEqual(['terminal'])
  // Tapping the front window's icon minimizes it.
  await dockIcon(page, 'Terminal').tap()
  await expect(page.getByRole('region', { name: 'About' })).toBeVisible()
  expect(await visibleWindows(page)).toEqual(['about'])
  await page.getByRole('button', { name: 'Close About' }).tap()
  expect(await visibleWindows(page)).toEqual(['contact'])
  // With the last one closed, only the desktop is left.
  await page.getByRole('button', { name: 'Close Contact' }).tap()
  expect(await visibleWindows(page)).toEqual([])
})

test('every tap target meets WCAG 2.2 target size', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const check = async () => {
    const { violations } = await new AxeBuilder({ page })
      .withRules(['target-size'])
      .analyze()
    return violations.flatMap((v) => v.nodes.map((n) => n.target.join(' ')))
  }
  expect(await check()).toEqual([])
  // Terminal used to open over About and Contact and crowd their close
  // boxes; on a phone it now replaces them.
  await dockIcon(page, 'Terminal').tap()
  await expect(page.getByRole('region', { name: 'Terminal' })).toBeVisible()
  expect(await check()).toEqual([])
})
