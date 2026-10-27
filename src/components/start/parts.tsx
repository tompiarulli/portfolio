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

/** A filter that shaves strokes thinner, for a face with one weight, by
 *  `radius` pixels each side. */
export function Thin({ id, radius = 1 }: { id: string; radius?: number }) {
  return (
    <filter id={id}>
      <feMorphology operator="erode" radius={radius} />
    </filter>
  )
}
