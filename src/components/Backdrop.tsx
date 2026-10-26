import { Suspense, lazy, useEffect, useState } from 'react'

import { RAIN_CHARACTERS, THEMES, currentTheme } from '#/lib/theme'
import type { Backdrop } from '#/lib/theme'

// Backgrounds load after hydration, so the shell stays small. Only the
// current theme's one is fetched.
const CodeRain = lazy(() => import('#/components/CodeRain'))
const Orbits = lazy(() => import('#/components/Orbits'))
const Film = lazy(() => import('#/components/Film'))
const Streaks = lazy(() => import('#/components/Streaks'))

/** For `backdrop: 'rain'`. */
const RAIN = {
  characters: RAIN_CHARACTERS,
  /** Glyph cell in pixels; the glyph fills most of it. */
  cellWidth: 14,
  cellHeight: 18,
  /** Drop speed range, in cells per second. */
  minSpeed: 6,
  maxSpeed: 18,
  /** Trail length range, in cells. */
  minTrail: 15,
  maxTrail: 50,
  /** Drops falling in each column at once; more is denser. */
  dropsPerColumn: 2,
} as const

/** For `backdrop: 'streaks'`, drawn in --streak-1 to --streak-4. */
const STREAKS = {
  /** Streaks on screen at once, per 100 rows of pixels. */
  density: 80,
  /** Speed range of the nearest streaks, in screen widths per second. */
  minSpeed: 0.4,
  maxSpeed: 0.9,
  /** Tail length range of the nearest streaks, in screen widths. */
  minLength: 1,
  maxLength: 2.5,
  /** Thickness of the nearest streaks, in drawn pixels. */
  thickness: 2,
  /** Drawn pixel size in CSS pixels. */
  pixelSize: 1,
} as const

/** For `backdrop: 'orbits'`; the Settings preview starts from it too. */
export const ORBITS = {
  count: 7,
  /** Centre of the set, as fractions of the width and height. */
  center: [0.6, 0.55],
  /** Radius of the innermost and outermost rings, as fractions of the
   *  shorter screen side. */
  inner: 0.22,
  outer: 0.75,
  /** How fast the set turns, and the rings wobble and the points ride. */
  speed: 0.05,
  /** Brightness of the far half of each ring, against the near half. */
  far: 0.3,
  /** Line width in pixels. */
  lineWidth: 1,
  /** Radius of the riding points in pixels; 0 is none. */
  point: 2,
  fps: 30,
} as const

/** For `backdrop: 'film'`. */
const FILM = {
  /** How much the frame's brightness jumps, frame to frame. */
  flicker: 0.04,
  /** How dark the edges get; 0 is none. */
  vignette: 0.7,
  /** Cell size in pixels. */
  pixelSize: 2,
  /** Projector speed, in frames a second. */
  fps: 24,
} as const

type State = {
  backdrop: Backdrop
  desk: string
  warp: string
  glint: string
  streaks: string[]
  still: boolean
}

/** Reads the backdrop's colours from tokens, following theme changes. */
function useBackdrop() {
  const [state, setState] = useState<State | null>(null)
  useEffect(() => {
    const root = document.documentElement
    const update = () => {
      const s = getComputedStyle(root)
      const theme = THEMES.find((t) => t.id === currentTheme()) ?? THEMES[0]
      setState({
        backdrop: theme.backdrop,
        desk: s.getPropertyValue('--desk').trim(),
        warp: s.getPropertyValue('--warp').trim(),
        glint: s.getPropertyValue('--glint').trim(),
        streaks: [1, 2, 3, 4].map((n) =>
          s.getPropertyValue(`--streak-${n}`).trim(),
        ),
        still: matchMedia('(prefers-reduced-motion: reduce)').matches,
      })
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    // Turning reduced motion on or off stills or restarts the backdrop.
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    motion.addEventListener('change', update)
    return () => {
      observer.disconnect()
      motion.removeEventListener('change', update)
    }
  }, [])
  return state
}

export function Backdrop() {
  const b = useBackdrop()
  if (!b) return null
  // Every backdrop draws in --warp, lit in --glint, over --desk.
  const shared = { background: b.desk, still: b.still }
  return (
    <div aria-hidden className="fixed inset-0 opacity-(--backdrop-opacity)">
      <Suspense>
        {b.backdrop === 'film' ? (
          <Film
            {...FILM}
            paletteLow={b.desk}
            paletteHigh={b.warp}
            disableAnimation={b.still}
          />
        ) : b.backdrop === 'streaks' ? (
          <Streaks {...STREAKS} {...shared} colors={b.streaks} />
        ) : b.backdrop === 'orbits' ? (
          <Orbits
            {...ORBITS}
            background={b.desk}
            color={b.warp}
            highlight={b.glint}
            still={b.still}
          />
        ) : (
          <CodeRain {...RAIN} {...shared} trail={b.warp} head={b.glint} />
        )}
      </Suspense>
    </div>
  )
}
