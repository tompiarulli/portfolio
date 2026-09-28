import type { ComponentType } from 'react'
import { WindowIdContext, useWindows } from '#/components/WindowManager'
import type { WindowId } from '#/lib/windows'
import { About } from './About'
import { Work } from './Work'
import { Player } from './Player'
import { Blog } from './Blog'
import { Project } from './Project'
import { Contact } from './Contact'
import { Settings } from './Settings'
import { SystemInfo } from './SystemInfo'

const APPS: Record<Exclude<WindowId, `project:${string}`>, ComponentType> = {
  about: About,
  work: Work,
  player: Player,
  blog: Blog,
  contact: Contact,
  settings: Settings,
  system: SystemInfo,
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
