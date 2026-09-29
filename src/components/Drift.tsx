import { useEffect, useRef } from 'react'

type Props = {
  /** Base colour behind the glyphs. */
  background: string
  /** Colour of the far and middle glyphs. */
  glyph: string
  /** Colour of the nearest glyphs. */
  glint: string
  /** Glyphs to draw from. */
  characters: string
  /** Glyphs per 10,000 square pixels. */
  density: number
  /** Sideways and downward speed of the nearest glyphs, in pixels per
   *  second; farther ones move slower. */
  wind?: number
  fall?: number
  /** How far gusts swing the wind, as a share of it. */
  gust?: number
  /** Twinkles per second; 0 holds every glyph steady. */
  twinkle?: number
  /** Draw one frame and stop, for reduced motion. */
  still?: boolean
}

/** Far, middle and near: font size, speed and brightness of each depth. */
const LAYERS = [
  { size: 9, speed: 0.35, alpha: 0.45 },
  { size: 12, speed: 0.6, alpha: 0.7 },
  { size: 16, speed: 1, alpha: 1 },
] as const

type Mote = { x: number; y: number; glyph: string; phase: number }

const random = (min: number, max: number) => min + Math.random() * (max - min)

/**
 * Glyphs scattered over three depths, like a starfield or a snowstorm seen
 * through a window. Each drifts with the wind and the fall, nearer ones
 * faster and brighter, wrapping round the edges, and may twinkle.
 */
export default function Drift({
  background,
  glyph,
  glint,
  characters,
  density,
  wind = 0,
  fall = 0,
  gust = 0,
  twinkle = 0,
  still = false,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    const parent = canvas?.parentElement
    if (!canvas || !ctx || !parent) return

    const glyphs = Array.from(characters)
    // Glyphs wrap this far past each edge, so none pop in or out in view.
    const margin = 20
    let width = 0
    let height = 0
    let layers: Mote[][] = []

    const mote = (): Mote => ({
      x: random(-margin, width + margin),
      y: random(-margin, height + margin),
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
      phase: random(0, Math.PI * 2),
    })

    const resize = () => {
      ;({ width, height } = parent.getBoundingClientRect())
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Split evenly across the depths.
      const count = Math.round(((width * height) / 10_000) * density)
      layers = LAYERS.map(() =>
        Array.from({ length: Math.ceil(count / LAYERS.length) }, mote),
      )
      draw(0)
    }

    const draw = (t: number) => {
      ctx.globalAlpha = 1
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      LAYERS.forEach((layer, i) => {
        ctx.font = `${layer.size}px monospace`
        ctx.fillStyle = i === LAYERS.length - 1 ? glint : glyph
        for (const m of layers[i]) {
          const shimmer = twinkle
            ? 0.55 + 0.45 * Math.sin(m.phase + t * twinkle * Math.PI * 2)
            : 1
          ctx.globalAlpha = layer.alpha * shimmer
          ctx.fillText(m.glyph, Math.round(m.x), Math.round(m.y))
        }
      })
    }

    const span = (v: number, size: number) =>
      v > size + margin
        ? v - size - 2 * margin
        : v < -margin
          ? v + size + 2 * margin
          : v

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      // Cap the step so a background tab doesn't lurch when it returns.
      const dt = Math.min(now - last, 100) / 1000
      last = now
      const t = now / 1000
      // Two slow waves beating against each other make irregular gusts.
      const blow =
        wind * (1 + gust * Math.sin(t * 0.7) * Math.sin(t * 0.23 + 1))
      LAYERS.forEach((layer, i) => {
        for (const m of layers[i]) {
          m.x = span(m.x + blow * layer.speed * dt, width)
          m.y = span(m.y + fall * layer.speed * dt, height)
        }
      })
      draw(t)
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
    glyph,
    glint,
    characters,
    density,
    wind,
    fall,
    gust,
    twinkle,
    still,
  ])

  return <canvas ref={ref} className="block size-full" />
}
