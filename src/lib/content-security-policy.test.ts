import { describe, expect, it } from 'vitest'

import { contentSecurityPolicy } from '#/lib/content-security-policy'

/** The policy as directive name to its list of sources. */
function parse(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy.split('; ').map((directive) => {
      const [name = '', ...sources] = directive.split(' ')
      return [name, sources]
    }),
  )
}

describe('contentSecurityPolicy', () => {
  it('only allows the site itself', () => {
    const policy = parse(contentSecurityPolicy())
    expect(policy['default-src']).toEqual(["'self'"])
    expect(policy['font-src']).toEqual(["'self'"])
    expect(policy['connect-src']).toEqual(["'self'"])
    expect(policy['img-src']).toEqual(["'self'", 'data:'])
    expect(policy['media-src']).toEqual(["'self'"])
  })

  it('cannot be framed and has no plugins', () => {
    const policy = parse(contentSecurityPolicy())
    expect(policy['frame-ancestors']).toEqual(["'none'"])
    expect(policy['object-src']).toEqual(["'none'"])
    expect(policy['base-uri']).toEqual(["'self'"])
  })

  it('allows inline scripts and styles for hydration and window styles', () => {
    const policy = parse(contentSecurityPolicy())
    expect(policy['script-src']).toEqual(["'self'", "'unsafe-inline'"])
    expect(policy['style-src']).toEqual(["'self'", "'unsafe-inline'"])
  })

  it('never repeats a directive', () => {
    const names = contentSecurityPolicy()
      .split('; ')
      .map((directive) => directive.split(' ')[0])
    expect(new Set(names).size).toBe(names.length)
  })
})
