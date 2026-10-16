import { act, cleanup, configure, getConfig, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './test/SampleApp.jsx'
import { samplePhotos } from './data/samplePhotos.js'
const originalWrapper = getConfig().asyncWrapper
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  configure({ asyncWrapper: callback => act(callback) })
})
afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); configure({ asyncWrapper: originalWrapper }) })
const input = () => screen.getByRole('searchbox')
const submit = () => screen.getByRole('button', { name: 'Search', exact: true })
const tick = () => act(async () => { await vi.advanceTimersByTimeAsync(600) })
function setup(service) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(<App searchService={service} />)
  return user
}

test('empty recovery uses the real form reset/clear path, including stale blank-validation removal and focus', async () => {
  const user = setup()
  await user.type(input(), 'no-matching-photo'); await user.click(submit()); await tick()
  const results = document.getElementById('gallery-results')
  expect(screen.getByRole('heading', { name: 'Nothing in this frame.' })).not.toBeNull()
  await user.clear(input()); await user.type(input(), '   '); await user.click(submit())
  expect(screen.getByRole('alert')).not.toBeNull()
  await user.click(screen.getByRole('button', { name: 'Show all sample photographs' }))
  expect(input().value).toBe('')
  expect(document.activeElement).toBe(input())
  expect(screen.queryByRole('alert')).toBeNull()
  expect(results.getAttribute('aria-busy')).toBe('true')
  expect(screen.queryByRole('heading', { name: 'Nothing in this frame.' })).toBeNull()
  await tick()
  expect(screen.getAllByRole('article')).toHaveLength(10)
  expect(document.getElementById('gallery-status').textContent).toBe('10 images shown · Local sample collection.')
})

test('busy Search keeps its accessible name and remains usable for a different submitted draft', async () => {
  const user = setup()
  await user.type(input(), 'earth'); await user.click(submit())
  expect(submit().getAttribute('aria-busy')).toBe('true')
  expect(submit().disabled).toBe(false)
  expect(input().disabled).toBe(false)
  expect(screen.getByText(/You can submit a different search/).textContent).toContain('earth')
  await user.clear(input()); await user.type(input(), 'river')
  expect(screen.getByText(/You can submit a different search/).textContent).toContain('earth')
  await user.keyboard('{Enter}')
  expect(screen.getByText(/You can submit a different search/).textContent).toContain('river')
  await tick()
  expect(document.getElementById('gallery-status').textContent).toBe('1 image shown for “river”.')
  expect(submit().getAttribute('aria-busy')).toBe('false')
})

test.each(['success', 'empty', 'error'])('Retry passes through skeleton loading and settles %s without state bleed', async outcome => {
  const service = vi.fn().mockRejectedValueOnce(new Error('Private service detail')).mockImplementationOnce(() => new Promise((resolve, reject) => {
    setTimeout(() => outcome === 'error' ? reject(new Error('Private retry detail')) : resolve({ photos: outcome === 'empty' ? [] : [samplePhotos[3]] }), 600)
  }))
  const user = setup(service)
  await user.type(input(), 'river'); await user.click(submit())
  expect(screen.getByRole('heading', { name: 'Photographs could not be loaded.' })).not.toBeNull()
  await user.clear(input()); await user.type(input(), 'unsent earth')
  await user.click(screen.getByRole('button', { name: 'Retry search' }))
  expect(service.mock.calls[1][0].query).toBe('river')
  expect(input().value).toBe('unsent earth')
  expect(document.activeElement).toBe(input())
  expect(document.getElementById('gallery-results').querySelector('[aria-hidden="true"]')).not.toBeNull()
  expect(screen.queryByRole('heading', { name: 'Photographs could not be loaded.' })).toBeNull()
  await tick()
  expect(screen.queryAllByRole('article')).toHaveLength(outcome === 'success' ? 1 : 0)
  expect(screen.queryByRole('heading', { name: 'Nothing in this frame.' }) !== null).toBe(outcome === 'empty')
  expect(screen.queryByRole('heading', { name: 'Photographs could not be loaded.' }) !== null).toBe(outcome === 'error')
  expect(screen.queryByText(/Private/)).toBeNull()
})

test('recovery is a native reset action, not a second submit request path', async () => {
  const service = vi.fn().mockResolvedValueOnce({ photos: [] }).mockResolvedValueOnce({ photos: samplePhotos })
  setup(service)
  fireEvent.change(input(), { target: { value: 'zz' } }); fireEvent.submit(input().form)
  await act(async () => {})
  let submits = 0
  input().form.addEventListener('submit', () => { submits++ })
  fireEvent.click(screen.getByRole('button', { name: 'Show all sample photographs' }))
  await act(async () => {})
  expect(submits).toBe(0)
  expect(service.mock.calls.map(([request]) => request.query)).toEqual(['zz', 'nature'])
})
