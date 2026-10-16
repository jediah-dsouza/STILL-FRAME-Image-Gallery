import { MAX_QUERY_LENGTH } from '../../shared/searchConfig.js'
import { normalizePhotoResponse } from '../utils/normalizePhoto.js'
import { PhotoSearchError } from './searchErrors.js'

/** Same-origin only; provider parsing stays at this boundary, not in components. */
export async function searchPhotos({ query, signal }) {
  if (signal?.aborted) throw new DOMException('Search cancelled.', 'AbortError')
  if (typeof query !== 'string' || !query.trim() || query.trim().length > MAX_QUERY_LENGTH) throw new PhotoSearchError('api')
  let response
  try {
    response = await fetch(`/api/photos/search?${new URLSearchParams({ query: query.trim() })}`, {
      method: 'GET', signal, headers: { Accept: 'application/json' }, credentials: 'omit',
    })
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw new DOMException('Search cancelled.', 'AbortError')
    throw new PhotoSearchError('network')
  }
  if (signal?.aborted) throw new DOMException('Search cancelled.', 'AbortError')
  let body
  try { body = await response.json() } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw new DOMException('Search cancelled.', 'AbortError')
    throw new PhotoSearchError('api')
  }
  if (signal?.aborted) throw new DOMException('Search cancelled.', 'AbortError')
  if (!response.ok) {
    if ([401, 403].includes(response.status) || (response.status === 503 && body?.error?.type === 'auth')) throw new PhotoSearchError('auth')
    if (response.status === 429) throw new PhotoSearchError('rate-limit')
    if (body?.error?.type === 'auth') throw new PhotoSearchError('auth')
    if (body?.error?.type === 'network') throw new PhotoSearchError('network')
    if (body?.error?.type === 'unknown') throw new PhotoSearchError('unknown')
    throw new PhotoSearchError('api')
  }
  try {
    const photos = normalizePhotoResponse(body)
    if (new Set(photos.map(photo => photo.id)).size !== photos.length) throw new PhotoSearchError('api')
    return { photos }
  } catch { throw new PhotoSearchError('api') }
}
