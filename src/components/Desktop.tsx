import { useRouterState } from '@tanstack/react-router'
import { MenuBar } from '#/components/MenuBar'
import { Dock } from '#/components/Dock'
import { Backdrop } from '#/components/Backdrop'
import { WindowManager } from '#/components/WindowManager'
import { OpenWindows } from '#/components/apps'
import { site } from '#/lib/site'
import { idForPath } from '#/lib/windows'

export function Desktop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <WindowManager>
      <Backdrop />
      <MenuBar />
      {/* Above the menu bar and dock so windows can be dragged over them;
          click-through except on the windows themselves. */}
      <main
        data-shutdown="windows"
        className="pointer-events-none absolute inset-x-0 top-0 bottom-[88px] z-60"
      >
        <h1 className="sr-only">{site.headings[idForPath(pathname)]}</h1>
        <OpenWindows />
      </main>
      <Dock />
    </WindowManager>
  )
}
