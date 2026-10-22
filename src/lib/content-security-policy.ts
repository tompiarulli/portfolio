// Everything the site loads comes from its own origin, so the policy is
// 'self' throughout. Scripts and styles also need 'unsafe-inline':
// - TanStack's hydration script is inline and carries a timestamp, so its
//   hash changes with every build and every page, and the headers are fixed
//   before the prerender writes the pages. The theme boot scripts in
//   __root.tsx are stable and could be hashed, but CSP ignores
//   'unsafe-inline' as soon as a hash is listed, which would block the
//   hydration script.
// - Windows, dock icons and backdrops position and paint themselves with
//   inline style attributes.
// The site renders no user content, so inline scripts can only be its own.
const DIRECTIVES: Record<string, string> = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline'",
  'style-src': "'self' 'unsafe-inline'",
  // data: for the menu marks, which are inline SVGs in styles.css.
  'img-src': "'self' data:",
  'font-src': "'self'",
  'connect-src': "'self'",
  'manifest-src': "'self'",
  'frame-ancestors': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'object-src': "'none'",
}

// Vercel injects its toolbar (comments, accessibility audit, layout tools)
// into preview deployments only. These are the extra sources it needs:
// https://vercel.com/docs/vercel-toolbar/managing-toolbar#using-a-content-security-policy
const VERCEL_TOOLBAR_SOURCES: Record<string, string> = {
  'script-src': 'https://vercel.live',
  'style-src': 'https://vercel.live',
  'img-src': 'https://vercel.live https://vercel.com blob:',
  'font-src': 'https://vercel.live https://assets.vercel.com',
  'connect-src': 'https://vercel.live wss://ws-us3.pusher.com',
  'frame-src': 'https://vercel.live',
}

/** The Content-Security-Policy header value, with the Vercel Toolbar's
 *  sources added on preview deployments. */
export function contentSecurityPolicy({ vercelToolbar = false } = {}): string {
  const directives = { ...DIRECTIVES }
  if (vercelToolbar) {
    for (const [name, sources] of Object.entries(VERCEL_TOOLBAR_SOURCES)) {
      directives[name] = `${directives[name] ?? "'self'"} ${sources}`
    }
  }
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources}`)
    .join('; ')
}
