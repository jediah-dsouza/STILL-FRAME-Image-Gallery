import { samplePhotos } from '../data/samplePhotos.js'
import { filterPhotos } from '../utils/filterPhotos.js'

import { DEFAULT_QUERY } from '../../shared/searchConfig.js'
export { DEFAULT_QUERY } from '../../shared/searchConfig.js'

/**
 * Sample-only request boundary: deterministic 600ms latency, no network.
 * The default nature scenario represents the approved full local collection.
 * @param {{query: string, signal?: AbortSignal}} request
 * @returns {Promise<{photos: import('../utils/normalizePhoto.js').GalleryPhoto[]}>}
 */
export function searchPhotos({ query, signal }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Sample search cancelled.', 'AbortError'))
      return
    }
    if (typeof query !== 'string' || !query.trim()) {
      reject(new Error('A nonblank sample query is required.'))
      return
    }
    function handleAbort() {
      clearTimeout(timer)
      signal.removeEventListener('abort', handleAbort)
      reject(new DOMException('Sample search cancelled.', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      const photos = query.trim().toLowerCase() === DEFAULT_QUERY
        ? samplePhotos : filterPhotos(samplePhotos, query)
      resolve({ photos })
    }, 600)
    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}
