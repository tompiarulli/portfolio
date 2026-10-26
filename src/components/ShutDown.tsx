import { useEffect, useRef, useState } from 'react'

import { build } from '#/lib/build'
import { site } from '#/lib/site'

/** Shut Down plays out in stages: the desktop chrome collapses (CSS keyed
 *  off `data-off` on <html>), a splash card counts the system down, the
 *  picture tube switches off, the room goes dark, the tube comes back on,
 *  and a game-style start screen comes up over the theme's own backdrop. Any click or key boots
 *  straight back in: the chrome folds open again. Everything follows the
 *  theme; the start screen takes its type and colours from tokens. */
type Phase = 'closing' | 'down' | 'tube' | 'dark' | 'on' | 'title'

// Timed stages: how long each holds, and what follows. The splash stages
// move on when their steps run out instead.
const HOLD: Partial<Record<Phase, number>> = {
  closing: 700,
  tube: 500,
  dark: 900,
  on: 600,
}
const NEXT: Partial<Record<Phase, Phase>> = {
  closing: 'down',
  tube: 'dark',
  dark: 'on',
  on: 'title',
}

// Whole squares in the progress bar. It fills one square per tick, and the
// status line moves through `steps` as the squares fill.
const CELLS = 18
const TICK = 80

/** The title, shaded in bands and stood on an extrusion: a second copy
 *  behind it. The version sits across its lower right corner.
 *  The theme styles all of it (see "Start screen" in styles.css). */
function Title() {
  return (
    <p
      aria-hidden
      className="relative grid font-(family-name:--start-title-font) text-[calc(96px*var(--start-title-scale))] leading-none [font-weight:var(--start-title-weight)] tracking-(--start-title-tracking) *:col-start-1 *:row-start-1 sm:text-[calc(144px*var(--start-title-scale))]"
    >
      <span className="title-extrude">TomOS</span>
      <span className="title-bands">TomOS</span>
      <span className="script">v{site.version}</span>
    </p>
  )
}

// Ordered dithering: a 4x4 Bayer threshold map, each cell DOT pixels
// square, nudges every pixel up to one colour step before the colours snap
// to a few steps, so a smooth gradient comes out as patterned bands. The
// map's greys are thresholds, not colours.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const DOT = 2
const BAYER_MAP = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4" width="${4 * DOT}" height="${4 * DOT}" shape-rendering="crispEdges">${BAYER.map(
    (b, i) => {
      const v = Math.round(((b + 0.5) / 16) * 255)
      return `<rect x="${i % 4}" y="${Math.floor(i / 4)}" width="1" height="1" fill="rgb(${v},${v},${v})"/>`
    },
  ).join('')}</svg>`,
)}`
/** The dither as an SVG filter, snapping each colour channel to `levels`
 *  steps; its edges snap to fully in or out. */
function Dither({ id, levels }: { id: string; levels: number }) {
  const step = 1 / (levels - 1)
  const table = Array.from({ length: levels }, (_, i) => i * step).join(' ')
  return (
    <filter
      id={id}
      x="0"
      y="0"
      width="1"
      height="1"
      colorInterpolationFilters="sRGB"
    >
      <feImage href={BAYER_MAP} width={4 * DOT} height={4 * DOT} />
      <feTile result="bayer" />
      <feComposite
        in="SourceGraphic"
        in2="bayer"
        operator="arithmetic"
        k2="1"
        k3={step}
        k4={-step / 2}
      />
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues={table} />
        <feFuncG type="discrete" tableValues={table} />
        <feFuncB type="discrete" tableValues={table} />
        <feFuncA type="discrete" tableValues="0 1" />
      </feComponentTransfer>
    </filter>
  )
}

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

/** `straight` skips to the tube coming on, for `?start`. */
export function ShutDown({
  onBoot,
  straight = false,
}: {
  onBoot: () => void
  straight?: boolean
}) {
  const [phase, setPhase] = useState<Phase>(() =>
    reducedMotion() ? 'title' : straight ? 'on' : 'closing',
  )
  const dialog = useRef<HTMLDialogElement>(null)
  const button = useRef<HTMLButtonElement>(null)

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
  // Once the start screen is up, any click, tap or key boots.
  useEffect(() => {
    if (!ready) return
    button.current?.focus()
    window.addEventListener('keydown', onBoot)
    return () => window.removeEventListener('keydown', onBoot)
  }, [ready, onBoot])

  // Clear while the chrome folds and the card counts down, black while the
  // tube switches off and the room is dark, then clear again so the
  // desktop's backdrop shows behind the start screen.
  const bg =
    phase === 'tube' || phase === 'dark' || phase === 'on'
      ? 'bg-(--off)'
      : 'bg-transparent'
  // The tube's glow, filling the screen as it comes on, fades off the
  // start screen; reduced motion starts there with no glow.
  const [glow, setGlow] = useState(() => !reducedMotion())

  return (
    <dialog
      ref={dialog}
      aria-label="Shut down"
      aria-busy={!ready}
      // Escape doesn't dismiss it, it boots like any other key. If the
      // browser closes it anyway, boot.
      onCancel={(e) => e.preventDefault()}
      onClose={(e) => !e.currentTarget.open && onBoot()}
      className={`fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 p-0 text-(--ink) transition-colors duration-200 outline-none backdrop:bg-transparent ${bg}`}
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
      {phase === 'on' && (
        <div aria-hidden className="tube-on absolute inset-0 bg-(--glint)" />
      )}
      {ready && (
        <>
          {/* The title's dither, and a filter that shaves the version's
              marker strokes thinner, since the face comes in one weight. */}
          <svg aria-hidden className="absolute size-0">
            <Dither id="title-dither" levels={8} />
            <filter id="script-thin">
              <feMorphology operator="erode" radius="1" />
            </filter>
          </svg>
          {/* The whole screen is the button. */}
          <button
            ref={button}
            type="button"
            aria-label="Press any key to start"
            onClick={onBoot}
            className="absolute inset-0 cursor-pointer outline-none"
          />
          {/* Clicks pass through to the button. Sizes are in pixels, since
              rems follow the theme's text size and this screen's layout is
              the same on every theme. The prompt is boxed in its own colour
              on the ground colour, so it reads over any backdrop; the extra
              left padding balances its letter spacing. */}
          <div
            aria-hidden
            className="fade-in pointer-events-none absolute inset-0 bg-(--start-dim)"
          />
          <div className="fade-in pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[8vh] px-4">
            <Title />
            <span
              aria-hidden
              className="blink prompt-glow rounded-(--close-radius) border border-current bg-(--start-ground) py-[8px] pr-[16px] pl-[calc(16px+0.3em)] font-(family-name:--prompt-font) text-[12px] [font-weight:var(--prompt-weight)] tracking-[0.3em] whitespace-nowrap uppercase sm:pl-[calc(16px+0.4em)] sm:text-[14px] sm:tracking-[0.4em]"
            >
              Press Any Key to Start
            </span>
          </div>
          <p
            aria-hidden
            className="fade-in absolute inset-x-0 bottom-4 text-center font-(family-name:--start-font) text-[11.5px] text-(--start-text)"
          >
            Build {build.commit}
            {build.date && ` (${build.date})`}
          </p>
          {glow && (
            <div
              aria-hidden
              onAnimationEnd={() => setGlow(false)}
              className="glow-out pointer-events-none absolute inset-0 bg-(--glint)"
            />
          )}
        </>
      )}
    </dialog>
  )
}
