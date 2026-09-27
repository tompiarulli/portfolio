import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/work')({
  head: () => ({ meta: [{ title: `Work - ${site.title}` }] }),
})
