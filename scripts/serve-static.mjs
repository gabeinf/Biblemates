// Tiny static server for the exported web build, with SPA fallback to index.html.
// Usage: node scripts/serve-static.mjs <dir> <port>   (Playwright starts this itself.)
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

const [dir = 'artifacts/web', port = '4173'] = process.argv.slice(2)
const base = resolve(dir)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function fileFor(urlPath) {
  const target = normalize(join(base, decodeURIComponent(urlPath)))
  if (!target.startsWith(base)) return null
  try {
    if ((await stat(target)).isFile()) return target
  } catch {}
  return extname(urlPath) ? null : join(base, 'index.html')
}

createServer(async (req, res) => {
  const file = await fileFor(new URL(req.url ?? '/', 'http://x').pathname)
  if (!file) return res.writeHead(404).end('not found')
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
  res.end(await readFile(file))
}).listen(Number(port), '127.0.0.1', () => console.log(`serving ${base} on http://127.0.0.1:${port}`))
