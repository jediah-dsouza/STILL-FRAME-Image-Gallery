import { afterEach, expect, test, vi } from 'vitest'
import { searchPhotos } from './photoSearch.js'
import { providerPhoto } from '../test/livePhotos.js'
import { normalizePhoto } from '../utils/normalizePhoto.js'

const respond = (body, status = 200) => new Response(JSON.stringify(body), { status })
afterEach(() => vi.unstubAllGlobals())
function stub(body, status) {
  const fetcher = vi.fn().mockResolvedValue(respond(body, status))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
test('same-origin GET uses submitted query/signal, no provider credentials, normalizes once without losing URL params', async () => {
  const fetcher = stub({ results: [providerPhoto()] })
  const signal = new AbortController().signal
  const result = await searchPhotos({ query: '  lake & forest  ', signal })
  expect(result).toEqual({ photos: [normalizePhoto(providerPhoto())] })
  expect(fetcher).toHaveBeenCalledExactlyOnceWith('/api/photos/search?query=lake+%26+forest', {
    method: 'GET', signal, headers: { Accept: 'application/json' }, credentials: 'omit',
  })
  expect(result.photos[0].links.downloadLocation).toContain('ixid=preserve')
})
test('empty array resolves empty', async () => { stub({ results: [] }); expect(await searchPhotos({ query: 'none' })).toEqual({ photos: [] }) })
test('mixed malformed results skip invalid records', async () => { stub({ results: [null, providerPhoto()] }); expect((await searchPhotos({ query: 'lake' })).photos).toHaveLength(1) })
test.each([null, {}, { results: {} }, { results: [null] }])('malformed/all invalid data is safe API error', async body => {
  stub(body); await expect(searchPhotos({ query: 'lake' })).rejects.toMatchObject({ type: 'api', retryable: true })
})
test.each([[503, 'auth', false], [401, 'auth', false], [403, 'auth', false], [429, 'rate-limit', true], [502, 'network', true], [502, 'api', true], [500, 'unknown', true]])('safe %s/%s mapping', async (status, type, retryable) => {
  stub({ error: { type, message: 'PRIVATE detail' } }, status)
  await expect(searchPhotos({ query: 'lake' })).rejects.toMatchObject({ type, retryable })
  await expect(searchPhotos({ query: 'lake' })).rejects.not.toHaveProperty('message', 'PRIVATE detail')
})
test('network rejection sanitized', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('PRIVATE network detail')))
  await expect(searchPhotos({ query: 'lake' })).rejects.toMatchObject({ type: 'network', retryable: true })
})
test('malformed JSON never becomes Empty', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json')))
  await expect(searchPhotos({ query: 'lake' })).rejects.toMatchObject({ type: 'api' })
})
test('AbortError preserved; pre-abort does not fetch', async () => {
  const fetcher = stub({ results: [] })
  await expect(searchPhotos({ query: 'lake', signal: AbortSignal.abort() })).rejects.toMatchObject({ name: 'AbortError' })
  expect(fetcher).not.toHaveBeenCalled()
  fetcher.mockRejectedValue(new DOMException('private', 'AbortError'))
  await expect(searchPhotos({ query: 'lake' })).rejects.toMatchObject({ name: 'AbortError' })
})
test.each(['', ' ', 'x'.repeat(201), null])('invalid frontend input never fetches', async query => {
  const fetcher = stub({ results: [] })
  await expect(searchPhotos({ query })).rejects.toMatchObject({ type: 'api' })
  expect(fetcher).not.toHaveBeenCalled()
})

test('duplicate normalized identities cannot create ambiguous React cards', async () => {
  stub({ results: [providerPhoto(), providerPhoto()] })
  await expect(searchPhotos({ query: 'lake' })).rejects.toMatchObject({ type: 'api' })
})
