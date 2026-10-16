import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './test/SampleApp.jsx'
import GallerySection from './test/SampleGallerySection.jsx'

test('skip wording accurately names the permanent main destination', () => {
  render(<App />)
  const link = screen.getByRole('link', { name: 'Skip to main content' })
  const target = document.getElementById(link.hash.slice(1))
  expect(target).toBe(screen.getByRole('main'))
  expect(target.contains(screen.getByRole('search'))).toBe(true)
  expect(target.getAttribute('tabindex')).toBe('-1')
  expect(screen.queryByRole('link', { name: 'Skip to gallery' })).toBeNull()
})

test('compact gallery heading keeps disclosure, live status and busy results separate', () => {
  const { rerender } = render(<GallerySection photos={[]} status="empty" submittedQuery="river" />)
  const heading = screen.getByRole('heading', { name: 'Gallery' })
  const disclosure = screen.getByText('Local sample photographs · Sample downloads only.')
  const status = document.getElementById('gallery-status')
  const results = document.getElementById('gallery-results')
  expect(heading.parentElement).toBe(disclosure.parentElement)
  expect(heading.parentElement.contains(status)).toBe(false)
  expect(status.getAttribute('role')).toBe('status')
  expect(results.contains(status)).toBe(false)
  rerender(<GallerySection photos={[]} status="loading" submittedQuery="earth" />)
  expect(document.getElementById('gallery-results')).toBe(results)
  expect(document.getElementById('gallery-status')).toBe(status)
  expect(results.getAttribute('aria-busy')).toBe('true')
})

test('plain photo-source language retains provenance and honest local action context', () => {
  render(<App />)
  const gallery = screen.getByRole('region', { name: 'Gallery' })
  const sources = within(gallery).getAllByRole('link', { name: 'Photo source' })
  expect(sources).toHaveLength(10)
  for (const source of sources) expect(source.getAttribute('href')).toBe('/fixtures/PROVENANCE.md')
  expect(within(gallery).getAllByText('No automatic file save.')).toHaveLength(10)
  expect(screen.getByRole('contentinfo').textContent).toBe('Educational sample gallery. No live Unsplash search.')
  expect(within(gallery).queryByText(/Local fixture/)).toBeNull()
  expect(screen.queryByText('Photograph discovery')).toBeNull()
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
})