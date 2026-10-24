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

const dockIcon = (page: Page, name: string) =>
  page
    .getByRole('navigation', { name: 'Applications' })
    .getByRole('button', { name: new RegExp(`^${name}`) })

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
  // Windows open stepped down a title bar each on a phone, so opening
  // Terminal leaves the close boxes behind it clear.
  await dockIcon(page, 'Terminal').tap()
  await expect(page.getByRole('region', { name: 'Terminal' })).toBeVisible()
  expect(await check()).toEqual([])
})

test('windows opened in any order keep the close boxes behind them clear', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // Settings, then Terminal: the reverse of the usual order.
  for (const name of ['Settings', 'Terminal']) {
    await dockIcon(page, name).tap()
    await expect(page.getByRole('region', { name })).toBeVisible()
  }
  const { violations } = await new AxeBuilder({ page })
    .withRules(['target-size'])
    .analyze()
  expect(
    violations.flatMap((v) => v.nodes.map((n) => n.target.join(' '))),
  ).toEqual([])
})
