import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/seo'
import { site } from '#/lib/site'

export const Route = createFileRoute('/system')({
  head: () =>
    pageHead({
      path: '/system',
      title: `System Info - ${site.title}`,
      description: site.descriptions.system,
    }),
})
