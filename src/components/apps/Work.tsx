import { Window } from '#/components/Window'
import { profiles, site } from '#/lib/site'

const linkedIn = profiles.find((p) => p.label === 'LinkedIn')

export function Work() {
  return (
    <Window title="Work" x={-250} y={90} width={420}>
      <div className="space-y-3">
        {site.work.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {linkedIn && (
          <p>
            <a
              href={linkedIn.url}
              rel="me"
              className="underline outline-offset-2 outline-current outline-dotted not-focus-visible:outline-none"
            >
              {site.workLink}
            </a>
          </p>
        )}
      </div>
    </Window>
  )
}
