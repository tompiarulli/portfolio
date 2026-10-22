import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { setResponseStatus } from '@tanstack/react-start/server'
import { Suspense, lazy, useEffect } from 'react'

import { Desktop } from '#/components/Desktop'
import { ogImage, pageHead } from '#/lib/seo'
import { site } from '#/lib/site'
import { themeBootScript } from '#/lib/theme'
import { pathFor } from '#/lib/windows'

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

// Orbital's font, both weights on screen at first paint, preloaded so it is
// fetched alongside the stylesheet rather than after it. Like the colour
// above, it is the default theme's and has to move with it (see its
// @font-face rules in styles.css).
const DEFAULT_FONTS = [
  '/fonts/geist-mono-400.woff2',
  '/fonts/geist-mono-600.woff2',
]

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

// A URL no route matches leaves the root matched alone. The server answers
// those with a 404, and the desktop opens File Not Found for them. A catch-
// all route would do the same, but its match is keyed by the URL, so
// 404.html (rendered at /404) wouldn't hydrate cleanly at any other URL.
const notFoundHead = pageHead({
  path: pathFor('notfound'),
  title: `File Not Found - ${site.title}`,
  description: site.descriptions.notFound,
  noindex: true,
})

// The prerender only writes pages that answer 200, so /404 does while it is
// rendered into 404.html. Vercel then serves that file with a 404 for every
// unknown URL (see vite.config.ts).
const keepPrerenderedNotFound = createIsomorphicFn().server(
  (pathname: string) => {
    if (
      process.env.TSS_PRERENDERING === 'true' &&
      pathname === pathFor('notfound')
    )
      setResponseStatus(200)
  },
)

export const Route = createRootRoute({
  loader: ({ location }) => keepPrerenderedNotFound(location.pathname),
  head: ({ matches }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // Every page sets its own title and description; the root alone is a
      // URL nothing else matched.
      ...(matches.length === 1 ? notFoundHead.meta : [{ title: site.title }]),
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
      ...DEFAULT_FONTS.map((href) => ({
        rel: 'preload',
        href,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous' as const,
      })),
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
    scripts: [{ children: themeBootScript }],
  }),
  shellComponent: RootDocument,
  component: Desktop,
  // Nothing to render for a not-found: the desktop shows its own window.
  notFoundComponent: () => null,
  errorComponent: RootError,
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

/** Stands in for the whole desktop, which is what failed, so it draws a
 *  plain alert box in the window chrome's tokens rather than a Window. The
 *  error itself only reaches the console, and in full only in development. */
function RootError({ error }: ErrorComponentProps) {
  // Deliberate: the console is the only place a crash is reported.
  if (import.meta.env.DEV) {
    // oxlint-disable-next-line no-console
    console.error(error)
  } else {
    // oxlint-disable-next-line no-console
    console.error(
      'Desktop error:',
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
  return (
    <div className="grid h-dvh place-items-center bg-(--desk) p-4">
      <section
        role="alertdialog"
        aria-labelledby="error-title"
        aria-describedby="error-body"
        className="w-[360px] max-w-full border border-(--ink) bg-(--surface) shadow-(--window-shadow)"
      >
        <h1
          id="error-title"
          className="font-title flex h-(--title-height) items-center justify-center border-b border-(--ink) bg-(--title) text-(length:--title-size) [font-weight:var(--title-weight)] text-(--on-title) [text-transform:var(--title-case)]"
        >
          Error
        </h1>
        <div className="p-5">
          <p id="error-body">
            Something went wrong and the desktop quit unexpectedly. Restart to
            try again.
          </p>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => location.reload()}
              className="bevel font-title active:bevel-pressed cursor-pointer px-6 py-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ink)"
            >
              Restart
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
