import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/media')({
  head: () => ({ meta: [{ title: `Media - ${site.title}` }] }),
})
