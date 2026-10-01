import { Taskbar } from './Taskbar'
import { Backdrop } from './Backdrop'
import { WindowManager } from './WindowManager'
import { OpenWindows } from './apps'

export function Desktop() {
  return (
    <WindowManager>
      <Backdrop />
      {/* Above the taskbar so windows can be dragged over it; click-through
          except on the windows themselves. */}
      <main className="pointer-events-none absolute inset-x-0 top-0 bottom-[36px] z-60">
        <OpenWindows />
      </main>
      <Taskbar />
    </WindowManager>
  )
}
