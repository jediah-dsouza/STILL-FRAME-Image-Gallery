import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { unsplashReferral, UNSPLASH_APPLICATION_ID, isUnsplashPhoto } from './attribution.js'
import { normalizePhoto } from './normalizePhoto.js'
import { providerPhoto } from '../test/livePhotos.js'
import ImageCard from '../components/gallery/ImageCard.jsx'

test('referral slug is explicit and existing provider parameters survive', () => {
  expect(UNSPLASH_APPLICATION_ID).toBe('grid-image-gallery')
  const url = new URL(unsplashReferral('https://unsplash.com/@example?ixid=original&keep=yes&utm_source=old#bio'))
  expect(url.searchParams.get('ixid')).toBe('original'); expect(url.searchParams.get('keep')).toBe('yes')
  expect(url.searchParams.getAll('utm_source')).toEqual(['grid-image-gallery'])
  expect(url.searchParams.get('utm_medium')).toBe('referral'); expect(url.hash).toBe('#bio')
})
test.each(['https://evil.test/', 'https://unsplash.com.evil.test/', 'https://user:pass@unsplash.com/', 'http://unsplash.com/'])('rejects unsafe attribution destination %s', href => expect(() => unsplashReferral(href)).toThrow())
test('live card attributes photographer and Unsplash with links; Download remains available without automatic registration', () => {
  const onDownload = vi.fn()
  render(<ImageCard photo={normalizePhoto(providerPhoto())} onDownload={onDownload} />)
  const photographer = new URL(screen.getByRole('link', { name: 'Example Photographer' }).href)
  const unsplash = new URL(screen.getByRole('link', { name: 'on Unsplash' }).href)
  expect(photographer.pathname).toBe('/@example'); expect(photographer.searchParams.get('keep')).toBe('profile')
  for (const url of [photographer, unsplash]) {
    expect(url.searchParams.get('utm_source')).toBe('grid-image-gallery'); expect(url.searchParams.get('utm_medium')).toBe('referral')
  }
  const button = screen.getByRole('button', { name: /^Download photograph:/ })
  expect(button.disabled).toBe(false); expect(onDownload).not.toHaveBeenCalled()
  expect(screen.getByRole('status').textContent).toBe('Your browser handles saving after download registration.')
  expect(screen.queryByText('Photo source')).toBeNull(); expect(screen.queryByText('Open local image')).toBeNull()
  fireEvent.error(screen.getByRole('img'))
  expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Photograph unavailable')
  expect(screen.getByText('The photograph could not be displayed.')).not.toBeNull()
  expect(screen.getAllByRole('link')).toHaveLength(2)
})

test('provider source detection handles root URLs without mislabeling fixtures as live', () => {
  expect(isUnsplashPhoto({ user: { profileUrl: 'https://unsplash.com' } })).toBe(true)
  expect(isUnsplashPhoto({ user: { profileUrl: '/fixtures/mock/profile' } })).toBe(false)
  expect(isUnsplashPhoto({ user: { profileUrl: 'https://unsplash.com.evil.test/' } })).toBe(false)
})
