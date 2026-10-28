import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import type { ShutDownProps, StartScreenProps } from '#/components/start'
import { build } from '#/lib/build'
import { site } from '#/lib/site'

/** Orbital's shut down: a ruled panel like its start screen's powers on
 *  over the rings, the version along its top, a status line walking
 *  through the steps and a bar of squares filling under it. Then its rows
 *  switch off from the bottom up and it closes to a line, then a point,
 *  as the rings wind in to their centre (Orbits). */
export function Down({ onDone }: ShutDownProps) {
  const steps = site.shutdown.down
  const [filled, setFilled] = useState(0)
  const [off, setOff] = useState(false)
  const full = filled >= CELLS
  useEffect(() => {
    const t = off
      ? setTimeout(onDone, POWER_OFF)
      : full
        ? setTimeout(() => setOff(true), HOLD)
        : setTimeout(() => setFilled(filled + 1), filled ? TICK : FIRST)
    return () => clearTimeout(t)
  }, [filled, full, off, onDone])
  const step =
    steps[
      Math.min(Math.floor((filled / CELLS) * steps.length), steps.length - 1)
    ]
  return (
    <Panel off={off}>
      <Row row={0} off={off} className={TOP}>
        <Version />
        <span className="text-(--start-muted)">Shutting down</span>
      </Row>
      {/* A status line, read out as the steps change. */}
      <Row row={1} off={off} className="px-[12px] pt-[20px] pb-[24px]">
        <output className="block truncate font-(family-name:--start-title-font) text-[28px] leading-none [font-weight:var(--start-title-weight)] tracking-(--start-title-tracking) sm:text-[40px]">
          {step}…
        </output>
      </Row>
      <Row row={2} off={off} className="border-t border-current p-[12px]">
        <div
          aria-hidden
          style={{ gridTemplateColumns: `repeat(${CELLS}, 1fr)` }}
          className="grid h-[26px] gap-[3px] border border-current p-[3px]"
        >
          {Array.from({ length: CELLS }, (_, c) => (
            <div key={c} className={c < filled ? 'bg-current' : ''} />
          ))}
        </div>
      </Row>
    </Panel>
  )
}

/** Orbital's start screen: clean and flat over the point the rings wound
 *  into, one ruled panel with the version and build along its top, the
 *  title, and the prompt along its foot. The panel powers on like a
 *  display, its rows coming up in turn; leaving, it switches off as the
 *  shut down's did while the rings spin back out, and the desktop's
 *  windows power on after it. */
export function Start({ leaving }: StartScreenProps) {
  return (
    <Panel off={leaving} hidden>
      <Row row={0} off={leaving} className={TOP}>
        <Version />
        <span className="truncate text-(--start-muted)">
          Build {build.commit}
          {build.date && ` (${build.date})`}
        </span>
      </Row>
      <Row
        row={1}
        off={leaving}
        className="px-[12px] pt-[28px] pb-[32px] font-(family-name:--start-title-font) text-[64px] leading-[0.8] [font-weight:var(--start-title-weight)] tracking-(--start-title-tracking) sm:text-[104px]"
      >
        TomOS
      </Row>
      {/* The prompt, in a ruled bar. */}
      <Row row={2} off={leaving} className="border-t border-current p-[12px]">
        <span className="block border border-current py-[6px] pl-[0.3em] text-center text-[11px] font-semibold tracking-[0.3em] whitespace-nowrap uppercase sm:text-[12px]">
          <Chevrons mark="‹" />
          {' Press any key to start '}
          <Chevrons mark="›" />
        </span>
      </Row>
    </Panel>
  )
}

/** The ruled panel, centred, powering on; `off` switches it off. */
function Panel({
  off,
  hidden = false,
  children,
}: {
  off: boolean
  /** Hidden from assistive tech, for the start screen, whose button
   *  says it all. */
  hidden?: boolean
  children: ReactNode
}) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 font-(family-name:--start-font) text-(--start-text)"
    >
      <div
        className={`w-[min(560px,100%)] border border-current bg-(--start-ground) ${off ? 'power-off' : 'power-on'}`}
      >
        {children}
      </div>
    </div>
  )
}

/** One of the panel's rows: it comes up after the row above it, and
 *  switches off after the row below. */
function Row({
  row,
  off,
  className,
  children,
}: {
  row: number
  off: boolean
  className: string
  children: ReactNode
}) {
  return (
    <div
      style={{ '--row': row, '--row-out': ROWS - 1 - row } as CSSProperties}
      className={`${off ? 'power-off-row' : 'power-on-row'} ${className}`}
    >
      {children}
    </div>
  )
}

/** The version, inverted, along the panel's top. */
function Version() {
  return (
    <span className="bg-(--start-text) px-[6px] font-semibold text-(--start-ground)">
      v{site.version}
    </span>
  )
}

/** Three chevrons either side of the prompt that fill in from the text
 *  outward, one at a time, then clear and start again, like a console
 *  waiting for input. Without motion they all show. */
function Chevrons({ mark }: { mark: '‹' | '›' }) {
  const steps = mark === '‹' ? [3, 2, 1] : [1, 2, 3]
  return (
    <>
      {steps.map((step) => (
        <span key={step} className={`chevron-${step}`}>
          {mark}
        </span>
      ))}
    </>
  )
}

const TOP =
  'flex items-center justify-between gap-4 border-b border-current px-[12px] py-[8px] text-[11px] tracking-[0.1em] sm:text-[12px]'
const ROWS = 3

// The shut down's pace: squares in the bar, the wait for the panel's rows
// to come up before the first, then one per tick; the hold once it's
// full; and how long switching off takes (see .power-off in styles.css).
const CELLS = 18
const FIRST = 900
const TICK = 70
const HOLD = 300
const POWER_OFF = 700
