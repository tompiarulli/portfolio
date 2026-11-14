import { contentSecurityPolicy } from '#/lib/content-security-policy'

/** Headers for every response: written into Cloudflare's `_headers` file
 *  for the static assets (see vite.config.ts), and set by the Worker on its
 *  own responses (src/server.ts). A route's `headers()` would only reach
 *  server-rendered pages, and every page here is prerendered. */
export function securityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': contentSecurityPolicy(),
    'X-Content-Type-Options': 'nosniff',
    // For browsers that predate frame-ancestors.
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  }
}
