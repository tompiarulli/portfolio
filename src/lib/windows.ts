/** Every window the desktop can open. Project windows carry their slug. */
export type WindowId =
  'home' | 'projects' | 'about' | 'contact' | 'settings' | `project:${string}`

const PATHS = {
  home: '/',
  projects: '/projects',
  about: '/about',
  contact: '/contact',
  settings: '/settings',
} as const

type AppId = keyof typeof PATHS

export function pathFor(id: WindowId): string {
  return id.startsWith('project:')
    ? `/projects/${encodeURIComponent(id.slice('project:'.length))}`
    : PATHS[id as AppId]
}

export function idForPath(pathname: string): WindowId | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  const slug = /^\/projects\/([^/]+)$/.exec(path)?.[1]
  if (slug) return `project:${decodeURIComponent(slug)}`
  return (Object.keys(PATHS) as AppId[]).find((k) => PATHS[k] === path) ?? null
}

/** Windows open on first paint for a URL, back to front. */
export function initialStack(pathname: string): WindowId[] {
  const id = idForPath(pathname)
  if (!id) return []
  return id.startsWith('project:') ? ['projects', id] : [id]
}
