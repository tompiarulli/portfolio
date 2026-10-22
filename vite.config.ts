import { execSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import type { NitroModule } from 'nitro/types'
import { securityHeaders } from './src/lib/security-headers'
import { site } from './src/lib/site'

const git = (args: string) => {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

// The commit this build came from, shown as the site version in Settings.
// Vercel provides the SHA; locally it comes from git.
const sha = process.env.VERCEL_GIT_COMMIT_SHA || git('rev-parse HEAD')
const build = {
  commit: sha.slice(0, 7) || 'unknown',
  date: (sha && git(`log -1 --format=%cs ${sha}`)) || '',
}

const oneDay = { headers: { 'cache-control': 'public, max-age=86400' } }
// Not hashed, so not immutable, but they rarely change.
const oneWeek = {
  headers: {
    'cache-control': 'public, max-age=604800, stale-while-revalidate=86400',
  },
}

type VercelRoute = {
  src?: string
  dest?: string
  status?: number
  headers?: Record<string, string>
  continue?: boolean
  handle?: string
}

// Two fixes to the routes Nitro writes for Vercel (config.json):
// - Header rules stack, as they do in Nitro's own server. Vercel stops at
//   the first route that matches unless it has `continue`, which Nitro
//   leaves off, so a font would get its cache header but none of the
//   security headers.
// - Nitro sends every URL without a file behind it to the server function.
//   Nothing here runs at request time, so those are answered from the CDN
//   after the filesystem check instead: a missing /assets file (an old hash
//   asked for mid-deploy) gets a bare 404 that can't be cached, where it
//   would otherwise keep the immutable header from the /assets rule and be
//   cached for a year; anything else gets the prerendered 404.html with a
//   404 status.
// It edits the file in a `compiled` hook because Nitro's own
// `vercel.config.routes` option can only add routes ahead of the filesystem
// check. Modules install after the preset's hooks, so the preset has
// written the file by then.
const vercelRoutes: NitroModule = {
  name: 'vercel-routes',
  setup(instance) {
    if (!instance.options.preset.startsWith('vercel')) return
    instance.hooks.hook('compiled', async () => {
      const configPath = join(instance.options.output.dir, 'config.json')
      const config: { routes: VercelRoute[] } = JSON.parse(
        await readFile(configPath, 'utf8'),
      )
      const filesystem = config.routes.findIndex(
        (route) => route.handle === 'filesystem',
      )
      for (const route of config.routes.slice(0, filesystem)) {
        if (route.headers && !route.dest && !route.status) route.continue = true
      }
      const fallback = config.routes.findIndex(
        (route) => route.src === '/(.*)' && route.dest === '/__server',
      )
      if (fallback === -1)
        throw new Error(`No server fallback route in ${configPath}`)
      config.routes.splice(
        fallback,
        1,
        {
          src: '/assets/(.*)',
          status: 404,
          headers: { 'cache-control': 'no-store' },
        },
        { src: '/(.*)', dest: '/404.html', status: 404 },
      )
      await writeFile(configPath, JSON.stringify(config, null, 2))
    })
  },
}

export default defineConfig({
  define: { __BUILD__: JSON.stringify(build) },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({
      routeRules: {
        // Security headers for every response. Vercel applies header rules
        // before its filesystem check, so they reach the prerendered pages
        // too. They set no cache-control, so the rules below still apply.
        // Rules are fixed at build time; Vercel sets VERCEL_ENV on preview
        // builds, which allow the Vercel Toolbar.
        '/**': {
          headers: securityHeaders({
            vercelToolbar: process.env.VERCEL_ENV === 'preview',
          }),
        },
        // Hashed by Vite, so they can be cached for good.
        '/assets/**': {
          headers: { 'cache-control': 'public, max-age=31536000, immutable' },
        },
        '/fonts/**': oneWeek,
        '/icons/**': oneWeek,
        '/images/**': oneWeek,
        '/favicon.svg': oneDay,
        '/favicon.ico': oneDay,
        '/apple-touch-icon.png': oneDay,
        '/icon-192.png': oneDay,
        '/icon-512.png': oneDay,
        '/og.png': oneDay,
        '/manifest.webmanifest': oneDay,
        '/robots.txt': oneDay,
        '/sitemap.xml': oneDay,
      },
      modules: [vercelRoutes],
    }),
    tailwindcss(),
    tanstackStart({
      // Every route is static HTML on Vercel's CDN. No function on the hot path.
      prerender: { enabled: true, crawlLinks: true, autoSubfolderIndex: true },
      pages: [
        // System sits in a closed menu, so no prerendered page links to it
        // and the crawl alone never finds it.
        { path: '/system' },
        // The page for unknown URLs (see src/routes/__root.tsx).
        {
          path: '/404',
          prerender: { outputPath: '/404.html' },
          sitemap: { exclude: true },
        },
      ],
      // Lists every prerendered page.
      sitemap: { host: site.url },
    }),
    viteReact(),
  ],
})
