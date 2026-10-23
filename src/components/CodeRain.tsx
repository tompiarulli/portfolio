import { useEffect, useRef } from 'react'

import { random } from '#/lib/random'

type Props = {
  background: string
  /** Colour of the falling trails. */
  trail: string
  /** Colour of the leading glyph in each drop. */
  head: string
  characters: string
  /** Size of one glyph cell in CSS pixels. */
  cellWidth?: number
  cellHeight?: number
  /** Drop speed range, in cells per second. */
  minSpeed?: number
  maxSpeed?: number
  /** Trail length range, in cells. */
  minTrail?: number
  maxTrail?: number
  /** Drops falling in each column at once. */
  dropsPerColumn?: number
  /** Screens a drop may wait off screen before entering; more is sparser. */
  wait?: number
  /** Share of glyphs that change each second. */
  mutation?: number
  /** Draw one frame and stop, for reduced motion. */
  still?: boolean
}

type Drop = { y: number; speed: number; trail: number }

/** Glyphs sit on a fixed grid and light up as a drop passes over them,
 *  rather than falling with it; a few change at random each second. */
export default function CodeRain({
  background,
  trail,
  head,
  characters,
  cellWidth = 14,
  cellHeight = 18,
  minSpeed = 6,
  maxSpeed = 18,
  minTrail = 15,
  maxTrail = 50,
  dropsPerColumn = 2,
  wait = 1,
  mutation = 0.04,
  still = false,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    const parent = canvas?.parentElement
    if (!canvas || !ctx || !parent) return

    const glyphs = Array.from(characters)
    const pick = () => Math.floor(Math.random() * glyphs.length)
    let columns = 0
    let rows = 0
    // Lanes the drops run in, and how many cells long each lane is.
    let lanes = 0
    let length = 0
    let cells = new Uint16Array(0)
    let drops: Drop[] = []

    // Starts a drop before the screen, so lanes enter at staggered times.
    const spawn = (anywhere = false): Drop => ({
      y: anywhere
        ? random(-length * (wait - 1), length + maxTrail)
        : random(-length * wait, 0),
      speed: random(minSpeed, maxSpeed),
      trail: Math.round(random(minTrail, maxTrail)),
    })

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      columns = Math.ceil(width / cellWidth)
      rows = Math.ceil(height / cellHeight)
      lanes = columns
      length = rows
      cells = Uint16Array.from({ length: columns * rows }, pick)
      drops = Array.from({ length: lanes * dropsPerColumn }, () => spawn(true))
      draw()
    }

    const draw = () => {
      ctx.globalAlpha = 1
      ctx.fillStyle = background
      ctx.fillRect(0, 0, columns * cellWidth, rows * cellHeight)
      ctx.font = `${cellHeight - 2}px monospace`
      ctx.textBaseline = 'top'
      ctx.textAlign = 'center'
      drops.forEach((d, i) => {
        const lane = i % lanes
        const top = Math.floor(d.y)
        for (let p = Math.max(0, top - d.trail); p <= top && p < length; p++) {
          const cell = cells[p * columns + lane]
          const glyph = cell === undefined ? undefined : glyphs[cell]
          if (glyph === undefined) continue
          // Square-root falloff keeps most of the trail bright, fading late.
          ctx.globalAlpha = Math.sqrt(1 - (top - p) / d.trail)
          ctx.fillStyle = p === top ? head : trail
          ctx.fillText(
            glyph,
            lane * cellWidth + cellWidth / 2,
            p * cellHeight + 1,
          )
        }
      })
    }

    let frame = 0
    let last = performance.now()
    let pending = 0
    const tick = (now: number) => {
      // Cap the step so a background tab doesn't lurch when it returns.
      const dt = Math.min(now - last, 100) / 1000
      last = now
      drops.forEach((d, i) => {
        d.y += d.speed * dt
        if (d.y - d.trail > length) drops[i] = spawn()
      })
      pending += cells.length * mutation * dt
      for (; pending >= 1; pending--)
        cells[Math.floor(Math.random() * cells.length)] = pick()
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
    trail,
    head,
    characters,
    cellWidth,
    cellHeight,
    minSpeed,
    maxSpeed,
    minTrail,
    maxTrail,
    dropsPerColumn,
    wait,
    mutation,
    still,
  ])

  return <canvas ref={ref} className="block size-full" />
}
