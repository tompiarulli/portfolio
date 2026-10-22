import { contentSecurityPolicy } from '#/lib/content-security-policy'

/** Headers for every response. They go out through a Nitro `/**` route rule
 *  (see vite.config.ts), which Vercel applies to static files too; a route's
 *  `headers()` would only reach server-rendered pages, and every page here
 *  is prerendered. */
export function securityHeaders({ vercelToolbar = false } = {}): Record<
  string,
  string
> {
  return {
    'Content-Security-Policy': contentSecurityPolicy({ vercelToolbar }),
    'X-Content-Type-Options': 'nosniff',
    // For browsers that predate frame-ancestors.
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  }
}
