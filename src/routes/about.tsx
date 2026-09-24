import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: `About - ${site.title}` }] }),
})
