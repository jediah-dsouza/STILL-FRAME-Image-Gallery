import { validImageResource } from '../../shared/downloadPolicy.js'
import { DownloadError } from '../services/downloadErrors.js'
const MAX_BYTES = 64 * 1024 * 1024
const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }

/** Direct browser-to-CDN image transfer, then a native Blob download; never a server image relay. */
export async function downloadImage(url, { photoId, signal } = {}) {
  if (!validImageResource(url)) throw new DownloadError('delivery')
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), 30000)
  const combined = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal
  const check = () => { if (combined.aborted) throw new DOMException('Download cancelled.', 'AbortError') }
  let reader, objectUrl
  try {
    check()
    const response = await fetch(url, { signal: combined, mode: 'cors', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' })
    if (!response.ok || !response.body) { await response.body?.cancel(); throw new DownloadError('delivery') }
    const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
    if (!Object.hasOwn(types, type) || Number(response.headers.get('content-length')) > MAX_BYTES) {
      await response.body.cancel()
      throw new DownloadError('delivery')
    }
    reader = response.body.getReader()
    const chunks = []
    let size = 0
    while (true) {
      check()
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) { await reader.cancel(); throw new DownloadError('delivery') }
      chunks.push(value)
    }
    check()
    if (!size) throw new DownloadError('delivery')
    objectUrl = URL.createObjectURL(new Blob(chunks, { type }))
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `stillframe-${String(photoId || 'photo').replace(/[^a-zA-Z0-9_-]/g, '').slice(0,128)}.${types[type]}`
    anchor.hidden = true
    document.body.append(anchor)
    try { check(); anchor.click() } finally { anchor.remove() }
    // Keep the object URL alive while the browser consumes it, then release memory.
    const prepared = objectUrl
    setTimeout(() => URL.revokeObjectURL(prepared), 60000)
    objectUrl = null
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Download cancelled.', 'AbortError')
    if (error instanceof DownloadError) throw error
    throw new DownloadError('delivery')
  } finally {
    clearTimeout(timer)
    reader?.releaseLock()
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}
