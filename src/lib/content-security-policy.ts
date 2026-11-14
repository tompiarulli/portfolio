// Everything the site loads comes from its own origin, so the policy is
// 'self' throughout. Scripts and styles also need 'unsafe-inline':
// - TanStack's hydration script is inline and carries a timestamp, so its
//   hash changes with every build and every page, and the headers are fixed
//   before the prerender writes the pages. The theme boot scripts in
//   __root.tsx are stable and could be hashed, but CSP ignores
//   'unsafe-inline' as soon as a hash is listed, which would block the
//   hydration script.
// - Windows and backdrops position and paint themselves with
//   inline style attributes.
// The site renders no user content, so inline scripts can only be its own.
const DIRECTIVES: Record<string, string> = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline'",
  'style-src': "'self' 'unsafe-inline'",
  // data: for the menu marks, which are inline SVGs in styles.css.
  'img-src': "'self' data:",
  'media-src': "'self'",
  'font-src': "'self'",
  'connect-src': "'self'",
  'manifest-src': "'self'",
  'frame-ancestors': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'object-src': "'none'",
}

/** The Content-Security-Policy header value. */
export function contentSecurityPolicy(): string {
  return Object.entries(DIRECTIVES)
    .map(([name, sources]) => `${name} ${sources}`)
    .join('; ')
}
