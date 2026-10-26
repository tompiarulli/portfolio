import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { dockLink, renderDesktop } from '#/test/desktop'

vi.mock('#/components/Backdrop', () => ({ Backdrop: () => null, ORBITS: {} }))

const root = document.documentElement
const thisYear = String(new Date().getFullYear())

beforeEach(() => {
  localStorage.clear()
  root.dataset.theme = 'steamboat'
})

afterEach(() => {
  delete root.dataset.theme
})

/** The clock's date, once its flip has settled on `year`. */
const showsYear = (year: string) =>
  waitFor(() => expect(screen.getByText(new RegExp(`\\b${year}$`))), {
    timeout: 2000,
  })

describe('Date & Time', () => {
  it("shows the theme's day until Current is picked, and remembers it", async () => {
    const { user } = await renderDesktop('/')
    await showsYear('1908')

    await user.click(dockLink('settings'))
    const accurate = await screen.findByRole('radio', { name: 'Current' })
    expect(screen.getByRole('radio', { name: 'Themed' })).toHaveProperty(
      'checked',
      true,
    )

    await user.click(accurate)
    expect(accurate).toHaveProperty('checked', true)
    expect(localStorage.getItem('clock')).toBe('accurate')
    await showsYear(thisYear)

    await user.click(screen.getByRole('radio', { name: 'Themed' }))
    expect(localStorage.getItem('clock')).toBe('theme')
    await showsYear('1908')
  })

  it('opens on a saved choice of Current', async () => {
    localStorage.setItem('clock', 'accurate')
    await renderDesktop('/')
    await showsYear(thisYear)
  })
})
