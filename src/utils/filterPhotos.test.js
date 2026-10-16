// @vitest-environment node
import { expect, test } from 'vitest'
import { filterPhotos } from './filterPhotos.js'
import { samplePhotos } from '../data/samplePhotos.js'

test.each([
  ['glacier', [0, 1]], ['  GLACIER  ', [0, 1]], ['STEReO', [2]],
  ['airtanker', [2]], ['river', [3]], ['shadow', [7]], ['Jim Ross', [0, 1]],
  ['nasa-joel-kowsky', [2]], ['NASA', [0,1,2,3,4,5,6,7,8,9]],
  ['earth', [6, 9]], ['zz-no-match', []], ['sample-', []],
  ['/fixtures/photos/', []], ['1280', []], ['.*', []],
])('matches only meaningful normalized text: %s', (query, indices) => {
  expect(filterPhotos(samplePhotos, query)).toEqual(indices.map(i => samplePhotos[i]))
})

test('empty/default filter preserves the supplied collection and empty collections are safe', () => {
  expect(filterPhotos(samplePhotos, '   ')).toBe(samplePhotos)
  expect(filterPhotos([], 'earth')).toEqual([])
})

test('preserves source order and references without mutating frozen input', () => {
  const photos = structuredClone(samplePhotos)
  const before = structuredClone(photos)
  for (const photo of photos) {
    for (const value of Object.values(photo)) if (value && typeof value === 'object') Object.freeze(value)
    Object.freeze(photo)
  }
  Object.freeze(photos)
  const result = filterPhotos(photos, 'earth')
  expect(result).toEqual([photos[6], photos[9]])
  expect(result[0]).toBe(photos[6])
  expect(photos).toEqual(before)
})
