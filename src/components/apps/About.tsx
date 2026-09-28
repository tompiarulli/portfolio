import { Window } from '#/components/Window'
import { site } from '#/lib/site'

export function About() {
  return (
    <Window title="About" x={-330} y={-20} width={420}>
      <Portrait />
      <div className="space-y-3 text-[length:calc(var(--text-size)+1px)]">
        {site.letter.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>{site.signoff}</p>
      </div>
    </Window>
  )
}

/** Codec screen; a pixel silhouette stands in until there's a photo. */
function Portrait() {
  return (
    <div className="codec mb-4 h-32 w-28" aria-hidden>
      <svg
        viewBox="0 0 22 28"
        shapeRendering="crispEdges"
        className="absolute inset-0 size-full"
        fill="currentColor"
      >
        <rect x="6" y="4" width="10" height="3" />
        <rect x="7" y="7" width="8" height="8" opacity="0.8" />
        <rect x="9" y="15" width="4" height="2" opacity="0.6" />
        <rect x="3" y="17" width="16" height="11" opacity="0.6" />
      </svg>
    </div>
  )
}
