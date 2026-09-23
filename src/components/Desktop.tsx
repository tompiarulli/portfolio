import type { ReactNode } from 'react'
import { MenuBar } from './MenuBar'
import { Dock } from './Dock'
import { Backdrop } from './Backdrop'

export function Desktop({ children }: { children: ReactNode }) {
  return (
    <>
      <Backdrop />
      <MenuBar />
      <main className="absolute inset-x-0 top-7 bottom-16">{children}</main>
      <Dock />
    </>
  )
}
