import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/projects')({
  head: () => ({ meta: [{ title: `Projects - ${site.title}` }] }),
})
