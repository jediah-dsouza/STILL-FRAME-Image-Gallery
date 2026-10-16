import { MAX_QUERY_LENGTH } from '../shared/searchConfig.js'

const ENDPOINT = 'https://api.unsplash.com/search/photos'
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024
const MAX_CONCURRENT = 4
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
})
const failure = (type, status) => json({ error: { type } }, status)
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value, max = 4096) => typeof value === 'string' && value.length <= max ? value : null

// Whitelist primitives only: never return provider headers, errors or full objects.
function selectPhoto(photo) {
  if (!object(photo)) return null
  return {
    id: text(photo.id, 200),
    width: typeof photo.width === 'number' ? photo.width : null,
    height: typeof photo.height === 'number' ? photo.height : null,
    color: typeof photo.color === 'string' && /^#[a-f\d]{6}$/i.test(photo.color) ? photo.color : null,
    description: text(photo.description, 2000),
    alt_description: text(photo.alt_description, 2000),
    urls: { regular: text(photo.urls?.regular), small: text(photo.urls?.small), thumb: text(photo.urls?.thumb) },
    links: { html: text(photo.links?.html), download: text(photo.links?.download), download_location: text(photo.links?.download_location) },
    user: { name: text(photo.user?.name, 200), username: text(photo.user?.username, 200), links: { html: text(photo.user?.links?.html) } },
  }
}

export async function readJson(response, maxBytes = MAX_RESPONSE_BYTES) {
  if (Number(response.headers.get('content-length')) > maxBytes) {
    await response.body?.cancel()
    throw new Error('Invalid response')
  }
  if (!response.body) throw new Error('Invalid response')
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw new Error('Invalid response')
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return JSON.parse(new TextDecoder().decode(bytes))
}

// Only recognizable quota evidence changes a 403; ambiguous/permission failures stay auth.
export async function isQuotaExhausted(response) {
  const limit = response.headers.get('x-ratelimit-limit')?.trim() ?? ''
  const remaining = response.headers.get('x-ratelimit-remaining')?.trim()
  if (/^\d{1,10}$/.test(limit) && Number(limit) > 0 && remaining === '0') {
    await response.body?.cancel()
    return true
  }
  try {
    const body = await readJson(response, 8192)
    return Array.isArray(body?.errors) && body.errors.length <= 10
      && body.errors.some(error => typeof error === 'string' && error.length <= 128
        && /^rate limit exceeded[.!]?$/i.test(error.trim()))
  } catch {
    // Malformed/oversized/unrecognized bodies are never exposed or assumed to be quota.
    return false
  }
}

/** Fixed-purpose, host-neutral Web Request/Response search boundary. No image proxy or Download handler. */
export function createUnsplashSearchHandler({ getAccessKey = () => '', fetchImpl = (...args) => fetch(...args), timeoutMs = 10000 } = {}) {
  let active = 0
  return async function search(request) {
    if (request.method !== 'GET') {
      const response = failure('api', 405)
      response.headers.set('Allow', 'GET')
      return response
    }
    const input = new URL(request.url)
    const terms = input.searchParams.getAll('query')
    if (input.pathname !== '/api/photos/search' || [...input.searchParams.keys()].some(key => key !== 'query')
      || terms.length !== 1 || !terms[0].trim() || terms[0].trim().length > MAX_QUERY_LENGTH) return failure('api', 400)
    const key = getAccessKey()
    if (typeof key !== 'string' || !key.trim() || key.trim() === 'YOUR_UNSPLASH_ACCESS_KEY') return failure('auth', 503)
    if (request.signal.aborted) return failure('network', 499)
    if (active >= MAX_CONCURRENT) return failure('rate-limit', 429)
    const url = new URL(ENDPOINT)
    url.searchParams.set('query', terms[0].trim())
    url.searchParams.set('page', '1')
    url.searchParams.set('per_page', '24')
    const timeout = new AbortController()
    const timer = setTimeout(() => timeout.abort(), timeoutMs)
    const signal = AbortSignal.any([request.signal, timeout.signal])
    active += 1
    try {
      const response = await fetchImpl(url, {
        method: 'GET', headers: { Authorization: `Client-ID ${key.trim()}`, 'Accept-Version': 'v1', Accept: 'application/json' },
        signal, redirect: 'error',
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
      let body
      try { body = await readJson(response) } catch { return failure(signal.aborted ? 'network' : 'api', 502) }
      if (!object(body) || !Array.isArray(body.results) || body.results.length > 30) return failure('api', 502)
      const results = body.results.map(selectPhoto)
      // Reject unexpected credential reflection even in an ostensibly successful response.
      if (JSON.stringify(results).includes(key.trim())) return failure('api', 502)
      return json({ results })
    } catch {
      // Never echo exception text, Authorization, provider errors, or configuration.
      return failure('network', 502)
    } finally {
      active -= 1
      clearTimeout(timer)
    }
  }
}
