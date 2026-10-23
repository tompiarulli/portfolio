// Serves the Vercel build the way Vercel does, for the end-to-end tests and
// Lighthouse: it follows the routes Nitro wrote to config.json (headers,
// then files, then the 404 fallbacks), so every response carries the
// production headers and status, and it brotli-encodes what Vercel's CDN
// would. Nothing runs at request time, so there is no server to start.
//
// Usage: pnpm build:vercel && node scripts/serve-prod.mjs   (PORT defaults to 4173)
import { existsSync, readFileSync, statSync } from 'node:fs'
import http from 'node:http'
import { extname, join, normalize, sep } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'

const PORT = Number(process.env.PORT ?? 4173)
const OUTPUT = join(import.meta.dirname, '..', '.vercel', 'output')
const STATIC = join(OUTPUT, 'static')

if (!existsSync(join(OUTPUT, 'config.json'))) {
  process.stderr.write(
    'No Vercel build found. Run `pnpm build:vercel` first.\n',
  )
  process.exit(1)
}

/** @type {{ routes: { src?: string, dest?: string, status?: number, headers?: Record<string, string>, continue?: boolean, handle?: string }[] }} */
const config = JSON.parse(readFileSync(join(OUTPUT, 'config.json'), 'utf8'))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}
const COMPRESSIBLE =
  /^(text\/|application\/(json|manifest\+json|xml)|image\/(svg|x-icon))/

/** A file under the static folder for a URL path, as Vercel's filesystem
 *  check finds it: the file itself, or a folder's index.html. */
function findFile(pathname) {
  let safe
  try {
    safe = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, '')
  } catch {
    return null
  }
  for (const candidate of [safe, join(safe, 'index.html')]) {
    const file = join(STATIC, candidate)
    if (!file.startsWith(STATIC + sep) && file !== STATIC) continue
    if (existsSync(file) && statSync(file).isFile()) return file
  }
  return null
}

/** Vercel matches `src` against the whole path, ignoring case. */
const matches = (route, pathname) =>
  route.src !== undefined && new RegExp(`^${route.src}$`, 'i').test(pathname)

const lower = (headers = {}) =>
  Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  )

/** Walks the routes for a path: what to serve, with which status and
 *  headers. Later headers win, as they do on Vercel. */
function resolve(pathname) {
  let headers = {}
  let filesystem = false
  for (const route of config.routes) {
    if (route.handle === 'filesystem') {
      filesystem = true
      const file = findFile(pathname)
      if (file) return { status: 200, file, headers }
      continue
    }
    if (route.handle || !matches(route, pathname)) continue
    headers = { ...headers, ...lower(route.headers) }
    if (route.continue) continue
    const file = route.dest ? findFile(route.dest) : null
    return { status: route.status ?? 200, file, headers }
  }
  if (!filesystem) {
    const file = findFile(pathname)
    if (file) return { status: 200, file, headers }
  }
  return { status: 404, file: null, headers }
}

function send(req, res, status, headers, body) {
  const type = String(headers['content-type'] ?? '')
  if (
    COMPRESSIBLE.test(type) &&
    /\bbr\b/.test(req.headers['accept-encoding'] ?? '')
  ) {
    body = brotliCompressSync(body, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    })
    headers['content-encoding'] = 'br'
    headers.vary = 'accept-encoding'
  }
  headers['content-length'] = body.length
  res.writeHead(status, headers)
  res.end(req.method === 'HEAD' ? undefined : body)
}

http
  .createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' })
      return res.end()
    }
    const { pathname } = new URL(req.url ?? '/', 'http://localhost')
    const { status, file, headers } = resolve(pathname)
    if (!file)
      return send(
        req,
        res,
        status,
        { ...headers, 'content-type': 'text/plain; charset=utf-8' },
        Buffer.from('Not Found'),
      )
    // Vercel's default for files no rule gives a cache-control.
    const type = MIME[extname(file)] ?? 'application/octet-stream'
    const cache =
      headers['cache-control'] ?? 'public, max-age=0, must-revalidate'
    send(
      req,
      res,
      status,
      { ...headers, 'content-type': type, 'cache-control': cache },
      readFileSync(file),
    )
  })
  .listen(PORT, () =>
    process.stdout.write(
      `Serving production build at http://localhost:${PORT}\n`,
    ),
  )

for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => process.exit(0))
