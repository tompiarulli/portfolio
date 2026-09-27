import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/albums')({
  head: () => ({ meta: [{ title: `Albums - ${site.title}` }] }),
})
