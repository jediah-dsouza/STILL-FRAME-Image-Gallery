const messages = {
  network: ['Photographs could not be reached. Try again.', true],
  auth: ['Photo service access is unavailable. Check the server configuration.', false],
  'rate-limit': ['The photo request limit was reached. Wait before trying again.', true],
  api: ['Photographs could not be loaded. Try again.', true],
  unknown: ['Something went wrong loading photographs. Try again.', true],
}
export function searchError(type = 'unknown') {
  const safeType = Object.hasOwn(messages, type) ? type : 'unknown'
  const [message, retryable] = messages[safeType]
  return { type: safeType, message, retryable }
}
export class PhotoSearchError extends Error {
  constructor(type) {
    const safe = searchError(type)
    super(safe.message)
    this.name = 'PhotoSearchError'
    Object.assign(this, safe)
  }
}
// Arbitrary service errors never become user-visible provider details.
export const toSearchError = error => searchError(error instanceof PhotoSearchError ? error.type : 'api')
