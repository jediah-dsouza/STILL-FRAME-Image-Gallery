import { validDownloadLocation, validImageResource } from '../shared/downloadPolicy.js'
import { isQuotaExhausted, readJson } from './unsplashSearch.js'
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
})
const failure = (type, status) => json({ error: { type } }, status)

/** Registration only: use the returned location unchanged; never fetch image bytes here. */
export function createUnsplashDownloadHandler({ getAccessKey = () => '', fetchImpl = (...args) => fetch(...args), timeoutMs = 10000 } = {}) {
  let active = 0
  return async request => {
    if (request.method !== 'POST') {
      const response = failure('api', 405)
      response.headers.set('Allow', 'POST')
      return response
    }
    const url = new URL(request.url)
    if (url.pathname !== '/api/photos/download' || url.search) return failure('api', 400)
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return failure('api', 415)
    let body
    try { body = await readJson(request, 8192) } catch { return failure('api', 400) }
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).some(name => !['photoId', 'downloadLocation'].includes(name))
      || !validDownloadLocation(body.photoId, body.downloadLocation)) return failure('api', 400)
    const key = getAccessKey()
    if (typeof key !== 'string' || !key.trim() || key.trim() === 'YOUR_UNSPLASH_ACCESS_KEY') return failure('auth', 503)
    if (request.signal.aborted) return failure('network', 499)
    if (active >= 4) return failure('rate-limit', 429)
    const timeout = new AbortController()
    const timer = setTimeout(() => timeout.abort(), timeoutMs)
    const signal = AbortSignal.any([request.signal, timeout.signal])
    active += 1
    try {
      const response = await fetchImpl(body.downloadLocation, {
        method: 'GET', signal, redirect: 'error',
        headers: { Authorization: `Client-ID ${key.trim()}`, 'Accept-Version': 'v1', Accept: 'application/json' },
      })
      if (response.status === 403) {
        const quota = await isQuotaExhausted(response)
        if (signal.aborted) return failure('network', 502)
        return quota ? failure('rate-limit', 429) : failure('auth', 502)
      }
      if (!response.ok) await response.body?.cancel()
      if (response.status === 401) return failure('auth', 502)
      if (response.status === 429) return failure('rate-limit', 429)
      if (!response.ok) return failure('api', 502)
      let result
      try { result = await readJson(response, 16384) } catch { return failure(signal.aborted ? 'network' : 'api', 502) }
      if (!validImageResource(result?.url) || result.url.includes(key.trim())) return failure('api', 502)
      return json({ url: result.url })
    } catch { return failure('network', 502) } finally {
      active -= 1
      clearTimeout(timer)
    }
  }
}
