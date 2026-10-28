import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { KeyboardEvent, RefObject } from 'react'

import { Clock } from '#/components/Clock'
import { useWindows } from '#/components/WindowManager'

// Only needed once someone shuts down, so it is a chunk of its own, fetched
// while the browser is idle after load, with the current theme's sequence,
// so choosing it is still instant.
const loadShutDown = () =>
  import('#/components/ShutDown').then((m) => ({ default: m.ShutDown }))
const ShutDown = lazy(loadShutDown)
if (typeof window !== 'undefined') {
  const prefetch = () =>
    (window.requestIdleCallback ?? setTimeout)(
      () => void import('#/components/ShutDown').then((m) => m.prefetch()),
    )
  if (document.readyState === 'complete') prefetch()
  else addEventListener('load', prefetch, { once: true })
}

const BAR =
  'fixed top-0 z-50 flex h-[32px] items-center border-b border-(--frame) bg-(--surface) text-(length:--label-size)'

const ITEM =
  'block w-full px-4 py-[3px] pointer-coarse:py-3 text-left whitespace-nowrap outline-none hover:bg-(--accent) hover:text-(--on-accent) focus-visible:bg-(--accent) focus-visible:text-(--on-accent)'

/** Windows the system menu opens, rather than the dock. */
const APPS = [
  { id: 'system', label: 'System Info' },
  { id: 'terminal', label: 'Terminal' },
] as const

/** The theme logo menu, opened like the system menu on a 90s desktop. */
function SystemMenu({
  trigger,
  onShutDown,
}: {
  trigger: RefObject<HTMLButtonElement | null>
  onShutDown: () => void
}) {
  const { raise } = useWindows()
  const [open, setOpen] = useState(false)
  // The item to focus once the menu is open.
  const [start, setStart] = useState<'first' | 'last'>('first')
  const root = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const close = () => setOpen(false)

  const items = () => [
    ...(menu.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []),
  ]

  const openAt = (at: 'first' | 'last') => {
    setStart(at)
    setOpen(true)
  }
  useEffect(() => {
    if (open)
      items()
        .at(start === 'first' ? 0 : -1)
        ?.focus()
  }, [open, start])

  const actions: { label: string; onSelect: () => void }[] = [
    { label: 'Restart…', onSelect: onShutDown },
  ]

  // Down or Up on the button opens the menu at its first or last item.
  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    openAt(e.key === 'ArrowDown' ? 'first' : 'last')
  }

  // Arrow keys walk the items, Home and End jump to the ends, Escape closes
  // and hands focus back.
  const onMenuKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close()
      trigger.current?.focus()
      return
    }
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLElement)
    const to =
      e.key === 'ArrowDown'
        ? (i + 1) % list.length
        : e.key === 'ArrowUp'
          ? (i - 1 + list.length) % list.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? list.length - 1
              : null
    if (to === null) return
    e.preventDefault()
    list[to]?.focus()
  }

  return (
    <div
      ref={root}
      className="relative flex h-full"
      // Tabbing out of the menu closes it, as clicking away does.
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget)) close()
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="System menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : openAt('first'))}
        onKeyDown={onTriggerKeyDown}
        className={`flex aspect-square h-full items-center justify-center pr-px pb-px -outline-offset-4 outline-current outline-dotted not-focus-visible:outline-none ${open ? 'bg-(--accent) text-(--on-accent)' : ''}`}
      >
        {/* The bar's rule leaves the button an odd 31px; the padding keeps
            the mark on whole pixels, so it draws sharp. */}
        <span aria-hidden className="logo" />
      </button>
      {open && (
        <div
          ref={menu}
          role="menu"
          aria-label="System"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="absolute top-full left-0 min-w-44 border border-(--frame) bg-(--surface) py-1 font-(family-name:--font-label) tracking-(--label-tracking) shadow-(--window-shadow)"
        >
          {APPS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                raise(a.id)
                close()
              }}
              className={ITEM}
            >
              {a.label}
            </button>
          ))}
          <hr className="my-1 border-(--frame)" />
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close()
                a.onSelect()
              }}
              className={ITEM}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const noChange = () => () => {}

// Long enough for any theme's --window-boot to play out.
const BOOTING = 1000

export function MenuBar() {
  const [shutDown, setShutDown] = useState(false)
  // `?start` opens on the start screen, straight from the tube coming on,
  // until the first boot. Only known in the browser.
  const start = useSyncExternalStore(
    noChange,
    () => new URLSearchParams(location.search).has('start'),
    () => false,
  )
  const [booted, setBooted] = useState(false)
  const straight = start && !booted && !shutDown
  const off = shutDown || straight
  const trigger = useRef<HTMLButtonElement>(null)
  const { dockAll, front, raise } = useWindows()
  // The windows fly into the dock as the rest shuts down; booting, they
  // come back as the theme says while the bar and dock fold open.
  const shutDownNow = useCallback(() => {
    dockAll(true)
    setShutDown(true)
  }, [dockAll])
  const boot = useCallback(() => {
    dockAll(false)
    setShutDown(false)
    setBooted(true)
    // Marks the boot for a moment, for themes whose windows come back with
    // an animation (--window-boot in styles.css).
    const html = document.documentElement
    html.dataset.booting = ''
    setTimeout(() => delete html.dataset.booting, BOOTING)
  }, [dockAll])
  // Back on, once the shut down screen has gone and the desktop is no
  // longer inert, focus goes into the front window, as on a fresh start;
  // with none open, to where Shut Down was chosen from.
  const wasOff = useRef(false)
  useEffect(() => {
    if (wasOff.current && !off) {
      if (front) raise(front)
      else trigger.current?.focus()
    }
    wasOff.current = off
  }, [off, front, raise])
  return (
    <>
      {off && (
        <Suspense>
          <ShutDown onBoot={boot} straight={straight} />
        </Suspense>
      )}
      {/* One banner for both halves of the bar: the menu at the left, the
          clock at the right. */}
      <header>
        <div
          data-shutdown="bar"
          className={`${BAR} left-0 border-r has-aria-expanded:z-70`}
        >
          <SystemMenu trigger={trigger} onShutDown={shutDownNow} />
        </div>
        <div data-shutdown="bar" className={`${BAR} right-0 border-l`}>
          <Clock />
        </div>
      </header>
    </>
  )
}
