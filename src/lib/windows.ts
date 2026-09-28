/** Every window the desktop can open. Project windows carry their slug. */
export type WindowId =
  | 'about'
  | 'work'
  | 'player'
  | 'blog'
  | 'contact'
  | 'settings'
  | 'system'
  | `project:${string}`

const PATHS = {
  about: '/',
  work: '/work',
  player: '/player',
  blog: '/blog',
  contact: '/contact',
  settings: '/settings',
  system: '/system',
} as const

type AppId = keyof typeof PATHS

export function pathFor(id: WindowId): string {
  return id.startsWith('project:')
    ? `/work/${encodeURIComponent(id.slice('project:'.length))}`
    : PATHS[id as AppId]
}

export function idForPath(pathname: string): WindowId | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  const slug = /^\/work\/([^/]+)$/.exec(path)?.[1]
  if (slug) return `project:${decodeURIComponent(slug)}`
  return (Object.keys(PATHS) as AppId[]).find((k) => PATHS[k] === path) ?? null
}

/** Windows open on first paint for a URL, back to front. About and Player are
 *  always open. */
export function initialStack(pathname: string): WindowId[] {
  const id = idForPath(pathname)
  const base: WindowId[] = ['player', 'about']
  if (!id || id === 'about') return base
  if (id === 'player') return ['about', 'player']
  return id.startsWith('project:') ? [...base, 'work', id] : [...base, id]
}
