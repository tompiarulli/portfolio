// Circles tilted in 3D and projected onto a 2D canvas, the near half of each
// ring brighter than the far half for depth.
import { useEffect, useLayoutEffect, useRef } from 'react'

import { rgb } from '#/lib/color'

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

    const start = performance.now()
    const draw = (now: number) => {
      const p = live.current
      const t =
        (p.still ? (p.stillTime ?? 0) : (now - start) / 1000) *
        (p.speed ?? 0.05)
      const dpr = devicePixelRatio
      const w = canvas.width
      const h = canvas.height
      const [fx, fy] = p.center ?? [0.6, 0.55]
      const cx = fx * w
      const cy = fy * h
      const unit = Math.min(w, h)
      const count = p.count ?? 7
      const inner = (p.inner ?? 0.18) * unit
      const outer = (p.outer ?? 0.62) * unit
      const far = p.far ?? 0.3
      // Camera distance for the perspective, past the outermost ring.
      const camera = outer * 3

      ctx.fillStyle = p.background
      ctx.fillRect(0, 0, w, h)
      ctx.lineWidth = (p.lineWidth ?? 1) * dpr
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const back = rgb(p.background)
      const line = rgb(p.color)
      const ramp = Array.from({ length: SHADES }, (_, i) => {
        const a = i / (SHADES - 1)
        return `rgb(${back.map((b, c) => Math.round(b + (line[c] - b) * a)).join(',')})`
      })

      const turn = t * 0.6
      const ct = Math.cos(turn)
      const st = Math.sin(turn)

      /** Each ring's riding point: screen position and depth. */
      const riders: (readonly [number, number, number])[] = []
      for (let k = 0; k < count; k++) {
        const r =
          count > 1 ? inner + ((outer - inner) * k) / (count - 1) : inner
        // Mostly towards the viewer, so each ring reads as a flattened
        // ellipse.
        const tilt = 1.15 + 0.25 * Math.sin(k * 1.7) + 0.08 * Math.sin(t + k)
        const roll = 0.45 * Math.sin(k * 2.3) + 0.05 * Math.cos(t * 0.8 + k)
        const cx1 = Math.cos(tilt)
        const sx1 = Math.sin(tilt)
        const cr = Math.cos(roll)
        const sr = Math.sin(roll)

        /** A point at angle a on ring k, projected to the screen, with its
         *  depth (-1 far .. 1 near). */
        const project = (a: number) => {
          let x = r * Math.cos(a)
          let y = r * Math.sin(a)
          let z = 0
          // Tilt about the horizontal axis.
          ;[y, z] = [y * cx1 - z * sx1, y * sx1 + z * cx1]
          // Roll about the view axis.
          ;[x, y] = [x * cr - y * sr, x * sr + y * cr]
          // The set's turn about the vertical.
          ;[x, z] = [x * ct + z * st, -x * st + z * ct]
          const s = camera / (camera - z)
          return [cx + x * s, cy + y * s, z / r] as const
        }

        // Each run of one shade is a single opaque path in a pre-mixed
        // colour: overlapping semi-transparent segments would double up at
        // every joint and show as a string of dots.
        let points = [project(0)]
        let shade = -1
        const flush = () => {
          if (points.length < 2) return
          ctx.strokeStyle = ramp[shade]
          ctx.beginPath()
          ctx.moveTo(points[0][0], points[0][1])
          for (let i = 1; i < points.length; i++)
            ctx.lineTo(points[i][0], points[i][1])
          ctx.stroke()
        }
        for (let i = 1; i <= SEGMENTS; i++) {
          const next = project((i / SEGMENTS) * Math.PI * 2)
          const prev = points[points.length - 1]
          const depth = (prev[2] + next[2]) / 2
          const level = Math.round(
            (far + (1 - far) * (0.5 + 0.5 * depth)) * (SHADES - 1),
          )
          if (level !== shade) {
            flush()
            points = [prev]
            shade = level
          }
          points.push(next)
        }
        flush()

        // Inner rings ride faster, like real orbits; alternate ways round.
        const pace = (k % 2 ? 1 : -1) * (1.6 / Math.sqrt(1 + k))
        riders.push(project(t * pace + k * 2.1))
      }

      const point = (p.point ?? 2) * dpr
      if (point > 0) {
        ctx.fillStyle = p.highlight
        for (const [x, y, depth] of riders) {
          ctx.globalAlpha = far + (1 - far) * (0.5 + 0.5 * depth)
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
      draw(performance.now())
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
      draw(now)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="block size-full" />
}
