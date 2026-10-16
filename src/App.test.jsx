import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import App from './test/SampleApp.jsx'
import { samplePhotos } from './data/samplePhotos.js'

test('renders exactly one primary header, main and footer landmark', () => {
  render(<App />)

  expect(screen.getAllByRole('banner')).toHaveLength(1)
  expect(screen.getAllByRole('main')).toHaveLength(1)
  expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
})

test('provides one page H1 and a named gallery section with its H2', () => {
  render(<App />)

  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 1, name: /Find the frame/ })).not.toBeNull()
  const gallery = screen.getByRole('region', { name: 'Gallery' })
  expect(within(gallery).getByRole('heading', { level: 2, name: 'Gallery' })).not.toBeNull()
})

test('labels the native search input and submit action, with honest help text', () => {
  render(<App />)

  const input = screen.getByRole('searchbox', { name: 'Search photographs' })
  expect(screen.getByLabelText('Search photographs')).toBe(input)
  expect(input.getAttribute('aria-describedby')).toBe('search-help')
  expect(screen.getByRole('button', { name: 'Search' }).getAttribute('type')).toBe('submit')
  expect(screen.getByText(/Search local sample photographs/)).not.toBeNull()
})

test('connects the skip link to a permanent programmatically focusable main destination', () => {
  render(<App />)

  const link = screen.getByRole('link', { name: 'Skip to main content' })
  const target = document.getElementById(link.getAttribute('href').slice(1))
  expect(target).toBe(screen.getByRole('main'))
  expect(target.getAttribute('tabindex')).toBe('-1')
})

test.each(['button', 'Enter'])('a valid %s submission prevents navigation and completes the default sample request', async (action) => {
  const user = userEvent.setup()
  render(<App searchService={async () => ({ photos: samplePhotos })} />)
  const form = screen.getByRole('search', { name: 'Photograph search' })
  let submitEvent
  form.addEventListener('submit', event => { submitEvent = event })
  await user.type(screen.getByRole('searchbox', { name: 'Search photographs' }), 'nature')

  if (action === 'button') {
    await user.click(screen.getByRole('button', { name: 'Search' }))
  } else {
    await user.keyboard('{Enter}')
  }

  expect(submitEvent?.defaultPrevented).toBe(true)
  await screen.findByText('10 images shown · Local sample collection.')
  expect(within(screen.getByRole('region', { name: 'Gallery' })).getAllByRole('img')).toHaveLength(10)
  expect(screen.getAllByRole('article').map(card => card.dataset.photoId)).toEqual(samplePhotos.map(photo => photo.id))
})

test('keeps the shell keyboard order skip link → input → submit button', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.tab()
  expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Skip to main content' }))
  await user.tab()
  expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Search photographs' }))
  await user.tab()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Search' }))
})

test('presents truthful local sample context without claiming live results', () => {
  render(<App />)

  expect(screen.getByText(/No live Unsplash search/)).not.toBeNull()
  expect(document.getElementById('gallery-results')).not.toBeNull()
  expect(within(screen.getByRole('region', { name: 'Gallery' })).getAllByRole('img')).toHaveLength(10)
  expect(screen.getByText(/Local sample photographs/)).not.toBeNull()
  expect(document.getElementById('gallery-results').getAttribute('aria-busy')).toBe('false')
  expect(document.querySelector('details, [role="alert"]')).toBeNull()
  expect(screen.queryByRole('checkbox', { name: 'Simulate download failure' })).toBeNull()
  expect(screen.queryByRole('button', { name: /Retry/ })).toBeNull()
  expect(screen.getByText('10 images shown · Local sample collection.')).not.toBeNull()
})
