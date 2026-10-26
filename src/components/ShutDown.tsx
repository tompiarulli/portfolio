import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

import {
  START_EXITS,
  START_SCREENS,
  preloadStartScreen,
} from '#/components/start'
import { site } from '#/lib/site'
import { currentTheme } from '#/lib/theme'

/** Shut Down plays out in stages: the desktop chrome collapses (CSS keyed
 *  off `data-off` on <html>), a splash card counts the system down, the
 *  picture tube switches off and the room goes dark, then the theme's own
 *  start screen comes up over its backdrop, making its own entrance (see
 *  components/start). Any click or key boots straight back
 *  in: the chrome folds open again. */
type Phase = 'closing' | 'down' | 'tube' | 'dark' | 'title'

// Timed stages: how long each holds, and what follows. The splash card
// moves on when its steps run out instead.
const HOLD: Partial<Record<Phase, number>> = {
  closing: 700,
  tube: 500,
  dark: 500,
}
const NEXT: Partial<Record<Phase, Phase>> = {
  closing: 'down',
  tube: 'dark',
  dark: 'title',
}

// Whole squares in the progress bar. It fills one square per tick, and the
// status line moves through `steps` as the squares fill.
const CELLS = 18
const TICK = 80

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

/** The splash card; its status line and progress bar walk through
 *  `steps`. */
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
    <div className="absolute top-1/2 left-1/2 w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border border-(--ink) bg-(--surface) text-(--ink) shadow-(--window-shadow)">
      <div className="flex items-center gap-4 border-b border-dotted border-(--ink) p-4">
        <span aria-hidden className="logo shrink-0 [--logo-size:48px]" />
        <div className="min-w-0">
          <p className="font-mono text-lg leading-tight">{site.os}</p>
          <p className="truncate">{title}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex justify-between gap-4 font-mono">
          {/* A status line, read out as the steps change; the percentage
              would be too chatty. */}
          <output className="truncate">{step}…</output>
          <span aria-hidden className="tabular-nums">
            {pct}%
          </span>
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

/** `straight` goes straight to the start screen, for `?start`. */
export function ShutDown({
  onBoot,
  straight = false,
}: {
  onBoot: () => void
  straight?: boolean
}) {
  const [phase, setPhase] = useState<Phase>(() =>
    reducedMotion() || straight ? 'title' : 'closing',
  )
  const dialog = useRef<HTMLDialogElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  // The theme's start screen, fetched now so it's ready by the time the
  // card has counted down.
  const [theme] = useState(currentTheme)
  const Screen = START_SCREENS[theme]
  useEffect(() => preloadStartScreen(theme), [theme])

  // Modal, so it takes focus and leaves the rest of the desktop inert.
  useEffect(() => {
    const d = dialog.current
    d?.showModal()
    return () => d?.close()
  }, [])

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

  const ready = phase === 'title'
  // Once the start screen is up, any click, tap or key boots, after the
  // screen's exit if it has one (none without motion).
  const [leaving, setLeaving] = useState(false)
  const leave = useCallback(
    () =>
      START_EXITS[theme] && !reducedMotion() ? setLeaving(true) : onBoot(),
    [theme, onBoot],
  )
  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(onBoot, START_EXITS[theme])
    return () => clearTimeout(t)
  }, [leaving, onBoot, theme])
  useEffect(() => {
    if (!ready) return
    button.current?.focus()
    window.addEventListener('keydown', leave)
    return () => window.removeEventListener('keydown', leave)
  }, [ready, leave])

  return (
    <dialog
      ref={dialog}
      aria-label="Shut down"
      aria-busy={!ready}
      // Escape doesn't dismiss it, it boots like any other key. If the
      // browser closes it anyway, boot.
      onCancel={(e) => e.preventDefault()}
      onClose={(e) => !e.currentTarget.open && onBoot()}
      // Black while the tube switches off and the room is dark; clear
      // otherwise, so the desktop's backdrop shows behind the start screen.
      className={`fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 p-0 text-(--ink) outline-none backdrop:bg-transparent ${phase === 'tube' || phase === 'dark' ? 'bg-(--off)' : 'bg-transparent'}`}
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
          {/* The whole screen is the button; the screen over it lets
              clicks through. */}
          <button
            ref={button}
            type="button"
            aria-label="Press any key to start"
            onClick={leave}
            className="absolute inset-0 cursor-pointer outline-none"
          />
          {/* Dark until the theme's screen arrives, so the backdrop never
              shows before its entrance. */}
          <Suspense fallback={<div className="absolute inset-0 bg-(--off)" />}>
            {/* Never in the way of a click. */}
            <div className="pointer-events-none absolute inset-0">
              <Screen leaving={leaving} />
            </div>
          </Suspense>
        </>
      )}
    </dialog>
  )
}
