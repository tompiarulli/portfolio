/** Every window the desktop can open. */
export type WindowId = 'about' | 'contact' | 'settings'

/** Every window in taskbar order. Each keeps its taskbar button (or phone
 *  tab) when closed, so it can always be reopened. */
export const WINDOWS: { id: WindowId; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  { id: 'settings', label: 'Settings' },
]

const PATHS = {
  about: '/',
  contact: '/contact',
  settings: '/settings',
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
 *  are always open. */
export function initialStack(pathname: string): WindowId[] {
  const id = idForPath(pathname)
  const base: WindowId[] = ['contact', 'about']
  if (!id || id === 'about') return base
  if (id === 'contact') return ['about', 'contact']
  return [...base, id]
}
