import { Suspense, lazy, useEffect, useState } from 'react'
import { RAIN_CHARACTERS, THEMES } from '#/lib/theme'
import type { Backdrop } from '#/lib/theme'

// Backgrounds load after hydration, so the shell stays small. Only the
// current theme's one is fetched.
const CodeRain = lazy(() => import('./CodeRain'))
const NightSky = lazy(() => import('./NightSky'))

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

type State = {
  backdrop: Backdrop
  low: string
  high: string
  head: string
  hull: string
  beam: string
  pine: string
  pineLit: string
  moon: string
  still: boolean
}

/** Reads the pattern colours from tokens, following theme changes. */
function useBackdrop() {
  const [state, setState] = useState<State | null>(null)
  useEffect(() => {
    const root = document.documentElement
    const update = () => {
      const s = getComputedStyle(root)
      const theme = THEMES.find((t) => t.id === root.dataset.theme)
      setState({
        backdrop: theme?.backdrop ?? 'rain',
        head: s.getPropertyValue('--rain-head').trim(),
        low: s.getPropertyValue('--desk').trim(),
        high: s.getPropertyValue('--warp').trim(),
        hull: s.getPropertyValue('--hull').trim(),
        beam: s.getPropertyValue('--beam').trim(),
        pine: s.getPropertyValue('--pine').trim(),
        pineLit: s.getPropertyValue('--pine-lit').trim(),
        moon: s.getPropertyValue('--moon').trim(),
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
  return (
    <div aria-hidden className="fixed inset-0 opacity-(--backdrop-opacity)">
      <Suspense>
        {b.backdrop === 'sky' ? (
          <NightSky
            // --warp stars over a --desk sky, above --pine trees lit in
            // --pine-lit, under a --moon; the saucer is a --hull outline shaded, lit and
            // beamed in --beam, and the trees are outlined in --hull too.
            background={b.low}
            stars={b.high}
            hull={b.hull}
            beam={b.beam}
            pine={b.pine}
            pineLit={b.pineLit}
            moon={b.moon}
            still={b.still}
          />
        ) : (
          <CodeRain
            {...RAIN}
            // --warp trails led by a --rain-head glyph over the --desk base.
            background={b.low}
            trail={b.high}
            head={b.head}
            still={b.still}
          />
        )}
      </Suspense>
    </div>
  )
}
