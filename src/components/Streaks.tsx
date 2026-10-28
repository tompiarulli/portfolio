import { useEffect, useRef } from 'react'

import { stage } from '#/lib/power'
import { random } from '#/lib/random'

/** How many times its usual speed the field runs at Restart's exit. */
const WARP = 10

type Props = {
  background: string
  /** Colours the streaks burn in, one picked per streak, fading out along
   *  their tails. */
  colors: string[]
  /** Streaks on screen at once, per 100 rows of pixels. */
  density?: number
  /** Speed range of the nearest streaks, in screen widths per second. */
  minSpeed?: number
  maxSpeed?: number
  /** Tail length range of the nearest streaks, in screen widths. */
  minLength?: number
  maxLength?: number
  /** Thickness of the nearest streaks, in drawn pixels. */
  thickness?: number
  /** Size of one drawn pixel in CSS pixels. */
  pixelSize?: number
  /** Draw one frame and stop, for reduced motion. */
  still?: boolean
}

type Streak = {
  x: number
  y: number
  /** 0 is far away, 1 is close. Fixed per slot, so the slots stay sorted
   *  far to near and near streaks always draw on top. */
  depth: number
  speed: number
  length: number
  size: number
  color: string
}

/** Light trails racing left to right in perspective: far streaks thin,
 *  slow and dim, near ones thicker and faster. Drawn at a fixed pixel
 *  size, so every edge stays hard. */
export default function Streaks({
  background,
  colors,
  density = 80,
  minSpeed = 0.4,
  maxSpeed = 0.9,
  minLength = 1,
  maxLength = 2.5,
  thickness = 2,
  pixelSize = 1,
  still = false,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let streaks: Streak[] = []
    // How many times its usual speed the field runs, and how many times
    // their usual length the tails stretch with it.
    let pace = 1
    let stretch = 1

    // Starts a streak off the left edge, or anywhere along its run.
    const spawn = (depth: number, anywhere = false): Streak => {
      const scale = 0.1 + 0.9 * depth
      const length = random(minLength, maxLength) * width * scale
      return {
        x: anywhere ? random(0, width + length) : random(-width, 0),
        y: Math.floor(random(0, height)),
        depth,
        speed: random(minSpeed, maxSpeed) * width * scale,
        length,
        size: Math.max(1, Math.round(thickness * depth)),
        color:
          colors[Math.floor(Math.random() * colors.length)] ?? 'transparent',
      }
    }

    const draw = () => {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      // Transparent leaves the page's own sky showing between streaks.
      if (background === 'transparent') ctx.clearRect(0, 0, width, height)
      else {
        ctx.fillStyle = background
        ctx.fillRect(0, 0, width, height)
      }
      // Overlapping light adds up, so crossings burn hotter.
      ctx.globalCompositeOperation = 'lighter'
      for (const s of streaks) {
        const headX = Math.floor(s.x)
        const tailX = Math.floor(s.x - s.length * stretch)
        const gradient = ctx.createLinearGradient(tailX, 0, headX, 0)
        gradient.addColorStop(0, 'transparent')
        gradient.addColorStop(1, s.color)
        ctx.globalAlpha = 0.3 + 0.7 * s.depth
        ctx.fillStyle = gradient
        ctx.fillRect(tailX, s.y, headX - tailX, s.size)
      }
    }

    const resize = () => {
      const size = Math.max(1, pixelSize)
      width = canvas.width = Math.max(1, Math.round(canvas.clientWidth / size))
      height = canvas.height = Math.max(
        1,
        Math.round(canvas.clientHeight / size),
      )
      const count = Math.round((density * height) / 100)
      // Most streaks far off, a few close by.
      const depths = Array.from({ length: count }, () => Math.random() ** 1.6)
      streaks = depths.sort((a, b) => a - b).map((d) => spawn(d, true))
      draw()
    }

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      // Cap the step so a background tab doesn't lurch when it returns.
      const dt = Math.min(now - last, 100) / 1000
      last = now
      if (document.hidden) return
      // As Restart's start screen leaves, the streaks run up to full speed,
      // their tails stretching, and ease back once the desktop is on
      // (lib/power).
      const target = stage() === 'leaving' ? WARP : 1
      pace += (target - pace) * Math.min(1, dt * 4)
      stretch = 1 + (pace - 1) * 0.3
      streaks.forEach((s, i) => {
        s.x += s.speed * pace * dt
        if (s.x - s.length * stretch > width) streaks[i] = spawn(s.depth)
      })
      draw()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    if (!still) frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [
    background,
    colors,
    density,
    minSpeed,
    maxSpeed,
    minLength,
    maxLength,
    thickness,
    pixelSize,
    still,
  ])

  return (
    <canvas ref={ref} className="block size-full [image-rendering:pixelated]" />
  )
}
