import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import ImageGrid from './ImageGrid.jsx'
import GallerySection from '../../test/SampleGallerySection.jsx'
import { samplePhotos } from '../../data/samplePhotos.js'
import { imageFailurePhoto } from '../../data/imageFailurePhoto.js'

const immediateDownload = photo => Promise.resolve({ url: photo.links.download })
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

test('renders each normalized photo in supplied order with its original media and credit', () => {
  render(<ImageGrid photos={samplePhotos} onDownload={immediateDownload} />)
  const cards = screen.getAllByRole('article')
  expect(cards).toHaveLength(10)
  expect(cards.map(card => card.dataset.photoId)).toEqual(samplePhotos.map(photo => photo.id))
  cards.forEach((card, index) => {
    const image = within(card).getByRole('img')
    expect(image.getAttribute('src')).toBe(samplePhotos[index].urls.regular)
    expect(image.getAttribute('width')).toBe(String(samplePhotos[index].width))
    expect(image.getAttribute('height')).toBe(String(samplePhotos[index].height))
    expect(within(card).getByText(samplePhotos[index].user.name)).not.toBeNull()
  })
})

test('does not mutate frozen normalized records or their supplied array', () => {
  const photos = structuredClone(samplePhotos)
  const before = structuredClone(photos)
  function freeze(value) {
    Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child) })
    return Object.freeze(value)
  }
  freeze(photos)
  render(<ImageGrid photos={photos} onDownload={immediateDownload} />)
  expect(photos).toEqual(before)
})

test('accepts an empty array without fabricating cards or application empty-state UI', () => {
  render(<ImageGrid photos={[]} onDownload={immediateDownload} />)
  expect(screen.queryAllByRole('article')).toHaveLength(0)
  expect(screen.queryAllByRole('img')).toHaveLength(0)
  expect(screen.queryAllByRole('button')).toHaveLength(0)
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.queryByText(/No images|Try again|Retry/)).toBeNull()
})

test('keeps contextual Download names distinct across all ten cards', () => {
  render(<ImageGrid photos={samplePhotos} onDownload={immediateDownload} />)
  const names = screen.getAllByRole('button').map(button => button.getAttribute('aria-label'))
  expect(names).toHaveLength(10)
  expect(new Set(names).size).toBe(10)
  names.forEach(name => expect(name).toMatch(/^Download sample photograph: .+/))
})

test('loads the first two images eagerly and the remaining eight natively lazily', () => {
  render(<ImageGrid photos={samplePhotos} onDownload={immediateDownload} />)
  const images = screen.getAllByRole('img')
  expect(images.map(image => image.getAttribute('loading'))).toEqual(['eager', 'eager', ...Array(8).fill('lazy')])
  images.forEach(image => expect(image.getAttribute('decoding')).toBe('async'))
})

test('preserves the pending card identity when supplied photos are reordered', async () => {
  const pending = deferred()
  const onDownload = vi.fn(() => pending.promise)
  const photos = samplePhotos.slice(0, 2)
  const view = render(<ImageGrid photos={photos} onDownload={onDownload} />)
  const originalButton = screen.getAllByRole('button')[0]
  fireEvent.click(originalButton)
  view.rerender(<ImageGrid photos={[photos[1], photos[0]]} onDownload={onDownload} />)
  const reordered = screen.getAllByRole('article')
  expect(reordered.map(card => card.dataset.photoId)).toEqual([photos[1].id, photos[0].id])
  expect(within(reordered[1]).getByRole('button')).toBe(originalButton)
  expect(originalButton.disabled).toBe(true)
  expect(within(reordered[0]).getByRole('button').disabled).toBe(false)
  await act(async () => { pending.resolve({ url: photos[0].links.download }) })
  expect(within(reordered[1]).getByRole('link', { name: 'Open local image' }).getAttribute('href')).toBe(photos[0].links.download)
  expect(within(reordered[0]).queryByRole('link', { name: 'Open local image' })).toBeNull()
})

test('removing a pending record does not attach its late completion to another card', async () => {
  const pending = deferred()
  const photos = samplePhotos.slice(0, 2)
  const view = render(<ImageGrid photos={photos} onDownload={() => pending.promise} />)
  fireEvent.click(screen.getAllByRole('button')[0])
  view.rerender(<ImageGrid photos={[photos[1]]} onDownload={immediateDownload} />)
  await act(async () => { pending.resolve({ url: photos[0].links.download }) })
  expect(screen.getByRole('article').dataset.photoId).toBe(photos[1].id)
  expect(screen.getByRole('button').disabled).toBe(false)
  expect(screen.queryByRole('link', { name: 'Open local image' })).toBeNull()
})

test('guards repeat activation while independent grid cards can succeed and fail locally', async () => {
  const user = userEvent.setup()
  const first = deferred(), second = deferred()
  const photos = samplePhotos.slice(0, 3)
  const onDownload = vi.fn(photo => photo.id === photos[0].id ? first.promise : second.promise)
  render(<ImageGrid photos={photos} onDownload={onDownload} />)
  const cards = screen.getAllByRole('article'), buttons = screen.getAllByRole('button')
  await user.click(buttons[0])
  await user.click(buttons[0])
  expect(onDownload).toHaveBeenCalledTimes(1)
  expect(buttons[1].disabled).toBe(false)
  await user.click(buttons[1])
  expect(onDownload).toHaveBeenCalledTimes(2)
  expect(buttons[0].disabled).toBe(true)
  expect(buttons[1].disabled).toBe(true)
  expect(buttons[2].disabled).toBe(false)
  await act(async () => {
    first.resolve({ url: photos[0].links.download })
    second.reject(new Error('Private failure'))
  })
  expect(within(cards[0]).getByRole('status').textContent).toBe('Sample ready. No automatic file save.')
  expect(within(cards[1]).getByRole('status').textContent).toBe('Sample preparation failed. Try Download again.')
  expect(within(cards[1]).queryByRole('link', { name: 'Open local image' })).toBeNull()
  expect(within(cards[2]).getByRole('status').textContent).toBe('No automatic file save.')
  expect(buttons.every(button => !button.disabled)).toBe(true)
})

test('keyboard traversal follows each card source then action in supplied order', async () => {
  const user = userEvent.setup()
  render(<ImageGrid photos={samplePhotos.slice(0, 3)} onDownload={immediateDownload} />)
  for (const card of screen.getAllByRole('article')) {
    await user.tab()
    expect(document.activeElement).toBe(within(card).getByRole('link', { name: 'Photo source' }))
    await user.tab()
    expect(document.activeElement).toBe(within(card).getByRole('button'))
  }
})

test('the full gallery excludes intentional failures and temporary controls, with honest static context', () => {
  render(<GallerySection photos={samplePhotos} status="success" error={null} submittedQuery="nature" onRetry={() => {}} />)
  const gallery = screen.getByRole('region', { name: 'Gallery' })
  const cards = within(gallery).getAllByRole('article')
  expect(cards.map(card => card.dataset.photoId)).toEqual(samplePhotos.map(photo => photo.id))
  expect(cards.some(card => card.dataset.photoId === imageFailurePhoto.id)).toBe(false)
  expect(within(gallery).getAllByRole('img')).toHaveLength(10)
  expect(document.querySelector('img[src*="intentionally-missing"], details')).toBeNull()
  expect(screen.queryByRole('checkbox')).toBeNull()
  expect(screen.getByText('10 images shown · Local sample collection.')).not.toBeNull()
  expect(screen.queryByText(/Unsplash results|API results/)).toBeNull()
  expect(document.getElementById('gallery-results').getAttribute('aria-busy')).toBe('false')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.queryByRole('button', { name: /Retry/ })).toBeNull()
})
