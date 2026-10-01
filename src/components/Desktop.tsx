import { MenuBar } from './MenuBar'
import { Backdrop } from './Backdrop'
import { WindowManager } from './WindowManager'
import { OpenWindows } from './apps'

export function Desktop() {
  return (
    <WindowManager>
      <Backdrop />
      <MenuBar />
      {/* Above the menu bar so windows can be dragged over it; click-through
          except on the windows themselves. */}
      <main className="pointer-events-none absolute inset-0 z-60">
        <OpenWindows />
      </main>
    </WindowManager>
  )
}
