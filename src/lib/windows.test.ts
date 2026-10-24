import { describe, expect, it } from 'vitest'

import { NOT_FOUND_PATH, initialStack, isHome } from '#/lib/windows'

describe('isHome', () => {
  it('is true for the root, with or without trailing slashes', () => {
    expect(isHome('/')).toBe(true)
    expect(isHome('')).toBe(true)
    expect(isHome('//')).toBe(true)
  })

  it('is false for any other path, including the old window paths', () => {
    for (const path of [
      '/contact',
      '/terminal/',
      '/settings',
      '/system',
      NOT_FOUND_PATH,
      '/nope',
    ])
      expect(isHome(path)).toBe(false)
  })
})

describe('initialStack', () => {
  it('opens Contact in front of About on the home page', () => {
    expect(initialStack('/')).toEqual(['about', 'contact'])
  })

  it('puts File Not Found in front for any other URL', () => {
    expect(initialStack('/nope')).toEqual(['about', 'contact', 'notfound'])
    expect(initialStack(NOT_FOUND_PATH)).toEqual([
      'about',
      'contact',
      'notfound',
    ])
  })
})
