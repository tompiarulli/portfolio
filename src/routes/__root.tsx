import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { Suspense, lazy } from 'react'
import { Desktop } from '#/components/Desktop'
import { site } from '#/lib/site'
import { themeBootScript } from '#/lib/theme'
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
      { name: 'theme-color', content: '#f6d5d5' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
    scripts: [{ children: themeBootScript }],
  }),
  shellComponent: RootDocument,
  component: () => (
    <Desktop>
      <Outlet />
    </Desktop>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
