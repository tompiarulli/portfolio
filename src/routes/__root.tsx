import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Suspense, lazy, useEffect } from 'react'
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

// The browser tints its toolbar to theme-color, matched to the menu bar's
// --surface. This hex is the one colour kept outside styles.css: static HTML
// can only carry one, so it is the default theme's (Orbital's --surface)
// and has to move with it. useThemeColor swaps in the live theme's.
const DEFAULT_THEME_COLOR = '#0a0a0a'

/** Copies the theme's --surface into theme-color, now and whenever the theme
 *  changes. It waits for hydration: React matches the meta tag by its
 *  content, so changing it any earlier makes React add a second one. */
function useThemeColor() {
  useEffect(() => {
    const root = document.documentElement
    const sync = () => {
      const meta = document.querySelector<HTMLMetaElement>(
        'meta[name="theme-color"]',
      )
      const color = getComputedStyle(root).getPropertyValue('--surface').trim()
      if (meta && color) meta.content = color
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // Every page sets its own title and description.
      { title: site.title },
      { name: 'theme-color', content: DEFAULT_THEME_COLOR },
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
  useThemeColor()
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
