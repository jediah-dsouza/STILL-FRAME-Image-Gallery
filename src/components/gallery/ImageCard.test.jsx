import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import ImageCard from './ImageCard.jsx'
import { samplePhotos } from '../../data/samplePhotos.js'
import { imageFailurePhoto } from '../../data/imageFailurePhoto.js'

const photo = samplePhotos[1]
const actionName = p => {
  const context = p.altDescription?.trim() || p.description?.trim() || `Photograph credited to ${p.user.name}`
  const characters = Array.from(context)
  return `Download sample photograph: ${characters.length > 80 ? `${characters.slice(0, 77).join('').trimEnd()}…` : context}`
}
const successfulAction = () => Promise.resolve({ url: photo.links.download })

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

test('renders canonical data as semantic image/figure/caption without mutating the photo', () => {
  const frozen = structuredClone(photo)
  Object.values(frozen).forEach(value => { if (value && typeof value === 'object') Object.freeze(value) })
  Object.freeze(frozen)
  render(<ImageCard photo={frozen} onDownload={successfulAction} loading="eager" />)
  const image = screen.getByRole('img', { name: photo.altDescription })
  expect(image.getAttribute('src')).toBe(photo.urls.regular)
  expect(image.getAttribute('width')).toBe(String(photo.width))
  expect(image.getAttribute('height')).toBe(String(photo.height))
  expect(image.getAttribute('loading')).toBe('eager')
  expect(image.getAttribute('decoding')).toBe('async')
  expect(image.closest('figure').querySelector('figcaption')).not.toBeNull()
  expect(screen.getByText(photo.user.name)).not.toBeNull()
  expect(frozen).toEqual(photo)
})

test('uses lazy loading by default for later review cards', () => {
  render(<ImageCard photo={photo} onDownload={successfulAction} />)
  expect(screen.getByRole('img').getAttribute('loading')).toBe('lazy')
})

test('prefers altDescription over description', () => {
  render(<ImageCard photo={{ ...photo, altDescription: 'Actual alt text', description: 'Secondary text' }} onDownload={successfulAction} />)
  expect(screen.getByRole('img', { name: 'Actual alt text' })).not.toBeNull()
})

test.each([null, '   '])('uses description when altDescription is %s', altDescription => {
  render(<ImageCard photo={{ ...photo, altDescription, description: 'Source description' }} onDownload={successfulAction} />)
  expect(screen.getByRole('img', { name: 'Source description' })).not.toBeNull()
})

test('uses conservative contributor context when both optional descriptions are missing', () => {
  render(<ImageCard photo={{ ...photo, altDescription: null, description: null }} onDownload={successfulAction} />)
  expect(screen.getByRole('img', { name: `Photograph credited to ${photo.user.name}` })).not.toBeNull()
})

test('keeps the full long contributor name and nullable description usable', () => {
  const longPhoto = samplePhotos[3]
  render(<ImageCard photo={longPhoto} onDownload={successfulAction} />)
  expect(screen.getByText(longPhoto.user.name)).not.toBeNull()
  expect(screen.getByRole('button', { name: actionName(longPhoto) })).not.toBeNull()
  expect(screen.getByRole('img', { name: longPhoto.altDescription })).not.toBeNull()
})

test('uses a contextual native Download button and meaningful local provenance, not inert provider links', () => {
  render(<ImageCard photo={photo} onDownload={successfulAction} />)
  const button = screen.getByRole('button', { name: actionName(photo) })
  expect(button.tagName).toBe('BUTTON')
  expect(button.getAttribute('type')).toBe('button')
  expect(screen.getByRole('link', { name: 'Photo source' }).getAttribute('href')).toBe('/fixtures/PROVENANCE.md')
  expect(document.querySelector('a[href^="/fixtures/mock/"], a[href*="unsplash.com"]')).toBeNull()
  expect(screen.getByRole('status').textContent).toBe('No automatic file save.')
})

test('keeps control context concise while preserving the full image alt and contributor identity', () => {
  const longAlt = 'A photographic subject with source-provided context. '.repeat(8)
  render(<ImageCard photo={{ ...photo, altDescription: longAlt }} onDownload={successfulAction} />)
  expect(screen.getByRole('img').getAttribute('alt')).toBe(longAlt.trim())
  expect(Array.from(screen.getByRole('button').getAttribute('aria-label')).length).toBeLessThanOrEqual(108)
  expect(screen.getByText(photo.user.name)).not.toBeNull()
})

test('shows guarded busy state then honest ready feedback and a local image link', async () => {
  const user = userEvent.setup()
  const pending = deferred()
  const onDownload = vi.fn(() => pending.promise)
  render(<ImageCard photo={photo} onDownload={onDownload} />)
  const button = screen.getByRole('button', { name: actionName(photo) })
  await user.click(button)
  expect(button.disabled).toBe(true)
  expect(button.getAttribute('aria-busy')).toBe('true')
  expect(screen.getByRole('status').textContent).toBe('Preparing sample download…')
  expect(onDownload).toHaveBeenCalledWith(photo)
  await user.click(button)
  await act(async () => { pending.resolve({ url: photo.links.download }) })
  expect(onDownload).toHaveBeenCalledTimes(1)
  expect(button.disabled).toBe(false)
  expect(button.getAttribute('aria-busy')).toBe('false')
  expect(screen.getByRole('status').textContent).toBe('Sample ready. No automatic file save.')
  expect(screen.getByRole('link', { name: 'Open local image' }).getAttribute('href')).toBe(photo.links.download)
  expect(screen.queryByText(/Downloaded|^Saved$/)).toBeNull()
})

test('guards synchronous repeated activations before the operation settles', async () => {
  const pending = deferred()
  const onDownload = vi.fn(() => pending.promise)
  render(<ImageCard photo={photo} onDownload={onDownload} />)
  const button = screen.getByRole('button', { name: actionName(photo) })
  act(() => {
    fireEvent.click(button)
    fireEvent.click(button)
  })
  expect(onDownload).toHaveBeenCalledTimes(1)
  await act(async () => { pending.resolve({ url: photo.links.download }) })
})

test('keyboard activation follows the same busy guard and restores the original control', async () => {
  const user = userEvent.setup()
  const pending = deferred()
  const onDownload = vi.fn(() => pending.promise)
  render(<ImageCard photo={photo} onDownload={onDownload} />)
  await user.tab()
  expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Photo source' }))
  await user.tab()
  const button = screen.getByRole('button', { name: actionName(photo) })
  expect(document.activeElement).toBe(button)
  await user.keyboard('{Enter}{Enter} ')
  expect(onDownload).toHaveBeenCalledTimes(1)
  await act(async () => { pending.resolve({ url: photo.links.download }) })
  expect(button.disabled).toBe(false)
})

test('mock failure is inline, safe and retryable through the same Download action', async () => {
  const user = userEvent.setup()
  const onDownload = vi.fn()
    .mockRejectedValueOnce(new Error('Private technical detail'))
    .mockResolvedValueOnce({ url: photo.links.download })
  render(<ImageCard photo={photo} onDownload={onDownload} />)
  const button = screen.getByRole('button', { name: actionName(photo) })
  await user.click(button)
  expect(screen.getByRole('status').textContent).toBe('Sample preparation failed. Try Download again.')
  expect(screen.queryByText(/Private technical detail/)).toBeNull()
  expect(button.disabled).toBe(false)
  expect(screen.queryByRole('link', { name: 'Open local image' })).toBeNull()
  await user.click(button)
  expect(screen.getByRole('status').textContent).toBe('Sample ready. No automatic file save.')
  expect(onDownload).toHaveBeenCalledTimes(2)
})

test('one busy card does not disable another card or move focus after completion', async () => {
  const user = userEvent.setup()
  const first = deferred(), second = deferred()
  render(<>
    <ImageCard photo={photo} onDownload={() => first.promise} />
    <ImageCard photo={samplePhotos[3]} onDownload={() => second.promise} />
  </>)
  const buttons = screen.getAllByRole('button')
  await user.click(buttons[0])
  expect(buttons[0].disabled).toBe(true)
  expect(buttons[1].disabled).toBe(false)
  screen.getAllByRole('link', { name: 'Photo source' })[1].focus()
  const focused = document.activeElement
  await act(async () => { first.resolve({ url: photo.links.download }) })
  expect(document.activeElement).toBe(focused)
  await user.click(buttons[1])
  expect(buttons[1].disabled).toBe(true)
  expect(buttons[0].disabled).toBe(false)
  await act(async () => { second.resolve({ url: samplePhotos[3].links.download }) })
})

test('restores native-disable focus loss after completion without focusing a status message', async () => {
  const user = userEvent.setup()
  const pending = deferred()
  render(<ImageCard photo={photo} onDownload={() => pending.promise} />)
  const button = screen.getByRole('button')
  await user.click(button)
  // jsdom does not reproduce Chromium's automatic blur on native disabling.
  document.body.tabIndex = -1
  document.body.focus()
  expect(document.activeElement).toBe(document.body)
  await act(async () => { pending.resolve({ url: photo.links.download }) })
  expect(document.activeElement).toBe(button)
  document.body.removeAttribute('tabindex')
})

test('image failure replaces the broken img while retaining dimensions, attribution and action context', () => {
  render(<ImageCard photo={imageFailurePhoto} onDownload={successfulAction} />)
  const image = screen.getByRole('img')
  const frame = image.parentElement
  const initialRatio = frame.style.aspectRatio
  fireEvent.error(image)
  expect(frame.querySelector('img')).toBeNull()
  expect(frame.style.aspectRatio).toBe(initialRatio)
  expect(screen.getByRole('img', { name: /Photograph unavailable/ })).not.toBeNull()
  expect(screen.getByText('Photograph unavailable')).not.toBeNull()
  expect(screen.getByText(imageFailurePhoto.user.name)).not.toBeNull()
  expect(screen.getByRole('button', { name: actionName(imageFailurePhoto) }).disabled).toBe(false)
  expect(screen.getByRole('status').textContent).toMatch(/Image unavailable/)
})

test('changing photo identity resets failed media and ignores a previous pending completion', async () => {
  const user = userEvent.setup()
  const pending = deferred()
  const { rerender } = render(<ImageCard photo={photo} onDownload={() => pending.promise} />)
  fireEvent.error(screen.getByRole('img'))
  await user.click(screen.getByRole('button'))
  rerender(<ImageCard photo={samplePhotos[3]} onDownload={successfulAction} />)
  expect(screen.getByRole('img', { name: samplePhotos[3].altDescription })).not.toBeNull()
  expect(screen.getByRole('button').disabled).toBe(false)
  await act(async () => { pending.resolve({ url: photo.links.download }) })
  expect(screen.queryByRole('link', { name: 'Open local image' })).toBeNull()
  expect(screen.getByRole('status').textContent).toBe('No automatic file save.')
})

test.each(['resolve', 'reject'])('ignores late %s after unmount without affecting another mounted card', async outcome => {
  const user = userEvent.setup()
  const pending = deferred()
  const view = render(<ImageCard photo={photo} onDownload={() => pending.promise} />)
  await user.click(screen.getByRole('button'))
  view.unmount()
  render(<ImageCard photo={samplePhotos[3]} onDownload={successfulAction} />)
  await act(async () => {
    if (outcome === 'resolve') pending.resolve({ url: photo.links.download })
    else pending.reject(new Error('late failure'))
  })
  expect(screen.getByRole('status').textContent).toBe('No automatic file save.')
  expect(within(screen.getByRole('article')).queryByRole('link', { name: 'Open local image' })).toBeNull()
})
