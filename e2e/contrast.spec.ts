import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

import { THEMES } from '../src/lib/theme'
import { expect, test } from './fixtures'

// Colours are measured at rest: no transitions or animations.
test.use({ reducedMotion: 'reduce' })

/** Waits for every finite animation on the page to finish, so nothing is
 *  measured mid-fade. */
const settle = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  )

/** axe's colour-contrast rule (WCAG 2 AA) over `selector`. Lighthouse only
 *  sees the default theme, so this runs it in every theme. */
async function contrastViolations(page: Page, selector: string) {
  await settle(page)
  const { violations } = await new AxeBuilder({ page })
    .include(selector)
    .withRules(['color-contrast'])
    .analyze()
  return violations.flatMap((v) =>
    v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary ?? ''}`),
  )
}

/** Opens an app from the dock, or System Info from the system menu, and
 *  returns its window's selector once it's in front. */
async function open(page: Page, name: string) {
  if (name === 'System Info') {
    await page.getByRole('button', { name: 'System menu' }).click()
    await page.getByRole('menuitem', { name }).click()
  } else {
    await page
      .getByRole('navigation', { name: 'Applications' })
      .getByRole('button', { name: new RegExp(`^${name}`) })
      .click()
  }
  const window = page.getByRole('region', { name })
  await expect(window).toBeVisible()
  return `section[data-window][aria-labelledby="${await window.getAttribute('aria-labelledby')}"]`
}

for (const { id, label } of THEMES) {
  test(`${label} meets WCAG AA contrast`, async ({ page }) => {
    await page.addInitScript(
      (theme) => localStorage.setItem('theme', theme),
      id,
    )
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('html')).toHaveAttribute('data-theme', id)

    const failures: string[] = []
    // The menu bar, the dock and About, in front at load.
    failures.push(...(await contrastViolations(page, 'header')))
    failures.push(...(await contrastViolations(page, 'nav')))
    // Each window in turn, brought to the front so nothing overlaps it.
    for (const name of [
      'About',
      'Contact',
      'Work',
      'Terminal',
      'Settings',
      'System Info',
    ]) {
      const selector = await open(page, name)
      if (name === 'Terminal') {
        const input = page.getByRole('textbox', { name: 'Terminal input' })
        await input.fill('help')
        await input.press('Enter')
      }
      failures.push(...(await contrastViolations(page, selector)))
    }
    // The open system menu.
    await page.getByRole('button', { name: 'System menu' }).click()
    failures.push(...(await contrastViolations(page, '[role=menu]')))

    expect(failures).toEqual([])
  })
}

test.describe('not found', () => {
  test.use({ allowErrors: [/status of 404/] })

  for (const { id, label } of THEMES) {
    test(`${label}'s File Not Found meets WCAG AA contrast`, async ({
      page,
    }) => {
      await page.addInitScript(
        (theme) => localStorage.setItem('theme', theme),
        id,
      )
      await page.goto('/nope')
      await page.waitForLoadState('networkidle')
      const window = page.getByRole('region', { name: 'File Not Found' })
      await expect(window).toBeVisible()
      expect(
        await contrastViolations(page, 'section[data-window="notfound"]'),
      ).toEqual([])
    })
  }
})
