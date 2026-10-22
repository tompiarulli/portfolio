/** Every window the desktop can open. */
export type WindowId =
  'about' | 'contact' | 'terminal' | 'settings' | 'system' | 'notfound'

const PATHS = {
  about: '/',
  contact: '/contact',
  terminal: '/terminal',
  settings: '/settings',
  system: '/system',
  // Any URL without a window of its own opens this one; /404 is where it
  // prerenders, as 404.html.
  notfound: '/404',
} as const satisfies Record<WindowId, string>

export function pathFor(id: WindowId): string {
  return PATHS[id]
}

/** The window a URL opens. Unknown URLs open File Not Found. */
export function idForPath(pathname: string): WindowId {
  const path = pathname.replace(/\/+$/, '') || '/'
  return (
    (Object.keys(PATHS) as WindowId[]).find((k) => PATHS[k] === path) ??
    'notfound'
  )
}

/** Windows open on first paint for a URL, back to front. About and Contact
 *  are always open; the URL's window comes to the front. */
export function initialStack(pathname: string): WindowId[] {
  const id = idForPath(pathname)
  const base: WindowId[] = ['contact', 'about']
  return [...base.filter((w) => w !== id), id]
}
