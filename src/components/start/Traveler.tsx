import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import type { ShutDownProps, StartScreenProps } from '#/components/start'
import { BuildLine, Title } from '#/components/start/parts'
import { setPower } from '#/lib/power'
import { site } from '#/lib/site'

/** OUTATIME's shut down: it runs out of fuel. As the dock and menu bar
 *  finish folding and the screen dims (DOWN_AT, and data-dim in
 *  styles.css), a gauge rises in, full, and drains, its cells turning red
 *  as it runs low and its empty lamp blinking, while the streaks slow with
 *  it (Streaks) and coast to a stop as it runs dry. Down to its last cell,
 *  that cell gutters, then the gauge stutters out a piece at a time and
 *  the screen goes dark. */
export function Down({ onDone }: ShutDownProps) {
  const [part, setPart] = useState<'drain' | 'out' | 'dark'>('drain')
  const [level, setLevel] = useState(1)
  useEffect(() => {
    let frame = 0
    const start = performance.now() + RISE
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / DRAIN))
      const left = 1 - (1 - LAST) * (1 - (1 - t) ** 2)
      setLevel(left)
      // The streaks run on what's left, and stop once it's all but gone.
      setPower(t < 1 ? left : 0)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      setPower(undefined)
    }
  }, [])
  useEffect(() => {
    const t = setTimeout(
      part === 'drain'
        ? () => setPart('out')
        : part === 'out'
          ? () => setPart('dark')
          : onDone,
      part === 'drain' ? RISE + DRAIN + EMPTY : part === 'out' ? OUT : 300,
    )
    return () => clearTimeout(t)
  }, [part, onDone])
  // When each piece stutters out, within OUT ms of the gauge going out
  // (less the stutter itself, 280 ms in styles.css);
  // picked once, so they hold across renders.
  const [delays] = useState(() =>
    Array.from(
      { length: CELLS + 3 },
      () => `${Math.round(Math.random() * (OUT - 300))}ms`,
    ),
  )
  const out = part !== 'drain'
  const piece = (i: number, className = '') => ({
    className: `${className} ${out ? 'segment-out' : ''}`,
    style: { '--at': delays[i] } as CSSProperties,
  })
  const lit = Math.ceil(level * CELLS)
  const low = lit <= CELLS / 4
  return (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <div
        aria-hidden
        className={`fade-in flex flex-col gap-[0.8em] border border-(--frame) bg-(--gauge-panel) px-[1.4em] py-[1.2em] font-(family-name:--prompt-font) text-[11px] font-bold tracking-[0.2em] text-(--gauge-label) uppercase sm:text-[14px] ${low ? '[--fuel:var(--gauge-low)]' : '[--fuel:var(--gauge)]'}`}
      >
        <div className="flex items-center justify-between gap-[2em]">
          <span {...piece(CELLS)}>{site.shutdown.fuel.label}</span>
          <span {...piece(CELLS + 1, 'flex items-center gap-[0.6em]')}>
            <span
              className={`size-[0.8em] border border-(--gauge-low) ${low ? 'lamp-blink bg-(--gauge-low) shadow-[0_0_0.8em_var(--gauge-low)]' : ''}`}
            />
            {site.shutdown.fuel.empty}
          </span>
        </div>
        <div className="flex gap-[0.35em]">
          {Array.from({ length: CELLS }, (_, i) => (
            <span
              key={i}
              className={`h-[2.8em] w-[1.5em] border border-(--fuel) sm:w-[1.7em] ${
                i < lit
                  ? `bg-(--fuel) shadow-[0_0_0.8em_var(--fuel)] ${out ? 'segment-out' : i === 0 && lit === 1 ? 'gutter' : ''}`
                  : ''
              }`}
              style={piece(i).style}
            />
          ))}
        </div>
        <div {...piece(CELLS + 2, 'flex justify-between')}>
          <span>{site.shutdown.fuel.low}</span>
          <span>{site.shutdown.fuel.high}</span>
        </div>
      </div>
      {part === 'dark' && (
        <div aria-hidden className="fade-in absolute inset-0 bg-(--off)" />
      )}
    </div>
  )
}

/** OUTATIME's start screen: a game's heads-up display over the grid. The
 *  title in orange capitals rushing into the distance, with the version in
 *  yellow glitched type, and the prompt glowing cyan in the title's face,
 *  like an arcade cabinet's attract screen, while arcs of electricity
 *  crackle across the streaks behind (Arcs). It comes up out of the dark;
 *  the title flies in, the version strikes on like lightning, and the
 *  prompt drops into place. Leaving, the arcs build to a storm as the
 *  streaks hit full speed (Streaks), the title rushes past, and the screen
 *  flashes white; the desktop comes back out of the flash (see "Shut
 *  Down" in styles.css). */
export function Start({ leaving }: StartScreenProps) {
  return (
    <>
      <Arcs storm={leaving} />
      <div
        className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[11vh] px-4 ${leaving ? 'fly-past' : ''}`}
      >
        <div className="fly-in">
          <Title taper />
        </div>
        <p
          aria-hidden
          className="drop-in prompt-glow pl-[0.25em] font-(family-name:--start-title-font) text-[15px] tracking-[0.25em] uppercase sm:text-[18px]"
        >
          Press Any Key to Start
        </p>
      </div>
      <BuildLine />
      <div aria-hidden className="from-dark absolute inset-0 bg-(--off)" />
      {leaving && (
        <div aria-hidden className="flash-in absolute inset-0 bg-(--glint)" />
      )}
    </>
  )
}

/** A flash of electricity: its paths (the arc, then its forks), when it
 *  struck, and how long it lasts, in ms. */
type Bolt = { paths: number[][][]; born: number; life: number }

/** Arcs of electricity crackling across the screen: a jagged bolt now and
 *  then, forking as it goes, flickering for a moment before it's gone, in
 *  --bolt round a --bolt-core. In a `storm` they come thick and fast, and
 *  longer. None without motion. */
function Arcs({ storm }: { storm: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const stormy = useRef(storm)
  useEffect(() => {
    stormy.current = storm
  }, [storm])
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const css = getComputedStyle(canvas)
    const glow = css.getPropertyValue('--bolt').trim()
    const core = css.getPropertyValue('--bolt-core').trim()
    let width = 0
    let height = 0
    let scale = 1
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Thicker on bigger screens.
      scale = Math.max(1, Math.min(width, height) / 600)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    let bolts: Bolt[] = []
    // The first arc waits for the title to land.
    let next = performance.now() + 1200
    let stormFrom = 0
    let frame = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      // The storm breaks at once, whatever the idle wait.
      if (stormy.current && !stormFrom) next = stormFrom = now
      // Idle, an arc every second or so, sometimes two at once; in a
      // storm, more and more of them, longer and wilder.
      const fury = stormFrom ? Math.min(1, (now - stormFrom) / 350) : 0
      if (now >= next) {
        const n = stormFrom ? 1 + Math.round(fury) : Math.random() < 0.3 ? 2 : 1
        for (let i = 0; i < n; i++) bolts.push(bolt(width, height, now, fury))
        next = now + (stormFrom ? 70 - fury * 35 : 500 + Math.random() * 1300)
      }
      bolts = bolts.filter((b) => now - b.born < b.life)
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'
      for (const b of bolts) {
        // Flickers on and off as it lives, dimming as it goes.
        if (Math.random() < 0.3) continue
        const fade = 1 - (now - b.born) / b.life
        for (const [line, color, alpha] of STROKES) {
          ctx.globalAlpha = alpha * fade
          ctx.strokeStyle = color === 'core' ? core : glow
          ctx.lineWidth = line * scale
          ctx.beginPath()
          for (const path of b.paths)
            path.forEach(([x = 0, y = 0], i) =>
              i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
            )
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])
  return <canvas ref={ref} aria-hidden className="absolute inset-0 size-full" />
}

/** One bolt, struck in from beyond an edge of the screen, mostly the
 *  sides, along the streaks: across to the far edge, or into the screen,
 *  where it splits. It forks on the way. `fury`, 0 to 1, sends more of
 *  them all the way across. */
function bolt(width: number, height: number, now: number, fury: number) {
  const side = Math.random() < 0.75
  const flip = Math.random() < 0.5
  const across = Math.random() < 0.4 + fury * 0.4
  const reach = across ? 1 : 0.45 + Math.random() * 0.35
  const out = OUTSIDE
  // Where it comes from and goes to, across the screen as 0 to 1, along
  // the edge it leaves as 0 to 1.
  const from = [-out, Math.random()]
  const to = [across ? 1 + out : reach, Math.random()]
  const place = ([u = 0, v = 0]: number[]) => {
    const along = flip ? 1 - u : u
    return side ? [along * width, v * height] : [v * width, along * height]
  }
  const a = place(from)
  const b = place(to)
  const length = Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!)
  const arc = jag(a, b, 7, length * 0.12)
  const paths = [arc]
  // Forks off the way, and a few more where it ends inside.
  const forks = 1 + Math.round(Math.random() * 2) + (across ? 0 : 2)
  for (let f = 0; f < forks; f++) {
    const at = across || f < forks - 2 ? 0.2 + Math.random() * 0.6 : 0.98
    const start = arc[Math.floor(at * (arc.length - 1))]!
    const angle =
      Math.atan2(b[1]! - a[1]!, b[0]! - a[0]!) + (Math.random() - 0.5) * 1.6
    const span = length * (0.12 + Math.random() * 0.2)
    const end = [
      start[0]! + Math.cos(angle) * span,
      start[1]! + Math.sin(angle) * span,
    ]
    paths.push(jag(start, end, 5, span * 0.2))
  }
  return { paths, born: now, life: 120 + Math.random() * 160 }
}

/** A line from `a` to `b` broken into a jagged one: its midpoint knocked
 *  aside, mostly across the line, then each half's, by half as much each
 *  time, `depth` times. */
function jag(
  a: number[],
  b: number[],
  depth: number,
  rough: number,
): number[][] {
  const [ax = 0, ay = 0] = a
  const [bx = 0, by = 0] = b
  if (!depth) return [a, b]
  const length = Math.hypot(bx - ax, by - ay) || 1
  // Across the line, and along it.
  const [nx, ny] = [-(by - ay) / length, (bx - ax) / length]
  const across = (Math.random() - 0.5) * rough * 2
  const along = (Math.random() - 0.5) * rough * 0.5
  const mid = [
    (ax + bx) / 2 + nx * across + ny * along,
    (ay + by) / 2 + ny * across - nx * along,
  ]
  return [
    ...jag(a, mid, depth - 1, rough / 2),
    ...jag(mid, b, depth - 1, rough / 2).slice(1),
  ]
}

/** Each bolt is drawn three times over: a wide faint glow, the bolt, and a
 *  thin bright core; line width, colour, opacity. */
const STROKES = [
  [12, 'glow', 0.22],
  [4.5, 'glow', 0.8],
  [1.8, 'core', 1],
] as const
/** How far beyond the edge each bolt starts, as a share of the screen. */
const OUTSIDE = 0.05

// The gauge takes RISE ms to come up, then the fuel drains over DRAIN ms
// down to its LAST, on a gauge of CELLS, and runs on empty for EMPTY ms
// before the gauge stutters out over OUT ms.
const RISE = 200
const DRAIN = 750
const EMPTY = 300
const OUT = 500
const LAST = 0.05
const CELLS = 10
