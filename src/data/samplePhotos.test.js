// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect, test } from 'vitest'
import { samplePhotos } from './samplePhotos.js'
import { imageFailurePhoto } from './imageFailurePhoto.js'

const fixtureRoot = new URL('../../public/fixtures/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('provenance.json', fixtureRoot), 'utf8'))
const nonblank = value => typeof value === 'string' && value.trim().length > 0

function expectGalleryPhoto(photo) {
  expect(Object.keys(photo).sort()).toEqual([
    'altDescription', 'color', 'description', 'height', 'id', 'links', 'urls', 'user', 'width',
  ])
  expect(nonblank(photo.id)).toBe(true)
  expect(Number.isFinite(photo.width) && photo.width > 0).toBe(true)
  expect(Number.isFinite(photo.height) && photo.height > 0).toBe(true)
  for (const key of ['color', 'description', 'altDescription']) {
    expect(photo[key] === null || typeof photo[key] === 'string').toBe(true)
  }
  expect(Object.keys(photo.urls).sort()).toEqual(['regular', 'small', 'thumb'])
  expect(Object.keys(photo.links).sort()).toEqual(['download', 'downloadLocation', 'html'])
  expect(Object.keys(photo.user).sort()).toEqual(['name', 'profileUrl', 'username'])
  for (const group of [photo.urls, photo.links, photo.user]) {
    expect(Object.values(group).every(nonblank)).toBe(true)
  }
}

test('exports ten already-normalized GalleryPhoto records with unique identities', () => {
  expect(samplePhotos).toHaveLength(10)
  expect(new Set(samplePhotos.map(photo => photo.id)).size).toBe(10)
  samplePhotos.forEach(expectGalleryPhoto)
  expect(samplePhotos.some(photo => 'alt_description' in photo || 'download_location' in photo.links)).toBe(false)
})

test('representative dimension/orientation and optional-content cases actually exist', () => {
  expect(samplePhotos.some(photo => photo.width > photo.height)).toBe(true)
  expect(samplePhotos.some(photo => photo.height / photo.width > 1.4)).toBe(true)
  expect(samplePhotos.some(photo => Math.abs(photo.width / photo.height - 1) < 0.02)).toBe(true)
  expect(samplePhotos.some(photo => photo.width / photo.height > 1.7)).toBe(true)
  expect(new Set(samplePhotos.map(photo => `${photo.width}x${photo.height}`)).size).toBeGreaterThan(5)
  expect(samplePhotos.some(photo => photo.user.name.length >= 45)).toBe(true)
  expect(samplePhotos.some(photo => photo.user.name.length <= 4)).toBe(true)
  expect(samplePhotos.some(photo => photo.description === null)).toBe(true)
  expect(samplePhotos.some(photo => photo.altDescription === null)).toBe(true)
  expect(samplePhotos.some(photo => photo.color === null)).toBe(true)
  expect(new Set(samplePhotos.map(photo => photo.color)).size).toBeGreaterThan(5)
})

test.each(samplePhotos.map(photo => [photo.id, photo]))('%s uses existing local WebP bytes with recorded provenance/hash/dimensions', (id, photo) => {
  const source = manifest.find(record => id === `sample-${record.id.toLowerCase()}`)
  expect(source).toBeDefined()
  expect(source.width).toBe(photo.width)
  expect(source.height).toBe(photo.height)
  expect(source.sourceCredit).toMatch(/^NASA/)
  expect(source.usageGuidelines).toBe('https://www.nasa.gov/nasa-brand-center/images-and-media/')
  for (const url of Object.values(photo.urls)) {
    expect(url).toBe(`/fixtures/${source.file}`)
    const bytes = readFileSync(new URL(`../../public${url}`, import.meta.url))
    expect(bytes.subarray(0, 4).toString()).toBe('RIFF')
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256)
  }
  expect(photo.links.download).toBe(photo.urls.regular)
  expect(photo.links.html.startsWith('/fixtures/mock/photos/')).toBe(true)
  expect(photo.links.downloadLocation.startsWith('/fixtures/mock/photos/')).toBe(true)
  expect(photo.user.profileUrl.startsWith('/fixtures/mock/photographers/')).toBe(true)
})

test('image-failure record is opt-in, canonical and deterministically absent from successful assets', () => {
  expectGalleryPhoto(imageFailurePhoto)
  expect(samplePhotos.some(photo => photo.id === imageFailurePhoto.id)).toBe(false)
  expect(samplePhotos.some(photo => photo.urls.regular === imageFailurePhoto.urls.regular)).toBe(false)
  expect(new Set(Object.values(imageFailurePhoto.urls)).size).toBe(1)
  expect(imageFailurePhoto.urls.regular).toBe('/fixtures/photos/intentionally-missing.webp')
  expect(existsSync(new URL(`../../public${imageFailurePhoto.urls.regular}`, import.meta.url))).toBe(false)
  expect(imageFailurePhoto.description).toBeNull()
  expect(imageFailurePhoto.altDescription).toBeNull()
})
