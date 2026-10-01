import { useCallback, useLayoutEffect, useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { useWindowId, useWindows } from './WindowManager'

/**
 * Shrinks a window into its taskbar button (or grows it back out when
 * `restore`). Uses the individual translate/scale properties, which apply on
 * top of the window's position transform, so dragging and minimizing never
 * fight. No animation when the taskbar is hidden, as on phones.
 */
function flyToTaskbar(el: HTMLElement, id: string, restore: boolean) {
  const button = document.querySelector<HTMLElement>(`[data-taskbar="${id}"]`)
  if (
    !button?.offsetParent ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return null
  const r = el.getBoundingClientRect()
  const b = button.getBoundingClientRect()
  const o = el.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 }
  const sx = b.width / r.width
  const sy = b.height / r.height
  // With the origin at the layout box's corner, a point lands at
  // origin + translate + scale * (position), so solve for the translate.
  const tx = b.left - o.left - sx * (r.left - o.left)
  const ty = b.top - o.top - sy * (r.top - o.top)
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

/** Tailwind's sm breakpoint, below which windows stop floating. */
const PHONE = '(width < 40rem)'

/** On phones only the focused window shows, across the screen at its own
 *  height. Overrides the inline position and size. */
const PHONE_LAYOUT =
  'max-sm:inset-x-2 max-sm:top-2 max-sm:h-auto! max-sm:max-h-[calc(100%-1rem)] max-sm:w-auto! max-sm:max-w-none max-sm:transform-none!'

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
  className = '',
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const id = useWindowId()
  const { stack, focus, close: closeWindow, minimized } = useWindows()
  const active = stack.at(-1) === id
  const hidden = minimized.includes(id)
  const close = () => closeWindow(id)

  // Animate into the taskbar and hide, or show and animate back out. Hidden
  // windows stay mounted, keeping their place and state.
  const wasHidden = useRef(hidden)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || wasHidden.current === hidden) return
    wasHidden.current = hidden
    for (const a of el.getAnimations()) a.cancel()
    if (hidden) {
      const anim = flyToTaskbar(el, id, false)
      const hide = () => (el.style.visibility = 'hidden')
      if (!anim) return void hide()
      anim.finished.then(hide, () => {})
    } else {
      el.style.visibility = ''
      flyToTaskbar(el, id, true)
    }
  }, [hidden, id])

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    // Phones show one window filling the screen, so nothing to drag.
    if (e.button !== 0 || !ref.current || matchMedia(PHONE).matches) return
    const r = ref.current.getBoundingClientRect()
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top }
    e.currentTarget.setPointerCapture(e.pointerId)
    ref.current.style.willChange = 'transform'
  }, [])

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !ref.current) return
    const el = ref.current
    const { left = 0, top = 0 } = el.offsetParent?.getBoundingClientRect() ?? {}
    // Keep the whole window inside the browser viewport on every side; it
    // may cover the menu bar and taskbar.
    const vx = Math.max(
      0,
      Math.min(innerWidth - el.offsetWidth, e.clientX - d.dx),
    )
    const vy = Math.max(
      0,
      Math.min(innerHeight - el.offsetHeight, e.clientY - d.dy),
    )
    const nx = Math.round(vx - left)
    const ny = Math.round(vy - top)
    el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`
  }, [])

  const onPointerUp = useCallback(() => {
    drag.current = null
    if (ref.current) ref.current.style.willChange = ''
  }, [])

  return (
    <section
      ref={ref}
      role="dialog"
      aria-label={title}
      onPointerDown={() => focus(id)}
      style={{
        // Centred in CSS, so the prerendered HTML is already in place. The
        // window's top sits a little above middle since heights vary.
        transform: `translate3d(max(8px, calc(${right ? `100vw - ${width + 16}px` : `50vw - ${width / 2}px`} + ${x}px)), max(8px, calc(40vh - 180px + ${y}px)), 0)`,
        width,
        height,
        zIndex: stack.indexOf(id) + 1,
      }}
      className={`pointer-events-auto absolute top-0 left-0 flex max-h-full max-w-[calc(100vw-1rem)] flex-col border border-(--ink) bg-(--surface) shadow-(--window-shadow) ${PHONE_LAYOUT} ${active ? '' : 'max-sm:hidden'} ${className}`}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={close}
        className={`grid h-(--title-height) shrink-0 cursor-grab touch-none grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-(--ink) px-1.5 active:cursor-grabbing ${active ? 'bg-(--title) text-(--on-title)' : 'bg-(--surface)'}`}
      >
        {/* Equal side columns keep the title centred on the whole bar, not
            on the space left over after the buttons. */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={close}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Close"
            className="relative flex size-(--box-size) shrink-0 cursor-pointer items-center justify-center border border-current after:absolute after:-inset-x-[2px] after:-inset-y-[5px] after:content-[''] bg-(--close-bg) shadow-(--close-shadow) active:bg-(--ink) active:text-(--surface)"
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
          <span
            aria-hidden
            className={`stripes h-[17px] flex-1 ${active ? 'opacity-70' : 'opacity-0'}`}
          />
        </div>
        <span
          className={`px-2 font-title text-(length:--title-size) tracking-tight [text-box:trim-both_cap_alphabetic] [text-transform:var(--title-case)] [font-weight:var(--title-weight)] before:content-(--title-open) after:content-(--title-close) ${active ? 'bg-(--title)' : 'bg-(--surface)'}`}
        >
          {title}
        </span>
        <span
          aria-hidden
          className={`stripes h-[17px] ${active ? 'opacity-70' : 'opacity-0'}`}
        />
      </div>
      <div className="os-scroll min-h-0 flex-1 p-5 select-text">{children}</div>
    </section>
  )
}
