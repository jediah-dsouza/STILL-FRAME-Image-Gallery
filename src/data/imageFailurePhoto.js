import { samplePhotos } from './samplePhotos.js'

// Separate opt-in fixture; deliberately absent bytes produce an image decode
// failure even when the development server's SPA fallback returns HTTP 200.
/** @type {import('../utils/normalizePhoto.js').GalleryPhoto} */
export const imageFailurePhoto = {
  ...samplePhotos[0],
  id: 'sample-image-failure',
  description: null,
  altDescription: null,
  urls: {
    regular: '/fixtures/photos/intentionally-missing.webp',
    small: '/fixtures/photos/intentionally-missing.webp',
    thumb: '/fixtures/photos/intentionally-missing.webp',
  },
  links: {
    html: '/fixtures/mock/photos/sample-image-failure',
    download: samplePhotos[0].links.download,
    downloadLocation: '/fixtures/mock/photos/sample-image-failure/download',
  },
  user: { ...samplePhotos[0].user },
}
