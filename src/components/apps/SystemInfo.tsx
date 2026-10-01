import { Window } from '#/components/Window'
import { build } from '#/lib/build'
import { credits, site } from '#/lib/site'

export function SystemInfo() {
  return (
    <Window title="System Info" x={-80} y={-10} width={340} height={420}>
      <p className="font-title text-base">{site.os}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-dotted border-(--ink) pt-3">
        <dt className="font-title">Version</dt>
        <dd>
          {build.commit}
          {build.date && ` (${build.date})`}
        </dd>
      </dl>
      {credits.map(({ group, items }) => (
        <section
          key={group}
          className="mt-3 border-t border-dotted border-(--ink) pt-3"
        >
          <h2 className="font-title">{group}</h2>
          <ul className="mt-1 space-y-1">
            {items.map((c) => (
              <li key={c.name}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener"
                  className="underline"
                >
                  {c.name}
                </a>
                {c.by && ` by ${c.by}`}
                {c.license && `, ${c.license}`}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Window>
  )
}
