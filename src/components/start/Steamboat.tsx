import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { FilmGrain } from '#/components/FilmGrain'
import type { ShutDownProps, StartScreenProps } from '#/components/start'
import { BuildLine, Title } from '#/components/start/parts'
import { site } from '#/lib/site'

/** Steamboat's shut down, like the end of an old cartoon: the desktop
 *  irises out to a point, then an end card comes up on the dimmed film,
 *  jumping and flickering, until the film runs out of the gate: a few
 *  frames flap through bright and dark, then nothing. */
export function Down({ onDone }: ShutDownProps) {
  const [part, setPart] = useState<'iris' | 'end' | 'run-out'>('iris')
  useEffect(() => {
    const t = setTimeout(
      part === 'iris'
        ? () => setPart('end')
        : part === 'end'
          ? () => setPart('run-out')
          : onDone,
      PARTS[part],
    )
    return () => clearTimeout(t)
  }, [part, onDone])
  if (part === 'iris')
    return (
      <div
        style={{ '--iris-time': `${PARTS.iris - 100}ms` } as CSSProperties}
        className="iris-out absolute inset-0"
      />
    )
  if (part === 'end')
    return (
      <Card>
        <div className="flex flex-col items-center gap-[4vh]">
          {/* Set as the title is: in bands over its extrusion. */}
          <p className="relative grid font-(family-name:--start-title-font) text-[calc(96px*var(--start-title-scale))] leading-none [font-weight:var(--start-title-weight)] tracking-(--start-title-tracking) *:col-start-1 *:row-start-1 sm:text-[calc(144px*var(--start-title-scale))]">
            <span aria-hidden className="title-extrude">
              {site.shutdown.end}
            </span>
            <span className="title-bands">{site.shutdown.end}</span>
          </p>
          <Rule />
        </div>
      </Card>
    )
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-(--off)">
      <div className="run-out absolute inset-0" />
      <div className="run-out-band absolute inset-x-0 top-0 h-[14vh]" />
    </div>
  )
}

/** Steamboat's start screen: a countdown leader runs first, then a
 *  cartoon title card irises in on the dimmed film, like a projected
 *  print. It jumps as the projector catches up, then flickers, with grain
 *  and the odd scratch; its prompt is held still. Starting irises out on
 *  it, and the desktop irises in (see "Shut Down" in styles.css). */
export function Start({ leaving }: StartScreenProps) {
  const [count, setCount] = useState(() =>
    matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : LEADER[0],
  )
  useEffect(() => {
    if (!count) return
    const t = setTimeout(() => setCount(count - 1), BEAT)
    return () => clearTimeout(t)
  }, [count])
  if (count > LEADER[1]) return <Leader count={count} />
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <Card>
        <div className="flex flex-col items-center gap-[6vh]">
          <Presents />
          <Title />
          <div className="mt-[3vh] flex flex-col items-center gap-[10px]">
            <Credit />
            <Rule />
          </div>
        </div>
        <BuildLine />
      </Card>
      <div className="iris-in absolute inset-0" />
      {leaving && (
        <div
          style={{ '--iris-time': '400ms' } as CSSProperties}
          className="iris-out absolute inset-0"
        />
      )}
    </div>
  )
}

/** A card on the dimmed film, like a projected print: it jumps as the
 *  projector catches up, then flickers, with grain and two scratches that
 *  flash down the frame now and then (hidden without motion). */
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-(--start-dim)" />
      <div className="projector-start absolute inset-0">
        <div className="film-flicker absolute inset-0 flex flex-col items-center justify-center px-4">
          {children}
        </div>
      </div>
      <FilmGrain />
      <div aria-hidden className="absolute inset-0">
        <div className="film-scratch absolute inset-y-0 left-[31%] w-px bg-(--start-text)" />
        <div className="film-scratch absolute inset-y-0 left-[72%] w-px bg-(--start-text) [animation-delay:-2.3s]" />
      </div>
    </div>
  )
}

/** A countdown leader: a number a beat, in a ringed frame crossed by its
 *  sights, as a sweep goes round. */
function Leader({ count }: { count: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-(--start-ground) text-(--start-text)">
      <div className="film-flicker absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-current" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-current" />
        <div
          // Restarts with each number.
          key={count}
          style={{ '--beat': `${BEAT}ms` } as CSSProperties}
          className="leader-sweep absolute size-[min(70vh,80vw)] rounded-full"
        />
        <div className="absolute size-[min(70vh,80vw)] rounded-full border-2 border-current" />
        <div className="absolute size-[min(56vh,64vw)] rounded-full border border-current" />
        <p className="relative font-(family-name:--start-title-font) text-[min(40vh,48vw)] leading-none">
          {count}
        </p>
      </div>
      <FilmGrain />
    </div>
  )
}

// How long each part of the shut down takes, in ms (the run-out's frames
// are in .run-out in styles.css).
const PARTS = { iris: 1000, end: 2400, 'run-out': 1100 } as const
// The leader counts from the first number, a beat each, and the card cuts
// in after the second.
const LEADER = [5, 2] as const
const BEAT = 500

/** Who presents it, above the title, in small spaced capitals. */
function Presents() {
  return (
    <p
      aria-hidden
      className="-mb-[5vh] pl-[0.35em] font-(family-name:--prompt-font) text-[11px] [font-weight:var(--prompt-weight)] tracking-[0.35em] text-(--prompt) uppercase [text-shadow:0.08em_0.1em_0_var(--start-title-shade)] sm:text-[13px]"
    >
      {site.name} {site.shutdown.presents}
    </p>
  )
}

/** A thin rule under the credit, a diamond at each end. */
function Rule() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 8"
      className="h-[8px] w-[min(240px,70vw)] text-(--prompt) [filter:drop-shadow(1.5px_2px_0_var(--start-title-shade))]"
    >
      <path d="M12 4h216" stroke="currentColor" strokeWidth="1" />
      <path d="M4 4l4-3 4 3-4 3zM228 4l4-3 4 3-4 3z" fill="currentColor" />
    </svg>
  )
}

/** The prompt set like a credit line on the card: small spaced capitals
 *  either side of one word in the title's face, all cast in its shadow.
 *  The small capitals carry their spacing on the left too, to balance. */
function Credit() {
  const small =
    'pl-[0.35em] font-(family-name:--prompt-font) text-[11px] [font-weight:var(--prompt-weight)] tracking-[0.35em] sm:text-[13px]'
  return (
    <p
      aria-hidden
      className="flex items-baseline gap-[10px] whitespace-nowrap text-(--prompt) uppercase [text-shadow:0.08em_0.1em_0_var(--start-title-shade)] sm:gap-[14px]"
    >
      <span className={small}>Press</span>
      <span className="font-(family-name:--start-title-font) text-[24px] tracking-[0.02em] sm:text-[30px]">
        Any Key
      </span>
      <span className={small}>to Start</span>
    </p>
  )
}
