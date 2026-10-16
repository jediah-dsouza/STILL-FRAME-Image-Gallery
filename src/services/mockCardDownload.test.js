// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest'
import { mockCardDownload } from './mockCardDownload.js'
import { samplePhotos } from '../data/samplePhotos.js'

afterEach(() => vi.useRealTimers())

test('prepares only the same local image resource after a deterministic review delay', async () => {
  vi.useFakeTimers()
  const promise = mockCardDownload(samplePhotos[0])
  let settled = false
  promise.then(() => { settled = true })
  await vi.advanceTimersByTimeAsync(699)
  expect(settled).toBe(false)
  await vi.advanceTimersByTimeAsync(1)
  await expect(promise).resolves.toEqual({ url: samplePhotos[0].links.download })
})

test('simulated failure rejects without returning or opening an image', async () => {
  vi.useFakeTimers()
  const promise = mockCardDownload(samplePhotos[0], { fail: true })
  const assertion = expect(promise).rejects.toThrow('Sample preparation failed.')
  await vi.advanceTimersByTimeAsync(700)
  await assertion
})

test.each(['https://images.unsplash.com/example', '//remote.example/image.webp', '/fixtures/photos/../secret.webp'])('refuses remote/unsafe resources: %s', url => {
  vi.useFakeTimers()
  const promise = mockCardDownload({ ...samplePhotos[0], links: { ...samplePhotos[0].links, download: url } })
  const assertion = expect(promise).rejects.toThrow('Sample preparation failed.')
  return vi.advanceTimersByTimeAsync(700).then(() => assertion)
})
