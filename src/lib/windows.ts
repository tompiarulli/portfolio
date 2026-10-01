/** Every window the desktop can open. */
export type WindowId = 'about' | 'socials' | 'settings' | 'system'

/** Windows with a taskbar button even when closed, so they can always be
 *  reopened, and a tab in the phone menu. */
export const PINNED: { id: WindowId; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'socials', label: 'Socials' },
  { id: 'settings', label: 'Settings' },
]

const PATHS = {
  about: '/',
  socials: '/socials',
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

/** Windows open on first paint for a URL, back to front. About and Socials
 *  are always open. */
export function initialStack(pathname: string): WindowId[] {
  const id = idForPath(pathname)
  const base: WindowId[] = ['socials', 'about']
  if (!id || id === 'about') return base
  if (id === 'socials') return ['about', 'socials']
  return [...base, id]
}
