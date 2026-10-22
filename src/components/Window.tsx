import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import {
  scrollBefore,
  useWindowId,
  useWindows,
} from '#/components/WindowManager'

/**
 * Shrinks a window into its dock icon (or grows it back out when `restore`).
 * Uses the individual translate/scale properties, which apply on top of the
 * window's position transform, so dragging and minimizing never fight.
 */
function flyToDock(el: HTMLElement, iconId: string, restore: boolean) {
  const icon = document.querySelector(`[data-dock-icon="${iconId}"]`)
  if (!icon || matchMedia('(prefers-reduced-motion: reduce)').matches)
    return null
  const r = el.getBoundingClientRect()
  const i = icon.getBoundingClientRect()
  const o = el.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 }
  const sx = i.width / r.width
  const sy = i.height / r.height
  // With the origin at the layout box's corner, a point lands at
  // origin + translate + scale * (position), so solve for the translate.
  const tx = i.left - o.left - sx * (r.left - o.left)
  const ty = i.top - o.top - sy * (r.top - o.top)
  return el.animate(
    [
      { transformOrigin: '0 0', translate: '0 0', scale: '1', opacity: 1 },
      {
        transformOrigin: '0 0',
        translate: `${tx}px ${ty}px`,
        scale: `${sx} ${sy}`,
        opacity: 0.3,
      },
    ],
    {
      duration: 200,
      easing: restore ? 'ease-out' : 'ease-in',
      direction: restore ? 'reverse' : 'normal',
    },
  )
}

/** Puts the window's top-left corner at (`vx`, `vy`) in the viewport, kept
 *  wholly on screen on every side; it may cover the menu bar and dock. */
function moveTo(el: HTMLElement, vx: number, vy: number) {
  const { left = 0, top = 0 } = el.offsetParent?.getBoundingClientRect() ?? {}
  const x = Math.max(0, Math.min(innerWidth - el.offsetWidth, vx))
  const y = Math.max(0, Math.min(innerHeight - el.offsetHeight, vy))
  el.style.transform = `translate3d(${Math.round(x - left)}px, ${Math.round(y - top)}px, 0)`
}

// Arrow keys on the title move the window this far, or further with Shift.
const STEP = 10
const BIG_STEP = 50
const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

type Props = {
  title: string
  children: ReactNode
  /** Initial offset from the centre of the desktop, so open windows fan out
   *  instead of stacking exactly. Drag state lives in a transform so React
   *  never re-renders mid-drag. */
  x?: number
  y?: number
  /** Measure `x` from the right edge of the desktop instead of the centre. */
  right?: boolean
  width?: number
  height?: number
  /** Let the content run to the edges, without the usual padding. */
  flush?: boolean
  className?: string
}

export function Window({
  title,
  children,
  x = 0,
  y = 0,
  right = false,
  width = 560,
  height,
  flush = false,
  className = '',
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const id = useWindowId()
  const titleId = useId()
  const hintId = useId()
  const {
    stack,
    focus,
    close: closeWindow,
    minimized,
    focusRequest,
    peek,
    setPeek,
  } = useWindows()
  const active = peek ? peek === id : stack.at(-1) === id
  const hidden = minimized.includes(id)
  const close = () => closeWindow(id)
  // Restacking moves windows in the DOM, which resets their scroll; put
  // it back.
  const body = useRef<HTMLDivElement>(null)
  const place = stack.indexOf(id)
  useLayoutEffect(() => {
    const el = body.current
    const y = el && scrollBefore.get(el)
    if (el && y) el.scrollTop = y
  }, [place])

  // Rolled up to its title bar, like a windowshade.
  const [shaded, setShaded] = useState(false)
  const shade = () => setShaded((s) => !s)

  // Take keyboard focus when asked (opened, raised, or the window above
  // closed), unless it is already inside. A control marked
  // data-autofocus, like the terminal's prompt, takes it over the window.
  const handled = useRef(0)
  useEffect(() => {
    const el = ref.current
    const { id: want, seq } = focusRequest
    if (!el || want !== id || seq === handled.current) return
    handled.current = seq
    if (el.contains(document.activeElement)) return
    const target = el.querySelector<HTMLElement>('[data-autofocus]') ?? el
    target.focus({ preventScroll: true })
  }, [focusRequest, id])

  // Animate into the dock and hide, or show and animate back out. Hidden
  // windows stay mounted, keeping their place and state.
  const wasHidden = useRef(hidden)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || wasHidden.current === hidden) return
    wasHidden.current = hidden
    for (const a of el.getAnimations()) a.cancel()
    if (hidden) {
      const anim = flyToDock(el, id, false)
      const hide = () => (el.style.visibility = 'hidden')
      if (!anim) return void hide()
      anim.finished.then(hide, () => {})
    } else {
      el.style.visibility = ''
      flyToDock(el, id, true)
    }
  }, [hidden, id])

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top }
    e.currentTarget.setPointerCapture(e.pointerId)
    ref.current.style.willChange = 'transform'
  }, [])

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !ref.current) return
    moveTo(ref.current, e.clientX - d.dx, e.clientY - d.dy)
  }, [])

  const onPointerUp = useCallback(() => {
    drag.current = null
    if (ref.current) ref.current.style.willChange = ''
  }, [])

  // The keyboard's way to drag: arrow keys on the title.
  const onTitleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const arrow = ARROWS[e.key]
    if (!arrow || !ref.current || e.altKey || e.metaKey || e.ctrlKey) return
    e.preventDefault()
    const step = e.shiftKey ? BIG_STEP : STEP
    const r = ref.current.getBoundingClientRect()
    moveTo(ref.current, r.left + arrow[0] * step, r.top + arrow[1] * step)
  }

  // Window management, listened for on the window rather than making it a
  // control: pressing anywhere in it raises it, Escape anywhere in it
  // closes it, and focus inside it brings it to the top while it stays.
  const top = stack.at(-1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // The close box closes a window behind without bringing it forward.
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (!(e.target as Element).closest('[data-close]')) focus(id)
    }
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      e.preventDefault()
      closeWindow(id)
    }
    const onFocusIn = () => setPeek(() => (top === id ? null : id))
    const onFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node | null))
        setPeek((p) => (p === id ? null : p))
    }
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('keydown', onKeyDown)
    el.addEventListener('focusin', onFocusIn)
    el.addEventListener('focusout', onFocusOut)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('keydown', onKeyDown)
      el.removeEventListener('focusin', onFocusIn)
      el.removeEventListener('focusout', onFocusOut)
    }
  }, [focus, closeWindow, setPeek, top, id])

  return (
    // A labelled region rather than a dialog: several are open at once and
    // none is modal, so each is a landmark of its own, named by its title.
    <section
      ref={ref}
      aria-labelledby={titleId}
      data-window={id}
      tabIndex={-1}
      style={{
        // Centred in CSS, so the prerendered HTML is already in place. The
        // window's top sits a little above middle since heights vary.
        transform: `translate3d(max(8px, calc(${right ? `100vw - ${width + 16}px` : `50vw - ${width / 2}px`} + ${x}px)), max(8px, calc(40vh - 180px + ${y}px)), 0)`,
        width,
        height: shaded ? undefined : height,
        zIndex: peek === id ? stack.length + 1 : stack.indexOf(id) + 1,
      }}
      className={`pointer-events-auto absolute top-0 left-0 flex max-h-full max-w-[calc(100vw-1rem)] flex-col border border-(--ink) bg-(--surface) shadow-(--window-shadow) outline-none ${className}`}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={shade}
        className={`grid h-(--title-height) shrink-0 cursor-grab touch-none grid-cols-[1fr_auto_1fr] items-center gap-2 px-1.5 active:cursor-grabbing ${shaded ? '' : 'border-b border-(--ink)'} ${active ? 'bg-(--title) text-(--on-title)' : 'bg-(--surface)'}`}
      >
        {/* Equal side columns keep the title centred on the whole bar, not
            on the space left over after the buttons. */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={close}
            onPointerDown={(e) => e.stopPropagation()}
            data-close
            aria-label={`Close ${title}`}
            className="relative flex size-(--box-size) shrink-0 cursor-pointer items-center justify-center border border-current outline-current outline-dotted outline-offset-2 not-focus-visible:outline-none after:absolute after:-inset-x-[2px] after:-inset-y-[5px] after:content-[''] bg-(--close-bg) shadow-(--close-shadow) active:bg-(--ink) active:text-(--surface)"
          >
            {/* X drawn as two smooth 1px strokes, like the box borders */}
            <svg aria-hidden viewBox="0 0 8 8" className="size-(--glyph-size)">
              <path
                d="M1 1l6 6M7 1L1 7"
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                strokeLinecap="square"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </button>
        </div>
        {/* The title is the window's handle: arrow keys move it, and
            Enter rolls it up like a double-click does. A mouse click does
            nothing, so a drag never toggles it. */}
        <h2 id={titleId} className="flex min-w-0">
          <button
            type="button"
            aria-expanded={!shaded}
            aria-describedby={hintId}
            onKeyDown={onTitleKeyDown}
            onClick={(e) => e.detail === 0 && shade()}
            className="cursor-[inherit] px-2 font-mono text-(length:--title-size) tracking-tight outline-current outline-dotted outline-offset-2 not-focus-visible:outline-none [text-box:trim-both_cap_alphabetic] [text-transform:var(--title-case)] [font-weight:var(--title-weight)] before:content-(--title-open) after:content-(--title-close)"
          >
            {title}
          </button>
        </h2>
        <span id={hintId} hidden>
          Arrow keys move the window, Enter rolls it up, Escape closes it.
        </span>
      </div>
      <div
        ref={body}
        data-window-body
        hidden={shaded}
        className={`os-scroll min-h-0 flex-1 select-text ${flush ? '' : 'p-5'}`}
      >
        {children}
      </div>
    </section>
  )
}
