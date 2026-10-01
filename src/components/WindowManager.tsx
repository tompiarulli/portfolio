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
  /** Open windows hidden in the dock. They stay mounted, keeping their place. */
  minimized: WindowId[]
  /** Hide a window into its dock icon; the next window takes focus. */
  minimize: (id: WindowId) => void
}

const WindowsContext = createContext<Windows | null>(null)
export const WindowIdContext = createContext<WindowId>('about')

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
  const [minimized, setMinimized] = useState<WindowId[]>([])
  const unminimize = useCallback((id: WindowId) => {
    setMinimized((m) => (m.includes(id) ? m.filter((w) => w !== id) : m))
  }, [])
  // Set when closing or minimizing the last window sends the URL to /, so
  // About isn't reopened.
  const skipSync = useRef(false)

  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false
      return
    }
    const id = idForPath(pathname)
    if (!id) return
    setStack((s) => toFront(s, id))
    unminimize(id)
  }, [pathname, unminimize])

  const raise = useCallback(
    (id: WindowId) => {
      setStack((s) => toFront(s, id))
      unminimize(id)
    },
    [unminimize],
  )

  const focus = useCallback(
    (id: WindowId) => {
      setStack((s) => toFront(s, id))
      unminimize(id)
      if (idForPath(pathname) !== id)
        navigate({ href: pathFor(id), replace: true })
    },
    [pathname, navigate, unminimize],
  )

  const close = useCallback(
    (id: WindowId) => {
      const next = stack.filter((w) => w !== id)
      setStack(next)
      unminimize(id)
      if (idForPath(pathname) !== id) return
      const top = next.filter((w) => !minimized.includes(w)).at(-1)
      if (top) {
        navigate({ href: pathFor(top), replace: true })
      } else if (id !== 'about') {
        skipSync.current = true
        navigate({ href: '/', replace: true })
      }
    },
    [stack, minimized, pathname, navigate, unminimize],
  )

  const minimize = useCallback(
    (id: WindowId) => {
      const hidden = [...minimized.filter((w) => w !== id), id]
      setMinimized(hidden)
      // Send it to the back so the next visible window becomes the top.
      const next = [id, ...stack.filter((w) => w !== id)]
      setStack(next)
      if (idForPath(pathname) !== id) return
      const top = next.filter((w) => !hidden.includes(w)).at(-1)
      const href = top ? pathFor(top) : '/'
      if (href === pathname) return
      skipSync.current = !top
      navigate({ href, replace: true })
    },
    [stack, minimized, pathname, navigate],
  )

  const value = useMemo(
    () => ({ stack, raise, focus, close, minimized, minimize }),
    [stack, raise, focus, close, minimized, minimize],
  )

  return (
    <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
  )
}
