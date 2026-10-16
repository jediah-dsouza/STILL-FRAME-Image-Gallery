import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import GallerySection from '../../test/SampleGallerySection.jsx'
import { samplePhotos } from '../../data/samplePhotos.js'

const base = { photos: samplePhotos, submittedQuery: 'earth', onRetry: vi.fn(), error: null }
const props = status => ({ ...base, status, photos: status === 'success' ? samplePhotos : [], error: status === 'error' ? { retryable: true, message: 'PRIVATE raw provider detail' } : null })
const empty = () => screen.queryByRole('heading', { name: 'Nothing in this frame.' })
const error = () => screen.queryByRole('heading', { name: 'Photographs could not be loaded.' })

test.each(['loading', 'success', 'empty', 'error'])('%s renders exactly its own presentation without state bleed', status => {
  const { container } = render(<GallerySection {...props(status)} />)
  const results = document.getElementById('gallery-results')
  expect(results.getAttribute('aria-busy')).toBe(String(status === 'loading'))
  expect(results.children).toHaveLength(1)
  expect(container.querySelector('.image-grid') !== null).toBe(status === 'success')
  expect(container.querySelector('[aria-hidden="true"]') !== null).toBe(status === 'loading')
  expect(empty() !== null).toBe(status === 'empty')
  expect(error() !== null).toBe(status === 'error')
  expect(screen.queryAllByRole('article')).toHaveLength(status === 'success' ? 10 : 0)
  expect(screen.queryByText(/PRIVATE raw provider detail/)).toBeNull()
  expect(document.getElementById('gallery-status').getAttribute('role')).toBe('status')
  expect(results.querySelector('[role="status"], [role="alert"]') !== null).toBe(status === 'success')
})

test('loading ignores stale photos/error and count rather than presenting them as current', () => {
  render(<GallerySection {...base} status="loading" error={{ retryable: true, message: 'Old error' }} />)
  expect(screen.queryAllByRole('article')).toHaveLength(0)
  expect(document.getElementById('gallery-status').textContent).toBe('Searching local photographs…')
  expect(screen.queryByText(/images shown|Old error/)).toBeNull()
  expect(empty()).toBeNull()
  expect(error()).toBeNull()
})

test('one stable named Gallery/result container and status persist through every request state', () => {
  const { rerender } = render(<GallerySection {...props('success')} />)
  const region = screen.getByRole('region', { name: 'Gallery' })
  const results = document.getElementById('gallery-results')
  const status = document.getElementById('gallery-status')
  for (const next of ['loading', 'empty', 'loading', 'error', 'loading', 'success']) {
    rerender(<GallerySection {...props(next)} />)
    expect(screen.getByRole('region', { name: 'Gallery' })).toBe(region)
    expect(document.getElementById('gallery-results')).toBe(results)
    expect(document.getElementById('gallery-status')).toBe(status)
  }
})

test('nonretryable gallery failure cannot expose raw details or an unavailable Retry', () => {
  render(<GallerySection {...props('error')} error={{ retryable: false, message: 'PRIVATE raw provider detail' }} />)
  expect(error()).not.toBeNull()
  expect(screen.queryByText(/PRIVATE/)).toBeNull()
  expect(screen.queryByRole('button', { name: 'Retry search' })).toBeNull()
  expect(document.getElementById('gallery-status').textContent).toBe('Sample search could not be completed.')
})
