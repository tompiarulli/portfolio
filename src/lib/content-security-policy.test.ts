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
  it('otherwise only allows the site itself', () => {
    const policy = parse(contentSecurityPolicy())
    expect(policy['default-src']).toEqual(["'self'"])
    expect(policy['font-src']).toEqual(["'self'"])
    expect(policy['connect-src']).toEqual(["'self'"])
    expect(policy['img-src']).toEqual([
      "'self'",
      'data:',
      'https://*.public.blob.vercel-storage.com',
    ])
  })

  it("allows the Player's videos from Vercel Blob", () => {
    const policy = parse(contentSecurityPolicy())
    expect(policy['media-src']).toEqual([
      "'self'",
      'https://*.public.blob.vercel-storage.com',
    ])
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

  it('lists no Vercel sources by default', () => {
    expect(contentSecurityPolicy()).not.toContain('vercel.live')
    expect(parse(contentSecurityPolicy())).not.toHaveProperty('frame-src')
  })

  it('adds the Vercel Toolbar sources on top of the defaults', () => {
    const policy = parse(contentSecurityPolicy({ vercelToolbar: true }))
    expect(policy['script-src']).toEqual([
      "'self'",
      "'unsafe-inline'",
      'https://vercel.live',
    ])
    expect(policy['connect-src']).toContain('wss://ws-us3.pusher.com')
    expect(policy['frame-ancestors']).toEqual(["'none'"])
  })

  it('starts a directive the defaults lack from self', () => {
    const policy = parse(contentSecurityPolicy({ vercelToolbar: true }))
    expect(policy['frame-src']).toEqual(["'self'", 'https://vercel.live'])
  })

  it('never repeats a directive', () => {
    for (const vercelToolbar of [false, true]) {
      const names = contentSecurityPolicy({ vercelToolbar })
        .split('; ')
        .map((directive) => directive.split(' ')[0])
      expect(new Set(names).size).toBe(names.length)
    }
  })
})
