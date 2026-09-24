import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [{ title: `Settings - ${site.title}` }] }),
})
