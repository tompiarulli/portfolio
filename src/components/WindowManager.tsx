import { useNavigate, useRouterState } from '@tanstack/react-router'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { initialStack } from '#/lib/windows'
import type { WindowId } from '#/lib/windows'

type Windows = {
  /** Open windows, back to front. The last one is focused. */
  stack: WindowId[]
  /** Where each open window opened, in order: on a phone, each opens one
   *  title bar below the one before (styles.css), so the close boxes of
   *  the windows behind stay clear. */
  slots: Partial<Record<WindowId, number>>
  /** Open a window, or bring it to the front if already open, and move
   *  keyboard focus into it. */
  raise: (id: WindowId) => void
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

// Past this, a new window would open too low on a small phone.
const LAST_SLOT = 5

/** The slot below every open window's, for a window opening now. */
const nextSlot = (slots: Partial<Record<WindowId, number>>) =>
  Math.min(LAST_SLOT, Math.max(-1, ...Object.values(slots)) + 1)

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
 * Keeps a stack of open windows. The desktop has one URL: windows are state,
 * not routes, so opening one never touches history. Only an unknown URL
 * matters, opening File Not Found on load.
 */
export function WindowManager({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const [stack, setStack] = useState(() => initialStack(pathname))
  const [slots, setSlots] = useState<Partial<Record<WindowId, number>>>(() =>
    Object.fromEntries(initialStack(pathname).map((id, i) => [id, i])),
  )
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

  const raise = useCallback(
    (id: WindowId) => {
      keepScroll()
      setStack((s) => toFront(s, id))
      setSlots((s) => (id in s ? s : { ...s, [id]: nextSlot(s) }))
      unminimize(id)
      requestFocus(id)
    },
    [unminimize, requestFocus],
  )

  const close = useCallback(
    (id: WindowId) => {
      const next = stack.filter((w) => w !== id)
      keepScroll()
      setStack(next)
      setSlots((s) => {
        const rest = { ...s }
        delete rest[id]
        return rest
      })
      unminimize(id)
      const top = next.filter((w) => !minimized.includes(w)).at(-1)
      // Focus moves on to the next window, as on a desktop OS.
      if (holdsFocus(id)) {
        if (top) requestFocus(top)
        else focusDock(id)
      }
      // Dismissing File Not Found leaves the bad URL for the home page, so
      // a reload doesn't bring it back.
      if (id === 'notfound') navigate({ to: '/', replace: true })
    },
    [stack, minimized, navigate, unminimize, requestFocus],
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
    },
    [stack, minimized, requestFocus],
  )

  const value = useMemo(
    () => ({
      stack,
      slots,
      raise,
      close,
      minimized,
      minimize,
      focusRequest,
      peek,
      setPeek,
    }),
    [stack, slots, raise, close, minimized, minimize, focusRequest, peek],
  )

  return (
    <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
  )
}
