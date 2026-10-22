import { describe, expect, it } from 'vitest'

import { idForPath, initialStack, pathFor } from '#/lib/windows'
import type { WindowId } from '#/lib/windows'

const ids: WindowId[] = [
  'about',
  'contact',
  'terminal',
  'settings',
  'system',
  'notfound',
]

describe('idForPath', () => {
  it('maps every window path back to its id', () => {
    for (const id of ids) expect(idForPath(pathFor(id))).toBe(id)
  })

  it('treats the root as About', () => {
    expect(idForPath('/')).toBe('about')
    expect(idForPath('')).toBe('about')
  })

  it('ignores trailing slashes from prerendered subfolder indexes', () => {
    expect(idForPath('/contact/')).toBe('contact')
    expect(idForPath('/terminal//')).toBe('terminal')
    expect(idForPath('//')).toBe('about')
  })

  it('opens File Not Found at /404', () => {
    expect(idForPath('/404')).toBe('notfound')
  })

  it('opens File Not Found for paths with no window', () => {
    expect(idForPath('/nope')).toBe('notfound')
    expect(idForPath('/contact/extra')).toBe('notfound')
    expect(idForPath('/Contact')).toBe('notfound')
  })
})

describe('initialStack', () => {
  it('opens Contact behind About on the home page', () => {
    expect(initialStack('/')).toEqual(['contact', 'about'])
  })

  it('brings Contact to the front on its own page', () => {
    expect(initialStack('/contact')).toEqual(['about', 'contact'])
  })

  it.each(['terminal', 'settings', 'system', 'notfound'] as const)(
    'puts %s in front of About and Contact',
    (id) => {
      expect(initialStack(pathFor(id))).toEqual(['contact', 'about', id])
    },
  )

  it('puts File Not Found in front for unknown paths', () => {
    expect(initialStack('/nope')).toEqual(['contact', 'about', 'notfound'])
  })

  it('never lists a window twice', () => {
    for (const id of ids) {
      const stack = initialStack(pathFor(id))
      expect(new Set(stack).size).toBe(stack.length)
    }
  })
})
