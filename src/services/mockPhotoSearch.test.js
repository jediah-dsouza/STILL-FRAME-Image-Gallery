// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest'
import { searchPhotos } from './mockPhotoSearch.js'
import { samplePhotos } from '../data/samplePhotos.js'

afterEach(() => vi.useRealTimers())

test('uses deterministic 600ms latency and returns normalized photos without provider envelope/total', async () => {
  vi.useFakeTimers()
  const promise = searchPhotos({ query: '  EARTH  ' })
  let settled = false
  promise.then(() => { settled = true })
  await vi.advanceTimersByTimeAsync(599)
  expect(settled).toBe(false)
  await vi.advanceTimersByTimeAsync(1)
  await expect(promise).resolves.toEqual({ photos: [samplePhotos[6], samplePhotos[9]] })
})

test('the default nature fixture scenario restores the full approved collection', async () => {
  vi.useFakeTimers()
  const promise = searchPhotos({ query: ' Nature ' })
  await vi.advanceTimersByTimeAsync(600)
  expect((await promise).photos).toBe(samplePhotos)
})

test('a successful zero-match response is an empty collection, not an error', async () => {
  vi.useFakeTimers()
  const promise = searchPhotos({ query: 'zz-no-match' })
  await vi.advanceTimersByTimeAsync(600)
  await expect(promise).resolves.toEqual({ photos: [] })
})

test.each(['', '   ', null, undefined])('rejects invalid query %s without starting a timer', async query => {
  vi.useFakeTimers()
  await expect(searchPhotos({ query })).rejects.toThrow('nonblank')
  expect(vi.getTimerCount()).toBe(0)
})

test('rejects an already-aborted signal as cancellation without scheduling work', async () => {
  vi.useFakeTimers()
  const controller = new AbortController()
  controller.abort()
  await expect(searchPhotos({ query: 'earth', signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
  expect(vi.getTimerCount()).toBe(0)
})

test('abort during latency clears the timer and listener and never returns stale photos', async () => {
  vi.useFakeTimers()
  const controller = new AbortController()
  const remove = vi.spyOn(controller.signal, 'removeEventListener')
  const promise = searchPhotos({ query: 'earth', signal: controller.signal })
  const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' })
  await vi.advanceTimersByTimeAsync(300)
  controller.abort()
  await assertion
  expect(vi.getTimerCount()).toBe(0)
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
})

test('completion removes its abort listener and a later abort cannot change the settled result', async () => {
  vi.useFakeTimers()
  const controller = new AbortController()
  const remove = vi.spyOn(controller.signal, 'removeEventListener')
  const promise = searchPhotos({ query: 'river', signal: controller.signal })
  await vi.advanceTimersByTimeAsync(600)
  controller.abort()
  await expect(promise).resolves.toEqual({ photos: [samplePhotos[3]] })
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
  expect(vi.getTimerCount()).toBe(0)
})
