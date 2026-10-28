import { Window } from '#/components/Window'
import { site } from '#/lib/site'

export function About() {
  return (
    <Window title="About" x={-317} y={37} width={420}>
      <div className="space-y-3">
        {site.letter.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>{site.signoff}</p>
      </div>
    </Window>
  )
}
