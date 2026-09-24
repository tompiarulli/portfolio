import { MenuBar } from './MenuBar'
import { Dock } from './Dock'
import { Backdrop } from './Backdrop'
import { WindowManager } from './WindowManager'
import { OpenWindows } from './apps'

export function Desktop() {
  return (
    <WindowManager>
      <Backdrop />
      <MenuBar />
      <main className="absolute inset-x-0 top-7 bottom-16">
        <OpenWindows />
      </main>
      <Dock />
    </WindowManager>
  )
}
