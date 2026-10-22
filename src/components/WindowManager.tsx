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
  /** The window keyboard focus should move into, bumped each time it is
   *  asked for, so the same window can be asked for twice. */
  focusRequest: { id: WindowId | null; seq: number }
  /** A window behind the top one that holds keyboard focus. It is drawn on
   *  top while it does, without reordering the stack, so tabbing through
   *  the windows never hides the focused control. */
  peek: WindowId | null
  setPeek: (update: (peek: WindowId | null) => WindowId | null) => void
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

/** Each window body's scroll offset, from just before the stack last
 *  changed: windows render front to back, so restacking moves them in the
 *  DOM, which resets their scroll. */
export const scrollBefore = new WeakMap<Element, number>()
const keepScroll = () => {
  for (const el of document.querySelectorAll('[data-window-body]'))
    scrollBefore.set(el, el.scrollTop)
}

const toFront = (stack: WindowId[], id: WindowId) =>
  stack.at(-1) === id ? stack : [...stack.filter((w) => w !== id), id]

/** Whether keyboard focus is in window `id`, or nowhere in particular. */
const holdsFocus = (id: WindowId) => {
  const el = document.activeElement
  return (
    !el ||
    el === document.body ||
    !!document.querySelector(`[data-window="${id}"]`)?.contains(el)
  )
}

/** With no window left to take it, focus goes to the window's dock icon,
 *  or the first one for windows without an icon, once the window is gone. */
const focusDock = (id: WindowId) =>
  setTimeout(() =>
    (
      document.querySelector<HTMLElement>(`[data-dock-link="${id}"]`) ??
      document.querySelector<HTMLElement>('[data-dock-link]')
    )?.focus(),
  )

/**
 * Keeps a stack of open windows. The URL tracks the focused window, so every
 * route still prerenders with its window open and back/forward work.
 */
export function WindowManager({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const [stack, setStack] = useState(() => initialStack(pathname))
  const [minimized, setMinimized] = useState<WindowId[]>([])
  const [focusRequest, setFocusRequest] = useState<{
    id: WindowId | null
    seq: number
  }>({ id: null, seq: 0 })
  const [peek, setPeek] = useState<WindowId | null>(null)
  const requestFocus = useCallback((id: WindowId) => {
    setFocusRequest((r) => ({ id, seq: r.seq + 1 }))
    setPeek(null)
  }, [])
  const unminimize = useCallback((id: WindowId) => {
    setMinimized((m) => (m.includes(id) ? m.filter((w) => w !== id) : m))
  }, [])
  // Set when closing or minimizing the last window sends the URL to /, so
  // About isn't reopened.
  const skipSync = useRef(false)
  // The page's own URL leaves focus alone, at the top of the document;
  // later ones (back, forward) move it into their window.
  const loadedPath = useRef<string | null>(pathname)

  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false
      return
    }
    const id = idForPath(pathname)
    keepScroll()
    setStack((s) => toFront(s, id))
    unminimize(id)
    if (pathname !== loadedPath.current) {
      loadedPath.current = null
      requestFocus(id)
    }
  }, [pathname, unminimize, requestFocus])

  const raise = useCallback(
    (id: WindowId) => {
      keepScroll()
      setStack((s) => toFront(s, id))
      unminimize(id)
      requestFocus(id)
    },
    [unminimize, requestFocus],
  )

  const focus = useCallback(
    (id: WindowId) => {
      keepScroll()
      setStack((s) => toFront(s, id))
      unminimize(id)
      requestFocus(id)
      if (idForPath(pathname) !== id)
        navigate({ href: pathFor(id), replace: true })
    },
    [pathname, navigate, unminimize, requestFocus],
  )

  const close = useCallback(
    (id: WindowId) => {
      const next = stack.filter((w) => w !== id)
      keepScroll()
      setStack(next)
      unminimize(id)
      const top = next.filter((w) => !minimized.includes(w)).at(-1)
      // Focus moves on to the next window, as on a desktop OS.
      if (holdsFocus(id)) {
        if (top) requestFocus(top)
        else focusDock(id)
      }
      if (idForPath(pathname) !== id) return
      if (top) {
        navigate({ href: pathFor(top), replace: true })
      } else if (id !== 'about') {
        skipSync.current = true
        navigate({ href: '/', replace: true })
      }
    },
    [stack, minimized, pathname, navigate, unminimize, requestFocus],
  )

  const minimize = useCallback(
    (id: WindowId) => {
      const hidden = [...minimized.filter((w) => w !== id), id]
      setMinimized(hidden)
      // Send it to the back so the next visible window becomes the top.
      const next = [id, ...stack.filter((w) => w !== id)]
      keepScroll()
      setStack(next)
      const top = next.filter((w) => !hidden.includes(w)).at(-1)
      if (holdsFocus(id)) {
        if (top) requestFocus(top)
        else focusDock(id)
      }
      if (idForPath(pathname) !== id) return
      const href = top ? pathFor(top) : '/'
      if (href === pathname) return
      skipSync.current = !top
      navigate({ href, replace: true })
    },
    [stack, minimized, pathname, navigate, requestFocus],
  )

  const value = useMemo(
    () => ({
      stack,
      raise,
      focus,
      close,
      minimized,
      minimize,
      focusRequest,
      peek,
      setPeek,
    }),
    [stack, raise, focus, close, minimized, minimize, focusRequest, peek],
  )

  return (
    <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
  )
}
