import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/player')({
  head: () => ({ meta: [{ title: `Player - ${site.title}` }] }),
})
