import type { ComponentType } from 'react'
import { WindowIdContext, useWindows } from '#/components/WindowManager'
import type { WindowId } from '#/lib/windows'
import { About } from './About'
import { Socials } from './Socials'
import { Settings } from './Settings'
import { SystemInfo } from './SystemInfo'

const APPS: Record<WindowId, ComponentType> = {
  about: About,
  socials: Socials,
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
        <App />
      </WindowIdContext.Provider>
    )
  })
}
