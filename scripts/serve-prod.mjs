// Serves the production build as Cloudflare does, for the end-to-end tests
// and Lighthouse. `vite preview` runs the built Worker and its assets in
// Cloudflare's local runtime (headers, statuses, the 404s), but sends
// everything uncompressed, where Cloudflare's edge compresses text. This
// starts it one port up and puts a proxy in front that brotli-encodes text
// responses, so Lighthouse measures what visitors download.
// Usage: pnpm build && node scripts/serve-prod.mjs   (PORT defaults to 4173)

import { spawn } from 'node:child_process'
import { createServer, request } from 'node:http'
import { constants, createBrotliCompress } from 'node:zlib'

const PORT = Number(process.env.PORT ?? 4173)
const UPSTREAM = PORT + 1

// What Cloudflare compresses: text, not images, video or woff2.
const COMPRESSIBLE =
  /^(text\/|application\/(javascript|json|manifest\+json|xml)|image\/svg\+xml)/

const preview = spawn(
  'pnpm',
  ['exec', 'vite', 'preview', '--port', String(UPSTREAM), '--strictPort'],
  { stdio: ['ignore', 'ignore', 'inherit'] },
)
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    preview.kill()
    process.exit()
  })
preview.on('exit', (code) => process.exit(code ?? 1))

const server = createServer((req, res) => {
  const upstream = request(
    {
      port: UPSTREAM,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, 'accept-encoding': 'identity' },
    },
    (response) => {
      const headers = { ...response.headers }
      const type = String(headers['content-type'] ?? '')
      const brotli =
        COMPRESSIBLE.test(type) &&
        /\bbr\b/.test(String(req.headers['accept-encoding'] ?? ''))
      if (brotli) {
        delete headers['content-length']
        headers['content-encoding'] = 'br'
        headers.vary = 'accept-encoding'
      }
      res.writeHead(response.statusCode ?? 502, headers)
      if (brotli)
        response
          .pipe(
            createBrotliCompress({
              params: { [constants.BROTLI_PARAM_QUALITY]: 4 },
            }),
          )
          .pipe(res)
      else response.pipe(res)
    },
  )
  upstream.on('error', () => {
    res.writeHead(502)
    res.end()
  })
  req.pipe(upstream)
})

// Wait for the preview to answer before saying the server is up.
async function waitForPreview() {
  for (let i = 0; i < 120; i++) {
    try {
      await fetch(`http://localhost:${UPSTREAM}/`)
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  throw new Error('vite preview did not start')
}

await waitForPreview()
server.listen(PORT, () =>
  process.stdout.write(
    `Serving production build at http://localhost:${PORT}\n`,
  ),
)
