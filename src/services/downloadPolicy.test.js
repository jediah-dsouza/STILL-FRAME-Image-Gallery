import { expect, test } from 'vitest'
import { validDownloadLocation, validImageResource } from '../../shared/downloadPolicy.js'
test('valid registration URLs keep provided ixid encoding and permit its documented absence', () => {
  expect(validDownloadLocation('abc-_1', 'https://api.unsplash.com/photos/abc-_1/download?ixid=a%2Bb%2Fc%3D')).toBe(true)
  expect(validDownloadLocation('abc', 'https://api.unsplash.com/photos/abc/download')).toBe(true)
})
test.each(['https://images.unsplash.com/photo-1?ixid=test&dl=name.jpg', 'https://plus.unsplash.com/premium_photo-1?ixid=retained'])('permits intended CDN resources %s', url => expect(validImageResource(url)).toBe(true))
test.each(['https://images.unsplash.com/', 'https://user@images.unsplash.com/photo-1', 'https://images.unsplash.com:444/photo-1', 'https://images.unsplash.com/photo-1#fragment', 'https://images.unsplash.com.evil.test/photo', 'https://images.unsplash.com/photo?Authorization=private', 'https://api.unsplash.com/photos/1/download'])('rejects unsafe delivery destination %s', url => expect(validImageResource(url)).toBe(false))
