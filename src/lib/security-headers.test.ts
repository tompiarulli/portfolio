import { describe, expect, it } from 'vitest'

import { contentSecurityPolicy } from '#/lib/content-security-policy'
import { securityHeaders } from '#/lib/security-headers'

describe('securityHeaders', () => {
  it('sends the hardening headers', () => {
    expect(securityHeaders()).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
  })

  it('turns off the browser features the site never uses', () => {
    const policy = securityHeaders()['Permissions-Policy']
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) {
      expect(policy).toContain(`${feature}=()`)
    }
  })

  it('passes the toolbar flag through to the CSP', () => {
    expect(securityHeaders()['Content-Security-Policy']).toBe(
      contentSecurityPolicy(),
    )
    expect(
      securityHeaders({ vercelToolbar: true })['Content-Security-Policy'],
    ).toBe(contentSecurityPolicy({ vercelToolbar: true }))
  })

  it('sets no cache-control, so the cache route rules still apply', () => {
    const names = Object.keys(securityHeaders()).map((n) => n.toLowerCase())
    expect(names).not.toContain('cache-control')
  })
})
