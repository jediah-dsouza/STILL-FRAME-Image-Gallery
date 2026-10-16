import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import GallerySkeleton from './GallerySkeleton.jsx'
import EmptyState from './EmptyState.jsx'
import ErrorState from './ErrorState.jsx'

test('skeleton has four deterministic decorative placeholders, no fake data or controls', () => {
  const { container, rerender } = render(<GallerySkeleton />)
  const first = container.innerHTML
  const skeleton = container.firstElementChild
  expect(skeleton.getAttribute('aria-hidden')).toBe('true')
  expect(skeleton.children).toHaveLength(4)
  expect(screen.queryByRole('button')).toBeNull()
  expect(screen.queryByRole('img')).toBeNull()
  expect(screen.queryByRole('status')).toBeNull()
  expect(container.textContent).toBe('')
  rerender(<GallerySkeleton />)
  expect(container.innerHTML).toBe(first)
})

test('empty names the committed query as text and offers native reset to the existing form', () => {
  const reset = vi.fn(event => event.preventDefault())
  render(<><form id="review-search" onReset={reset} /><EmptyState query={'<river> & “earth”'} resetFormId="review-search" /></>)
  expect(screen.getByRole('heading', { name: 'Nothing in this frame.' }).tagName).toBe('H3')
  expect(screen.getByText(/No sample photographs match/).textContent).toContain('<river> & “earth”')
  expect(document.querySelector('river')).toBeNull()
  const button = screen.getByRole('button', { name: 'Show all sample photographs' })
  expect(button.getAttribute('type')).toBe('reset')
  expect(button.form.id).toBe('review-search')
  fireEvent.click(button)
  expect(reset).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('alert')).toBeNull()
})

test('retryable error offers a native callback action with safe human-readable copy', () => {
  const retry = vi.fn()
  render(<ErrorState retryable onRetry={retry} />)
  expect(screen.getByRole('heading', { name: 'Photographs could not be loaded.' }).tagName).toBe('H3')
  const button = screen.getByRole('button', { name: 'Retry search' })
  expect(button.getAttribute('type')).toBe('button')
  fireEvent.click(button)
  expect(retry).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.queryByText(/No sample photographs match/)).toBeNull()
})

test('nonretryable error has safe alternative guidance without a Retry button', () => {
  const retry = vi.fn()
  render(<ErrorState retryable={false} onRetry={retry} />)
  expect(screen.getByText(/Try a different subject using the search above/)).not.toBeNull()
  expect(screen.queryByRole('button')).toBeNull()
  expect(retry).not.toHaveBeenCalled()
})
