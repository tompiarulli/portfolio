import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_THEME,
  THEMES,
  applyTheme,
  currentTheme,
  themeBootScript,
} from '#/lib/theme'

const root = document.documentElement

/** Runs the inline script as the browser would, in a fresh page. */
const boot = () => new Function(themeBootScript)()

beforeEach(() => {
  localStorage.clear()
  delete root.dataset.theme
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('themeBootScript', () => {
  it.each(THEMES)('applies a saved $label', ({ id }) => {
    localStorage.setItem('theme', id)
    boot()
    expect(root.dataset.theme).toBe(id)
  })

  it('falls back to Orbital with nothing saved', () => {
    boot()
    expect(DEFAULT_THEME).toBe('orbital')
    expect(root.dataset.theme).toBe('orbital')
  })

  it('falls back to Orbital for a theme that no longer exists', () => {
    for (const saved of ['vaporwave', '', 'ORBITAL', ' rabbit']) {
      localStorage.setItem('theme', saved)
      boot()
      expect(root.dataset.theme).toBe('orbital')
    }
  })

  it('falls back to Orbital when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    expect(boot).not.toThrow()
    expect(root.dataset.theme).toBe('orbital')
  })

  // Rewriting the same value would still restart the backdrop.
  it('leaves data-theme alone when it already matches', () => {
    localStorage.setItem('theme', 'believe')
    root.dataset.theme = 'believe'
    const observer = new MutationObserver(() => {})
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    boot()
    const writes = observer.takeRecords()
    observer.disconnect()
    expect(writes).toEqual([])
    expect(root.dataset.theme).toBe('believe')
  })

  it('does write when the value differs', () => {
    localStorage.setItem('theme', 'believe')
    const observer = new MutationObserver(() => {})
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    boot()
    expect(observer.takeRecords()).toHaveLength(1)
    observer.disconnect()
  })

  it('replaces a stale data-theme', () => {
    localStorage.setItem('theme', 'outpost')
    root.dataset.theme = 'rabbit'
    boot()
    expect(root.dataset.theme).toBe('outpost')
  })
})

describe('applyTheme', () => {
  it('saves the theme and sets it on <html>', () => {
    applyTheme('steamboat')
    expect(localStorage.getItem('theme')).toBe('steamboat')
    expect(root.dataset.theme).toBe('steamboat')
  })

  it('still sets the theme when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    applyTheme('traveler')
    expect(root.dataset.theme).toBe('traveler')
  })

  it('is what the boot script picks up on the next page', () => {
    applyTheme('rabbit')
    delete root.dataset.theme
    boot()
    expect(root.dataset.theme).toBe('rabbit')
  })
})

describe('currentTheme', () => {
  it('reads the theme from <html>', () => {
    root.dataset.theme = 'believe'
    expect(currentTheme()).toBe('believe')
  })

  it('is Orbital when <html> has no known theme', () => {
    expect(currentTheme()).toBe('orbital')
    root.dataset.theme = 'vaporwave'
    expect(currentTheme()).toBe('orbital')
  })
})
