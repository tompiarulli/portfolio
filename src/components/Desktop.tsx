import { MenuBar } from './MenuBar'
import { Taskbar } from './Taskbar'
import { MobileNav } from './MobileNav'
import { Backdrop } from './Backdrop'
import { WindowManager } from './WindowManager'
import { OpenWindows } from './apps'

export function Desktop() {
  return (
    <WindowManager>
      <Backdrop />
      <MenuBar />
      {/* Above the menu bar and taskbar so windows can be dragged over them;
          click-through except on the windows themselves. */}
      <main className="pointer-events-none absolute inset-x-0 top-0 bottom-[60px] z-60 sm:bottom-[36px]">
        <OpenWindows />
      </main>
      <Taskbar />
      <MobileNav />
    </WindowManager>
  )
}
