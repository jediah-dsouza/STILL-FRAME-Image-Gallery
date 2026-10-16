import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '../../test/SampleApp.jsx'
import { mockCardDownload } from '../../services/mockCardDownload.js'
vi.mock('../../services/mockCardDownload.js', async importOriginal => {
  const original = await importOriginal()
  return { ...original, mockCardDownload: vi.fn(original.mockCardDownload) }
})
const { mockCardDownload: realDownload } = await vi.importActual('../../services/mockCardDownload.js')
beforeEach(() => { vi.useFakeTimers(); mockCardDownload.mockReset().mockImplementation(realDownload) })
afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers() })
const cards = () => screen.getAllByRole('article')
const tick = () => act(async () => { await vi.advanceTimersByTimeAsync(700) })
const noGalleryFailure = () => {
  expect(screen.queryByRole('heading', { name: 'Photographs could not be loaded.' })).toBeNull()
  expect(document.getElementById('gallery-status').textContent).toBe('10 images shown · Local sample collection.')
}

test('image failure preserves media slot/metadata/actions and neighboring Grid cards, not request ErrorState', () => {
  render(<App />)
  const first = cards()[0], neighbor = cards()[1]
  const media = first.querySelector('.image-card-media'), ratio = media.style.aspectRatio
  fireEvent.error(within(first).getByRole('img'))
  expect(within(first).getByRole('img').getAttribute('aria-label')).toMatch(/^Photograph unavailable/)
  expect(media.style.aspectRatio).toBe(ratio)
  expect(within(first).getByRole('link', { name: 'Photo source' })).not.toBeNull()
  expect(within(first).getByRole('button').disabled).toBe(false)
  expect(cards()).toHaveLength(10)
  expect(cards()[1]).toBe(neighbor)
  noGalleryFailure()
})

test('busy and ready remain local; repeated activation is guarded and other cards/search stay usable', async () => {
  render(<App />)
  const first = cards()[0], second = cards()[1]
  const button = within(first).getByRole('button')
  fireEvent.click(button); fireEvent.click(button)
  expect(mockCardDownload).toHaveBeenCalledTimes(1)
  expect(button.disabled).toBe(true)
  expect(within(first).getByRole('status').textContent).toBe('Preparing sample download…')
  expect(within(second).getByRole('button').disabled).toBe(false)
  expect(screen.getByRole('searchbox').disabled).toBe(false)
  expect(screen.queryByRole('link', { name: 'Open local image' })).toBeNull()
  noGalleryFailure()
  await tick()
  expect(within(first).getByRole('status').textContent).toBe('Sample ready. No automatic file save.')
  expect(within(first).getByRole('link', { name: 'Open local image' })).not.toBeNull()
  expect(within(second).queryByRole('link', { name: 'Open local image' })).toBeNull()
  noGalleryFailure()
})

test('Download error is local, keeps neighboring actions usable, and retries through its own callback', async () => {
  mockCardDownload.mockImplementationOnce(photo => realDownload(photo, { fail: true }))
  render(<App />)
  const first = cards()[0], second = cards()[1]
  fireEvent.click(within(first).getByRole('button')); await tick()
  expect(within(first).getByRole('status').textContent).toBe('Sample preparation failed. Try Download again.')
  expect(within(first).queryByRole('link', { name: 'Open local image' })).toBeNull()
  expect(within(second).getByRole('button').disabled).toBe(false)
  expect(screen.getByRole('searchbox').disabled).toBe(false)
  noGalleryFailure()
  fireEvent.click(within(first).getByRole('button')); await tick()
  expect(within(first).getByRole('link', { name: 'Open local image' })).not.toBeNull()
  noGalleryFailure()
})
