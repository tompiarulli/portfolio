import { Window } from '#/components/Window'
import { Button } from '#/components/Button'
import { projects } from '#/lib/site'

export function Project({ slug }: { slug: string }) {
  const p = projects.find((project) => project.slug === slug)
  if (!p)
    return (
      <Window title="Not found" x={200} y={140} width={320}>
        <p>No such project.</p>
      </Window>
    )
  return (
    <Window title={p.name} x={180} y={120} width={480}>
      <p className="font-title text-xs uppercase tracking-wide">{p.year}</p>
      <h1 className="font-title text-xl">{p.name}</h1>
      <p className="mt-3">{p.blurb}</p>
      <p className="mt-3 text-xs">{p.stack.join(' / ')}</p>
      {p.url && (
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block"
        >
          <Button accent>Open ↗</Button>
        </a>
      )}
    </Window>
  )
}
