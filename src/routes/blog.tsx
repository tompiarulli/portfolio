import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/blog')({
  head: () => ({ meta: [{ title: `Blog - ${site.title}` }] }),
})
