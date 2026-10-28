import { Suspense, lazy } from 'react'
import type { ComponentType } from 'react'

import { About } from '#/components/apps/About'
import { Contact } from '#/components/apps/Contact'
// Stays in the shell: it is tiny, and loading it lazily splits the router
// off into a chunk of its own, which costs more than it saves.
import { NotFound } from '#/components/apps/NotFound'
import { WindowIdContext, useWindows } from '#/components/WindowManager'
import type { WindowId } from '#/lib/windows'

// Every page opens with About and Contact, so they ship in the shell; the
// rest are chunks of their own. A page that prerenders one of them open
// keeps the server's HTML on screen until its chunk arrives and hydrates
// it, so nothing flashes or moves.
const load = {
  work: () =>
    import('#/components/apps/Work').then((m) => ({ default: m.Work })),
  player: () =>
    import('#/components/apps/Player').then((m) => ({ default: m.Player })),
  terminal: () =>
    import('#/components/apps/Terminal').then((m) => ({ default: m.Terminal })),
  settings: () =>
    import('#/components/apps/Settings').then((m) => ({ default: m.Settings })),
  system: () =>
    import('#/components/apps/SystemInfo').then((m) => ({
      default: m.SystemInfo,
    })),
}

// Once the page has loaded, fetch them all while the browser is idle, so
// opening one later is instant.
if (typeof window !== 'undefined') {
  const prefetch = () =>
    (window.requestIdleCallback ?? setTimeout)(() => {
      for (const get of Object.values(load)) void get()
    })
  if (document.readyState === 'complete') prefetch()
  else addEventListener('load', prefetch, { once: true })
}

const APPS: Record<WindowId, ComponentType> = {
  about: About,
  contact: Contact,
  work: lazy(load.work),
  player: lazy(load.player),
  terminal: lazy(load.terminal),
  settings: lazy(load.settings),
  system: lazy(load.system),
  notfound: NotFound,
}

/** Renders every open window, front to back, so reading and tab order
 *  follow what is on top; z-index follows the stack. */
export function OpenWindows() {
  const { stack } = useWindows()
  return [...stack].reverse().map((id) => {
    const App = APPS[id]
    return (
      <WindowIdContext.Provider key={id} value={id}>
        <Suspense>
          <App />
        </Suspense>
      </WindowIdContext.Provider>
    )
  })
}
