import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App.jsx'
import { providerPhoto } from './test/livePhotos.js'

const response = (body, status = 200) => new Response(JSON.stringify(body), { status })
const photos = (id = 'demo-photo') => ({ results: [providerPhoto({ id, links: { ...providerPhoto().links, download_location: `https://api.unsplash.com/photos/${id}/download?ixid=keep` } })] })
const input = () => screen.getByRole('searchbox')
const search = () => screen.getByRole('button', { name: 'Search', exact: true })
const context = () => document.getElementById('gallery-status').textContent
const ids = () => screen.queryAllByRole('article').map(card => card.dataset.photoId)
function setup(implementation = () => Promise.resolve(response(photos()))) {
  const fetcher = vi.fn(implementation)
  vi.stubGlobal('fetch', fetcher)
  const view = render(<StrictMode><App /></StrictMode>)
  return { ...view, fetcher, user: userEvent.setup() }
}
async function submit(user, text) { await user.clear(input()); await user.type(input(), text); await user.keyboard('{Enter}') }
afterEach(() => vi.unstubAllGlobals())

test('live initial nature fetch replaces fixtures; StrictMode makes one request, no search per keystroke, duplicate pending and completed refresh preserved', async () => {
  const { fetcher, user } = setup()
  expect(context()).toBe('Searching photographs…')
  expect(document.querySelector('.gallery-skeleton')).not.toBeNull()
  await screen.findByRole('article')
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(fetcher.mock.calls[0][0]).toBe('/api/photos/search?query=nature')
  expect(ids()).toEqual(['demo-photo']); expect(input().value).toBe('')
  expect(screen.queryByText(/Local sample|No live Unsplash/)).toBeNull()
  await user.type(input(), '  lakes  ')
  expect(fetcher).toHaveBeenCalledTimes(1)
  await user.click(search())
  await waitFor(() => expect(context()).toBe('1 image shown for “lakes”.'))
  expect(fetcher).toHaveBeenCalledTimes(2)
  await user.click(search()); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3))
  let release
  fetcher.mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
  await user.click(search()); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(4))
  await user.click(search()); expect(fetcher).toHaveBeenCalledTimes(4)
  await act(async () => release(response(photos())))
  expect(input().disabled).toBe(false)
})

test('empty is distinct, native recovery clears validation/draft and loads nature with input focus', async () => {
  const { fetcher, user } = setup()
  await screen.findByRole('article')
  fetcher.mockResolvedValueOnce(response({ results: [] }))
  await submit(user, 'zz-no-result')
  await screen.findByRole('heading', { name: 'Nothing in this frame.' })
  expect(context()).toBe('0 images shown for “zz-no-result”.')
  expect(screen.queryByRole('heading', { name: 'Photographs could not be loaded.' })).toBeNull()
  await user.clear(input()); await user.click(search())
  expect(input().getAttribute('aria-invalid')).toBe('true')
  const count = fetcher.mock.calls.length
  await user.click(screen.getByRole('button', { name: 'Show nature photographs' }))
  await screen.findByRole('article')
  expect(fetcher).toHaveBeenCalledTimes(count + 1)
  expect(fetcher.mock.lastCall[0]).toBe('/api/photos/search?query=nature')
  expect(input().value).toBe(''); expect(document.activeElement).toBe(input())
  expect(screen.queryByRole('alert')).toBeNull()
})

test('retry reissues committed failing query rather than unsent draft; Clear restores nature', async () => {
  const { fetcher, user } = setup()
  await screen.findByRole('article')
  fetcher.mockResolvedValueOnce(response({ error: { type: 'network', message: 'PRIVATE' } }, 502))
  await submit(user, 'river')
  await screen.findByRole('heading', { name: 'Photographs could not be loaded.' })
  expect(context()).toBe('Photographs could not be reached. Try again.')
  await user.clear(input()); await user.type(input(), 'unsent draft')
  await user.click(screen.getByRole('button', { name: 'Retry search' }))
  await screen.findByRole('article')
  expect(fetcher.mock.lastCall[0]).toBe('/api/photos/search?query=river')
  expect(input().value).toBe('unsent draft'); expect(document.activeElement).toBe(input())
  await user.click(screen.getByRole('button', { name: 'Clear search' }))
  await waitFor(() => expect(context()).toBe('1 image shown for “nature”.'))
  expect(fetcher.mock.lastCall[0]).toBe('/api/photos/search?query=nature')
  expect(input().value).toBe(''); expect(document.activeElement).toBe(input())
  expect(screen.queryByText(/PRIVATE/)).toBeNull()
})

test.each([[503, 'auth', false], [429, 'rate-limit', true], [502, 'api', true], [500, 'unknown', true]])('live error %s/%s is safe with appropriate recovery', async (status, type, retryable) => {
  setup(() => Promise.resolve(response({ error: { type, message: 'PRIVATE credential response' } }, status)))
  await screen.findByRole('heading', { name: 'Photographs could not be loaded.' })
  expect(ids()).toEqual([])
  expect(screen.queryByText(/PRIVATE/)).toBeNull()
  expect(Boolean(screen.queryByRole('button', { name: 'Retry search' }))).toBe(retryable)
  expect(document.getElementById('gallery-results').getAttribute('aria-busy')).toBe('false')
})

test('superseded initial request is aborted and ignored after newer success, including late resolution', async () => {
  let resolveInitial
  const { fetcher, user } = setup(() => new Promise(resolve => { resolveInitial = resolve }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  const initialSignal = fetcher.mock.calls[0][1].signal
  fetcher.mockResolvedValueOnce(response(photos('newer')))
  await submit(user, 'newer')
  await waitFor(() => expect(ids()).toEqual(['newer']))
  expect(initialSignal.aborted).toBe(true)
  await act(async () => resolveInitial(response(photos('obsolete'))))
  expect(ids()).toEqual(['newer']); expect(context()).toBe('1 image shown for “newer”.')
})

test('superseded abort cannot flash Error; stale reject does not clear pending guard', async () => {
  let rejectFirst, releaseSecond
  const { fetcher, user } = setup(() => new Promise((resolve, reject) => { rejectFirst = reject }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  fetcher.mockImplementationOnce(() => new Promise(resolve => { releaseSecond = resolve }))
  await submit(user, 'next')
  await act(async () => rejectFirst(new DOMException('private', 'AbortError')))
  expect(context()).toBe('Searching photographs…')
  await user.click(search()); expect(fetcher).toHaveBeenCalledTimes(2)
  await act(async () => releaseSecond(response(photos())))
  expect(screen.queryByRole('heading', { name: 'Photographs could not be loaded.' })).toBeNull()
})

test('blank and programmatic overlong drafts do not request or replace settled gallery', async () => {
  const { fetcher, user } = setup()
  await screen.findByRole('article')
  await user.click(search()); expect(fetcher).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('alert').textContent).toContain('Enter a subject')
  expect(input().getAttribute('maxlength')).toBe('200')
  fireEvent.change(input(), { target: { value: 'x'.repeat(201) } })
  fireEvent.submit(screen.getByRole('search'))
  expect(screen.getByRole('alert').textContent).toBe('Use at most 200 characters.')
  expect(fetcher).toHaveBeenCalledTimes(1); expect(ids()).toEqual(['demo-photo'])
})
