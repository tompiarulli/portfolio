import { useEffect, useRef } from 'react'

type Props = {
  /** Sky colour. */
  background: string
  /** Colour of the stars. */
  stars: string
  /** Colour of the road, and of the pines on the horizon. */
  asphalt: string
  /** Colour of the road's edge lines and centre dashes. */
  lane: string
  /** Colours of the fire trails and their white-hot cores. */
  flame: string
  core: string
  /** Colour of the electricity crackling round the car. */
  spark: string
  /** Size of one scene pixel in CSS pixels. */
  pixel?: number
  /** Seconds between runs, as a range. */
  minWait?: number
  maxWait?: number
  /** Draw one frame and stop, for reduced motion. */
  still?: boolean
}

/** Seconds the car takes to reach 88 and vanish, then for the trails to
 *  burn and to die down. */
const DRIVE = 1.6
const BURN = 5
const EMBER = 2
/** The car's distance when the run starts and when it vanishes, in road
 *  depths: 1 is the bottom of the screen, 2 halfway to the horizon. */
const NEAR = 0.8
const FAR = 7
/** Half the road's width and half the car's track at the bottom of the
 *  screen, as fractions of the screen's width. */
const ROAD = 0.42
const TRACK = 0.11
/** Tallest flame, at the bottom of the screen, in scene pixels. */
const FLAME = 26

/** 2x2 ordered dither, for stepping the glow and the ground into bands. */
const BAYER = [
  [0, 0.5],
  [0.75, 0.25],
]

const random = (min: number, max: number) => min + Math.random() * (max - min)

/** A CSS colour as [r, g, b], read back through a canvas. */
function rgb(g: CanvasRenderingContext2D, color: string) {
  g.fillStyle = color
  const n = parseInt(String(g.fillStyle).slice(1), 16) || 0
  return [n >> 16, (n >> 8) & 255, n & 255]
}

/** Seeded random, so the scenery keeps its shape when the window resizes. */
function seeded(seed: number) {
  return (min: number, max: number) => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return min + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (max - min)
  }
}

/**
 * The still part of the scene, drawn once per size: a night sky glowing
 * faintly at the horizon, the Twin Pines on it, and a road running
 * straight to the vanishing point between dark verges, its edge lines and
 * centre dashes fading into the distance.
 */
function makeScene(
  w: number,
  h: number,
  horizon: number,
  colors: Pick<Props, 'background' | 'stars' | 'asphalt' | 'lane'>,
) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const g = canvas.getContext('2d')
  if (!g || w < 1 || h < 1) return canvas
  const [sky, glow, road, lane] = [
    colors.background,
    colors.stars,
    colors.asphalt,
    colors.lane,
  ].map((c) => rgb(g, c))
  const mix = (a: number[], b: number[], t: number) =>
    `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join()})`
  /** Alpha stepped into eighths, dithered, so gradients stay pixel art. */
  const step = (a: number, x: number, y: number) =>
    Math.floor(Math.min(1, Math.max(0, a)) * 8 + BAYER[y & 1][x & 1]) / 8

  g.fillStyle = colors.background
  g.fillRect(0, 0, w, h)
  // The glow of the town beyond the horizon, in bands.
  const band = Math.min(40, horizon)
  for (let y = horizon - band; y < horizon; y++) {
    const t = (y - horizon + band) / band
    for (let x = 0; x < w; x++) {
      const a = step(t * t * 0.1, x, y)
      if (!a) continue
      g.fillStyle = mix(sky, glow, a)
      g.fillRect(x, y, 1, 1)
    }
  }

  // The verges, darkening into the distance, and the road between them.
  const cx = w / 2
  const depth = h - horizon
  for (let y = horizon; y < h; y++) {
    const t = (y - horizon) / depth
    g.fillStyle = mix(sky, road, 0.35 + 0.35 * t)
    g.fillRect(0, y, w, 1)
    const half = w * ROAD * t
    g.fillStyle = mix(sky, road, 0.4 + 0.6 * t)
    g.fillRect(Math.round(cx - half), y, Math.round(half * 2), 1)
    // Markings, thicker as they near, fading into the dark ahead.
    const paint = mix(sky, lane, 0.25 + 0.55 * t)
    const line = Math.max(1, Math.round(t * 3))
    g.fillStyle = paint
    g.fillRect(Math.round(cx - half), y, line, 1)
    g.fillRect(Math.round(cx + half) - line, y, line, 1)
    // Dashes every so many road depths, so they shorten with distance.
    if (t > 0 && Math.floor(6 / t) % 2 === 0)
      g.fillRect(Math.round(cx - line / 2), y, line, 1)
  }

  // The Twin Pines, left of the road on the horizon.
  const rand = seeded(1955)
  g.fillStyle = mix(sky, road, 0.9)
  for (const [at, tall] of [
    [0.24, 22],
    [0.29, 17],
  ]) {
    const x0 = Math.round(w * at)
    for (let y = 0; y < tall; y++) {
      // Wider every other row, stepping back in at each tier.
      const half = Math.max(0, Math.floor(y / 2.2) - (y % 5 === 4 ? 1 : 0))
      g.fillRect(x0 - half, horizon - tall + y, half * 2 + 1, 1)
    }
    g.fillRect(x0, horizon - 1, 1, 2)
  }
  // A few low buildings of the mall along the horizon on the right.
  for (let x = Math.round(w * 0.62); x < w * 0.9;) {
    const width = Math.round(rand(8, 22))
    const tall = Math.round(rand(2, 5))
    g.fillRect(x, horizon - tall, width, tall)
    x += width + Math.round(rand(0, 4))
  }
  return canvas
}

type Star = { x: number; y: number; phase: number; speed: number }

/**
 * A night road outside Twin Pines Mall. Every so often an unseen car tears
 * down it towards the horizon wrapped in electricity, hits 88 and vanishes
 * in a flash, leaving two trails of fire that burn out on the tarmac.
 * Drawn on a small canvas scaled up, so every scene pixel stays square.
 */
export default function FireTrails({
  background,
  stars: starColor,
  asphalt,
  lane,
  flame,
  core,
  spark,
  pixel = 3,
  minWait = 12,
  maxWait = 25,
  still = false,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    const parent = canvas?.parentElement
    if (!canvas || !ctx || !parent) return

    let w = 0
    let h = 0
    let horizon = 0
    let scene: HTMLCanvasElement | null = null
    let stars: Star[] = []
    /** Seconds into the current run, or null between runs. */
    let run: number | null = still ? DRIVE + 1.5 : null
    let wait = random(3, 6)

    const resize = () => {
      const r = parent.getBoundingClientRect()
      w = Math.ceil(r.width / pixel)
      h = Math.ceil(r.height / pixel)
      canvas.width = w
      canvas.height = h
      horizon = Math.round(h * 0.58)
      scene = makeScene(w, h, horizon, {
        background,
        stars: starColor,
        asphalt,
        lane,
      })
      stars = Array.from({ length: Math.round((w * horizon) / 700) }, () => ({
        x: Math.floor(random(0, w)),
        y: Math.floor(random(0, horizon - 4)),
        phase: random(0, Math.PI * 2),
        speed: random(0.5, 2.5),
      }))
      draw(0)
    }

    /** The car's road depth at a time into the run: it pulls away,
     *  picking up speed until it vanishes. */
    const reach = (s: number) =>
      NEAR + (FAR - NEAR) * Math.min(1, s / DRIVE) ** 2
    /** When the car passed a road depth, by inverting `reach`. */
    const passed = (z: number) =>
      z <= NEAR ? 0 : Math.sqrt((z - NEAR) / (FAR - NEAR)) * DRIVE

    const dot = (x: number, y: number, size = 1) =>
      ctx.fillRect(Math.round(x), Math.round(y), size, size)

    /** A jagged bolt from (x, y), plotted a pixel at a time. */
    const bolt = (x: number, y: number, length: number) => {
      let angle = random(0, Math.PI * 2)
      for (let i = 0; i < length; i++) {
        angle += random(-0.9, 0.9)
        x += Math.cos(angle)
        y += Math.sin(angle) * 0.7
        dot(x, y)
      }
    }

    const draw = (time: number) => {
      ctx.globalAlpha = 1
      if (scene) ctx.drawImage(scene, 0, 0)
      ctx.fillStyle = starColor
      for (const s of stars) {
        const a = 0.55 + 0.45 * Math.sin(time * s.speed + s.phase)
        ctx.globalAlpha = a * a
        dot(s.x, s.y)
      }
      if (run === null) return

      const s = run
      const cx = w / 2
      const depth = h - horizon
      const head = Math.min(reach(s), FAR)
      // How strongly the trails burn: full until they die down.
      const life =
        s < DRIVE + BURN
          ? 1
          : Math.max(0, 1 - (s - DRIVE - BURN) / EMBER) ** 1.5

      // Near rows last, so their flames stand in front of the far ones.
      for (let y = horizon + 1; y < h; y++) {
        const t = (y - horizon) / depth
        const z = 1 / t
        if (z > head) continue
        const age = s - passed(z)
        if (age < 0) continue
        // Freshly lit fire flares, then settles.
        const flare = 1 + 0.8 * Math.exp(-age * 3)
        const track = w * TRACK * t
        const width = Math.max(1, Math.round(t * 4))
        // The tarmac between the trails catches their light.
        ctx.globalAlpha = 0.12 * life
        ctx.fillStyle = flame
        ctx.fillRect(Math.round(cx - track), y, Math.round(track * 2), 1)
        for (const side of [-1, 1]) {
          const x = Math.round(cx + side * track - width / 2)
          const flicker =
            0.6 +
            0.2 * Math.sin(y * 1.7 + side + time * 13) +
            0.2 * Math.sin(y * 0.63 - time * 7.3 + side * 2)
          const tall = Math.max(
            1,
            Math.round(FLAME * t * flicker * flare * life),
          )
          // White-hot at the base, orange above, tips half see-through.
          const bands: [string, number, number][] = [
            [core, 0, 0.35],
            [flame, 0.35, 0.8],
            [flame, 0.8, 1],
          ]
          bands.forEach(([color, from, to], i) => {
            const top = Math.round(tall * to)
            const bottom = Math.round(tall * from)
            if (top <= bottom) return
            ctx.globalAlpha = (i === 2 ? 0.55 : 1) * Math.min(1, life * 1.5)
            ctx.fillStyle = color
            ctx.fillRect(x, y - top + 1, width, top - bottom)
          })
          // Now and then a spark flies off the top.
          if (life > 0.3 && Math.random() < 0.04 * t) {
            ctx.globalAlpha = 1
            ctx.fillStyle = core
            dot(x + random(-2, width + 2), y - tall - random(1, 4))
          }
        }
      }

      // The car, a knot of blue light racing ahead of the fire.
      if (s < DRIVE) {
        const t = 1 / head
        const y = horizon + depth * t
        const size = Math.max(2, (w * TRACK * t) / 1.5)
        ctx.globalAlpha = 0.9
        ctx.fillStyle = spark
        for (let i = 0; i < 3 + Math.round(size / 4); i++)
          bolt(cx, y - size / 2, Math.round(random(size, size * 2.5)))
        ctx.globalAlpha = 1
        ctx.fillStyle = core
        const glow = Math.max(1, Math.round(size / 3))
        ctx.fillRect(
          Math.round(cx - glow),
          Math.round(y - size / 2 - glow / 2),
          glow * 2,
          glow,
        )
      }

      // The flash as it breaks through: a burst where it vanished, and
      // the whole sky lit for a moment.
      const since = s - DRIVE
      if (since >= 0 && since < 0.6) {
        const y = horizon + depth / FAR
        const burst = Math.round(4 + since * 60)
        ctx.globalAlpha = Math.max(0, 1 - since / 0.6)
        ctx.fillStyle = spark
        ctx.fillRect(Math.round(cx - burst), Math.round(y) - 1, burst * 2, 2)
        ctx.fillRect(
          Math.round(cx) - 1,
          Math.round(y - burst / 3),
          2,
          Math.round((burst * 2) / 3),
        )
        ctx.fillStyle = core
        ctx.fillRect(Math.round(cx) - 2, Math.round(y) - 2, 4, 4)
        ctx.globalAlpha = 0.3 * Math.max(0, 1 - since / 0.3)
        ctx.fillStyle = spark
        ctx.fillRect(0, 0, w, h)
      }
    }

    let frame = 0
    let last = performance.now()
    let time = 0
    const tick = (now: number) => {
      // Cap the step so a background tab doesn't lurch when it returns.
      const dt = Math.min(now - last, 100) / 1000
      last = now
      time += dt
      if (run !== null) {
        run += dt
        if (run > DRIVE + BURN + EMBER) {
          run = null
          wait = random(minWait, maxWait)
        }
      } else if ((wait -= dt) <= 0) run = 0
      draw(time)
      frame = requestAnimationFrame(tick)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    resize()
    if (!still) frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [
    background,
    starColor,
    asphalt,
    lane,
    flame,
    core,
    spark,
    pixel,
    minWait,
    maxWait,
    still,
  ])

  return <canvas ref={ref} className="block size-full" />
}
