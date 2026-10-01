import type { ComponentType } from 'react'
import { WindowIdContext, useWindows } from '#/components/WindowManager'
import type { WindowId } from '#/lib/windows'
import { About } from './About'
import { Contact } from './Contact'
import { Settings } from './Settings'

const APPS: Record<WindowId, ComponentType> = {
  about: About,
  contact: Contact,
  settings: Settings,
}

/** Renders every open window. DOM order is stable; z-index follows the stack. */
export function OpenWindows() {
  const { stack } = useWindows()
  return [...stack].sort().map((id) => {
    const App = APPS[id]
    return (
      <WindowIdContext.Provider key={id} value={id}>
        <App />
      </WindowIdContext.Provider>
    )
  })
}
