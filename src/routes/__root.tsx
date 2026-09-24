import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'
import { Desktop } from '#/components/Desktop'
import { site } from '#/lib/site'
import { modeBootScript } from '#/lib/theme'
import appCss from '../styles.css?url'

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
      { title: site.title },
      { name: 'description', content: `${site.name} - ${site.tagline}` },
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
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
    scripts: [{ children: modeBootScript }],
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
