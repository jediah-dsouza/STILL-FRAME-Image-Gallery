import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { downloadImage } from './downloadImage.js'
const url = 'https://images.unsplash.com/photo-test?ixid=preserve&dl=test.jpg'
let click, create, revoke
beforeEach(() => {
  create = vi.fn(() => 'blob:test-download'); revoke = vi.fn()
  vi.stubGlobal('URL', class extends URL { static createObjectURL = create; static revokeObjectURL = revoke })
  click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })
const response = (body = new Uint8Array([1,2,3]), type = 'image/jpeg', options = {}) => new Response(body, { headers: { 'Content-Type': type }, ...options })
test('direct CORS image transfer creates real Blob and initiates a native download before resolving', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn(async () => response()); vi.stubGlobal('fetch', fetchMock)
  await downloadImage(url, { photoId: 'demo/photo' })
  expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ mode: 'cors', credentials: 'omit', redirect: 'error' }))
  expect(create.mock.calls[0][0]).toBeInstanceOf(Blob)
  expect(click).toHaveBeenCalledTimes(1)
  const anchor = click.mock.instances[0]
  expect(anchor.download).toBe('stillframe-demophoto.jpg'); expect(anchor.href).toBe('blob:test-download')
  expect(document.body.contains(anchor)).toBe(false)
  expect(revoke).not.toHaveBeenCalled(); await vi.advanceTimersByTimeAsync(60000); expect(revoke).toHaveBeenCalledWith('blob:test-download')
})
test.each(['https://evil.test/image.jpg', 'http://images.unsplash.com/photo', 'https://images.unsplash.com/photo?client_id=private'])('unsafe image URL is never fetched %s', async unsafe => {
  const mock = vi.fn(); vi.stubGlobal('fetch', mock)
  await expect(downloadImage(unsafe)).rejects.toMatchObject({ stage: 'delivery' }); expect(mock).not.toHaveBeenCalled()
})
test.each([() => response('error', 'text/html'), () => response('', 'image/png'), () => response('error', 'image/jpeg', { status: 500 }), () => new Response('x', { headers: { 'Content-Type': 'image/jpeg', 'Content-Length': String(65 * 1024 * 1024) } })])('unsafe or failed payload never initiates download', async factory => {
  vi.stubGlobal('fetch', vi.fn(async () => factory()))
  await expect(downloadImage(url)).rejects.toMatchObject({ stage: 'delivery' })
  expect(click).not.toHaveBeenCalled(); expect(create).not.toHaveBeenCalled()
})
test('network/CORS failure exposes safe delivery feedback only', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('internal secret') }))
  await expect(downloadImage(url)).rejects.toThrow(/registered, but file delivery/)
  expect(click).not.toHaveBeenCalled()
})
test('caller cancellation prevents fetch and native click', async () => {
  const controller = new AbortController(); controller.abort(); const mock = vi.fn(); vi.stubGlobal('fetch', mock)
  await expect(downloadImage(url, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
  expect(mock).not.toHaveBeenCalled(); expect(click).not.toHaveBeenCalled()
})
test('delivery timeout aborts transfer without claiming success', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn((url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('timeout'))))))
  const pending = downloadImage(url).catch(error => error)
  await vi.advanceTimersByTimeAsync(30000)
  expect(await pending).toMatchObject({ stage: 'delivery' }); expect(click).not.toHaveBeenCalled()
})

test('cancellation after a slow response resolves prevents late Blob creation or click', async () => {
  const controller = new AbortController()
  let complete
  vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { complete = resolve })))
  const pending = downloadImage(url, { signal: controller.signal }).catch(error => error)
  controller.abort(); complete(response())
  expect(await pending).toMatchObject({ name: 'AbortError' })
  expect(click).not.toHaveBeenCalled(); expect(create).not.toHaveBeenCalled()
})
test('streamed resource bound applies even without Content-Length', async () => {
  const chunk = new Uint8Array(1024 * 1024)
  let count = 0, cancelled = false
  const body = new ReadableStream({ pull(controller) { if (count++ < 100) controller.enqueue(chunk); else controller.close() }, cancel() { cancelled = true } })
  vi.stubGlobal('fetch', vi.fn(async () => response(body)))
  await expect(downloadImage(url)).rejects.toMatchObject({ stage: 'delivery' })
  expect(cancelled).toBe(true); expect(click).not.toHaveBeenCalled()
})
