import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/terminal')({
  head: () => ({ meta: [{ title: `Terminal - ${site.title}` }] }),
})
