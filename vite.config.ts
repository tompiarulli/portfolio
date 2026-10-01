import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const git = (args: string) => {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

// The commit this build came from, shown as the site version in the footer.
// Vercel provides the SHA; locally it comes from git.
const sha = process.env.VERCEL_GIT_COMMIT_SHA || git('rev-parse HEAD')
const build = {
  commit: sha.slice(0, 7) || 'unknown',
  date: (sha && git(`log -1 --format=%cs ${sha}`)) || '',
}

export default defineConfig({
  define: { __BUILD__: JSON.stringify(build) },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro(),
    tailwindcss(),
    tanstackStart({
      // Every route is static HTML on Vercel's CDN. No function on the hot path.
      prerender: { enabled: true, crawlLinks: true, autoSubfolderIndex: true },
    }),
    viteReact(),
  ],
})
