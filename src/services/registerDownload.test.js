import { afterEach, expect, test, vi } from 'vitest'
import { registerDownload, registerPhotoDownload } from './registerDownload.js'
import { normalizePhoto } from '../utils/normalizePhoto.js'
import { providerPhoto } from '../test/livePhotos.js'
const photo = normalizePhoto(providerPhoto())
const url = 'https://images.unsplash.com/photo-test?ixid=preserved&dl=test.jpg'
afterEach(() => vi.unstubAllGlobals())
test('uses exact API-provided location in same-origin JSON without credentials', async () => {
  const fetchMock = vi.fn(async () => Response.json({ url }))
  vi.stubGlobal('fetch', fetchMock)
  const signal = new AbortController().signal
  expect(await registerPhotoDownload(photo, { signal })).toEqual({ url })
  const [destination, options] = fetchMock.mock.calls[0]
  expect(destination).toBe('/api/photos/download'); expect(options.signal).toBe(signal)
  expect(options.credentials).toBe('omit'); expect(options.headers.Authorization).toBeUndefined()
  expect(JSON.parse(options.body)).toEqual({ photoId: photo.id, downloadLocation: photo.links.downloadLocation })
})
test.each([[503, 'auth', /configuration/], [429, 'rate-limit', /limit/], [502, 'network', /reached/], [502, 'api', /failed/], [500, '__proto__', /failed/]])('safe error for %s %s', async (status, type, message) => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: { type, message: 'private internal' } }, { status })))
  await expect(registerPhotoDownload(photo)).rejects.toThrow(message)
})
test.each(['{}', '{', '{"url":"https://evil.test/"}'])('rejects unsafe response %s', async body => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(body)))
  await expect(registerPhotoDownload(photo)).rejects.toMatchObject({ stage: 'registration' })
})
test('network failure and intentional cancellation remain distinct', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('private') }))
  await expect(registerPhotoDownload(photo)).rejects.toThrow(/reached/)
  const controller = new AbortController(); controller.abort()
  await expect(registerPhotoDownload(photo, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
})
test('invalid image data never reaches boundary', async () => {
  const mock = vi.fn(); vi.stubGlobal('fetch', mock)
  await expect(registerDownload({ photoId: photo.id, downloadLocation: 'https://evil.test' })).rejects.toThrow()
  expect(mock).not.toHaveBeenCalled()
})
