// @vitest-environment node
import { expect, test, vi } from 'vitest'
import { createUnsplashDownloadHandler } from './unsplashDownload.js'
const location = 'https://api.unsplash.com/photos/demo-photo/download?ixid=preserve'
const resource = 'https://images.unsplash.com/photo-demo?ixid=preserve&dl=download.jpg'
const input = { photoId: 'demo-photo', downloadLocation: location }
const request = (body = input, options = {}) => new Request('http://local/api/photos/download', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...options,
})
const setup = (fetchImpl = vi.fn().mockImplementation(async () => Response.json({ url: resource, ignored: 'not returned' })), extra = {}) => ({
  fetchImpl, handler: createUnsplashDownloadHandler({ fetchImpl, getAccessKey: () => 'synthetic-test-only', ...extra }),
})
test('registers the exact supplied URL and tracking query; projects only safe image URL', async () => {
  const { handler, fetchImpl } = setup()
  const response = await handler(request())
  expect(await response.json()).toEqual({ url: resource })
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(fetchImpl).toHaveBeenCalledTimes(1)
  const [url, options] = fetchImpl.mock.calls[0]
  expect(url).toBe(location); expect(url).not.toContain('synthetic-test-only')
  expect(options.headers).toMatchObject({ Authorization: 'Client-ID synthetic-test-only', 'Accept-Version': 'v1' })
  expect(options.redirect).toBe('error'); expect(options.method).toBe('GET')
})
test.each([null, [], {}, { ...input, photoId: '' }, { ...input, photoId: 'other' }, { ...input, extra: 'no' }, { ...input, downloadLocation: 7 }])('rejects malformed image data %j', async body => {
  const { handler, fetchImpl } = setup(); expect((await handler(request(body))).status).toBe(400); expect(fetchImpl).not.toHaveBeenCalled()
})
test.each([
  'http://api.unsplash.com/photos/demo-photo/download',
  'https://api.unsplash.com.evil.test/photos/demo-photo/download',
  'https://user:pass@api.unsplash.com/photos/demo-photo/download',
  'https://api.unsplash.com:8443/photos/demo-photo/download',
  'https://api.unsplash.com/photos/demo-photo/download#fragment',
  'https://api.unsplash.com/photos/demo-photo/../demo-photo/download',
  'https://api.unsplash.com/photos/%64emo-photo/download',
  location + '&ixid=duplicate', location + '&url=https://evil.test', 'javascript:alert(1)',
])('rejects unsafe or ambiguous registration URL %s', async downloadLocation => {
  const { handler, fetchImpl } = setup(); expect((await handler(request({ ...input, downloadLocation }))).status).toBe(400); expect(fetchImpl).not.toHaveBeenCalled()
})
test('rejects methods, content type, malformed JSON, oversized bodies and query parameters', async () => {
  const { handler, fetchImpl } = setup()
  const get = await handler(new Request('http://local/api/photos/download'))
  expect(get.status).toBe(405); expect(get.headers.get('Allow')).toBe('POST')
  expect((await handler(request(input, { headers: {} }))).status).toBe(415)
  expect((await handler(request(input, { body: '{' }))).status).toBe(400)
  expect((await handler(request(input, { body: ' '.repeat(8193) }))).status).toBe(400)
  expect((await handler(new Request('http://local/api/photos/download?url=evil', { method: 'POST' }))).status).toBe(400)
  expect(fetchImpl).not.toHaveBeenCalled()
})
test.each(['', undefined, 'YOUR_UNSPLASH_ACCESS_KEY'])('missing credential fails safely %s', async key => {
  const { handler, fetchImpl } = setup(undefined, { getAccessKey: () => key })
  const response = await handler(request()); expect(response.status).toBe(503)
  expect(await response.json()).toEqual({ error: { type: 'auth' } }); expect(fetchImpl).not.toHaveBeenCalled()
})
test.each([[401, 'auth'], [403, 'auth'], [429, 'rate-limit'], [500, 'api'], [302, 'api']])('maps upstream %s without leaking internals', async (status, type) => {
  const { handler } = setup(vi.fn(async () => new Response('sensitive upstream synthetic-test-only', { status })))
  const response = await handler(request()); expect(await response.json()).toEqual({ error: { type } })
})
test.each(['not json', '{}', '{"url":"https://evil.test/image.jpg"}', '{"url":"https://images.unsplash.com/photo?access_key=secret"}', '{"url":"https://images.unsplash.com/synthetic-test-only"}', ' '.repeat(16385)])('malformed or unsafe upstream resource fails closed', async body => {
  const { handler } = setup(vi.fn(async () => new Response(body)))
  expect(await (await handler(request())).json()).toEqual({ error: { type: 'api' } })
})
test('network failure exposes no exception text', async () => {
  const { handler } = setup(vi.fn(async () => { throw new Error('synthetic-test-only') }))
  expect(await (await handler(request())).json()).toEqual({ error: { type: 'network' } })
})
test('timeout aborts upstream and releases concurrency slots', async () => {
  const fetchImpl = vi.fn((url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('timeout')))))
  const { handler } = setup(fetchImpl, { timeoutMs: 5 })
  const pending = Array.from({ length: 4 }, () => handler(request()))
  await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(4), { interval: 1 })
  expect((await handler(request())).status).toBe(429)
  for (const response of await Promise.all(pending)) expect(await response.json()).toEqual({ error: { type: 'network' } })
  expect((await handler(request())).status).toBe(502); expect(fetchImpl).toHaveBeenCalledTimes(5)
})
test('caller cancellation aborts the registration request', async () => {
  const controller = new AbortController()
  let upstream
  const { handler } = setup(vi.fn((url, { signal }) => { upstream = signal; return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('abort')))) }))
  const pending = handler(request(input, { signal: controller.signal }))
  await vi.waitFor(() => expect(upstream).toBeDefined())
  controller.abort(); expect(await (await pending).json()).toEqual({ error: { type: 'network' } }); expect(upstream.aborted).toBe(true)
})

const quota403Cases = [
  ['quota headers', 403, { 'X-Ratelimit-Limit': '50', 'X-Ratelimit-Remaining': '0' }, 'private provider detail synthetic-test-only', 'rate-limit', 429],
  ['quota error field', 403, {}, JSON.stringify({ errors: ['Rate Limit Exceeded', 'private provider detail synthetic-test-only'], internal: 'omit' }), 'rate-limit', 429],
  ['normalized quota message', 403, {}, JSON.stringify({ errors: [' rate limit exceeded. '] }), 'rate-limit', 429],
  ['permission failure', 403, { 'X-Ratelimit-Limit': '50', 'X-Ratelimit-Remaining': '49' }, JSON.stringify({ errors: ['Forbidden: insufficient permissions', 'synthetic-test-only'] }), 'auth', 502],
  ['ambiguous response', 403, {}, JSON.stringify({ errors: ['Unknown failure mentioning a rate limit', 'synthetic-test-only'] }), 'auth', 502],
  ['incomplete quota headers', 403, { 'X-Ratelimit-Remaining': '0' }, '{}', 'auth', 502],
  ['invalid quota limit', 403, { 'X-Ratelimit-Limit': '-1', 'X-Ratelimit-Remaining': '0' }, '{}', 'auth', 502],
  ['malformed JSON', 403, {}, '{private synthetic-test-only', 'auth', 502],
  ['oversized error JSON', 403, {}, JSON.stringify({ errors: ['Rate Limit Exceeded'], private: 'x'.repeat(8192) }), 'auth', 502],
  ['too many error fields', 403, {}, JSON.stringify({ errors: ['Rate Limit Exceeded', ...Array(10).fill('private')] }), 'auth', 502],
  ['unrecognized error field', 403, {}, JSON.stringify({ message: 'Rate Limit Exceeded' }), 'auth', 502],
  ['429 unchanged', 429, {}, 'private provider detail synthetic-test-only', 'rate-limit', 429],
  ['401 remains auth even with quota headers', 401, { 'X-Ratelimit-Limit': '50', 'X-Ratelimit-Remaining': '0' }, 'private synthetic-test-only', 'auth', 502],
]

test.each(quota403Cases)('bounded quota classification and safe projection: %s', async (label, status, headers, body, type, expectedStatus) => {
  const upstream = new Response(body, { status, headers })
  const fetchImpl = vi.fn(async () => upstream)
  const { handler } = setup(fetchImpl)
  const result = await handler(request())
  expect(result.status).toBe(expectedStatus)
  expect(await result.json()).toEqual({ error: { type } })
  expect(result.headers.get('X-Ratelimit-Remaining')).toBeNull()
  expect(result.headers.get('Authorization')).toBeNull()
  expect(fetchImpl).toHaveBeenCalledTimes(1)
})
test('oversized declared 403 body is cancelled and conservatively classified', async () => {
  const cancel = vi.fn()
  const upstream = new Response(new ReadableStream({ cancel }), { status: 403, headers: { 'Content-Length': '8193' } })
  const fetchImpl = vi.fn(async () => upstream)
  const { handler } = setup(fetchImpl)
  const result = await handler(request())
  expect(result.status).toBe(502)
  expect(await result.json()).toEqual({ error: { type: 'auth' } })
  expect(cancel).toHaveBeenCalledTimes(1)
  expect(fetchImpl).toHaveBeenCalledTimes(1)
})
