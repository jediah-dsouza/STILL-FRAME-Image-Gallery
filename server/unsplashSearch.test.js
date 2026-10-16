// @vitest-environment node
import { expect, test, vi } from 'vitest'
import { createUnsplashSearchHandler } from './unsplashSearch.js'
import { providerPhoto } from '../src/test/livePhotos.js'

const key = 'test-only-synthetic-credential'
const response = (body, status = 200) => new Response(JSON.stringify(body), { status })
const request = (suffix = '?query=nature', options) => new Request(`http://local.test/api/photos/search${suffix}`, options)
function setup(upstream = response({ results: [providerPhoto()], total: 999, private: 'omit' }), options = {}) {
  const fetchImpl = vi.fn().mockResolvedValue(upstream)
  return { fetchImpl, search: createUnsplashSearchHandler({ fetchImpl, getAccessKey: () => key, ...options }) }
}

test.each(['', '?query=', '?query=%20%20', `?query=${'x'.repeat(201)}`, '?query=a&query=b', '?query=a&url=https://evil.test', '?query=a&page=2'])('rejects missing/blank/oversized/duplicate/unsupported query: %s', async suffix => {
  const { search, fetchImpl } = setup()
  expect((await search(request(suffix))).status).toBe(400)
  expect(fetchImpl).not.toHaveBeenCalled()
})
test.each(['POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'])('only GET is allowed: %s', async method => {
  const { search, fetchImpl } = setup()
  const result = await search(request('?query=nature', { method }))
  expect(result.status).toBe(405); expect(result.headers.get('Allow')).toBe('GET')
  expect(fetchImpl).not.toHaveBeenCalled()
})
test('accepts trimmed maximum query; constructs only search endpoint, page 1/per_page 24; credentials in headers only', async () => {
  const { search, fetchImpl } = setup()
  const result = await search(request(`?query=%20${'x'.repeat(200)}%20`))
  expect(result.status).toBe(200)
  const [url, options] = fetchImpl.mock.calls[0]
  expect(url.origin + url.pathname).toBe('https://api.unsplash.com/search/photos')
  expect([...url.searchParams]).toEqual([['query', 'x'.repeat(200)], ['page', '1'], ['per_page', '24']])
  expect(url.href).not.toContain(key)
  expect(options.headers.Authorization).toBe(`Client-ID ${key}`)
  expect(options.headers['Accept-Version']).toBe('v1')
  expect(options.redirect).toBe('error')
  expect(options.signal).toBeInstanceOf(AbortSignal)
  const body = await result.json()
  expect(Object.keys(body)).toEqual(['results'])
  expect(body.results[0]).toEqual(providerPhoto())
  expect(result.headers.get('Cache-Control')).toBe('no-store')
})
test.each(['', undefined, '   ', 'YOUR_UNSPLASH_ACCESS_KEY'])('missing server credential returns safe auth without fetch', async value => {
  const { search, fetchImpl } = setup(undefined, { getAccessKey: () => value })
  const result = await search(request())
  expect(result.status).toBe(503); expect(await result.json()).toEqual({ error: { type: 'auth' } })
  expect(fetchImpl).not.toHaveBeenCalled()
})
test.each([[401, 'auth'], [403, 'auth'], [429, 'rate-limit'], [500, 'api'], [302, 'api']])('safe upstream HTTP %s mapping', async (status, type) => {
  const { search } = setup(response({ errors: [key, 'private upstream detail'] }, status))
  const result = await search(request())
  expect(result.ok).toBe(false); expect(await result.json()).toEqual({ error: { type } })
})
test('network exception details and credential never returned', async () => {
  const { search, fetchImpl } = setup()
  fetchImpl.mockRejectedValue(new Error(`PRIVATE ${key}`))
  expect(await (await search(request())).json()).toEqual({ error: { type: 'network' } })
})
test.each(['bad-json', null, {}, { results: {} }, { results: Array(31).fill(null) }])('malformed upstream JSON/shape fails safely', async body => {
  const upstream = body === 'bad-json' ? new Response('{bad') : response(body)
  const { search } = setup(upstream)
  expect(await (await search(request())).json()).toEqual({ error: { type: 'api' } })
})
test('empty results are legitimate, provider internals never returned and nested fields are primitive-only', async () => {
  const { search } = setup(response({ results: [], total: 0 }))
  expect(await (await search(request())).json()).toEqual({ results: [] })
  const second = setup(response({ results: [{ ...providerPhoto(), extra: key, description: { secret: key } }], errors: [key] }))
  const body = await (await second.search(request())).json()
  expect(body.results[0].description).toBeNull(); expect(JSON.stringify(body)).not.toContain(key)
})
test('rejects credential reflection even inside selected fields', async () => {
  const { search } = setup(response({ results: [providerPhoto({ description: key })] }))
  expect(await (await search(request())).json()).toEqual({ error: { type: 'api' } })
})
test('bounds upstream response size', async () => {
  const { search } = setup(new Response('x'.repeat(2 * 1024 * 1024 + 1)))
  expect(await (await search(request())).json()).toEqual({ error: { type: 'api' } })
})
test('bounded upstream timeout and disconnect signal, no automatic retry', async () => {
  const { search, fetchImpl } = setup(undefined, { timeoutMs: 5 })
  fetchImpl.mockImplementation((url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('private', 'AbortError')), { once: true })))
  expect(await (await search(request())).json()).toEqual({ error: { type: 'network' } })
  expect(fetchImpl).toHaveBeenCalledTimes(1)
  const controller = new AbortController()
  const pending = search(request('?query=earth', { signal: controller.signal }))
  controller.abort()
  expect(await (await pending).json()).toEqual({ error: { type: 'network' } })
})
test('pre-aborted request never fetches', async () => {
  const { search, fetchImpl } = setup()
  expect((await search(request('?query=nature', { signal: AbortSignal.abort() }))).status).toBe(499)
  expect(fetchImpl).not.toHaveBeenCalled()
})
test('bounds concurrent requests and releases slots', async () => {
  const { search, fetchImpl } = setup()
  const resolvers = []
  fetchImpl.mockImplementation(() => new Promise(resolve => resolvers.push(resolve)))
  const pending = Array.from({ length: 4 }, () => search(request()))
  expect((await search(request())).status).toBe(429)
  expect(fetchImpl).toHaveBeenCalledTimes(4)
  resolvers.forEach(resolve => resolve(response({ results: [] })))
  await Promise.all(pending)
  fetchImpl.mockResolvedValue(response({ results: [] }))
  expect((await search(request())).status).toBe(200)
})

test('oversized declared response is cancelled before reading', async () => {
  const cancel = vi.fn()
  const upstream = new Response(new ReadableStream({ cancel }), { headers: { 'Content-Length': String(2 * 1024 * 1024 + 1) } })
  const { search } = setup(upstream)
  expect(await (await search(request())).json()).toEqual({ error: { type: 'api' } })
  expect(cancel).toHaveBeenCalledTimes(1)
})

const quota403Cases = [
  ['quota headers', 403, { 'X-Ratelimit-Limit': '50', 'X-Ratelimit-Remaining': '0' }, 'private provider detail test-only-synthetic-credential', 'rate-limit', 429],
  ['quota error field', 403, {}, JSON.stringify({ errors: ['Rate Limit Exceeded', 'private provider detail test-only-synthetic-credential'], internal: 'omit' }), 'rate-limit', 429],
  ['normalized quota message', 403, {}, JSON.stringify({ errors: [' rate limit exceeded. '] }), 'rate-limit', 429],
  ['permission failure', 403, { 'X-Ratelimit-Limit': '50', 'X-Ratelimit-Remaining': '49' }, JSON.stringify({ errors: ['Forbidden: insufficient permissions', 'test-only-synthetic-credential'] }), 'auth', 502],
  ['ambiguous response', 403, {}, JSON.stringify({ errors: ['Unknown failure mentioning a rate limit', 'test-only-synthetic-credential'] }), 'auth', 502],
  ['incomplete quota headers', 403, { 'X-Ratelimit-Remaining': '0' }, '{}', 'auth', 502],
  ['invalid quota limit', 403, { 'X-Ratelimit-Limit': '-1', 'X-Ratelimit-Remaining': '0' }, '{}', 'auth', 502],
  ['malformed JSON', 403, {}, '{private test-only-synthetic-credential', 'auth', 502],
  ['oversized error JSON', 403, {}, JSON.stringify({ errors: ['Rate Limit Exceeded'], private: 'x'.repeat(8192) }), 'auth', 502],
  ['too many error fields', 403, {}, JSON.stringify({ errors: ['Rate Limit Exceeded', ...Array(10).fill('private')] }), 'auth', 502],
  ['unrecognized error field', 403, {}, JSON.stringify({ message: 'Rate Limit Exceeded' }), 'auth', 502],
  ['429 unchanged', 429, {}, 'private provider detail test-only-synthetic-credential', 'rate-limit', 429],
  ['401 remains auth even with quota headers', 401, { 'X-Ratelimit-Limit': '50', 'X-Ratelimit-Remaining': '0' }, 'private test-only-synthetic-credential', 'auth', 502],
]

test.each(quota403Cases)('bounded quota classification and safe projection: %s', async (label, status, headers, body, type, expectedStatus) => {
  const upstream = new Response(body, { status, headers })
  const { search, fetchImpl } = setup(upstream)
  const result = await search(request())
  expect(result.status).toBe(expectedStatus)
  expect(await result.json()).toEqual({ error: { type } })
  expect(result.headers.get('X-Ratelimit-Remaining')).toBeNull()
  expect(result.headers.get('Authorization')).toBeNull()
  expect(fetchImpl).toHaveBeenCalledTimes(1)
})
test('oversized declared 403 body is cancelled and conservatively classified', async () => {
  const cancel = vi.fn()
  const upstream = new Response(new ReadableStream({ cancel }), { status: 403, headers: { 'Content-Length': '8193' } })
  const { search, fetchImpl } = setup(upstream)
  const result = await search(request())
  expect(result.status).toBe(502)
  expect(await result.json()).toEqual({ error: { type: 'auth' } })
  expect(cancel).toHaveBeenCalledTimes(1)
  expect(fetchImpl).toHaveBeenCalledTimes(1)
})
