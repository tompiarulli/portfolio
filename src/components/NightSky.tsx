import { useEffect, useRef } from 'react'

type Props = {
  /** Sky colour. */
  background: string
  /** Colour of the stars. */
  stars: string
  /** Colour of the saucer's outline, under its shading. */
  hull: string
  /** Colour of the saucer's lights and its beam. */
  beam: string
  /** Colours of the pines' needles and their lit side. */
  pine: string
  pineLit: string
  /** Colour of the moon. */
  moon: string
  /** Size of one sky pixel in CSS pixels. */
  pixel?: number
  /** Stars per 1000 sky pixels. */
  density?: number
  /** Seconds between saucer passes, as a range. */
  minWait?: number
  maxWait?: number
  /** Draw one frame and stop, for reduced motion. */
  still?: boolean
}

/** Dot, 2x2 block, or cross. */
type Size = 1 | 2 | 3

type Star = { x: number; y: number; phase: number; speed: number; size: Size }

type Saucer = {
  /** Seconds since this pass began. */
  t: number
  /** Direction across the sky, 1 or -1. */
  dir: number
  y: number
  /** Where along the pass it stops to hover, 0..1 of the width. */
  stop: number
  /** Which way the cow faces, 1 or -1. */
  cow: number
}

/** Saucer sprite, drawn one CSS pixel per character like the dock icons:
 *  . sky, k outline, 1 2 3 shading from dark to lit (lit from the upper
 *  left), o rim light, u the glow underneath. */
const SAUCER = [
  '.............................................kkkkkkkkkk.............................................',
  '..........................................kkk3332222222kkk..........................................',
  '........................................kk3333322222222222kk........................................',
  '......................................kk33333332222222222222kk......................................',
  '.....................................k333333332222222222222222k.....................................',
  '....................................k33333333322222222222222222k....................................',
  '...................................k3333333332222222222222222222k...................................',
  '..................................k333333333322222222222222222221k..................................',
  '..................................k333333333222222222222222222211k..................................',
  '.................................k33333333322222222222222222221111k.................................',
  '.................................k33333333322222222222222222221111k.................................',
  '.................................k33333333222222222222222222211111k.................................',
  '......................kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk......................',
  '................kkkkkk33333333333333333332222222222222222222111111111111111111kkkkkk................',
  '..........kkkkkk33333333333333333333333332222222222222222222111111111111111111111111kkkkkk..........',
  '......kkkk33333333333333333333333333333322222222222222222221111111111111111111111111111111kkkk......',
  '...kkk3333333333333333333333333333333332222222222222222222111111111111111111111111111111111111kkk...',
  '.kk3333333333333333333333333333333333332222222222222222222111111111111111111111111111111111111111kk.',
  'k33333333333333333333333333333333333332222222222222222222111111111111111111111111111111111111111111k',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  '.k222222222222222222222222222222222222222222221111111111111111111111111111111111111111111111111111k.',
  '..k222222o22222222o22222222o22222222o22222222o11111111o11111111o11111111o11111111o11111111o111111k..',
  '...k22222222222222222222222222222222222222222111111111111111111111111111111111111111111111111111k...',
  '....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk....',
  '.......kkk11111111111111111111111111111111111111111111111111111111111111111111111111111111kkk.......',
  '..........kkkk111111111111111111111111111111111111111111111111111111111111111111111111kkkk..........',
  '..............kkkk1111111111111111111111111111111111111111111111111111111111111111kkkk..............',
  '..................kkkk11111111111111111111111111111111111111111111111111111111kkkk..................',
  '......................kkkk111111111111111111111111111111111111111111111111kkkk......................',
  '..........................kkkkkkkk11111111111111111111111111111111kkkkkkkk..........................',
  '..................................kkuuuuuuuuuuuuuuuuuuuuuuuuuuuukk..................................',
]
/** Opacity of --beam over --hull for each shade. The saucer is a dark
 *  body with a grey dome and disc; the cow is lit bright by the beam. */
const SHADE: Record<string, number> = {
  k: 0,
  '1': 0.12,
  '2': 0.3,
  '3': 0.55,
  u: 0.8,
}
/** Opacity of --beam over --hull for each of the cow's flat colours. */
const COW_SHADE: Record<string, number> = {
  k: 0,
  b: 0.85,
  w: 1,
  p: 0.55,
  h: 0.7,
}
/** Saucer width in CSS pixels. The saucer and cow scale to it by nearest
 *  neighbour, so some sprite pixels land a CSS pixel wider than others. */
const SPRITE = 108 / SAUCER[0].length
/** Where sprite pixel `n` starts, in whole CSS pixels. */
const snap = (n: number) => Math.round(n * SPRITE)
const SAUCER_W = snap(SAUCER[0].length)
const SAUCER_H = snap(SAUCER.length)

/** The cow the saucer beams up, facing us, flat like a South Park cow:
 *  a square k head with ears out to the sides, h horns, big round w eyes
 *  with k dots and a p nose, on a short b Holstein body with k patches,
 *  two front legs and a p udder. */
const COW = [
  '......h......h......',
  '......h......h......',
  '.....kkkkkkkkkk.....',
  '..kkkkkwwkkwwkkkkk..',
  '.kkkkkwwwwwwwwkkkkk.',
  '..kkkkwkkwwkkwkkkk..',
  '....kkwkkwwkkwkk....',
  '....kkkwwkkwwkkk....',
  '....kkkkkkkkkkkk....',
  '....kkkppppppkkk....',
  '....kkppkppkppkk....',
  '....bkkppppppkkb....',
  '....bbkkkkkkkkbb....',
  '...kkbbbbbbbbbbbb...',
  '...kkbbbbbbbbbbkk...',
  '...kkbbbbbbbbkkkk...',
  '...bbbbbbbbbbkkkk...',
  '...bbbkkkbbbbbkkb...',
  '...bbbkkkbbbbbbbb...',
  '...bbb...pp...bbb...',
  '...bbb........bbb...',
  '...kkk........kkk...',
]
const COW_W = snap(COW[0].length)
const COW_H = snap(COW.length)

/** Seconds to cross in, hover, and cross out. */
const FLY = 5
const HOVER = 8
/** Seconds into the hover the cow starts and finishes rising. */
const LIFT_START = 1.8
const LIFT_END = HOVER - 1.5

const random = (min: number, max: number) => min + Math.random() * (max - min)
/** Mostly dots, some blocks, a few crosses. */
const starSize = (): Size => {
  const r = Math.random()
  return r < 0.05 ? 3 : r < 0.35 ? 2 : 1
}
const ease = (t: number) => t * t * (3 - 2 * t)

/** Seeded random, so the forest keeps its shape when the window resizes. */
function seeded(seed: number) {
  return (min: number, max: number) => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return min + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (max - min)
  }
}

/** CSS pixels per forest pixel: chunkier than the saucer, so the trees
 *  read as pixel art at a glance. */
const FOREST_PIXEL = 2
/** 2x2 ordered dither, for stepping the glow and fog into bands. */
const BAYER = [
  [0, 0.5],
  [0.75, 0.25],
]

/**
 * One fir as a mask: branches fanning out from the trunk on both sides,
 * each thick at the trunk and tapering to a drooping tip with needles
 * hanging under it, longer towards the ground, with sky showing between
 * them. `tops` marks the upper edge of each branch, where moonlight
 * catches.
 */
function makeFir(height: number, rand: ReturnType<typeof seeded>) {
  const reach = Math.max(3, Math.round(height * 0.34))
  const width = reach * 2 + 7
  const mid = reach + 3
  const mask = new Uint8Array(width * height)
  const fill = (x: number, y: number) => {
    if (x >= 0 && x < width && y >= 0 && y < height) mask[y * width + x] = 1
  }
  // The trunk and a dense core of needles along it.
  for (let y = 0; y < height; y++) {
    const core = Math.round((y / height) * reach * 0.12)
    for (let x = mid - core; x <= mid + core; x++) fill(x, y)
  }
  /** Branches that catch the moon; the rest stay dark. */
  const frosted = new Uint8Array(width * height)
  for (const dir of [-1, 1]) {
    let y = Math.round(rand(2, 4)) + (dir > 0 ? Math.round(rand(1, 3)) : 0)
    while (y < height - 1) {
      const envelope = reach * Math.pow(y / height, 0.8)
      const len = Math.max(1, Math.round(envelope * rand(0.75, 1.1)))
      const droop = 1 + len * 0.18
      const shine = rand(0, 1) < 0.4
      for (let t = 0; t <= len; t++) {
        const f = t / len
        // Lifts a little off the trunk, then sags towards the tip.
        const yc = y + Math.round(-f * 1.2 + f * f * droop)
        const thick =
          Math.max(1, Math.round((1 - f) * (1 + len * 0.2))) + (f < 0.7 ? 1 : 0)
        for (let k = 0; k < thick; k++) fill(mid + dir * t, yc + k)
        if (shine && f > 0.15 && f < 0.9)
          frosted[
            (yc < 0 ? 0 : Math.min(height - 1, yc)) * width + mid + dir * t
          ] = 1
        // Needles hanging under the branch.
        if (t > 1 && t % 2 === 0 && rand(0, 1) < 0.6)
          fill(mid + dir * t, yc + thick + (rand(0, 1) < 0.4 ? 1 : 0))
      }
      y += Math.max(2, Math.round(2 + len * rand(0.12, 0.22)))
    }
  }
  const tops = new Uint8Array(width * height)
  for (let y = 1; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      // Branch tops only, away from the trunk.
      if (mask[i] && !mask[i - width] && frosted[i]) tops[i] = 1
    }
  return { width, height, mid, mask, tops }
}

/** An RGBA pixel buffer with "over" blending, for building the forest. */
function pixels(width: number, height: number) {
  const data = new Float32Array(width * height * 4)
  const put = (x: number, y: number, c: number[], a: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height || a <= 0) return
    const i = (y * width + x) * 4
    const under = data[i + 3] * (1 - a)
    const out = a + under
    for (let k = 0; k < 3; k++)
      data[i + k] = (c[k] * a + data[i + k] * under) / out
    data[i + 3] = out
  }
  return { data, put }
}

/**
 * The forest along the bottom, drawn once per size, in two parts so the
 * cow can rise between them. Behind: a green glow low in the sky, dark
 * firs against it, and a bank of fog across their feet. In front: tall,
 * near-black firs framing the view, their branch tops frosted with
 * moonlight, on a dark, grassy floor.
 */
function makeForest(
  width: number,
  sky: number,
  hull: string,
  needles: string,
  lit: string,
  frost: string,
) {
  const rand = seeded(1993)
  const P = FOREST_PIXEL
  const w = Math.ceil(width / P)
  const s = sky / P
  // Sizes are in forest pixels, not fractions of the screen, so the trees
  // stay in scale with the cow: a cow is about 10 forest pixels tall.
  const h = Math.max(1, Math.min(Math.round(s), 260))
  const fogY = h - 64
  const back = pixels(w, h)
  const front = pixels(w, h)

  const probe = document.createElement('canvas').getContext('2d')
  const [dark, green, light, white] = probe
    ? [hull, needles, lit, frost].map((c) => rgb(probe, c))
    : [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]
  const mix = (a: number[], b: number[], t: number) =>
    a.map((v, i) => v + (b[i] - v) * t)
  /** Alpha stepped into eighths, dithered, so gradients stay pixel art. */
  const step = (a: number, x: number, y: number) =>
    Math.floor(Math.min(1, Math.max(0, a)) * 8 + BAYER[y & 1][x & 1]) / 8

  // The glow: --pine-lit rising into the --desk sky above the fog.
  const glowTop = fogY - 110
  for (let y = Math.max(0, Math.floor(glowTop)); y < h; y++) {
    const t = Math.min(1, (y - glowTop) / (fogY - glowTop))
    for (let x = 0; x < w; x++) back.put(x, y, light, step(t * t * 0.4, x, y))
  }

  // The background row of firs, dark against the glow, their feet in
  // the fog.
  const plant = (
    target: ReturnType<typeof pixels>,
    cx: number,
    foot: number,
    tall: number,
    colour: number[],
    frosted: boolean,
  ) => {
    const fir = makeFir(Math.max(6, Math.round(tall)), rand)
    const left = Math.round(cx) - fir.mid
    const top = Math.round(foot) - fir.height
    for (let y = 0; y < fir.height; y++)
      for (let x = 0; x < fir.width; x++) {
        const i = y * fir.width + x
        if (!fir.mask[i]) continue
        const shine = frosted && fir.tops[i] && rand(0, 1) < 0.8
        target.put(left + x, top + y, shine ? white : colour, 1)
      }
  }
  const mid = mix(dark, green, 0.35)
  for (let cx = rand(-10, 0); cx < w + 10; cx += rand(7, 16))
    plant(back, cx, fogY + 4, 45 + 40 * rand(0, 1) ** 2, mid, false)

  // The field between the rows, moonlit at the far edge and darkening
  // towards us, with tufts of grass catching the light.
  const field = mix(dark, green, 0.45)
  const shade = mix(dark, green, 0.15)
  const tuft = mix(green, light, 0.5)
  for (let y = fogY; y < h; y++) {
    const t = (y - fogY) / (h - fogY)
    for (let x = 0; x < w; x++) {
      back.put(x, y, field, 1)
      back.put(x, y, shade, step(t * 0.9, x, y))
      if (rand(0, 1) < 0.06 * (1 - t)) back.put(x, y, tuft, 1)
    }
  }
  // Fog along the far edge of the field, thickest at the treeline and
  // rolling so it isn't a ruled line.
  const band = 12
  const haze = mix(light, white, 0.15)
  for (let y = Math.floor(fogY - band); y < Math.ceil(fogY + band); y++) {
    const t = 1 - Math.abs(y - fogY) / band
    for (let x = 0; x < w; x++) {
      const roll = 0.8 + 0.2 * Math.sin(x / 23 + y / 9) * Math.sin(x / 57)
      back.put(x, y, haze, step(t * t * 0.55 * roll, x, y))
    }
  }

  // Tall firs in front, framing the field: biggest at the sides, with a
  // gap in the middle to see through.
  for (let cx = rand(-20, 0); cx < w + 20;) {
    const side = Math.abs((cx / w) * 2 - 1)
    if (side > 0.15 || rand(0, 1) < 0.3) {
      const tall = (90 + 90 * side) * rand(0.75, 1)
      plant(front, cx, h + 4, tall, dark, true)
    }
    cx += rand(14, 30) * (0.6 + side)
  }
  // Grass on the floor in front, in clumps of --pine.
  const grass = mix(dark, green, 0.5)
  for (let y = h - 12; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = (y - (h - 12)) / 12
      front.put(x, y, dark, 1)
      if (rand(0, 1) < 0.25 * (1 - t)) front.put(x, y, grass, 1)
    }

  const paint = ({ data }: ReturnType<typeof pixels>) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const g = canvas.getContext('2d')
    // Nothing to draw before layout.
    if (!g || w < 1) return canvas
    const image = g.createImageData(w, h)
    for (let i = 0; i < data.length; i++)
      image.data[i] = data[i] * (i % 4 === 3 ? 255 : 1)
    g.putImageData(image, 0, 0)
    return canvas
  }
  return {
    back: paint(back),
    front: paint(front),
  }
}

/** Moon radius in forest pixels. */
const MOON = 10

/**
 * A full moon in forest pixels, as three layers the same size so they
 * can shimmer apart: the disc, faintly mottled with maria and dimmer
 * towards its lower right limb, and an inner and outer ring of halo that
 * step out into the sky in dithered bands.
 */
function makeMoon(color: string, sky: string) {
  const halo = MOON * 3
  const size = halo * 2 + 1
  const layers = [0, 1, 2].map(() => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    return canvas
  })
  const g = layers[0].getContext('2d')
  if (!g) return layers
  const lit = rgb(g, color)
  const dim = lit.map((v, i) => v + (rgb(g, sky)[i] - v) * 0.18)
  const images = layers.map(() => g.createImageData(size, size))
  // Dark patches, as offsets from the centre.
  const maria = [
    [-2, -3],
    [-3, -2],
    [2, 1],
    [3, 1],
    [2, 2],
    [-1, 3],
  ]
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = x - halo
      const dy = y - halo
      const r = Math.hypot(dx, dy)
      let c = lit
      let a: number
      let k: number
      if (r <= MOON) {
        a = 1
        k = 0
        const limb = (dx + dy) / MOON > 0.9
        if (limb || maria.some(([mx, my]) => mx === dx && my === dy)) c = dim
      } else {
        const t = Math.max(0, 1 - (r - MOON) / (halo - MOON))
        a = Math.floor(t * t * 0.3 * 8 + BAYER[y & 1][x & 1]) / 8
        k = r < MOON * 1.8 ? 1 : 2
      }
      if (a <= 0) continue
      const i = (y * size + x) * 4
      const data = images[k].data
      data[i] = c[0]
      data[i + 1] = c[1]
      data[i + 2] = c[2]
      data[i + 3] = Math.round(a * 255)
    }
  layers.forEach((canvas, k) =>
    canvas.getContext('2d')?.putImageData(images[k], 0, 0),
  )
  return layers
}

/** A CSS colour as [r, g, b], read back through a canvas. */
function rgb(g: CanvasRenderingContext2D, color: string) {
  g.fillStyle = color
  const n = parseInt(String(g.fillStyle).slice(1), 16) || 0
  return [n >> 16, (n >> 8) & 255, n & 255]
}

/** Beam half-width where it leaves the saucer, inside the sprite's glow
 *  row, and how fast it spreads per pixel of drop. */
const BEAM_TOP = snap(11)
const BEAM_SPREAD = 0.35

/** The cow drawn once, as drawn or mirrored so its patches vary. */
function makeCow(hull: string, beam: string, flip: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = COW_W
  canvas.height = COW_H
  const g = canvas.getContext('2d')
  if (!g) return canvas
  const cols = COW[0].length
  for (let r = 0; r < COW.length; r++) {
    for (let c = 0; c < cols; c++) {
      const p = COW[r][flip ? cols - 1 - c : c]
      if (p === '.') continue
      g.globalAlpha = 1
      g.fillStyle = hull
      const px = snap(c)
      const py = snap(r)
      const pw = snap(c + 1) - px
      const ph = snap(r + 1) - py
      g.fillRect(px, py, pw, ph)
      const a = COW_SHADE[p]
      if (!a) continue
      g.globalAlpha = a
      g.fillStyle = beam
      g.fillRect(px, py, pw, ph)
    }
  }
  return canvas
}

/**
 * The beam as a soft cone: nested cones stacked so the core is brightest,
 * faded out towards the ground. Drawn once per size and colour.
 */
function makeBeam(color: string, height: number) {
  const half = Math.ceil(BEAM_TOP + height * BEAM_SPREAD)
  const canvas = document.createElement('canvas')
  canvas.width = half * 2
  canvas.height = height
  const g = canvas.getContext('2d')
  if (!g) return canvas
  const layers = 6
  g.fillStyle = color
  g.globalAlpha = 1 / layers
  for (let i = 0; i < layers; i++) {
    const k = 1 - i / layers
    const top = BEAM_TOP * k
    const bottom = (half - BEAM_TOP) * k + top
    g.beginPath()
    g.moveTo(half - top, 0)
    g.lineTo(half + top, 0)
    g.lineTo(half + bottom, height)
    g.lineTo(half - bottom, height)
    g.fill()
  }
  // An alpha-only mask, so its colour never shows.
  const fade = g.createLinearGradient(0, 0, 0, height)
  fade.addColorStop(0, 'black')
  fade.addColorStop(1, 'transparent')
  g.globalAlpha = 1
  g.globalCompositeOperation = 'destination-in'
  g.fillStyle = fade
  g.fillRect(0, 0, canvas.width, height)
  return canvas
}

/**
 * A night sky of fine twinkling stars over a treeline. Every so often
 * a saucer drifts across, stops to shine its beam down, then leaves. The saucer is one
 * CSS pixel per sprite pixel, to match the dock icons, and so are the
 * stars, sized in whole pixels so they stay sharp.
 */
export default function NightSky({
  background,
  stars: starColor,
  hull,
  beam,
  pine,
  pineLit,
  moon,
  pixel = 1,
  density = 0.6,
  minWait = 10,
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
    let stars: Star[] = []
    let saucer: Saucer | null = null
    let wait = random(2, 6)
    let light: HTMLCanvasElement | null = null
    const cows = {
      right: makeCow(hull, beam, false),
      left: makeCow(hull, beam, true),
    }
    let forest: ReturnType<typeof makeForest> | null = null
    const moonlight = makeMoon(moon, background)

    const resize = () => {
      const r = parent.getBoundingClientRect()
      w = Math.ceil(r.width / pixel)
      h = Math.ceil(r.height / pixel)
      canvas.width = w * pixel
      canvas.height = h * pixel
      light = makeBeam(beam, canvas.height)
      forest = makeForest(
        canvas.width,
        canvas.height,
        hull,
        pine,
        pineLit,
        beam,
      )
      const count = Math.round((w * h * density) / 1000)
      stars = Array.from({ length: count }, () => ({
        x: Math.floor(random(0, w)),
        y: Math.floor(random(0, h)),
        phase: random(0, Math.PI * 2),
        speed: random(0.5, 2.5),
        size: starSize(),
      }))
      // Reduced motion shows one still frame: the saucer mid-hover.
      if (still)
        saucer = {
          t: FLY + HOVER / 2,
          dir: 1,
          y: Math.round(h * 0.3),
          stop: 0.6,
          cow: -1,
        }
      draw(0)
    }

    /**
     * Where to hover: tries a handful of spots and keeps the one whose
     * saucer and beam overlap the open windows least. The sky fills the
     * viewport, so window rects and sky pixels share an origin.
     */
    const clearSpot = () => {
      const windows = Array.from(
        document.querySelectorAll('[role="dialog"]'),
        (el) => el.getBoundingClientRect(),
      )
      const overlap = (x: number, y: number, width: number, height: number) =>
        windows.reduce(
          (sum, r) =>
            sum +
            Math.max(0, Math.min(x + width, r.right) - Math.max(x, r.left)) *
              Math.max(0, Math.min(y + height, r.bottom) - Math.max(y, r.top)),
          0,
        )
      const width = SAUCER_W / pixel
      let best = { dir: 1, y: 0, stop: 0 }
      let least = Infinity
      for (let i = 0; i < 24 && least > 0; i++) {
        const dir = Math.random() < 0.5 ? 1 : -1
        const y = Math.round(random(h * 0.15, h * 0.4))
        const stop = random(0.2, 0.8)
        const from = dir > 0 ? -width : w
        const x = (from + (w + width) * stop * dir) * pixel
        const top = y * pixel
        const bottom = top + SAUCER_H
        // The saucer counts most, then the column the cow rises through.
        const score =
          overlap(x, top, SAUCER_W, SAUCER_H) * 4 +
          overlap(
            x + SAUCER_W / 2 - COW_W / 2,
            bottom,
            COW_W,
            h * pixel - bottom,
          )
        if (score < least) {
          least = score
          best = { dir, y, stop }
        }
      }
      return best
    }

    /** Saucer position and beam strength at its time into the pass. */
    const place = (s: Saucer) => {
      const width = SAUCER_W / pixel
      const from = s.dir > 0 ? -width : w
      const to = s.dir > 0 ? w : -width
      const mid = from + (to - from) * s.stop
      let x: number
      let glow = 0
      if (s.t < FLY) x = from + (mid - from) * ease(s.t / FLY)
      else if (s.t < FLY + HOVER) {
        x = mid
        // The beam fades in and out over the first and last second.
        glow = Math.min(1, s.t - FLY, FLY + HOVER - s.t)
      } else x = mid + (to - mid) * ease((s.t - FLY - HOVER) / FLY)
      // Bob gently, in CSS pixels.
      const bob = Math.round(Math.sin(s.t * 2) * 3)
      return { x: Math.round(x * pixel), y: s.y * pixel + bob, glow }
    }

    /** The cow, rising from the hill between the rows of trees into the
     *  saucer's hatch, which it is small enough to fit through. */
    const drawCow = (s: Saucer, sx: number, sy: number, glow: number) => {
      const hatch = sy + snap(SAUCER.length - 1)
      // Starts just below the bottom edge and floats up between the rows
      // of trees, so the front row hides it until it clears them.
      const ground = canvas.height + COW_H
      const lift = ease(
        Math.min(
          1,
          Math.max(0, (s.t - FLY - LIFT_START) / (LIFT_END - LIFT_START)),
        ),
      )
      // Gone once it is all the way in; skip if the saucer is too low.
      if (lift >= 1 || ground <= hatch) return
      const top = Math.round(ground - COW_H + (hatch - ground) * lift)
      // Sways a little as it rises.
      const sway = Math.round(Math.sin(s.t * 3) * 2 * Math.min(1, lift * 4))
      const left = Math.round(sx + SAUCER_W / 2 - COW_W / 2) + sway
      // Whatever has passed the hatch is inside the saucer.
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, hatch, canvas.width, canvas.height)
      ctx.clip()
      ctx.globalAlpha = glow
      ctx.drawImage(s.cow > 0 ? cows.right : cows.left, left, top)
      ctx.restore()
    }

    const draw = (time: number) => {
      // The sky is drawn in sky pixels, the saucer in CSS pixels.
      ctx.setTransform(pixel, 0, 0, pixel, 0, 0)
      ctx.globalAlpha = 1
      ctx.fillStyle = background
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = starColor
      for (const s of stars) {
        // Mostly steady, dipping now and then.
        const a = 0.55 + 0.45 * Math.sin(time * s.speed + s.phase)
        ctx.globalAlpha = a * a
        if (s.size === 3) {
          ctx.fillRect(s.x - 1, s.y, 3, 1)
          ctx.fillRect(s.x, s.y - 1, 1, 3)
        } else ctx.fillRect(s.x, s.y, s.size, s.size)
      }

      // The treeline, in CSS pixels, in front of the stars and under the
      // beam, so the beam lights it. The cow stands between its rows.
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      const spot = saucer && place(saucer)
      const trees = (layer: HTMLCanvasElement | undefined) => {
        if (!layer?.width || !layer.height) return
        // Scaled up to chunky forest pixels, kept sharp.
        const tall = layer.height * FOREST_PIXEL
        ctx.globalAlpha = 1
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(
          layer,
          0,
          canvas.height - tall,
          layer.width * FOREST_PIXEL,
          tall,
        )
      }
      // The moon, high on the right, behind the trees and the saucer.
      {
        const size = moonlight[0].width * FOREST_PIXEL
        const mx = Math.round(canvas.width * 0.74 - size / 2)
        const my = Math.round(canvas.height * 0.16 - size / 2)
        // The halo breathes, its two rings out of step, like the stars.
        const glow = [
          1,
          0.75 + 0.25 * Math.sin(time * 0.9),
          0.6 + 0.4 * Math.sin(time * 0.55 + 2),
        ]
        ctx.imageSmoothingEnabled = false
        moonlight.forEach((layer, k) => {
          ctx.globalAlpha = glow[k]
          ctx.drawImage(layer, mx, my, size, size)
        })
      }
      trees(forest?.back)
      // The beam and the cow belong to the field, behind the front row.
      if (saucer && spot && spot.glow > 0 && light) {
        // Screen-tall, so it runs off the bottom whatever the height.
        ctx.globalAlpha = spot.glow * 0.45
        ctx.drawImage(
          light,
          Math.round(spot.x + SAUCER_W / 2 - light.width / 2),
          spot.y + snap(SAUCER.length - 1),
        )
      }
      if (saucer && spot && spot.glow > 0)
        drawCow(saucer, spot.x, spot.y, spot.glow)
      trees(forest?.front)

      if (saucer && spot) {
        const { x, y } = spot
        const blink = Math.floor(time * 6) % 2
        for (let r = 0; r < SAUCER.length; r++) {
          for (let c = 0; c < SAUCER[0].length; c++) {
            const p = SAUCER[r][c]
            if (p === '.') continue
            const px = x + snap(c)
            const py = y + snap(r)
            const pw = snap(c + 1) - snap(c)
            const ph = snap(r + 1) - snap(r)
            ctx.globalAlpha = 1
            ctx.fillStyle = hull
            ctx.fillRect(px, py, pw, ph)
            // Rim lights take turns.
            const a =
              p === 'o' ? (Math.floor(c / 4) % 2 === blink ? 1 : 0.3) : SHADE[p]
            if (!a) continue
            ctx.globalAlpha = a
            ctx.fillStyle = beam
            ctx.fillRect(px, py, pw, ph)
          }
        }
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
      if (saucer) {
        saucer.t += dt
        if (saucer.t > FLY * 2 + HOVER) {
          saucer = null
          wait = random(minWait, maxWait)
        }
      } else if ((wait -= dt) <= 0) {
        saucer = {
          t: 0,
          ...clearSpot(),
          cow: Math.random() < 0.5 ? 1 : -1,
        }
      }
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
    hull,
    beam,
    pine,
    pineLit,
    moon,
    pixel,
    density,
    minWait,
    maxWait,
    still,
  ])

  return <canvas ref={ref} className="block size-full" />
}
