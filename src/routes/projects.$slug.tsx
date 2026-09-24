import { createFileRoute, notFound } from '@tanstack/react-router'
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
  // The project window renders its own "not found" state.
  notFoundComponent: () => null,
})
