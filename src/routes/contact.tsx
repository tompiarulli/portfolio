import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '#/lib/seo'
import { site } from '#/lib/site'

export const Route = createFileRoute('/contact')({
  head: () =>
    pageHead({
      path: '/contact',
      title: `Contact - ${site.title}`,
      description: site.descriptions.contact,
    }),
})
