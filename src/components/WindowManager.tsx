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
  /** Open windows, back to front, minimized ones included. */
  stack: WindowId[]
  /** The focused window: the frontmost one not minimized. */
  front: WindowId | undefined
  /** Open windows hidden in the dock. They stay mounted, in their place in
   *  the stack, so minimizing never moves a window in the DOM. */
  minimized: WindowId[]
  /** Fly a window into its dock key and hide it; the next window takes
   *  focus. Pressing the key again, even mid-flight, brings it back. */
  minimize: (id: WindowId) => void
  /** For Shut Down: flies every window not minimized into its dock key,
   *  front to back. Undone at once with `docked` false, on boot, so the
   *  windows are simply there again. */
  dockAll: (docked: boolean) => void
  /** Where each open window opened, in order: on a phone, each opens one
   *  title bar below the one before (styles.css), so the close boxes of
   *  the windows behind stay clear. */
  slots: Partial<Record<WindowId, number>>
  /** Open a window, or bring it to the front if already open, and move
   *  keyboard focus into it. */
  raise: (id: WindowId) => void
  close: (id: WindowId) => void
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

const windowEl = (id: WindowId) =>
  document.querySelector<HTMLElement>(`[data-window="${id}"]`)

/** Flies window `id` into its dock key, or back out of it with `restore`.
 *  Measured before React renders, while layout is still clean, and drawn
 *  with the individual translate, scale and opacity properties only, so
 *  the compositor runs it and it composes with the transform that places
 *  the window. Returns null when there's nothing to animate. */
function flyToDock(id: WindowId, restore: boolean) {
  const el = windowEl(id)
  const key = document.querySelector(`[data-dock-link="${id}"]`)
  if (!el || !key || typeof el.animate !== 'function') return null
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  // Pressed again mid-flight: turn the running flight around.
  const flying = el.getAnimations().find((a) => a.id === 'dock')
  if (flying?.playState === 'running') {
    flying.reverse()
    return flying
  }
  el.style.visibility = ''
  const r = el.getBoundingClientRect()
  const k = key.getBoundingClientRect()
  const o = el.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 }
  const sx = k.width / r.width
  const sy = k.height / r.height
  // With the origin at the layout box's corner, a point lands at
  // origin + translate + scale * position, so solve for the translate.
  const tx = k.left - o.left - sx * (r.left - o.left)
  const ty = k.top - o.top - sy * (r.top - o.top)
  const out = { translate: '0 0', scale: '1', opacity: 1 }
  const docked = {
    translate: `${tx}px ${ty}px`,
    scale: `${sx} ${sy}`,
    opacity: 0,
  }
  el.style.transformOrigin = '0 0'
  const anim = el.animate(restore ? [docked, out] : [out, docked], {
    id: 'dock',
    duration: 220,
    // Quick off the mark, settling as it lands.
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    fill: 'forwards',
  })
  anim.finished.then(
    () => {
      // Hidden if it ended in the dock, whichever way it set off.
      const docked = restore === anim.playbackRate < 0
      el.style.visibility = docked ? 'hidden' : ''
      el.style.transformOrigin = ''
      anim.cancel()
    },
    () => {},
  )
  return anim
}

// Shutting down, the windows leave for the dock one after another.
const STAGGER = 60

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

/** With no window left to take it, focus goes to the window's dock key,
 *  or the first one for windows without a key, once the window is gone. */
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
  const [focusRequest, setFocusRequest] = useState<{
    id: WindowId | null
    seq: number
  }>({ id: null, seq: 0 })
  const [peek, setPeek] = useState<WindowId | null>(null)
  const [minimized, setMinimized] = useState<WindowId[]>([])
  const front = stack.filter((w) => !minimized.includes(w)).at(-1)
  const requestFocus = useCallback((id: WindowId) => {
    setFocusRequest((r) => ({ id, seq: r.seq + 1 }))
    setPeek(null)
  }, [])

  const raise = useCallback(
    (id: WindowId) => {
      if (minimized.includes(id)) {
        if (!flyToDock(id, true)) {
          const el = windowEl(id)
          if (el) el.style.visibility = ''
        }
        setMinimized((m) => m.filter((w) => w !== id))
      }
      keepScroll()
      setStack((s) => toFront(s, id))
      setSlots((s) => (id in s ? s : { ...s, [id]: nextSlot(s) }))
      requestFocus(id)
    },
    [minimized, requestFocus],
  )

  const minimize = useCallback(
    (id: WindowId) => {
      if (!flyToDock(id, false)) {
        const el = windowEl(id)
        if (el) el.style.visibility = 'hidden'
      }
      const hidden = [...minimized, id]
      setMinimized(hidden)
      const top = stack.filter((w) => !hidden.includes(w)).at(-1)
      if (holdsFocus(id)) {
        if (top) requestFocus(top)
        else focusDock(id)
      }
    },
    [stack, minimized, requestFocus],
  )

  const dockAll = useCallback(
    (docked: boolean) => {
      const shown = stack.filter((w) => !minimized.includes(w))
      shown.reverse().forEach((id, i) => {
        const el = windowEl(id)
        if (!el) return
        if (!docked) {
          el.style.visibility = ''
          return
        }
        setTimeout(() => {
          if (!flyToDock(id, false)) el.style.visibility = 'hidden'
        }, i * STAGGER)
      })
    },
    [stack, minimized],
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
      setMinimized((m) => m.filter((w) => w !== id))
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
    [stack, minimized, navigate, requestFocus],
  )

  const value = useMemo(
    () => ({
      stack,
      front,
      minimized,
      minimize,
      dockAll,
      slots,
      raise,
      close,
      focusRequest,
      peek,
      setPeek,
    }),
    [
      stack,
      front,
      minimized,
      minimize,
      dockAll,
      slots,
      raise,
      close,
      focusRequest,
      peek,
    ],
  )

  return (
    <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
  )
}
