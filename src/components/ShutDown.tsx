import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { SEQUENCES, START_EXITS, preloadSequence } from '#/components/start'
import type { Stage } from '#/lib/power'
import { currentTheme } from '#/lib/theme'

/** Restart plays out in stages: the desktop chrome closes (CSS keyed off
 *  `data-off` on <html>), then the theme's own sequence takes over: its
 *  shut down, then its start screen, making its own entrance (see
 *  components/start). Any click or key then boots back in, after the
 *  screen's exit, and the chrome comes back as the theme says. */
type Phase = Exclude<Stage, 'leaving'>

// How long the chrome takes to close before the theme's shut down.
const CLOSING = 700

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

/** Fetches the current theme's sequence, so Restart is instant. */
export const prefetch = () => preloadSequence(currentTheme())

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
  const [theme] = useState(currentTheme)
  const Sequence = SEQUENCES[theme]
  useEffect(() => preloadSequence(theme), [theme])

  // Modal, so it takes focus and leaves the rest of the desktop inert.
  useEffect(() => {
    const d = dialog.current
    d?.showModal()
    return () => d?.close()
  }, [])

  useEffect(() => {
    if (phase !== 'closing') return
    const t = setTimeout(() => setPhase('down'), CLOSING)
    return () => clearTimeout(t)
  }, [phase])
  const toTitle = useCallback(() => setPhase('title'), [])

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

  const stage: Stage = leaving ? 'leaving' : phase
  useEffect(() => {
    document.documentElement.dataset.off = stage
  }, [stage])
  useEffect(
    () => () => {
      delete document.documentElement.dataset.off
    },
    [],
  )

  return (
    <dialog
      ref={dialog}
      aria-label="Shut down"
      aria-busy={!ready}
      // Escape doesn't dismiss it, it boots like any other key. If the
      // browser closes it anyway, boot.
      onCancel={(e) => e.preventDefault()}
      onClose={(e) => !e.currentTarget.open && onBoot()}
      // Clear, so the desktop's backdrop shows behind the sequence, which
      // paints what it covers.
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 text-(--ink) outline-none backdrop:bg-transparent"
    >
      {/* The whole screen is the button; the sequence over it lets clicks
          through. */}
      {ready && (
        <button
          ref={button}
          type="button"
          aria-label="Press any key to start"
          onClick={leave}
          className="absolute inset-0 cursor-pointer outline-none"
        />
      )}
      {/* Dark if the sequence is still on its way once the chrome has
          closed, so the backdrop never shows before it. */}
      <Suspense
        fallback={
          phase === 'closing' ? null : (
            <div className="absolute inset-0 bg-(--off)" />
          )
        }
      >
        <div className="pointer-events-none absolute inset-0">
          <Sequence stage={stage} onDone={toTitle} />
        </div>
      </Suspense>
    </dialog>
  )
}
