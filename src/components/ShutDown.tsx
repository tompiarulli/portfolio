import { useEffect, useRef, useState } from 'react'

import { build } from '#/lib/build'
import { site } from '#/lib/site'

/** Shut Down plays out in stages: the desktop chrome collapses (CSS keyed
 *  off `data-off` on <html>), a splash card counts the system down, the
 *  picture tube switches off, the room goes dark, then a game-style start
 *  screen comes up. Touching the grass boots straight back in: the chrome
 *  folds open again. The splash card and the tube follow the theme; the
 *  start screen is the same on every theme. */
type Phase = 'closing' | 'down' | 'tube' | 'dark' | 'title'

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
  dark: 'title',
}

// Whole squares in the progress bar. It fills one square per tick, and the
// status line moves through `steps` as the squares fill.
const CELLS = 18
const TICK = 80

// The start screen's pixel art, as cells keyed `x,y` with a colour token.
type Cells = Map<string, string>

/** Draws cells as one crisp path per colour, a unit square per cell, on a
 *  `width` by `height` grid. */
function Pixels({
  cells,
  width,
  height,
  className,
}: {
  cells: Cells
  width: number
  height: number
  className: string
}) {
  const paths = new Map<string, string>()
  for (const [key, fill] of cells) {
    const [x, y] = key.split(',')
    paths.set(fill, `${paths.get(fill) ?? ''}M${x} ${y}h1v1h-1z`)
  }
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      className={className}
    >
      {[...paths].map(([fill, d]) => (
        <path key={fill} d={d} fill={`var(${fill})`} />
      ))}
    </svg>
  )
}

/** The title, shaded like an arcade logo and stood on an extrusion: a
 *  second copy behind it. The version, in brush script, slants across
 *  its lower right corner. */
function Title() {
  return (
    <p
      aria-hidden
      className="relative -top-[3vh] grid font-(family-name:--start-title-font) text-[96px] leading-none *:col-start-1 *:row-start-1 sm:text-[144px]"
    >
      <span className="title-extrude">TomOS</span>
      <span className="title-bands">TomOS</span>
      <span className="script absolute -right-[0.3em] -bottom-[0.26em] -rotate-8 font-(family-name:--script-font) text-[0.45em]">
        v{site.version}
      </span>
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

// A few blades of grass: where each one roots, how tall it grows, and how
// far its tip leans. The second frame bends them all one cell further, and
// the two alternate like a sprite in the wind.
const BLADES: [x: number, height: number, lean: number][] = [
  [0, 9, -3],
  [3, 14, -2],
  [6, 17, 1],
  [9, 12, 3],
  [11, 8, 4],
]
const GRASS_WIDTH = 22
const GRASS_HEIGHT = 17
// Margin either side for the leaning tips.
const GRASS_LEFT = 4
// Rows of solid grass across the roots.
const CLUMP = 6

/** One frame of the blades: each curves toward its lean, two cells wide
 *  until it tapers to one near the tip, dark at the root and bright at
 *  the tip, joined at the bottom by a dark clump. */
function grass(bend: number): Cells {
  const cells: Cells = new Map()
  const base = GRASS_HEIGHT
  const first = BLADES[0]?.[0] ?? 0
  const last = (BLADES.at(-1)?.[0] ?? 0) + 1
  for (let y = base - CLUMP; y < base; y++)
    for (let x = first; x <= last; x++)
      cells.set(`${x + GRASS_LEFT},${y}`, '--grass-dark')
  for (const [root, height, lean] of BLADES) {
    for (let i = 0; i < height; i++) {
      const t = i / (height - 1)
      const x = Math.round(root + (lean + bend) * t * t) + GRASS_LEFT
      const y = base - 1 - i
      const fill =
        t > 0.85
          ? '--grass-tip'
          : t > 0.55
            ? '--grass-light'
            : t > 0.25
              ? '--grass'
              : '--grass-dark'
      cells.set(`${x},${y}`, fill)
      if (t < 0.75) cells.set(`${x + 1},${y}`, fill)
    }
  }
  return cells
}
const FRAMES = [grass(0), grass(1)]

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

export function ShutDown({ onBoot }: { onBoot: () => void }) {
  const [phase, setPhase] = useState<Phase>(() =>
    reducedMotion() ? 'title' : 'closing',
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
  // Only the grass boots, by click, tap, or Enter or Space once it has
  // focus.
  useEffect(() => {
    if (ready) button.current?.focus()
  }, [ready])

  const bg =
    phase === 'closing' || phase === 'down' ? 'bg-transparent' : 'bg-(--off)'

  return (
    <dialog
      ref={dialog}
      aria-label="Shut down"
      aria-busy={!ready}
      // Escape doesn't dismiss it; only the grass boots. If
      // the browser closes it anyway, boot.
      onCancel={(e) => e.preventDefault()}
      onClose={(e) => !e.currentTarget.open && onBoot()}
      className={`fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 p-0 text-(--ink) outline-none backdrop:bg-transparent ${bg}`}
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
          {/* The dithers the sky and title use (the sky's colours sit
              closer together, so it gets finer steps), and a filter that
              shaves the version's marker strokes thinner, since the face
              comes in one weight. */}
          <svg aria-hidden className="absolute size-0">
            <Dither id="title-dither" levels={8} />
            <Dither id="sky-dither" levels={16} />
            <filter id="script-thin">
              <feMorphology operator="erode" radius="1" />
            </filter>
          </svg>
          <div aria-hidden className="start-sky absolute inset-0" />
          <div aria-hidden className="fade-in grid-fade absolute inset-0">
            <div className="scroll-grid" />
          </div>
          {/* Sizes are in pixels, since rems follow the theme's text size
              and this screen is the same on every theme. The prompt sits
              20px under the grass, which is nudged up 1.5vh, against the
              column's 5vh gap. */}
          <div className="fade-in absolute inset-0 flex flex-col items-center justify-center gap-[5vh] px-4">
            <Title />
            <button
              ref={button}
              type="button"
              aria-label="Touch Grass to Start"
              onClick={onBoot}
              className="relative -top-[1.5vh] grid w-[min(40vw,154px)] cursor-pointer outline-offset-8 outline-(--start-text) *:col-start-1 *:row-start-1 focus-visible:outline-2"
            >
              {FRAMES.map((cells, i) => (
                <Pixels
                  key={i}
                  cells={cells}
                  width={GRASS_WIDTH}
                  height={GRASS_HEIGHT}
                  className={i ? 'sway-b' : 'sway-a'}
                />
              ))}
            </button>
            <span
              aria-hidden
              className="blink prompt-glow mt-[calc(20px-6.5vh)] pl-[0.3em] font-(family-name:--prompt-font) text-[14px] font-bold tracking-[0.3em] whitespace-nowrap uppercase sm:pl-[0.4em] sm:text-[16px] sm:tracking-[0.4em]"
            >
              Touch Grass to Start
            </span>
          </div>
          <p
            aria-hidden
            className="fade-in absolute inset-x-0 bottom-4 text-center font-(family-name:--start-font) text-[11.5px] text-(--start-text)"
          >
            Build {build.commit}
            {build.date && ` (${build.date})`}
          </p>
        </>
      )}
    </dialog>
  )
}
