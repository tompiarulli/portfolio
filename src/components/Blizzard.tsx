import { useEffect, useRef } from 'react'

type Props = {
  /** Night sky at the top of the screen. */
  background: string
  /** The storm's glow along the horizon, and the whiteout in gusts. */
  haze: string
  /** Snow lying on the ground and the roofs. */
  drift: string
  /** Blowing snow. */
  snow: string
  /** The station, the dog and the helicopter's outline. */
  station: string
  /** Lit windows. */
  lamp: string
  /** The mast's beacon and the helicopter's paint. */
  flare: string
  /** CSS pixels per scenery pixel. */
  pixel?: number
  /** Flakes per 1000 CSS pixels of screen. */
  density?: number
  /** Seconds between chases, as a range. */
  minWait?: number
  maxWait?: number
  /** Draw one frame and stop, for reduced motion. */
  still?: boolean
}

type Chase = {
  /** Seconds since the dog came on screen. */
  t: number
  /** Direction it runs, 1 or -1. */
  dir: number
}

/** Outpost 31 along the horizon, in scenery pixels from the station's
 *  centre: [left, width, wall height, pitched roof]. */
const BUILDINGS: [number, number, number, boolean][] = [
  // Fuel shed, bunkhouse, the main building, the rec room, the lab and
  // the kennel.
  [-80, 16, 7, false],
  [-60, 30, 11, true],
  [-26, 42, 14, false],
  [22, 24, 10, true],
  [48, 34, 12, false],
  [86, 14, 6, false],
]
/** The radio mast, a three-pixel lattice rising behind the main building. */
const MAST = { x: 17, height: 54 }

/** The husky, side on and facing right, drawn two CSS pixels per
 *  character: k fur, w its pale belly and mask. Two gaits, legs stretched
 *  and gathered. */
const DOG_BODY = [
  '..............k.k.',
  '.............kkkk.',
  'kk..........kkkwkk',
  '.kkkkkkkkkkkkkkww.',
  '..kkkkkkkkkkkkk...',
  '..kkwwwwwwwwkkk...',
]
const DOG_LEGS = [
  ['.kk.k.......kk.k..', 'kk...k.....k....k.', 'k.....k...k......k'],
  ['...kk.....kkk.....', '....kk...kk.k.....', '.....k..k...k.....'],
]
/** The helicopter, facing right: k outline, r its red paint,
 *  g the cockpit glass. The main rotor is drawn on top, spinning. */
const HELI = [
  '.................kk.............',
  '..............kkkkkkkk..........',
  '.............krrrrrrrrkkk.......',
  'kk..........krrrrrrrrrrggk......',
  'krk.........krrrrrrrrrrgggk.....',
  'krrkkkkkkkkkkrrrrrrrrrrggggk....',
  '.krrrrrrrrrrrrrrrrrrrrrrgggk....',
  '..kkkkkkkkkkkrrrrrrrrrrrrrrk....',
  '.............krrrrrrrrrrrrkk....',
  '..............kkkkkkkkkkkk......',
  '...............k.......k........',
  '.............kkkkkkkkkkkkkk.....',
]
/** Where the rotor mast stands, between these columns of HELI. */
const MAST_COL = 18
/** CSS pixels per sprite character. */
const SPRITE = 2
const DOG_W = DOG_BODY[0].length * SPRITE
const DOG_H = (DOG_BODY.length + 3) * SPRITE
const HELI_W = HELI[0].length * SPRITE
/** How far the helicopter trails the dog, and how high above it flies. */
const TRAIL = 200
const ALTITUDE = 110
/** Dog speed in CSS pixels per second. */
const RUN = 120

/** Base wind in CSS pixels per second, blowing left to right. */
const WIND = 65
/** Wind strength at a time, as a share of WIND: a steady blow with slow
 *  swells and quicker gusts, never quite still. */
const gust = (t: number) =>
  0.75 +
  0.3 * Math.sin(t * 0.21) +
  0.2 * Math.sin(t * 0.67 + 1.3) +
  0.1 * Math.sin(t * 1.9 + 0.4)

/** Flake layers from far to near: opacity, size of the square dot in
 *  CSS pixels, and how fast they fall in CSS pixels per second. */
const LAYERS = [
  { alpha: 0.3, size: 1, fall: 18 },
  { alpha: 0.5, size: 1, fall: 27 },
  { alpha: 0.75, size: 2, fall: 39 },
  { alpha: 1, size: 2, fall: 55 },
]

/** Overall pace of the snow: scales every flake's drift, fall, zig-zag
 *  and eddies together. */
const PACE = 0.5
/** Floats stored per flake. */
const FLAKE = 6

/** Width of the fog tile in scenery pixels; it repeats across the screen. */
const FOG_W = 256
/** Fog banks, as [scenery pixels per second at the base wind, opacity]:
 *  a slow far bank and a faster near one, so they slide past each other. */
const FOG_LAYERS = [
  [9, 0.75],
  [22, 0.55],
] as const

/**
 * A band of blowing fog, FOG_W wide and tileable across: long streaks of
 * --haze from summed sines at whole-number frequencies, thin in the sky
 * and thickening into ground drift near the horizon. Opacity is stepped
 * into fifths so it reads as pixel art rather than a smooth gradient.
 */
function makeFog(h: number, ground: number, color: string, seed: number) {
  const canvas = document.createElement('canvas')
  canvas.width = FOG_W
  canvas.height = h
  const g = canvas.getContext('2d')
  if (!g || !h) return canvas
  const [r, gr, b] = rgb(g, color)
  const rand = seeded(seed)
  const phase = [rand(0, 6), rand(0, 6), rand(0, 6), rand(0, 6)]
  const image = g.createImageData(FOG_W, h)
  const tau = (Math.PI * 2) / FOG_W
  for (let y = 0; y < h; y++) {
    // Heaviest a little above the horizon, where the wind lifts the snow.
    const near = 1 - Math.min(1, Math.abs(y - ground + 6) / (ground * 0.55))
    const weight = 0.25 + 0.75 * near * near
    for (let x = 0; x < FOG_W; x++) {
      const n =
        0.5 +
        0.25 * Math.sin(2 * tau * x + 1.3 * Math.sin(y * 0.045) + phase[0]) +
        0.15 * Math.sin(5 * tau * x + y * 0.09 + phase[1]) +
        0.1 * Math.sin(11 * tau * x - y * 0.17 + phase[2]) +
        0.06 * Math.sin(23 * tau * x + y * 0.31 + phase[3])
      const a = Math.floor(Math.max(0, n * weight) * 5) / 5
      const i = (y * FOG_W + x) * 4
      image.data[i] = r
      image.data[i + 1] = gr
      image.data[i + 2] = b
      image.data[i + 3] = Math.round(a * 0.6 * 255)
    }
  }
  g.putImageData(image, 0, 0)
  return canvas
}

/** 2x2 ordered dither, for stepping the sky's glow into bands. */
const BAYER = [
  [0, 0.5],
  [0.75, 0.25],
]

const random = (min: number, max: number) => min + Math.random() * (max - min)

/** Seeded random, so the station keeps its lit windows on resize. */
function seeded(seed: number) {
  return (min: number, max: number) => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return min + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (max - min)
  }
}

/** A CSS colour as [r, g, b], read back through a canvas. */
function rgb(g: CanvasRenderingContext2D, color: string) {
  g.fillStyle = color
  const n = parseInt(String(g.fillStyle).slice(1), 16) || 0
  return [n >> 16, (n >> 8) & 255, n & 255]
}

const mix = (a: number[], b: number[], t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t))

/**
 * The still scenery in scenery pixels: a sky glowing toward the horizon,
 * a snowfield streaked by the wind and the station on it. Returns the
 * layer, the ground line and where the mast's beacon sits.
 */
function makeScene(
  w: number,
  h: number,
  colors: Pick<Props, 'background' | 'haze' | 'drift' | 'station' | 'lamp'>,
) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const g = canvas.getContext('2d')
  const ground = h - Math.max(24, Math.round(h * 0.16))
  if (!g || !w || !h) return { canvas, ground, beacon: { x: 0, y: 0 } }
  const sky = rgb(g, colors.background)
  const haze = rgb(g, colors.haze)
  const drift = rgb(g, colors.drift)
  const station = rgb(g, colors.station)
  const lamp = rgb(g, colors.lamp)
  const image = g.createImageData(w, h)
  const put = (x: number, y: number, c: number[]) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return
    const i = (y * w + x) * 4
    image.data[i] = c[0]
    image.data[i + 1] = c[1]
    image.data[i + 2] = c[2]
    image.data[i + 3] = 255
  }

  // The sky brightens toward the horizon in dithered eighths.
  for (let y = 0; y < ground; y++) {
    const t = (y / ground) ** 2
    for (let x = 0; x < w; x++) {
      const step = Math.floor(t * 8 + BAYER[y % 2][x % 2]) / 8
      put(x, y, mix(sky, haze, Math.min(1, step)))
    }
  }
  // The snowfield, hazed toward the horizon, with wind ripples.
  const depth = h - ground
  for (let y = ground; y < h; y++) {
    const t = 1 - (y - ground) / depth
    for (let x = 0; x < w; x++) {
      const step = Math.floor(t * 4 + BAYER[y % 2][x % 2]) / 4
      put(x, y, mix(drift, haze, 0.5 * step))
    }
  }
  const rand = seeded(31)
  const ripple = mix(drift, haze, 0.45)
  for (let i = Math.round((w * depth) / 50); i > 0; i--) {
    const x = Math.floor(rand(0, w))
    const y = Math.floor(rand(ground + 2, h))
    const len = Math.round(rand(3, 10))
    for (let k = 0; k < len; k++) put(x + k, y, ripple)
  }

  // The station, kept whole on narrow screens where it fits.
  const cx = Math.round(Math.min(Math.max(w * 0.66, 100), w - 100))
  const base = ground + 2
  for (let y = base - MAST.height; y < base; y++) {
    put(cx + MAST.x, y, station)
    put(cx + MAST.x + 2, y, station)
    // Cross bracing, zigzagging up the lattice.
    if (y % 4 === 0) put(cx + MAST.x + 1, y, station)
  }
  put(cx + MAST.x + 1, base - MAST.height - 1, station)
  for (const [left, width, height, pitched] of BUILDINGS) {
    const x0 = cx + left
    const top = base - height
    for (let y = top; y < base; y++)
      for (let x = x0; x < x0 + width; x++) put(x, y, station)
    // A gable, or a flat roof; either way with snow along the top.
    const rise = pitched ? Math.floor(width / 5) : 0
    for (let r = 1; r <= rise; r++)
      for (let x = x0 + r * 2; x < x0 + width - r * 2; x++)
        put(x, top - r, station)
    for (let x = x0; x < x0 + width; x++) {
      const inset = Math.min(x - x0, x0 + width - 1 - x)
      const r = Math.min(rise, Math.floor(inset / 2))
      put(x, top - r, drift)
    }
    // Windows every six pixels, about half of them lit.
    for (let y = top + 3; y < base - 3; y += 6)
      for (let x = x0 + 3; x < x0 + width - 4; x += 6)
        if (rand(0, 1) < 0.45) {
          put(x, y, lamp)
          put(x + 1, y, lamp)
          put(x, y + 1, lamp)
          put(x + 1, y + 1, lamp)
        }
    // Snow banked against both walls.
    for (let i = 0; i < 4; i++)
      for (let y = base - 4 + i; y < base; y++) {
        put(x0 - 4 + i, y, drift)
        put(x0 + width + 3 - i, y, drift)
      }
  }
  g.putImageData(image, 0, 0)
  return {
    canvas,
    ground,
    beacon: { x: cx + MAST.x + 1, y: base - MAST.height - 2 },
  }
}

/** Draws a sprite of characters into a canvas at SPRITE CSS pixels per
 *  character, mirrored for running left. */
function makeSprite(
  rows: string[],
  palette: Record<string, string>,
  flip: boolean,
) {
  const canvas = document.createElement('canvas')
  canvas.width = rows[0].length * SPRITE
  canvas.height = rows.length * SPRITE
  const g = canvas.getContext('2d')
  if (!g) return canvas
  rows.forEach((row, y) =>
    Array.from(row).forEach((c, x) => {
      if (!(c in palette)) return
      g.fillStyle = palette[c]
      const col = flip ? row.length - 1 - x : x
      g.fillRect(col * SPRITE, y * SPRITE, SPRITE, SPRITE)
    }),
  )
  return canvas
}

/**
 * A blizzard at Outpost 31: snow blown sideways in layers and fog banks
 * rolling through over the station at night, its windows lit and its
 * mast's beacon blinking, the wind rising and falling into whiteouts. Every so often a husky runs
 * across the snowfield with a helicopter after it.
 */
export default function Blizzard({
  background,
  haze,
  drift,
  snow,
  station,
  lamp,
  flare,
  pixel = 2,
  density = 2.4,
  minWait = 25,
  maxWait = 55,
  still = false,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    const parent = canvas?.parentElement
    if (!canvas || !ctx || !parent) return

    const skin = { k: station, w: drift }
    const dogs = [false, true].map((flip) =>
      DOG_LEGS.map((legs) => makeSprite([...DOG_BODY, ...legs], skin, flip)),
    )
    const paint = { k: station, r: flare, g: haze }
    const helis = [false, true].map((flip) => makeSprite(HELI, paint, flip))

    let w = 0
    let h = 0
    let scene = makeScene(0, 0, { background, haze, drift, station, lamp })
    let chase: Chase | null = null
    let wait = random(4, 9)
    let time = 0
    let fogs: HTMLCanvasElement[] = []
    // Flakes by layer, far to near, FLAKE floats each: x, y, a sway phase,
    // their own speed, sway rate and sway strength, so no two move alike.
    let flakes: Float32Array[] = []
    /** How far the wind has carried the fog, in base-wind seconds. */
    let blown = 0

    const resize = () => {
      const r = parent.getBoundingClientRect()
      w = Math.ceil(r.width)
      h = Math.ceil(r.height)
      canvas.width = w
      canvas.height = h
      scene = makeScene(Math.ceil(w / pixel), Math.ceil(h / pixel), {
        background,
        haze,
        drift,
        station,
        lamp,
      })
      fogs = FOG_LAYERS.map((_, k) =>
        makeFog(scene.canvas.height, scene.ground, haze, 7 + k),
      )
      const count = Math.round((w * h * density) / 1000 / LAYERS.length)
      flakes = LAYERS.map(() => {
        const f = new Float32Array(count * FLAKE)
        for (let i = 0; i < f.length; i += FLAKE) {
          f[i] = random(0, w)
          f[i + 1] = random(0, h)
          f[i + 2] = random(0, Math.PI * 2)
          f[i + 3] = random(0.6, 1.4)
          f[i + 4] = random(2, 4.5)
          f[i + 5] = random(0.5, 1.5)
        }
        return f
      })
      // Reduced motion shows one still frame, mid-chase.
      if (still) {
        chase = { t: (w * 0.45 + DOG_W) / RUN, dir: 1 }
        time = 4
      }
      draw()
    }

    /** Dog and helicopter positions at the chase's time. */
    const place = (c: Chase) => {
      const run = c.t * RUN
      const dogX = c.dir > 0 ? -DOG_W + run : w - run
      // Just in front of the station, clear of the dock.
      const dogY = (scene.ground + 5) * pixel - DOG_H
      const heliX = dogX - c.dir * TRAIL + (DOG_W - HELI_W) / 2
      const bob = Math.round(Math.sin(c.t * 1.7) * 5)
      return {
        dog: { x: Math.round(dogX), y: dogY },
        heli: { x: Math.round(heliX), y: dogY - ALTITUDE + bob },
        done: run > w + TRAIL + HELI_W + DOG_W,
      }
    }

    const draw = () => {
      const wind = gust(time)
      ctx.globalAlpha = 1
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(
        scene.canvas,
        0,
        0,
        scene.canvas.width * pixel,
        scene.canvas.height * pixel,
      )

      // The beacon, a short red blink with a glow round it.
      if (time % 1.2 < 0.3) {
        const bx = scene.beacon.x * pixel
        const by = scene.beacon.y * pixel
        ctx.fillStyle = flare
        ctx.globalAlpha = 0.3
        ctx.fillRect(bx - pixel * 1.5, by - pixel * 1.5, pixel * 4, pixel * 4)
        ctx.globalAlpha = 1
        ctx.fillRect(bx, by, pixel, pixel)
      }

      if (chase) {
        const { dog, heli } = place(chase)
        const flip = chase.dir > 0 ? 0 : 1
        const gait = Math.floor(chase.t * 10) % 2
        ctx.drawImage(dogs[flip][gait], dog.x, dog.y - gait * SPRITE)
        ctx.drawImage(helis[flip], heli.x, heli.y + SPRITE)
        // The rotor, flicking between the blade side on and end on.
        const long = Math.floor(time * 24) % 2 === 0
        const span = long ? HELI_W - 4 * SPRITE : 10 * SPRITE
        const hub = (flip ? HELI[0].length - MAST_COL : MAST_COL) * SPRITE
        ctx.fillStyle = station
        ctx.fillRect(heli.x + hub - span / 2, heli.y, span, SPRITE)
      }

      // Fog banks blowing through, scaled up to scenery pixels.
      FOG_LAYERS.forEach(([speed, alpha], k) => {
        const fog = fogs[k]
        if (!fog.height) return
        const tile = FOG_W * pixel
        const offset = Math.round(((blown * speed) % FOG_W) * pixel)
        ctx.globalAlpha = alpha
        for (let x = offset - tile; x < w; x += tile)
          ctx.drawImage(fog, x, 0, tile, fog.height * pixel)
      })

      // Blowing snow, a square dot per flake.
      ctx.fillStyle = snow
      LAYERS.forEach(({ alpha, size }, k) => {
        const f = flakes[k]
        ctx.globalAlpha = alpha
        for (let i = 0; i < f.length; i += FLAKE)
          ctx.fillRect(Math.round(f[i]), Math.round(f[i + 1]), size, size)
      })

      // Whiteout: the air thickens at the top of each gust.
      const white = Math.min(1, Math.max(0, (wind - 0.95) / 0.4))
      if (white > 0) {
        ctx.globalAlpha = white * 0.22
        ctx.fillStyle = haze
        ctx.fillRect(0, 0, w, h)
      }
    }

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      // Cap the step so a background tab doesn't lurch when it returns.
      const dt = Math.min(now - last, 100) / 1000
      last = now
      time += dt
      blown += dt * gust(time)
      const wind = gust(time) * WIND
      LAYERS.forEach(({ fall }, k) => {
        const f = flakes[k]
        // Nearer flakes blow faster and zig-zag wider.
        const depth = (k + 0.5) / LAYERS.length
        const vx = wind * (0.35 + 0.9 * depth)
        const sway = 18 + 24 * depth
        for (let i = 0; i < f.length; i += FLAKE) {
          const x = f[i]
          const y = f[i + 1]
          const speed = f[i + 3]
          // Each flake tumbles on its own beat, swinging side to side and
          // bobbing a little as it goes.
          const beat = time * PACE * f[i + 4] + f[i + 2]
          const swing = sway * f[i + 5]
          // Eddies: slow swirls in the wind that curl neighbouring flakes
          // different ways and drift across the screen.
          const eddy =
            Math.sin(y * 0.011 + time * 0.8) * Math.cos(x * 0.006 - time * 0.5)
          f[i] += (vx * speed + Math.sin(beat) * swing + eddy * 36) * dt * PACE
          f[i + 1] +=
            (fall * speed + Math.cos(beat * 1.7) * swing * 0.5 + eddy * 15) *
            dt *
            PACE
          if (f[i] > w + 8) f[i] -= w + 16
          if (f[i] < -8) f[i] += w + 16
          if (f[i + 1] < -4) f[i + 1] += h
          if (f[i + 1] > h) {
            f[i + 1] -= h + 2
            f[i] = random(-8, w)
          }
        }
      })
      if (chase) {
        chase.t += dt
        if (place(chase).done) {
          chase = null
          wait = random(minWait, maxWait)
        }
      } else if ((wait -= dt) <= 0)
        chase = { t: 0, dir: Math.random() < 0.5 ? 1 : -1 }
      draw()
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
    haze,
    drift,
    snow,
    station,
    lamp,
    flare,
    pixel,
    density,
    minWait,
    maxWait,
    still,
  ])

  return <canvas ref={ref} className="block size-full" />
}
