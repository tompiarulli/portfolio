import { Suspense, lazy, useEffect, useState } from 'react'
import { RAIN_CHARACTERS, THEMES } from '#/lib/theme'
import type { Backdrop } from '#/lib/theme'

// Backgrounds load after hydration, so the shell stays small. Only the
// current theme's one is fetched.
const CodeRain = lazy(() => import('./CodeRain'))
const Drift = lazy(() => import('./Drift'))

/** Code rain knobs, for themes with `backdrop: 'rain'`. */
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

/** Fire trails at 88 miles per hour, for `backdrop: 'streaks'`: the code
 *  rain turned sideways, fast, sparse and long. */
const STREAKS = {
  characters: '=-=~',
  direction: 'right',
  cellWidth: 10,
  cellHeight: 18,
  minSpeed: 40,
  maxSpeed: 90,
  minTrail: 12,
  maxTrail: 40,
  dropsPerColumn: 1,
  wait: 4,
} as const

/** A night sky of twinkling glyphs, for `backdrop: 'stars'`. */
const STARS = {
  characters: '..··+*',
  density: 1.4,
  wind: 3,
  twinkle: 0.25,
} as const

/** Snow blowing past, for `backdrop: 'snow'`. */
const SNOW = {
  characters: '*·.+*',
  density: 3,
  wind: 90,
  fall: 50,
  gust: 0.8,
} as const

type State = {
  backdrop: Backdrop
  desk: string
  warp: string
  glint: string
  still: boolean
}

/** Reads the backdrop's colours from tokens, following theme changes. */
function useBackdrop() {
  const [state, setState] = useState<State | null>(null)
  useEffect(() => {
    const root = document.documentElement
    const update = () => {
      const s = getComputedStyle(root)
      const theme = THEMES.find((t) => t.id === root.dataset.theme)
      setState({
        backdrop: theme?.backdrop ?? 'rain',
        desk: s.getPropertyValue('--desk').trim(),
        warp: s.getPropertyValue('--warp').trim(),
        glint: s.getPropertyValue('--glint').trim(),
        still: matchMedia('(prefers-reduced-motion: reduce)').matches,
      })
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])
  return state
}

export function Backdrop() {
  const b = useBackdrop()
  // A plain desktop is just the page's --desk background.
  if (!b || b.backdrop === 'plain') return null
  // Every backdrop draws --warp glyphs, lit in --glint, over --desk.
  const shared = { background: b.desk, still: b.still }
  return (
    <div aria-hidden className="fixed inset-0 opacity-(--backdrop-opacity)">
      <Suspense>
        {b.backdrop === 'stars' || b.backdrop === 'snow' ? (
          <Drift
            {...(b.backdrop === 'stars' ? STARS : SNOW)}
            {...shared}
            glyph={b.warp}
            glint={b.glint}
          />
        ) : (
          <CodeRain
            {...(b.backdrop === 'streaks' ? STREAKS : RAIN)}
            {...shared}
            trail={b.warp}
            head={b.glint}
          />
        )}
      </Suspense>
    </div>
  )
}
