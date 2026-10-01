/** Every window the desktop can open. */
export type WindowId = 'about' | 'contact' | 'terminal' | 'settings' | 'system'

const PATHS = {
  about: '/',
  contact: '/contact',
  terminal: '/terminal',
  settings: '/settings',
  system: '/system',
} as const satisfies Record<WindowId, string>

export function pathFor(id: WindowId): string {
  return PATHS[id]
}

export function idForPath(pathname: string): WindowId | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  return (
    (Object.keys(PATHS) as WindowId[]).find((k) => PATHS[k] === path) ?? null
  )
}

/** Windows open on first paint for a URL, back to front. About and Contact
 *  are always open; the URL's window comes to the front. */
export function initialStack(pathname: string): WindowId[] {
  const id = idForPath(pathname) ?? 'about'
  const base: WindowId[] = ['contact', 'about']
  return [...base.filter((w) => w !== id), id]
}
