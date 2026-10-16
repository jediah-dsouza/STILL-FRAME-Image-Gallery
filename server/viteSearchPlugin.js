import { loadEnv } from 'vite'
import { createUnsplashDownloadHandler } from './unsplashDownload.js'
import { createUnsplashSearchHandler } from './unsplashSearch.js'

/** Node/Connect adapter; disconnect aborts upstream, completed responses do not. */
export function createSearchMiddleware(options) {
  const search = createUnsplashSearchHandler(options)
  const download = createUnsplashDownloadHandler(options)
  return async (req, res, next) => {
    const url = new URL(req.url, 'http://same-origin.invalid')
    const isDownload = url.pathname === '/api/photos/download'
    if (!isDownload && url.pathname !== '/api/photos/search') return next()
    const controller = new AbortController()
    const disconnect = () => { if (!res.writableEnded) controller.abort() }
    res.on('close', disconnect)
    try {
      const body = isDownload && req.method === 'POST' ? await readBody(req, controller.signal) : undefined
      const handler = isDownload ? download : search
      const response = await handler(new Request(url, { method: req.method, headers: req.headers, body, signal: controller.signal }))
      if (res.destroyed) return
      res.statusCode = response.status
      for (const [name, value] of response.headers) res.setHeader(name, value)
      res.end(await response.text())
    } catch (error) {
      if (!res.destroyed) {
        res.writeHead(error?.code === 'BODY_LIMIT' ? 413 : 500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
        res.end('{"error":{"type":"unknown"}}')
      }
    } finally { res.off('close', disconnect) }
  }
}

/** Same handler for `npm run dev` and local compiled `npm run preview`. */
export function unsplashSearchPlugin(overrides = {}) {
  let config
  function install(server) {
    // Vite exposes only its normal VITE_ prefix to the client. Never define/inject this value.
    const env = loadEnv(config.mode, config.envDir, '')
    server.middlewares.use(createSearchMiddleware({ getAccessKey: () => env.UNSPLASH_ACCESS_KEY, ...overrides }))
  }
  return {
    name: 'same-origin-unsplash-search',
    configResolved(resolved) { config = resolved },
    configureServer: install,
    configurePreviewServer: install,
  }
}

// Bound JSON bodies without buffering arbitrary uploads or destroying the response socket.
function readBody(req, signal) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    function cleanup() {
      clearTimeout(timer)
      req.off('data', data); req.off('end', end); req.off('error', fail)
      signal.removeEventListener('abort', abort)
    }
    function fail(error) { cleanup(); req.resume(); reject(error) }
    function abort() { fail(new Error('Request cancelled')) }
    function data(chunk) {
      size += chunk.length
      if (size > 8192) { const error = new Error('Body limit'); error.code = 'BODY_LIMIT'; fail(error) }
      else chunks.push(chunk)
    }
    function end() { cleanup(); resolve(Buffer.concat(chunks).toString('utf8')) }
    const timer = setTimeout(() => fail(new Error('Body timeout')), 5000)
    req.on('data', data); req.on('end', end); req.on('error', fail)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) abort()
  })
}
