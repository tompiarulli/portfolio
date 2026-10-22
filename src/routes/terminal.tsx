import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/seo'
import { site } from '#/lib/site'

export const Route = createFileRoute('/terminal')({
  head: () =>
    pageHead({
      path: '/terminal',
      title: `Terminal - ${site.title}`,
      description: site.descriptions.terminal,
    }),
})
