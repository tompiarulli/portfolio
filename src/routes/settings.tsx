import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '#/lib/seo'
import { site } from '#/lib/site'

export const Route = createFileRoute('/settings')({
  head: () =>
    pageHead({
      path: '/settings',
      title: `Settings - ${site.title}`,
      description: site.descriptions.settings,
    }),
})
