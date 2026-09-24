import { useNavigate, useRouterState } from '@tanstack/react-router'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { idForPath, initialStack, pathFor } from '#/lib/windows'
import type { WindowId } from '#/lib/windows'

type Windows = {
  /** Open windows, back to front. The last one is focused. */
  stack: WindowId[]
  /** Open a window, or bring it to the front if already open. */
  raise: (id: WindowId) => void
  /** Raise a window and point the URL at it. */
  focus: (id: WindowId) => void
  close: (id: WindowId) => void
}

const WindowsContext = createContext<Windows | null>(null)
export const WindowIdContext = createContext<WindowId>('home')

export function useWindows() {
  const ctx = useContext(WindowsContext)
  if (!ctx) throw new Error('useWindows needs <WindowManager>')
  return ctx
}

export function useWindowId() {
  return useContext(WindowIdContext)
}

const toFront = (stack: WindowId[], id: WindowId) =>
  stack.at(-1) === id ? stack : [...stack.filter((w) => w !== id), id]

/**
 * Keeps a stack of open windows. The URL tracks the focused window, so every
 * route still prerenders with its window open and back/forward work.
 */
export function WindowManager({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const [stack, setStack] = useState(() => initialStack(pathname))
  // Set when closing the last window sends the URL home; home stays closed.
  const skipSync = useRef(false)

  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false
      return
    }
    const id = idForPath(pathname)
    if (id) setStack((s) => toFront(s, id))
  }, [pathname])

  const raise = useCallback((id: WindowId) => {
    setStack((s) => toFront(s, id))
  }, [])

  const focus = useCallback(
    (id: WindowId) => {
      setStack((s) => toFront(s, id))
      if (idForPath(pathname) !== id)
        navigate({ href: pathFor(id), replace: true })
    },
    [pathname, navigate],
  )

  const close = useCallback(
    (id: WindowId) => {
      const next = stack.filter((w) => w !== id)
      setStack(next)
      if (idForPath(pathname) !== id) return
      const top = next.at(-1)
      if (top) {
        navigate({ href: pathFor(top), replace: true })
      } else if (id !== 'home') {
        skipSync.current = true
        navigate({ href: '/', replace: true })
      }
    },
    [stack, pathname, navigate],
  )

  const value = useMemo(
    () => ({ stack, raise, focus, close }),
    [stack, raise, focus, close],
  )

  return (
    <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
  )
}
