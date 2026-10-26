import type { CSSProperties } from 'react'

// Film grain: a tile of noise baked into light and dark specks on
// transparency, laid over the film and jumped about a few times a second.
// Baked rather than blended, so it costs no more than any still layer.
// Its whites and blacks are specks, not colours.
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.33 0.33 0.33 0 0"/><feComponentTransfer result="light"><feFuncA type="linear" slope="3" intercept="-1.5"/></feComponentTransfer><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.33 -0.33 -0.33 0 1"/><feComponentTransfer result="dark"><feFuncA type="linear" slope="3" intercept="-1.5"/></feComponentTransfer><feMerge><feMergeNode in="dark"/><feMergeNode in="light"/></feMerge></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>',
)}")`

/** Film grain, for the film backdrop and Steamboat's start screen;
 *  `strength` is its opacity. */
export function FilmGrain({ strength = 0.32 }: { strength?: number }) {
  return (
    <div
      aria-hidden
      style={{ '--grain': strength } as CSSProperties}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        style={{ backgroundImage: GRAIN }}
        className="film-grain absolute -inset-[160px]"
      />
    </div>
  )
}
