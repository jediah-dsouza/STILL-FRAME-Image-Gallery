// @vitest-environment node
import { expect, test } from 'vitest'
import { normalizePhoto, normalizePhotoCollection, normalizePhotoResponse, PhotoDataError } from './normalizePhoto.js'

function rawPhoto() {
  return {
    id: 'photo-1', width: 1200, height: 800, color: '#918477',
    description: 'Mountain lake', alt_description: 'Mountains above a lake',
    urls: {
      regular: 'https://images.unsplash.com/photo-1?ixid=keep-me&w=1200',
      small: 'https://images.unsplash.com/photo-1?ixid=keep-me&w=400',
      thumb: 'https://images.unsplash.com/photo-1?ixid=keep-me&w=100',
    },
    links: {
      html: 'https://unsplash.com/photos/photo-1?utm_source=fixture&utm_medium=referral',
      download: 'https://unsplash.com/photos/photo-1/download?ixid=keep-me',
      download_location: 'https://api.unsplash.com/photos/photo-1/download?ixid=keep-me',
    },
    user: {
      name: 'Example Contributor', username: 'example',
      links: { html: 'https://unsplash.com/@example?utm_source=fixture&utm_medium=referral' },
    },
    ignored: 'not part of the UI contract',
  }
}

test('projects every required field and preserves exact URL strings/parameters', () => {
  const raw = rawPhoto()
  expect(normalizePhoto(raw)).toEqual({
    id: raw.id, width: 1200, height: 800, color: '#918477',
    description: 'Mountain lake', altDescription: 'Mountains above a lake',
    urls: raw.urls,
    links: { html: raw.links.html, download: raw.links.download, downloadLocation: raw.links.download_location },
    user: { name: raw.user.name, username: raw.user.username, profileUrl: raw.user.links.html },
  })
})

test('does not mutate a deeply frozen input or retain mutable nested references', () => {
  const raw = rawPhoto()
  const snapshot = structuredClone(raw)
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze)
      Object.freeze(value)
    }
  }
  freeze(raw)
  const result = normalizePhoto(raw)
  expect(raw).toEqual(snapshot)
  expect(result.urls).not.toBe(raw.urls)
  expect(result.links).not.toBe(raw.links)
  expect(result.user).not.toBe(raw.user)
})

test.each([null, undefined, '', '   ', 17])('nullable optional text %s becomes null without invented content', value => {
  const raw = rawPhoto()
  raw.description = value
  raw.alt_description = value
  raw.color = value
  const result = normalizePhoto(raw)
  expect([result.description, result.altDescription, result.color]).toEqual([null, null, null])
})

test('preserves supplied optional text instead of trimming or inventing it', () => {
  const raw = rawPhoto()
  raw.description = '  Actual source text  '
  expect(normalizePhoto(raw).description).toBe(raw.description)
})

test.each([null, undefined, {}, [], 'invalid'])('invalid record %s returns null', raw => {
  expect(normalizePhoto(raw)).toBeNull()
})

test.each(['', ' ', null, 1])('malformed identity %s is rejected', value => {
  expect(normalizePhoto({ ...rawPhoto(), id: value })).toBeNull()
})

test('an unencodable malformed identity returns null rather than leaking an exception', () => {
  expect(normalizePhoto({ ...rawPhoto(), id: '\uD800' })).toBeNull()
})

test.each([0, -1, Infinity, NaN, '1200', null])('invalid positive dimensions %s are rejected', value => {
  expect(normalizePhoto({ ...rawPhoto(), width: value })).toBeNull()
  expect(normalizePhoto({ ...rawPhoto(), height: value })).toBeNull()
})

test('missing image variants fall back to another validated variant', () => {
  const raw = rawPhoto()
  raw.urls = { small: raw.urls.small, regular: 'javascript:alert(1)' }
  expect(normalizePhoto(raw).urls).toEqual({
    regular: raw.urls.small, small: raw.urls.small, thumb: raw.urls.small,
  })
})

test.each([
  'http://images.unsplash.com/a', 'javascript:alert(1)', 'https://evil.example/a',
  'https://images.unsplash.com.evil.example/a', 'https://user:pass@images.unsplash.com/a',
  'https://images.unsplash.com:444/a', '//images.unsplash.com/a', '/fixtures/photos/../secret',
])('rejects unapproved/unsafe image URLs: %s', url => {
  expect(normalizePhoto({ ...rawPhoto(), urls: { regular: url } })).toBeNull()
})

test.each([
  ['user', null], ['user.name', ''], ['user.username', null], ['user.links', {}],
  ['links.html', null], ['links.download', ''], ['links.download_location', null],
  ['user.links.html', 'https://evil.example/profile'],
  ['links.download_location', 'https://api.unsplash.com/photos/another/download'],
  ['links.download_location', 'https://api.unsplash.com/photos/photo-1/download#fragment'],
  ['links.download_location', 'https://user:pass@api.unsplash.com/photos/photo-1/download'],
])('rejects missing/invalid attribution or download field %s', (path, value) => {
  const raw = rawPhoto()
  const keys = path.split('.')
  let target = raw
  keys.slice(0, -1).forEach(key => { target = target[key] })
  target[keys.at(-1)] = value
  expect(normalizePhoto(raw)).toBeNull()
})

test('explicit local fixture paths are allowed without any browser or network dependency', () => {
  const raw = rawPhoto()
  raw.urls = { regular: '/fixtures/photos/local.webp' }
  raw.links = {
    html: '/fixtures/mock/photos/local',
    download: '/fixtures/photos/local.webp',
    download_location: '/fixtures/mock/photos/local/download',
  }
  raw.user.links.html = '/fixtures/mock/photographers/local'
  expect(normalizePhoto(raw)).not.toBeNull()
})

test('mixed collection skips malformed records and preserves valid order', () => {
  const first = rawPhoto()
  const second = { ...rawPhoto(), id: 'photo-2', links: { ...rawPhoto().links, download_location: 'https://api.unsplash.com/photos/photo-2/download' } }
  expect(normalizePhotoCollection([null, first, {}, second]).map(photo => photo.id)).toEqual(['photo-1', 'photo-2'])
})

test('valid zero-record collection is empty, not an error', () => {
  expect(normalizePhotoCollection([])).toEqual([])
})

test.each([null, undefined, {}, { results: [] }, { results: null }, 'invalid'])('rejects non-array collection input %s as api data error', value => {
  expect(() => normalizePhotoCollection(value)).toThrow(PhotoDataError)
  try { normalizePhotoCollection(value) } catch (error) {
    expect(error.code).toBe('api')
    expect(error.reason).toBe('invalid-collection')
  }
})

test('nonempty all-malformed collection is an api error, not a deceptive empty result', () => {
  expect(() => normalizePhotoCollection([null, {}, { id: 'broken' }])).toThrow(PhotoDataError)
  try { normalizePhotoCollection([null]) } catch (error) {
    expect(error.code).toBe('api')
    expect(error.reason).toBe('all-malformed')
  }
})

test('valid provider envelopes retain the empty/mixed/all-malformed distinction', () => {
  expect(normalizePhotoResponse({ results: [] })).toEqual([])
  expect(normalizePhotoResponse({ results: [null, rawPhoto()] })).toHaveLength(1)
  expect(() => normalizePhotoResponse({ results: [{}] })).toThrow(PhotoDataError)
})

test.each([null, [], {}, { results: null }, { results: 'invalid' }])('invalid response envelope %s never masquerades as empty', value => {
  expect(() => normalizePhotoResponse(value)).toThrow(PhotoDataError)
  try { normalizePhotoResponse(value) } catch (error) {
    expect(error.code).toBe('api')
    expect(error.reason).toBe('invalid-envelope')
  }
})
