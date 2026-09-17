import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
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
