import { StrictMode } from 'react'
import { act, cleanup, configure, getConfig, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './test/SampleApp.jsx'
import { samplePhotos } from './data/samplePhotos.js'
import { searchPhotos } from './services/mockPhotoSearch.js'

const originalAsyncWrapper = getConfig().asyncWrapper
// RTL's default wrapper drains a zero-time timer using Jest detection, not Vitest.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  configure({ asyncWrapper: callback => act(callback) })
})
afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  configure({ asyncWrapper: originalAsyncWrapper })
})
const input = () => screen.getByRole('searchbox', { name: 'Search photographs' })
const context = () => document.getElementById('gallery-status').textContent
const ids = () => screen.queryAllByRole('article').map(card => card.dataset.photoId)
const tick = (ms = 600) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
function setup(service = vi.fn(searchPhotos), strict = false) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  const view = render(strict ? <StrictMode><App searchService={service} /></StrictMode> : <App searchService={service} />)
  return { ...view, user, service }
}
async function submit(user, term, enter = false) {
  await user.clear(input())
  await user.type(input(), term)
  if (enter) await user.keyboard('{Enter}')
  else await user.click(screen.getByRole('button', { name: 'Search', exact: true }))
}

test('StrictMode initial attempt zero reuses all ten fixtures with empty controlled input and no request', () => {
  const { service } = setup(undefined, true)
  expect(input().value).toBe('')
  expect(ids()).toEqual(samplePhotos.map(photo => photo.id))
  expect(context()).toBe('10 images shown · Local sample collection.')
  expect(service).not.toHaveBeenCalled()
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
})

test('typing updates only the controlled input, not the request or result announcement', async () => {
  const { user, service } = setup()
  await user.type(input(), 'EARTH')
  expect(input().value).toBe('EARTH')
  expect(ids()).toHaveLength(10)
  expect(context()).toBe('10 images shown · Local sample collection.')
  expect(service).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Clear search' }).getAttribute('type')).toBe('button')
})

test.each(['button', 'Enter'])('%s explicitly starts one abortable request and settles multi-match results', async method => {
  const { user, service } = setup(undefined, true)
  await submit(user, 'earth', method === 'Enter')
  expect(service).toHaveBeenCalledTimes(1)
  expect(service.mock.calls[0][0].query).toBe('earth')
  expect(service.mock.calls[0][0].signal.aborted).toBe(false)
  expect(ids()).toHaveLength(0)
  expect(context()).toBe('Searching local photographs…')
  expect(document.getElementById('gallery-results').getAttribute('aria-busy')).toBe('true')
  await tick()
  expect(ids()).toEqual([samplePhotos[6].id, samplePhotos[9].id])
  expect(context()).toBe('2 images shown for “earth”.')
  expect(document.getElementById('gallery-results').getAttribute('aria-busy')).toBe('false')
})

test('commits trimmed human-readable casing without rewriting visible input', async () => {
  const { user, service } = setup()
  await submit(user, '  EaRtH  ')
  expect(input().value).toBe('  EaRtH  ')
  expect(service.mock.calls[0][0].query).toBe('EaRtH')
  await tick()
  expect(ids()).toEqual([samplePhotos[6].id, samplePhotos[9].id])
  expect(context()).toBe('2 images shown for “EaRtH”.')
})

test.each([
  ['river', [3]], ['STEReO', [2]], ['airtanker', [2]],
  ['Jim Ross', [0, 1]], ['nasa-joel-kowsky', [2]],
])('searches expected normalized textual fields: %s', async (term, indices) => {
  const { user } = setup()
  await submit(user, term)
  await tick()
  expect(ids()).toEqual(indices.map(i => samplePhotos[i].id))
  expect(context()).toBe(`${indices.length} ${indices.length === 1 ? 'image' : 'images'} shown for “${term}”.`)
  const buttons = screen.getAllByRole('button', { name: /^Download sample photograph:/ })
  expect(new Set(buttons.map(button => button.getAttribute('aria-label'))).size).toBe(indices.length)
})

test('valid zero matches resolve to empty, remove stale cards and do not expose error/retry', async () => {
  const { user } = setup()
  await submit(user, 'zz-no-match')
  await tick()
  expect(ids()).toEqual([])
  expect(context()).toBe('0 images shown for “zz-no-match”.')
  expect(screen.getByText(/No sample photographs match/)).not.toBeNull()
  expect(screen.queryByRole('button', { name: 'Retry search' })).toBeNull()
  expect(screen.queryByRole('alert')).toBeNull()
})

test('blank initial submission is local validation, not a request or gallery error', async () => {
  const { user, service } = setup()
  await user.click(screen.getByRole('button', { name: 'Search', exact: true }))
  expect(service).not.toHaveBeenCalled()
  expect(ids()).toHaveLength(10)
  expect(input().getAttribute('aria-invalid')).toBe('true')
  expect(input().getAttribute('aria-describedby')).toBe('search-help search-validation')
  expect(screen.getByRole('alert').id).toBe('search-validation')
  expect(document.activeElement).toBe(input())
})

test('whitespace-only submission preserves settled valid results and Clear removes validation', async () => {
  const { user, service } = setup()
  await submit(user, 'earth'); await tick()
  await submit(user, '   ')
  expect(service).toHaveBeenCalledTimes(1)
  expect(ids()).toEqual([samplePhotos[6].id, samplePhotos[9].id])
  expect(context()).toBe('2 images shown for “earth”.')
  await user.click(screen.getByRole('button', { name: 'Clear search' }))
  expect(screen.queryByRole('alert')).toBeNull()
  expect(input().hasAttribute('aria-invalid')).toBe(false)
  await tick()
  expect(ids()).toHaveLength(10)
})

test('Clear is not submission, resets through nature request and restores focus and full collection', async () => {
  const { user, service } = setup()
  await submit(user, 'river'); await tick()
  let submits = 0
  screen.getByRole('search', { name: 'Photograph search' }).addEventListener('submit', () => { submits++ })
  await user.click(screen.getByRole('button', { name: 'Clear search' }))
  expect(submits).toBe(0)
  expect(input().value).toBe('')
  expect(document.activeElement).toBe(input())
  expect(service.mock.calls.at(-1)[0].query).toBe('nature')
  expect(ids()).toHaveLength(0)
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()
  await tick()
  expect(ids()).toEqual(samplePhotos.map(photo => photo.id))
  expect(context()).toBe('10 images shown · Local sample collection.')
})

test('Clear remains available when input is empty but a committed nondefault search is active', async () => {
  const { user } = setup()
  await submit(user, 'river'); await tick()
  await user.clear(input())
  expect(screen.getByRole('button', { name: 'Clear search' })).not.toBeNull()
  expect(ids()).toEqual([samplePhotos[3].id])
})

test('reset retriggers default even when submittedQuery already equals nature', async () => {
  const { user, service } = setup()
  await user.type(input(), 'unsent draft')
  await user.click(screen.getByRole('button', { name: 'Clear search' }))
  expect(service).toHaveBeenCalledTimes(1)
  expect(service.mock.calls[0][0].query).toBe('nature')
  await tick()
  expect(ids()).toHaveLength(10)
})

test('a second Clear reuses an identical pending nature request without aborting it', async () => {
  const { user, service } = setup()
  await user.type(input(), 'draft')
  await user.click(screen.getByRole('button', { name: 'Clear search' }))
  await user.type(input(), 'another draft')
  await user.click(screen.getByRole('button', { name: 'Clear search' }))
  expect(service).toHaveBeenCalledTimes(1)
  expect(service.mock.calls[0][0].signal.aborted).toBe(false)
  await tick()
  expect(ids()).toHaveLength(10)
})

test('identical pending submissions including casing variants do not duplicate requests', async () => {
  const { user, service } = setup()
  await submit(user, 'earth')
  await submit(user, ' EARTH ')
  expect(service).toHaveBeenCalledTimes(1)
  expect(service.mock.calls[0][0].signal.aborted).toBe(false)
  await tick()
  expect(ids()).toHaveLength(2)
})

test('completed identical query retriggers through requestAttempt and the same effect path', async () => {
  const { user, service } = setup()
  await submit(user, 'earth'); await tick()
  await user.click(screen.getByRole('button', { name: 'Search', exact: true }))
  expect(service).toHaveBeenCalledTimes(2)
  expect(context()).toBe('Searching local photographs…')
  expect(service.mock.calls[1][0].query).toBe('earth')
  await tick()
  expect(ids()).toHaveLength(2)
})

test.each(['resolve', 'reject'])('obsolete %s cannot clear newer loading or release its duplicate guard', async outcome => {
  const first = deferred(), second = deferred()
  const service = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
  const { user } = setup(service)
  await submit(user, 'earth')
  await submit(user, 'river')
  expect(service.mock.calls[0][0].signal.aborted).toBe(true)
  await act(async () => {
    if (outcome === 'resolve') first.resolve({ photos: [samplePhotos[6], samplePhotos[9]] })
    else first.reject(new Error('obsolete failure'))
  })
  expect(context()).toBe('Searching local photographs…')
  expect(ids()).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: 'Search', exact: true }))
  expect(service).toHaveBeenCalledTimes(2)
  await act(async () => { second.resolve({ photos: [samplePhotos[3]] }) })
  expect(ids()).toEqual([samplePhotos[3].id])
})

test.each(['resolve', 'reject'])('late obsolete %s cannot replace a newer settled result', async outcome => {
  const first = deferred(), second = deferred()
  const service = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
  const { user } = setup(service)
  await submit(user, 'earth'); await submit(user, 'river')
  await act(async () => { second.resolve({ photos: [samplePhotos[3]] }) })
  await act(async () => {
    if (outcome === 'resolve') first.resolve({ photos: [samplePhotos[6], samplePhotos[9]] })
    else first.reject(new Error('obsolete failure'))
  })
  expect(ids()).toEqual([samplePhotos[3].id])
  expect(context()).toBe('1 image shown for “river”.')
})

test('Clear during in-flight search invalidates the old request and only restores default results', async () => {
  const first = deferred(), reset = deferred()
  const service = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(reset.promise)
  const { user } = setup(service)
  await submit(user, 'earth')
  await user.click(screen.getByRole('button', { name: 'Clear search' }))
  expect(service.mock.calls[0][0].signal.aborted).toBe(true)
  expect(service.mock.calls[1][0].query).toBe('nature')
  await act(async () => { first.resolve({ photos: [samplePhotos[6], samplePhotos[9]] }) })
  expect(context()).toBe('Searching local photographs…')
  await act(async () => { reset.resolve({ photos: samplePhotos }) })
  expect(ids()).toEqual(samplePhotos.map(photo => photo.id))
  expect(input().value).toBe('')
})

test('actual cancellation of the mock timer is never exposed as a request failure', async () => {
  const { user, service } = setup()
  await submit(user, 'earth')
  await tick(300)
  await submit(user, 'river')
  expect(service.mock.calls[0][0].signal.aborted).toBe(true)
  await tick(300)
  expect(context()).toBe('Searching local photographs…')
  await tick(300)
  expect(context()).toBe('1 image shown for “river”.')
  expect(screen.queryByRole('button', { name: 'Retry search' })).toBeNull()
})

test('request failure is distinct from empty and Retry uses committed query, not unsent edits', async () => {
  const service = vi.fn().mockRejectedValueOnce(new Error('Private provider detail'))
    .mockImplementationOnce(searchPhotos)
  const { user } = setup(service)
  await submit(user, 'earth')
  expect(context()).toBe('Sample search could not be completed. Try again.')
  expect(screen.queryByText(/Private provider detail/)).toBeNull()
  expect(screen.queryByText(/No sample photographs match/)).toBeNull()
  await user.clear(input()); await user.type(input(), 'unsent river')
  await user.click(screen.getByRole('button', { name: 'Retry search' }))
  expect(service.mock.calls[1][0].query).toBe('earth')
  expect(input().value).toBe('unsent river')
  expect(document.activeElement).toBe(input())
  expect(context()).toBe('Searching local photographs…')
  await tick()
  expect(context()).toBe('2 images shown for “earth”.')
})

test('unmount aborts current work and ignores a noncooperative late completion', async () => {
  const pending = deferred(), service = vi.fn(() => pending.promise)
  const { user, unmount } = setup(service)
  await submit(user, 'earth')
  unmount()
  expect(service.mock.calls[0][0].signal.aborted).toBe(true)
  render(<App />)
  await act(async () => { pending.resolve({ photos: [samplePhotos[3]] }) })
  expect(ids()).toHaveLength(10)
})

test('card Download does not block search and its unmounted completion cannot leak into new results', async () => {
  const { user } = setup()
  const firstCard = screen.getAllByRole('article')[0]
  await user.click(within(firstCard).getByRole('button'))
  expect(within(firstCard).getByRole('button').disabled).toBe(true)
  expect(input().disabled).toBe(false)
  await submit(user, 'river')
  await tick()
  expect(ids()).toEqual([samplePhotos[3].id])
  await tick(100)
  expect(screen.queryByRole('link', { name: 'Open local image' })).toBeNull()
  expect(input().value).toBe('river')
})

test('search submission preserves native keyboard focus rather than jumping to results', async () => {
  const { user } = setup()
  await submit(user, 'river', true)
  expect(document.activeElement).toBe(input())
  await tick()
  expect(document.activeElement).toBe(input())
  await user.tab()
  const clear = screen.getByRole('button', { name: 'Clear search' })
  expect(document.activeElement).toBe(clear)
  await user.keyboard(' ')
  expect(input().value).toBe('')
  expect(document.activeElement).toBe(input())
})
