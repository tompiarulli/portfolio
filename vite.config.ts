import { execSync } from 'node:child_process'

import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

import { securityHeaders } from './src/lib/security-headers.ts'
import { site } from './src/lib/site.ts'

const git = (args: string) => {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

// The commit this build came from, shown as the site version in Settings.
// GitHub Actions provides the SHA; locally it comes from git.
const sha = process.env.GITHUB_SHA || git('rev-parse HEAD')
const build = {
  commit: sha.slice(0, 7) || 'unknown',
  date: (sha && git(`log -1 --format=%cs ${sha}`)) || '',
}

const oneDay = { 'cache-control': 'public, max-age=86400' }
// Not hashed, so not immutable, but they rarely change.
const oneWeek = {
  'cache-control': 'public, max-age=604800, stale-while-revalidate=86400',
}

// Headers for the static assets, written into Cloudflare's `_headers` file.
// Cloudflare applies every rule that matches a path, in order, so the
// security headers reach every file and the cache rules add to them. The
// Worker sets its own (see src/server.ts).
const headerRules: Record<string, Record<string, string>> = {
  // They set no cache-control, so the rules below still apply.
  '/*': securityHeaders(),
  // Hashed by Vite, so they can be cached for good.
  '/assets/*': { 'cache-control': 'public, max-age=31536000, immutable' },
  '/fonts/*': oneWeek,
  '/icons/*': oneWeek,
  '/travel/*': oneWeek,
  '/favicon.svg': oneDay,
  '/favicon.ico': oneDay,
  '/apple-touch-icon.png': oneDay,
  '/icon-192.png': oneDay,
  '/icon-512.png': oneDay,
  '/icon-maskable-512.png': oneDay,
  '/og.png': oneDay,
  '/manifest.webmanifest': oneDay,
  '/robots.txt': oneDay,
  '/sitemap.xml': oneDay,
}

const cloudflareHeaders: Plugin = {
  name: 'cloudflare-headers',
  apply: 'build',
  applyToEnvironment: (environment) => environment.name === 'client',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: '_headers',
      source: Object.entries(headerRules)
        .map(([path, headers]) =>
          [
            path,
            ...Object.entries(headers).map(
              ([name, value]) => `  ${name}: ${value}`,
            ),
          ].join('\n'),
        )
        .join('\n\n'),
    })
  },
}

// Tests only need React and Tailwind; Start and Cloudflare would build the app.
const isTest = process.env.VITEST === 'true'

export default defineConfig({
  define: { __BUILD__: JSON.stringify(build) },
  builder: { sharedConfigBuild: true },
  resolve: { tsconfigPaths: true },
  plugins: [
    !isTest && devtools(),
    !isTest && cloudflare({ viteEnvironment: { name: 'ssr' } }),
    !isTest && cloudflareHeaders,
    tailwindcss(),
    !isTest &&
      tanstackStart({
        // Every page is static HTML on Cloudflare's CDN; the Worker only
        // answers URLs with no file behind them (see src/server.ts).
        prerender: {
          enabled: true,
          crawlLinks: true,
          autoSubfolderIndex: true,
        },
        pages: [
          // The page for unknown URLs (see src/routes/__root.tsx).
          {
            path: '/404',
            prerender: { outputPath: '/404.html' },
            sitemap: { exclude: true },
          },
        ],
        sitemap: { host: site.url },
      }),
    viteReact(),
  ],
  test: {
    // e2e/ holds the Playwright tests.
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
