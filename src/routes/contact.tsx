import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/contact')({
  head: () => ({ meta: [{ title: `Contact - ${site.title}` }] }),
})
