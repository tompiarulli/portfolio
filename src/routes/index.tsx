import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/seo'
import { site } from '#/lib/site'

// Windows render from the desktop's window manager; routes set the URL and head.
export const Route = createFileRoute('/')({
  head: () =>
    pageHead({
      path: '/',
      title: `${site.name}, ${site.tagline}`,
      description: site.descriptions.home,
    }),
})
