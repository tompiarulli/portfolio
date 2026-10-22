import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'
import { Desktop } from '#/components/Desktop'
import { ogImage } from '#/lib/seo'
import { site } from '#/lib/site'
import { themeBootScript } from '#/lib/theme'
import appCss from '#/styles.css?url'

const Devtools = import.meta.env.DEV
  ? lazy(async () => {
      const [{ TanStackDevtools }, { TanStackRouterDevtoolsPanel }] =
        await Promise.all([
          import('@tanstack/react-devtools'),
          import('@tanstack/react-router-devtools'),
        ])
      return {
        default: () => (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              { name: 'Router', render: <TanStackRouterDevtoolsPanel /> },
            ]}
          />
        ),
      }
    })
  : () => null

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // Every page sets its own title and description.
      { title: site.title },
      {
        name: 'theme-color',
        content: '#efebe2',
        media: '(prefers-color-scheme: light)',
      },
      {
        name: 'theme-color',
        content: '#111111',
        media: '(prefers-color-scheme: dark)',
      },
      { property: 'og:site_name', content: site.name },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:image', content: ogImage.url },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: String(ogImage.width) },
      { property: 'og:image:height', content: String(ogImage.height) },
      { property: 'og:image:alt', content: ogImage.alt },
      // X falls back to the og: tags for everything else.
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
    scripts: [{ children: themeBootScript }],
  }),
  shellComponent: RootDocument,
  component: Desktop,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Suspense>
          <Devtools />
        </Suspense>
        <Scripts />
      </body>
    </html>
  )
}
