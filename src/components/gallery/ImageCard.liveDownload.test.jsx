import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import ImageCard from './ImageCard.jsx'
import { normalizePhoto } from '../../utils/normalizePhoto.js'
import { providerPhoto } from '../../test/livePhotos.js'
import { DownloadError } from '../../services/downloadErrors.js'
const photo = normalizePhoto(providerPhoto())
const url = 'https://images.unsplash.com/photo-download?ixid=preserve&dl=photo.jpg'
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const button = () => screen.getByRole('button', { name: /^Download photograph:/ })

test('native accessible live button registers exact photo before delivering; no early success; immediate duplicate guard', async () => {
  const registration = deferred(), delivery = deferred()
  const onDownload = vi.fn(() => registration.promise), deliverDownload = vi.fn(() => delivery.promise)
  render(<ImageCard photo={photo} onDownload={onDownload} deliverDownload={deliverDownload} />)
  button().focus(); fireEvent.click(button()); fireEvent.click(button())
  expect(onDownload).toHaveBeenCalledTimes(1)
  expect(onDownload.mock.calls[0][0]).toBe(photo)
  expect(onDownload.mock.calls[0][1].signal.aborted).toBe(false)
  expect(button().disabled).toBe(true); expect(button().getAttribute('aria-busy')).toBe('true')
  expect(screen.getByRole('status').textContent).toBe('Registering download…')
  expect(deliverDownload).not.toHaveBeenCalled()
  await act(async () => registration.resolve({ url }))
  expect(deliverDownload).toHaveBeenCalledWith(url, { photoId: photo.id, signal: expect.any(AbortSignal) })
  expect(screen.getByRole('status').textContent).toBe('Preparing image download…')
  expect(screen.queryByText(/Download initiated/)).toBeNull()
  await act(async () => delivery.resolve())
  expect(button().disabled).toBe(false); expect(document.activeElement).toBe(button())
  expect(screen.getByRole('status').textContent).toContain('a saved file cannot be verified')
  expect(screen.getByRole('link', { name: 'Open image to save' }).href).toBe(url)
})
test('registration failure is local, has no stale resource link, and can retry', async () => {
  const onDownload = vi.fn().mockRejectedValueOnce(new DownloadError('registration', 'auth')).mockResolvedValue({ url })
  const deliverDownload = vi.fn().mockResolvedValue()
  render(<ImageCard photo={photo} onDownload={onDownload} deliverDownload={deliverDownload} />)
  fireEvent.click(button())
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('configuration'))
  expect(deliverDownload).not.toHaveBeenCalled(); expect(screen.queryByRole('link', { name: 'Open image to save' })).toBeNull()
  fireEvent.click(button()); await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Download initiated'))
  expect(onDownload).toHaveBeenCalledTimes(2); expect(deliverDownload).toHaveBeenCalledTimes(1)
})
test('delivery failure preserves a safe manual-save link; retry does not register twice', async () => {
  const onDownload = vi.fn().mockResolvedValue({ url })
  const deliverDownload = vi.fn().mockRejectedValueOnce(new Error('private implementation detail')).mockResolvedValue()
  render(<ImageCard photo={photo} onDownload={onDownload} deliverDownload={deliverDownload} />)
  fireEvent.click(button())
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('file delivery could not start'))
  expect(screen.queryByText(/private implementation/)).toBeNull()
  expect(screen.getByRole('link', { name: 'Open image to save' }).getAttribute('rel')).toContain('noopener')
  fireEvent.click(button()); await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Download initiated'))
  expect(onDownload).toHaveBeenCalledTimes(1); expect(deliverDownload).toHaveBeenCalledTimes(2)
})
test('unsafe callback resource cannot trigger delivery or a link', async () => {
  const deliverDownload = vi.fn()
  render(<ImageCard photo={photo} onDownload={async () => ({ url: 'https://evil.test' })} deliverDownload={deliverDownload} />)
  fireEvent.click(button()); await waitFor(() => expect(screen.getByRole('status').textContent).toContain('registration failed'))
  expect(deliverDownload).not.toHaveBeenCalled(); expect(screen.queryByRole('link', { name: 'Open image to save' })).toBeNull()
})
test('unmount aborts registration and ignores late completion without initiating delivery', async () => {
  const pending = deferred(), onDownload = vi.fn(() => pending.promise), deliverDownload = vi.fn()
  const { unmount } = render(<ImageCard photo={photo} onDownload={onDownload} deliverDownload={deliverDownload} />)
  fireEvent.click(button()); const signal = onDownload.mock.calls[0][1].signal
  unmount(); expect(signal.aborted).toBe(true)
  await act(async () => pending.resolve({ url })); expect(deliverDownload).not.toHaveBeenCalled()
})
test('unmount aborts pending file transfer', async () => {
  const pending = deferred(), deliverDownload = vi.fn(() => pending.promise)
  const { unmount } = render(<ImageCard photo={photo} onDownload={async () => ({ url })} deliverDownload={deliverDownload} />)
  fireEvent.click(button()); await waitFor(() => expect(deliverDownload).toHaveBeenCalledTimes(1))
  const signal = deliverDownload.mock.calls[0][1].signal; unmount(); expect(signal.aborted).toBe(true)
  await act(async () => pending.resolve())
})
test('cards remain independent, keyboard activation is native and completion never steals new focus', async () => {
  const pending = deferred(), onDownload = vi.fn(() => pending.promise)
  render(<><input aria-label="Search photographs" /><ImageCard photo={photo} onDownload={onDownload} /><ImageCard photo={{ ...photo, id: 'other', links: { ...photo.links, downloadLocation: 'https://api.unsplash.com/photos/other/download' } }} onDownload={onDownload} /></>)
  const buttons = screen.getAllByRole('button')
  const user = userEvent.setup(); buttons[0].focus(); await user.keyboard('{Enter}')
  expect(buttons[0].disabled).toBe(true); expect(buttons[1].disabled).toBe(false)
  const search = screen.getByRole('textbox'); search.focus()
  await act(async () => pending.reject(new Error('private')))
  expect(document.activeElement).toBe(search)
  expect(within(buttons[1].closest('article')).getByRole('status').textContent).not.toContain('failed')
})
test('invalid download location disables only the affected action; failed image keeps attribution and valid Download', async () => {
  const { rerender } = render(<ImageCard photo={{ ...photo, links: { ...photo.links, downloadLocation: 'https://evil.test' } }} onDownload={vi.fn()} />)
  expect(button().disabled).toBe(true)
  rerender(<ImageCard photo={photo} onDownload={vi.fn()} />)
  fireEvent.error(screen.getByRole('img'))
  expect(button().disabled).toBe(false); expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Photograph unavailable')
  expect(screen.getByRole('link', { name: 'on Unsplash' })).not.toBeNull()
})

test('two simultaneous image actions keep independent pending, failure and initiated states', async () => {
  const first = deferred(), second = deferred()
  const other = { ...photo, id: 'other', links: { ...photo.links, downloadLocation: 'https://api.unsplash.com/photos/other/download' } }
  const onDownload = vi.fn(p => p.id === photo.id ? first.promise : second.promise)
  render(<><ImageCard photo={photo} onDownload={onDownload} deliverDownload={async () => {}} /><ImageCard photo={other} onDownload={onDownload} deliverDownload={async () => {}} /></>)
  const buttons = screen.getAllByRole('button')
  fireEvent.click(buttons[0]); fireEvent.click(buttons[1])
  expect(onDownload).toHaveBeenCalledTimes(2); expect(buttons.every(button => button.disabled)).toBe(true)
  await act(async () => first.reject(new Error('failure')))
  expect(buttons[0].disabled).toBe(false); expect(buttons[1].disabled).toBe(true)
  await act(async () => second.resolve({ url }))
  expect(within(buttons[0].closest('article')).getByRole('status').textContent).toContain('registration failed')
  expect(within(buttons[1].closest('article')).getByRole('status').textContent).toContain('Download initiated')
})
