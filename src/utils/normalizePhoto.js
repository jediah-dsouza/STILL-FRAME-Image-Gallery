/**
 * The only component-facing photo shape. Fixtures already use this contract;
 * future provider records are normalized once by the service, never in React.
 *
 * @typedef {Object} GalleryPhoto
 * @property {string} id
 * @property {number} width
 * @property {number} height
 * @property {string|null} color
 * @property {string|null} description
 * @property {string|null} altDescription
 * @property {{regular: string, small: string, thumb: string}} urls
 * @property {{html: string, download: string, downloadLocation: string}} links
 * @property {{name: string, username: string, profileUrl: string}} user
 */

const liveOrigins = {
  image: ['https://images.unsplash.com', 'https://plus.unsplash.com'],
  source: ['https://unsplash.com'],
  registration: ['https://api.unsplash.com'],
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const hasText = value => typeof value === 'string' && value.trim().length > 0
const optionalText = value => hasText(value) ? value : null
const positiveDimension = value => typeof value === 'number' && Number.isFinite(value) && value > 0

function usableUrl(value, kind) {
  if (!hasText(value) || value !== value.trim()) return false

  // Fixture-only root paths cannot become external URLs or traversal requests.
  if (value.startsWith('/fixtures/')) {
    return /^\/fixtures\/(?:photos|mock)\/[a-zA-Z0-9/_-]+(?:\.webp)?$/.test(value)
      && !value.includes('//')
  }

  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && !url.username && !url.password && !url.port
      && liveOrigins[kind].includes(url.origin)
  } catch {
    return false
  }
}

/**
 * Pure projection of the minimum Unsplash-like record; returns null when
 * identity, dimensions, imagery, attribution or download data is unusable.
 * URL strings are returned unchanged, including their query parameters.
 * Live origin/path policy must be reverified before Phase 9 integration.
 *
 * @param {unknown} rawPhoto
 * @returns {GalleryPhoto|null}
 */
export function normalizePhoto(rawPhoto) {
  if (!isObject(rawPhoto) || !hasText(rawPhoto.id)
    || !positiveDimension(rawPhoto.width) || !positiveDimension(rawPhoto.height)
    || !isObject(rawPhoto.urls) || !isObject(rawPhoto.links)
    || !isObject(rawPhoto.user) || !isObject(rawPhoto.user.links)) return null

  const { urls, links, user } = rawPhoto
  const fallback = [urls.regular, urls.small, urls.thumb].find(url => usableUrl(url, 'image'))
  if (!fallback || !hasText(user.name) || !hasText(user.username)
    || !usableUrl(user.links.html, 'source') || !usableUrl(links.html, 'source')
    || !usableUrl(links.download, 'source')
    || !usableUrl(links.download_location, 'registration')) return null

  if (!links.download_location.startsWith('/fixtures/')) {
    const registration = new URL(links.download_location)
    try {
      if (registration.hash
        || registration.pathname !== `/photos/${encodeURIComponent(rawPhoto.id)}/download`) return null
    } catch {
      return null
    }
  }

  return {
    id: rawPhoto.id,
    width: rawPhoto.width,
    height: rawPhoto.height,
    color: optionalText(rawPhoto.color),
    description: optionalText(rawPhoto.description),
    altDescription: optionalText(rawPhoto.alt_description),
    urls: {
      regular: usableUrl(urls.regular, 'image') ? urls.regular : fallback,
      small: usableUrl(urls.small, 'image') ? urls.small : fallback,
      thumb: usableUrl(urls.thumb, 'image') ? urls.thumb : fallback,
    },
    links: {
      html: links.html,
      download: links.download,
      downloadLocation: links.download_location,
    },
    user: { name: user.name, username: user.username, profileUrl: user.links.html },
  }
}

/** Safe domain error, not a raw provider payload or future UI component. */
export class PhotoDataError extends Error {
  constructor(reason) {
    super('Photo data could not be read.')
    this.name = 'PhotoDataError'
    this.code = 'api'
    this.reason = reason
  }
}

/**
 * Receives an extracted records array, not an API envelope. A future service
 * must validate/extract its envelope first; objects are never coerced to [].
 *
 * @param {unknown} rawPhotos
 * @returns {GalleryPhoto[]}
 * @throws {PhotoDataError}
 */
export function normalizePhotoCollection(rawPhotos) {
  if (!Array.isArray(rawPhotos)) throw new PhotoDataError('invalid-collection')
  const photos = rawPhotos.map(normalizePhoto).filter(photo => photo !== null)
  if (rawPhotos.length > 0 && photos.length === 0) throw new PhotoDataError('all-malformed')
  return photos
}

/** Pure validation of the provider-shaped search envelope, with no fetching. */
export function normalizePhotoResponse(rawResponse) {
  if (!isObject(rawResponse) || !Array.isArray(rawResponse.results)) {
    throw new PhotoDataError('invalid-envelope')
  }
  return normalizePhotoCollection(rawResponse.results)
}
