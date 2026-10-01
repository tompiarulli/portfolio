import { Suspense, lazy, useEffect, useState } from 'react'
import { RAIN_CHARACTERS, THEMES } from '#/lib/theme'
import type { Backdrop } from '#/lib/theme'

// Backgrounds load after hydration, so the shell stays small. Only the
// current theme's one is fetched.
const CodeRain = lazy(() => import('./CodeRain'))
const Drift = lazy(() => import('./Drift'))
const Dither = lazy(() => import('./bits/Dither'))
const Silk = lazy(() => import('./bits/Silk'))
const Film = lazy(() => import('./Film'))

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

/** Dust hanging in a sunlit room, for `backdrop: 'dust'`: sparse dots,
 *  barely moving, no twinkle. */
const DUST = {
  characters: '·.·',
  density: 0.8,
  wind: 2,
  fall: 1,
} as const

/** A slow dithered wash from --desk to --warp, for `backdrop: 'dither'`.
 *  Edit and save: the dev server applies changes live without restarting
 *  the animation. */
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

/** Slow dithered silk folds from --desk to --warp, for `backdrop: 'silk'`. */
export const SILK = {
  /** Fold speed; the original is 5. */
  speed: 1.5,
  /** Fold size; bigger is tighter. */
  scale: 0.8,
  /** Angle of the folds, in radians. */
  rotation: 0.3,
  /** 1 uses the whole ramp; lower keeps the folds near --desk. */
  contrast: 1,
  /** Film grain, so the folds read as fabric; the original is 1.5. */
  noiseIntensity: 0.2,
  /** Quantise to colorNum levels with an ordered dither; off is smooth. */
  dither: false,
  /** Shade levels from --desk to --warp, when dithered. */
  colorNum: 4,
  /** Cell size in pixels; 1 is a fine dither with no visible blocks. */
  pixelSize: 1,
} as const

/** An old sepia film in the projector, for `backdrop: 'film'`: --warp
 *  frame, --desk shadows, --glint specks and scratches. */
const FILM = {
  /** Grain strength; 0 is a clean print. */
  grain: 0.12,
  /** How much the frame's brightness jumps, frame to frame. */
  flicker: 0.08,
  /** How dark the edges get; 0 is none. */
  vignette: 0.7,
  /** Dust specks per frame, roughly. */
  dust: 1,
  /** Chance of each of the two scratches showing, 0..1. */
  scratches: 0.5,
  /** Cell size in pixels. */
  pixelSize: 2,
  /** Projector speed, in frames a second. */
  fps: 24,
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
  // Every other backdrop draws --warp glyphs, lit in --glint, over --desk.
  const shared = { background: b.desk, still: b.still }
  return (
    <div aria-hidden className="fixed inset-0 opacity-(--backdrop-opacity)">
      <Suspense>
        {b.backdrop === 'film' ? (
          <Film
            {...FILM}
            paletteLow={b.desk}
            paletteHigh={b.warp}
            glint={b.glint}
            disableAnimation={b.still}
          />
        ) : b.backdrop === 'silk' ? (
          <Silk
            {...SILK}
            paletteLow={b.desk}
            paletteHigh={b.warp}
            disableAnimation={b.still}
          />
        ) : b.backdrop === 'dither' ? (
          <Dither
            {...DITHER}
            // The pattern is computed in grey, then recoloured from --desk
            // (low) to --warp (high).
            backgroundColor="#000000"
            paletteLow={b.desk}
            paletteHigh={b.warp}
            disableAnimation={b.still}
            enableMouseInteraction={false}
          />
        ) : b.backdrop === 'stars' ||
          b.backdrop === 'snow' ||
          b.backdrop === 'dust' ? (
          <Drift
            {...(b.backdrop === 'stars'
              ? STARS
              : b.backdrop === 'snow'
                ? SNOW
                : DUST)}
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
