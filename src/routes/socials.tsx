import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/lib/site'

export const Route = createFileRoute('/socials')({
  head: () => ({ meta: [{ title: `Socials - ${site.title}` }] }),
})
