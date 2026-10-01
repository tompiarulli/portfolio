import { useEffect, useState } from 'react'
import { site } from '#/lib/site'

/** Shut Down plays out in stages: the desktop chrome collapses (CSS keyed
 *  off `data-off` on <html>), a splash card counts the system down, the
 *  picture tube switches off, the room goes dark, then a photo of outside
 *  comes up. Touching the grass boots: the splash card counts back up, then
 *  the chrome folds open again. */
type Phase = 'closing' | 'down' | 'tube' | 'dark' | 'outside' | 'up'

// Timed stages: how long each holds, and what follows. The splash stages
// move on when their steps run out instead.
const HOLD: Partial<Record<Phase, number>> = {
  closing: 700,
  tube: 500,
  dark: 900,
}
const NEXT: Partial<Record<Phase, Phase>> = {
  closing: 'down',
  tube: 'dark',
  dark: 'outside',
}

// Whole squares in the progress bar. It fills one square per tick, and the
// status line moves through `steps` as the squares fill.
const CELLS = 18
const TICK = 80

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

/** The splash card: the system mark, name and what it is doing, then a
 *  status line and a segmented progress bar that walk through `steps`. */
function Splash({
  title,
  steps,
  onDone,
}: {
  title: string
  steps: readonly string[]
  onDone: () => void
}) {
  const [filled, setFilled] = useState(1)
  const full = filled >= CELLS
  useEffect(() => {
    const t = setTimeout(
      full ? onDone : () => setFilled(filled + 1),
      full ? TICK * 3 : TICK,
    )
    return () => clearTimeout(t)
  }, [filled, full, onDone])
  const pct = Math.round((filled / CELLS) * 100)
  const step =
    steps[
      Math.min(Math.floor((filled / CELLS) * steps.length), steps.length - 1)
    ]
  return (
    <div
      role="status"
      aria-label={title}
      className="absolute top-1/2 left-1/2 w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border border-(--ink) bg-(--surface) text-(--ink) shadow-(--window-shadow)"
    >
      <div className="flex items-center gap-4 border-b border-dotted border-(--ink) p-4">
        <span aria-hidden className="logo shrink-0 [--logo-size:48px]" />
        <div className="min-w-0">
          <p className="font-title text-lg leading-tight">{site.os}</p>
          <p className="truncate">{title}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex justify-between gap-4 font-title">
          <span className="truncate">{step}…</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <div
          aria-hidden
          style={{ gridTemplateColumns: `repeat(${CELLS}, 1fr)` }}
          className="inset-well grid h-6 gap-[3px] p-[3px]"
        >
          {Array.from({ length: CELLS }, (_, c) => (
            <div key={c} className={c < filled ? 'bg-(--ink)' : ''} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ShutDown({ onBoot }: { onBoot: () => void }) {
  const [phase, setPhase] = useState<Phase>(() =>
    reducedMotion() ? 'outside' : 'closing',
  )

  useEffect(() => {
    document.documentElement.dataset.off = ''
    return () => {
      delete document.documentElement.dataset.off
    }
  }, [])

  useEffect(() => {
    const next = NEXT[phase]
    if (!next) return
    const t = setTimeout(() => setPhase(next), HOLD[phase])
    return () => clearTimeout(t)
  }, [phase])

  const ready = phase === 'outside'
  // Touching the grass runs the boot splash; reduced motion boots at once.
  const start = () => (reducedMotion() ? onBoot() : setPhase('up'))
  useEffect(() => {
    if (!ready) return
    window.addEventListener('keydown', start)
    return () => window.removeEventListener('keydown', start)
  })

  const bg =
    phase === 'closing' || phase === 'down'
      ? 'bg-transparent'
      : phase === 'up'
        ? 'bg-(--desk)'
        : 'bg-(--off)'

  return (
    <div
      role="dialog"
      aria-label="Shut down"
      aria-busy={!ready}
      className={`fixed inset-0 z-100 overflow-hidden ${bg}`}
    >
      {phase === 'down' && (
        <Splash
          title="Shutting down"
          steps={site.shutdown.down}
          onDone={() => setPhase('tube')}
        />
      )}
      {phase === 'tube' && (
        <div aria-hidden className="tube-off absolute inset-0 bg-(--glint)" />
      )}
      {ready && (
        <>
          <img
            src="/images/grass-1920.jpg"
            srcSet="/images/grass-1280.jpg 1280w, /images/grass-1920.jpg 1920w, /images/grass-2560.jpg 2560w, /images/grass-3840.jpg 3840w"
            sizes="100vw"
            alt="Grass"
            // Without the photo, leave the room dark rather than a broken image.
            onError={(e) => (e.currentTarget.style.display = 'none')}
            className="fade-in absolute inset-0 size-full object-cover [image-rendering:auto]!"
          />
          {/* Any click on the picture boots. */}
          <button
            type="button"
            aria-label="Touch grass to start"
            onClick={start}
            className="absolute inset-0 cursor-pointer outline-none"
          />
          <span className="bevel blink pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 px-6 py-2 font-title text-base text-(--ink)">
            Touch grass to start
          </span>
        </>
      )}
      {phase === 'up' && (
        <Splash title="Starting up" steps={site.shutdown.up} onDone={onBoot} />
      )}
    </div>
  )
}
