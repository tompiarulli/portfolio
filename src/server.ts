import handler, { createServerEntry } from '@tanstack/react-start/server-entry'

import { securityHeaders } from '#/lib/security-headers'

// The Worker behind the static assets. Cloudflare serves every prerendered
// page and file first, so in production this only sees URLs with no file
// behind them, and `_headers` doesn't reach its responses: it sets the
// security headers itself.
export default createServerEntry({
  async fetch(request, opts) {
    // A hashed file that isn't there (an old build's, asked for by a stale
    // page): a bare 404 that can't be cached, not the File Not Found page.
    const response = new URL(request.url).pathname.startsWith('/assets/')
      ? new Response('Not Found', {
          status: 404,
          headers: { 'cache-control': 'no-store' },
        })
      : await handler.fetch(request, opts)
    for (const [name, value] of Object.entries(securityHeaders()))
      response.headers.set(name, value)
    return response
  },
})
