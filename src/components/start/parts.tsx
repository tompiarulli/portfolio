import type { ReactNode } from 'react'

import { build } from '#/lib/build'
import { site } from '#/lib/site'

/** Pieces the themes' start screens share. Each screen lays them out and
 *  animates them its own way; their colours and type come from the theme's
 *  tokens (see "Start screen" in styles.css). */

/** The title, shaded in bands and stood on an extrusion: a second copy
 *  behind it. The version sits across its lower right corner. */
export function Title() {
  return (
    <p
      aria-hidden
      className="relative grid font-(family-name:--start-title-font) text-[calc(96px*var(--start-title-scale))] leading-none [font-weight:var(--start-title-weight)] tracking-(--start-title-tracking) *:col-start-1 *:row-start-1 sm:text-[calc(144px*var(--start-title-scale))]"
    >
      <span className="title-extrude">TomOS</span>
      <span className="title-bands">TomOS</span>
      <span className="script">v{site.version}</span>
    </p>
  )
}

/** The prompt, boxed in its own colour on the ground colour, so it reads
 *  over any backdrop; the extra left padding balances its letter spacing.
 *  Sizes are in pixels, since rems follow the theme's text size. */
export function Prompt({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <span
      aria-hidden
      className={`prompt-glow rounded-(--close-radius) border border-current bg-(--start-ground) py-[8px] pr-[16px] pl-[calc(16px+0.3em)] font-(family-name:--prompt-font) text-[12px] [font-weight:var(--prompt-weight)] tracking-[0.3em] whitespace-nowrap uppercase sm:pl-[calc(16px+0.4em)] sm:text-[14px] sm:tracking-[0.4em] ${className}`}
    >
      {children}
    </span>
  )
}

/** The build this is, along the bottom. */
export function BuildLine() {
  return (
    <p
      aria-hidden
      className="fade-in absolute inset-x-0 bottom-4 text-center font-(family-name:--start-font) text-[11.5px] text-(--start-text)"
    >
      Build {build.commit}
      {build.date && ` (${build.date})`}
    </p>
  )
}

// Ordered dithering: a 4x4 Bayer threshold map, each cell DOT pixels
// square, nudges every pixel up to one colour step before the colours snap
// to a few steps, so a smooth gradient comes out as patterned bands. The
// map's greys are thresholds, not colours.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const DOT = 2
const BAYER_MAP = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4" width="${4 * DOT}" height="${4 * DOT}" shape-rendering="crispEdges">${BAYER.map(
    (b, i) => {
      const v = Math.round(((b + 0.5) / 16) * 255)
      return `<rect x="${i % 4}" y="${Math.floor(i / 4)}" width="1" height="1" fill="rgb(${v},${v},${v})"/>`
    },
  ).join('')}</svg>`,
)}`

/** The dither as an SVG filter, snapping each colour channel to `levels`
 *  steps; its edges snap to fully in or out. */
export function Dither({ id, levels }: { id: string; levels: number }) {
  const step = 1 / (levels - 1)
  const table = Array.from({ length: levels }, (_, i) => i * step).join(' ')
  return (
    <filter
      id={id}
      x="0"
      y="0"
      width="1"
      height="1"
      colorInterpolationFilters="sRGB"
    >
      <feImage href={BAYER_MAP} width={4 * DOT} height={4 * DOT} />
      <feTile result="bayer" />
      <feComposite
        in="SourceGraphic"
        in2="bayer"
        operator="arithmetic"
        k2="1"
        k3={step}
        k4={-step / 2}
      />
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues={table} />
        <feFuncG type="discrete" tableValues={table} />
        <feFuncB type="discrete" tableValues={table} />
        <feFuncA type="discrete" tableValues="0 1" />
      </feComponentTransfer>
    </filter>
  )
}

/** A filter that shaves strokes thinner, for a face with one weight. */
export function Thin({ id }: { id: string }) {
  return (
    <filter id={id}>
      <feMorphology operator="erode" radius="1" />
    </filter>
  )
}
