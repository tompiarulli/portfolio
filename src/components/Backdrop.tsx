import { Suspense, lazy, useEffect, useState } from 'react'
import { RAIN_CHARACTERS, THEMES } from '#/lib/theme'
import type { Backdrop } from '#/lib/theme'

// Backgrounds load after hydration, so the shell stays small. Only the
// current theme's one is fetched.
const Dither = lazy(() => import('./bits/Dither'))
const CodeRain = lazy(() => import('./CodeRain'))

/**
 * Dither background knobs. Edit and save: the dev server applies changes
 * live without restarting the animation.
 */
const DITHER = {
  /** How fast the warp layer slides; this is what makes the shapes churn. */
  waveSpeed: 0.008,
  /** Direction the warp layer slides, [x, y]. [1, 1] is the original diagonal. */
  warpDirection: [1, 1],
  /** How strongly the warp bends the shapes; 0 is plain static noise. */
  warpStrength: 1,
  /** Slow slide of the whole pattern per second, [x, y]; [0, 0] is off. */
  drift: [0, 0],
  /** Detail: frequency step between noise octaves. */
  waveFrequency: 3,
  /** Detail: strength of each finer octave; lower = smoother, bigger masses. */
  waveAmplitude: 0.15,
  /** Shapes snap to blocks of this many dots; 1 is off. */
  blockSize: 12,
  /** Dither dot size in pixels. */
  pixelSize: 2,
  /** Shade levels from background ink to pattern ink. */
  colorNum: 4,
  /** Pattern contrast: '#808080' is the original, '#ffffff' uses the full ramp. */
  waveColor: '#808080',
} as const

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
        backdrop: theme?.backdrop ?? 'dither',
        head: s.getPropertyValue('--rain-head').trim(),
        low: s.getPropertyValue('--desk').trim(),
        high: s.getPropertyValue('--warp').trim(),
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
  if (!b) return null
  return (
    <div aria-hidden className="fixed inset-0 opacity-(--backdrop-opacity)">
      <Suspense>
        {b.backdrop === 'rain' ? (
          <CodeRain
            {...RAIN}
            // --warp trails led by a --rain-head glyph over the --desk base.
            background={b.low}
            trail={b.high}
            head={b.head}
            still={b.still}
          />
        ) : (
          <Dither
            {...DITHER}
            // The pattern is computed in grey, then recoloured from --desk (low)
            // to --warp (high).
            backgroundColor="#000000"
            paletteLow={b.low}
            paletteHigh={b.high}
            disableAnimation={b.still}
            enableMouseInteraction={false}
          />
        )}
      </Suspense>
    </div>
  )
}
