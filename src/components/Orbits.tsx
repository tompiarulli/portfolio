// The orbital rings (see lib/orbits) drawn on a 2D canvas, the near half of
// each ring brighter than the far half for depth.
import { useEffect, useLayoutEffect, useRef } from 'react'

import { rgb } from '#/lib/color'
import { brightness, rider, ring } from '#/lib/orbits'
import type { RingPoint } from '#/lib/orbits'
import { stage } from '#/lib/power'

type OrbitsProps = {
  count?: number
  /** Centre of the set, as fractions of the width and height. */
  center?: readonly [number, number]
  /** Radius of the innermost and outermost rings, as fractions of the
   *  shorter screen side. */
  inner?: number
  outer?: number
  /** How fast the set turns, and the rings wobble and the points ride. */
  speed?: number
  /** Brightness of the far half of each ring, against the near half. */
  far?: number
  /** Line width in CSS pixels. */
  lineWidth?: number
  /** Radius of the riding points in CSS pixels; 0 is none. */
  point?: number
  /** The ground, the rings and the points, as CSS colours. */
  background: string
  color: string
  highlight: string
  fps?: number
  still?: boolean
  /** Seconds into the motion the still frame is taken. */
  stillTime?: number
}

/** Segments per ring; enough that the curve never shows its corners. */
const SEGMENTS = 160
/** Steps of brightness from the far side of a ring to the near side. */
const SHADES = 32
/** How quickly the rings wind in and out at Restart: the share of the way
 *  left they cover each second. */
const WIND = 2.4

export default function Orbits(props: OrbitsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The render loop reads props from here, so prop changes never restart it.
  const live = useRef(props)
  useLayoutEffect(() => {
    live.current = props
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: false })
    if (!canvas || !ctx) return

    // Restart winds the rings in to their centre, slowing as they go, and
    // they hold there under the start screen until it leaves, then spin
    // back out (lib/power). `size` is how far out they are, and `time`
    // runs slower as they wind in.
    const wound = () => {
      const s = stage()
      return s === 'down' || s === 'title'
    }
    let size = wound() ? 0 : 1
    let time = 0
    let prev = performance.now()
    const draw = () => {
      const p = live.current
      const t = (p.still ? (p.stillTime ?? 0) : time) * (p.speed ?? 0.05)
      const dpr = devicePixelRatio
      const w = canvas.width
      const h = canvas.height
      const [fx, fy] = p.center ?? [0.6, 0.55]
      const cx = fx * w
      const cy = fy * h
      const unit = Math.min(w, h)
      const count = p.count ?? 7
      // Never quite nothing, or the projection divides by zero.
      const wind = Math.max(size, 0.002)
      const inner = (p.inner ?? 0.18) * unit * wind
      const outer = (p.outer ?? 0.62) * unit * wind
      const far = p.far ?? 0.3

      ctx.fillStyle = p.background
      ctx.fillRect(0, 0, w, h)
      ctx.lineWidth = (p.lineWidth ?? 1) * dpr
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const back = rgb(p.background)
      const line = rgb(p.color)
      const mix = (c: 0 | 1 | 2, a: number) =>
        Math.round(back[c] + (line[c] - back[c]) * a)
      const ramp = Array.from({ length: SHADES }, (_, i) => {
        const a = i / (SHADES - 1)
        return `rgb(${mix(0, a)},${mix(1, a)},${mix(2, a)})`
      })

      /** Each ring's riding point: screen position and depth. */
      const riders: RingPoint[] = []
      for (let k = 0; k < count; k++) {
        const around = ring(k, count, inner, outer, t)
        const project = (a: number): RingPoint => {
          const [x, y, depth] = around(a)
          return [cx + x, cy + y, depth]
        }

        // Each run of one shade is a single opaque path in a pre-mixed
        // colour: overlapping semi-transparent segments would double up at
        // every joint and show as a string of dots.
        let prev = project(0)
        let points = [prev]
        let shade = -1
        const flush = () => {
          const [first, ...rest] = points
          const style = ramp[shade]
          if (!first || !rest.length || !style) return
          ctx.strokeStyle = style
          ctx.beginPath()
          ctx.moveTo(first[0], first[1])
          for (const [x, y] of rest) ctx.lineTo(x, y)
          ctx.stroke()
        }
        for (let i = 1; i <= SEGMENTS; i++) {
          const next = project((i / SEGMENTS) * Math.PI * 2)
          const level = Math.round(
            brightness((prev[2] + next[2]) / 2, far) * (SHADES - 1),
          )
          if (level !== shade) {
            flush()
            points = [prev]
            shade = level
          }
          points.push(next)
          prev = next
        }
        flush()

        riders.push(project(rider(k, t)))
      }

      const point = (p.point ?? 2) * dpr
      if (point > 0) {
        ctx.fillStyle = p.highlight
        for (const [x, y, depth] of riders) {
          ctx.globalAlpha = brightness(depth, far)
          ctx.beginPath()
          ctx.arc(x, y, point, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }

    // Setting the size clears the canvas, so redraw before the browser
    // paints, or resizing flashes blank between throttled frames.
    const resize = () => {
      const dpr = devicePixelRatio
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr))
      draw()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    let frame = 0
    let last = 0
    const render = (now: number) => {
      frame = requestAnimationFrame(render)
      if (document.hidden || live.current.still) return
      const interval = 1000 / Math.max(1, live.current.fps ?? 30)
      if (now - last < interval) return
      last = now - ((now - last) % interval)
      // Cap the step so a background tab doesn't lurch when it returns.
      const dt = Math.min(now - prev, 100) / 1000
      prev = now
      size += ((wound() ? 0 : 1) - size) * Math.min(1, dt * WIND)
      time += dt * (0.2 + 0.8 * size)
      draw()
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="block size-full" />
}
