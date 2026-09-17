import { createFileRoute, notFound } from '@tanstack/react-router'
import { Window } from '#/components/Window'
import { Button } from '#/components/Button'
import { projects, site } from '#/lib/site'

export const Route = createFileRoute('/projects/$slug')({
  loader: ({ params }) => {
    const project = projects.find((p) => p.slug === params.slug)
    if (!project) throw notFound()
    return project
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.name ?? 'Project'} - ${site.title}` }],
  }),
  component: ProjectPage,
  notFoundComponent: () => (
    <Window title="Not found" x={200} y={140} width={320} closeTo="/projects">
      <p>No such project.</p>
    </Window>
  ),
})

function ProjectPage() {
  const p = Route.useLoaderData()
  return (
    <Window title={p.name} x={180} y={120} width={480} closeTo="/projects">
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
