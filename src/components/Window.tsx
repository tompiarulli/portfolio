import { useNavigate } from '@tanstack/react-router'
import { useCallback, useRef   } from 'react'
import type {PointerEvent, ReactNode} from 'react';

type Props = {
  title: string
  children: ReactNode
  /** Initial position. Drag state lives in a transform so React never re-renders mid-drag. */
  x?: number
  y?: number
  width?: number
  height?: number
  /** Where the close box navigates. Defaults to "/". */
  closeTo?: string
  className?: string
}

export function Window({
  title,
  children,
  x = 80,
  y = 60,
  width = 560,
  height,
  closeTo = '/',
  className = '',
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const navigate = useNavigate()
  const close = () => navigate({ to: closeTo })

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
    const nx = Math.max(0, Math.round(e.clientX - d.dx))
    const ny = Math.max(0, Math.round(e.clientY - d.dy - 28))
    ref.current.style.transform = `translate3d(${nx}px, ${ny}px, 0)`
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
      style={{ transform: `translate3d(${x}px, ${y}px, 0)`, width, height }}
      className={`absolute top-0 left-0 flex max-h-full max-w-[calc(100vw-1rem)] flex-col border border-black bg-(--surface) shadow-[0_50px_80px_-50px_rgb(0_0_0/0.3)] ${className}`}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={close}
        className="flex h-6 shrink-0 cursor-grab touch-none items-center gap-2 border-b border-black bg-(--surface) px-1.5 active:cursor-grabbing"
      >
        <button
          type="button"
          onClick={close}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Close"
          className="size-3 border border-black bg-(--surface-light) shadow-[inset_-1px_-1px_0_var(--surface-dark)] active:bg-(--ink)"
        />
        <span aria-hidden className="stripes h-3 flex-1 opacity-70" />
        <span className="bg-(--surface) px-2 font-title text-[12px] tracking-tight">
          {title}
        </span>
        <span aria-hidden className="stripes h-3 flex-1 opacity-70" />
      </div>
      <div className="os-scroll min-h-0 flex-1 p-4 select-text">{children}</div>
    </section>
  )
}
