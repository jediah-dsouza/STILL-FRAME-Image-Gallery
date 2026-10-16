/**
 * Phase 4 review only: no registration, fetch, navigation or file save.
 * The delay makes the card's busy/guard behavior observable; it is not a mock
 * search/request service. Future live work requires a separately approved adapter.
 *
 * @param {import('../utils/normalizePhoto.js').GalleryPhoto} photo
 * @param {{fail?: boolean}} options
 * @returns {Promise<{url: string}>}
 */
export function mockCardDownload(photo, { fail = false } = {}) {
  const localUrl = photo.links.download
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail || !/^\/fixtures\/photos\/[a-z0-9_-]+\.webp$/.test(localUrl)) {
        reject(new Error('Sample preparation failed.'))
      } else {
        resolve({ url: localUrl })
      }
    }, 700)
  })
}
