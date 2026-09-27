import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/system')({
  head: () => ({ meta: [{ title: `System Info - ${site.title}` }] }),
})
