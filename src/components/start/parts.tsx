import type { CSSProperties } from 'react'

import { build } from '#/lib/build'
import { site } from '#/lib/site'

/** Pieces the themes' start screens share. Each screen lays them out and
 *  animates them its own way; their colours and type come from the theme's
 *  tokens (see "Start screen" in styles.css). */

const NAME = 'TomOS'

/** The title, shaded in bands and stood on an extrusion: a second copy
 *  behind it. The version sits across its lower right corner. `taper` sets
 *  it in capitals leaning forward, each letter smaller than the last, as if
 *  rushing into the distance. */
export function Title({ taper = false }: { taper?: boolean }) {
  const name = taper
    ? [...NAME].map((c, i) => (
        <span key={i} style={{ '--i': i } as CSSProperties}>
          {c}
        </span>
      ))
    : NAME
  return (
    <p
      aria-hidden
      className={`relative grid font-(family-name:--start-title-font) text-[calc(96px*var(--start-title-scale))] leading-none [font-weight:var(--start-title-weight)] tracking-(--start-title-tracking) *:col-start-1 *:row-start-1 sm:text-[calc(144px*var(--start-title-scale))] ${taper ? 'title-taper' : ''}`}
    >
      <span className="title-extrude">{name}</span>
      <span className="title-bands">{name}</span>
      <span className="script">v{site.version}</span>
    </p>
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
