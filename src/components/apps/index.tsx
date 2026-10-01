import { Suspense, lazy } from 'react'
import type { ComponentType } from 'react'
import { WindowIdContext, useWindows } from '#/components/WindowManager'
import type { WindowId } from '#/lib/windows'
import { About } from './About'
import { Contact } from './Contact'
import { Settings } from './Settings'
import { SystemInfo } from './SystemInfo'

// Only fetched once someone opens it, so the shell stays small.
const Terminal = lazy(() =>
  import('./Terminal').then((m) => ({ default: m.Terminal })),
)

const APPS: Record<WindowId, ComponentType> = {
  about: About,
  contact: Contact,
  terminal: Terminal,
  settings: Settings,
  system: SystemInfo,
}

/** Renders every open window. DOM order is stable; z-index follows the stack. */
export function OpenWindows() {
  const { stack } = useWindows()
  return [...stack].sort().map((id) => {
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
