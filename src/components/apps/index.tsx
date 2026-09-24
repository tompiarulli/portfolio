import type { ComponentType } from 'react'
import { WindowIdContext, useWindows } from '#/components/WindowManager'
import type { WindowId } from '#/lib/windows'
import { Home } from './Home'
import { Projects } from './Projects'
import { Project } from './Project'
import { About } from './About'
import { Contact } from './Contact'
import { Settings } from './Settings'

const APPS: Record<Exclude<WindowId, `project:${string}`>, ComponentType> = {
  home: Home,
  projects: Projects,
  about: About,
  contact: Contact,
  settings: Settings,
}

function WindowContent({ id }: { id: WindowId }) {
  if (id.startsWith('project:'))
    return <Project slug={id.slice('project:'.length)} />
  const App = APPS[id as keyof typeof APPS]
  return <App />
}

/** Renders every open window. DOM order is stable; z-index follows the stack. */
export function OpenWindows() {
  const { stack } = useWindows()
  return [...stack].sort().map((id) => (
    <WindowIdContext.Provider key={id} value={id}>
      <WindowContent id={id} />
    </WindowIdContext.Provider>
  ))
}
