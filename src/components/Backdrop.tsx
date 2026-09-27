import { Suspense, lazy, useEffect, useState } from 'react'

// The WebGL background loads after hydration, so the shell stays small.
const Dither = lazy(() => import('./bits/Dither'))

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

type State = { low: string; high: string; still: boolean }

/** Reads the pattern colours from tokens, following mode and theme changes. */
function useBackdrop() {
  const [state, setState] = useState<State | null>(null)
  useEffect(() => {
    const root = document.documentElement
    const update = () => {
      const s = getComputedStyle(root)
      setState({
        low: s.getPropertyValue('--desk').trim(),
        high: s.getPropertyValue('--warp').trim(),
        still: matchMedia('(prefers-reduced-motion: reduce)').matches,
      })
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-mode', 'data-theme'],
    })
    return () => observer.disconnect()
  }, [])
  return state
}

export function Backdrop() {
  const b = useBackdrop()
  if (!b) return null
  return (
    <div aria-hidden className="fixed inset-0">
      <Suspense>
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
      </Suspense>
    </div>
  )
}
