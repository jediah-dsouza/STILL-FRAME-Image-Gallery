// @vitest-environment node
import { createServer } from 'node:http'
import { afterEach, expect, test, vi } from 'vitest'
import { createSearchMiddleware } from './viteSearchPlugin.js'
import { providerPhoto } from '../src/test/livePhotos.js'
const servers = []
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise(resolve => { server.closeAllConnections(); server.close(resolve) })))
})
async function start(options) {
  const middleware = createSearchMiddleware(options)
  const server = createServer((req, res) => middleware(req, res, () => { res.writeHead(404); res.end('not found') }))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  servers.push(server)
  return `http://127.0.0.1:${server.address().port}`
}
test('actual Node adapter routes only search, enforces GET, returns safe missing-config JSON', async () => {
  const fetchImpl = vi.fn()
  const origin = await start({ fetchImpl })
  expect((await fetch(origin + '/api/anything?url=evil')).status).toBe(404)
  const post = await fetch(origin + '/api/photos/search?query=nature', { method: 'POST' })
  expect(post.status).toBe(405); expect(post.headers.get('Allow')).toBe('GET')
  const result = await fetch(origin + '/api/photos/search?query=nature')
  expect(result.status).toBe(503); expect(await result.json()).toEqual({ error: { type: 'auth' } })
  expect(fetchImpl).not.toHaveBeenCalled()
})
test('actual Node adapter serves selected JSON through fixed native-fetch contract', async () => {
  const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [providerPhoto()] })))
  const origin = await start({ fetchImpl, getAccessKey: () => 'synthetic-test-only' })
  const result = await fetch(origin + '/api/photos/search?query=nature')
  expect(result.status).toBe(200); expect(result.headers.get('Cache-Control')).toBe('no-store')
  expect((await result.json()).results).toHaveLength(1)
  expect(fetchImpl).toHaveBeenCalledTimes(1)
  expect(fetchImpl.mock.calls[0][0].origin).toBe('https://api.unsplash.com')
  expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(false)
})
test('client disconnect propagates cancellation upstream', async () => {
  let upstreamSignal
  const fetchImpl = vi.fn((url, { signal }) => {
    upstreamSignal = signal
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), { once: true }))
  })
  const origin = await start({ fetchImpl, getAccessKey: () => 'synthetic-test-only' })
  const controller = new AbortController()
  const pending = fetch(origin + '/api/photos/search?query=nature', { signal: controller.signal }).catch(error => error)
  await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1))
  controller.abort()
  expect((await pending).name).toBe('AbortError')
  await vi.waitFor(() => expect(upstreamSignal.aborted).toBe(true))
})

test('Node adapter accepts bounded download JSON and preserves supplied tracking URL', async () => {
  const location = providerPhoto().links.download_location
  const fetchImpl = vi.fn(async () => Response.json({ url: 'https://images.unsplash.com/photo-test?dl=test.jpg' }))
  const origin = await start({ fetchImpl, getAccessKey: () => 'synthetic-test-only' })
  const response = await fetch(origin + '/api/photos/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoId: 'demo-photo', downloadLocation: location }) })
  expect(response.status).toBe(200); expect((await response.json()).url).toContain('images.unsplash.com')
  expect(fetchImpl.mock.calls[0][0]).toBe(location)
  const oversized = await fetch(origin + '/api/photos/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: ' '.repeat(9000) })
  expect(oversized.status).toBe(413); expect(fetchImpl).toHaveBeenCalledTimes(1)
  expect((await fetch(origin + '/api/photos/download')).status).toBe(405)
})
