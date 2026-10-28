import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

import type { ShutDownProps } from '#/components/start'
import { build } from '#/lib/build'
import { site } from '#/lib/site'

/** Pieces the themes' start screens share. Each screen lays them out and
 *  animates them its own way; their colours and type come from the theme's
 *  tokens (see "Start screen" in styles.css). */

const NAME = 'TomOS'

/** The title, shaded in bands and stood on an extrusion: a second copy
 *  behind it. The version sits across its lower right corner. `taper` sets
 *  it in capitals leaning forward, each letter smaller than the last, as if
 *  rushing into the distance. */
export function Title({ taper = false }: { taper?: boolean }) {
  const name = taper
    ? [...NAME].map((c, i) => (
        <span key={i} style={{ '--i': i } as CSSProperties}>
          {c}
        </span>
      ))
    : NAME
  return (
    <p
      aria-hidden
      className={`relative grid font-(family-name:--start-title-font) text-[calc(96px*var(--start-title-scale))] leading-none [font-weight:var(--start-title-weight)] tracking-(--start-title-tracking) *:col-start-1 *:row-start-1 sm:text-[calc(144px*var(--start-title-scale))] ${taper ? 'title-taper' : ''}`}
    >
      <span className="title-extrude">{name}</span>
      <span className="title-bands">{name}</span>
      <span className="script">v{site.version}</span>
    </p>
  )
}

/** The build this is, along the bottom. */
export function BuildLine() {
  return (
    <p
      aria-hidden
      className="fade-in absolute inset-x-0 bottom-4 text-center font-(family-name:--start-font) text-[11.5px] text-(--start-text)"
    >
      Build {build.commit}
      {build.date && ` (${build.date})`}
    </p>
  )
}

// Whole squares in the progress bar. It fills one square per tick, and the
// status line moves through the steps as the squares fill.
const CELLS = 18
const TICK = 80

/** A plain shut down: a splash card counts the system down, the picture
 *  tube switches off and the room goes dark. */
export function ShutDownCard({ onDone }: ShutDownProps) {
  const [stage, setStage] = useState<'card' | 'tube' | 'dark'>('card')
  useEffect(() => {
    if (stage === 'card') return
    const t = setTimeout(
      stage === 'tube' ? () => setStage('dark') : onDone,
      500,
    )
    return () => clearTimeout(t)
  }, [stage, onDone])
  return stage === 'card' ? (
    <Splash onDone={() => setStage('tube')} />
  ) : (
    <div className="absolute inset-0 bg-(--off)">
      {stage === 'tube' && (
        <div aria-hidden className="tube-off absolute inset-0 bg-(--glint)" />
      )}
    </div>
  )
}

/** The splash card; its status line and progress bar walk through the
 *  shut down's steps. */
function Splash({ onDone }: { onDone: () => void }) {
  const steps = site.shutdown.down
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
    <div className="absolute top-1/2 left-1/2 w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border border-(--frame) bg-(--surface) text-(--ink) shadow-(--window-shadow)">
      <div className="flex items-center gap-4 border-b border-dotted border-(--ink) p-4">
        <span aria-hidden className="logo shrink-0 [--logo-size:48px]" />
        <div className="min-w-0">
          <p className="font-mono text-lg leading-tight">{site.os}</p>
          <p className="truncate">Shutting down</p>
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
