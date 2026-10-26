import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clockMode, setClockMode, subscribeClockMode } from '#/lib/clock'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('clockMode', () => {
  it("follows the theme's day with nothing saved", () => {
    expect(clockMode()).toBe('theme')
  })

  it('reads a saved choice', () => {
    setClockMode('accurate')
    expect(clockMode()).toBe('accurate')
    expect(localStorage.getItem('clock')).toBe('accurate')
    setClockMode('theme')
    expect(clockMode()).toBe('theme')
  })

  it('treats anything unknown as the theme', () => {
    localStorage.setItem('clock', 'tomorrow')
    expect(clockMode()).toBe('theme')
  })

  it('falls back to the theme when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    expect(clockMode()).toBe('theme')
  })
})

describe('subscribeClockMode', () => {
  it('hears a change made here, until unsubscribed', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeClockMode(onChange)
    setClockMode('accurate')
    expect(onChange).toHaveBeenCalledTimes(1)
    unsubscribe()
    setClockMode('theme')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('hears a change made in another tab', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeClockMode(onChange)
    window.dispatchEvent(new StorageEvent('storage', { key: 'theme' }))
    expect(onChange).not.toHaveBeenCalled()
    window.dispatchEvent(new StorageEvent('storage', { key: 'clock' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    unsubscribe()
  })
})
