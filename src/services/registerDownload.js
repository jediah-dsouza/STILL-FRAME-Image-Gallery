import { validDownloadLocation, validImageResource } from '../../shared/downloadPolicy.js'
import { DownloadError } from './downloadErrors.js'
const cancelled = () => new DOMException('Download cancelled.', 'AbortError')

export async function registerDownload({ photoId, downloadLocation, signal }) {
  if (signal?.aborted) throw cancelled()
  if (!validDownloadLocation(photoId, downloadLocation)) throw new DownloadError('registration')
  let response
  try {
    response = await fetch('/api/photos/download', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'omit', signal, body: JSON.stringify({ photoId, downloadLocation }),
    })
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw cancelled()
    throw new DownloadError('registration', 'network')
  }
  let body
  try { body = await response.json() } catch {
    if (signal?.aborted) throw cancelled()
    throw new DownloadError('registration')
  }
  if (signal?.aborted) throw cancelled()
  if (!response.ok) throw new DownloadError('registration', response.status === 429 ? 'rate-limit' : body?.error?.type)
  if (!validImageResource(body?.url)) throw new DownloadError('registration')
  return { url: body.url }
}

export const registerPhotoDownload = (photo, { signal } = {}) => registerDownload({
  photoId: photo.id, downloadLocation: photo.links.downloadLocation, signal,
})
