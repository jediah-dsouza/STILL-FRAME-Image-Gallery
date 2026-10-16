// Public URL validation only. Never put server credentials in this shared module.
export function validDownloadLocation(photoId, value) {
  if (typeof photoId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(photoId)
    || typeof value !== 'string' || value.length > 4096 || value !== value.trim()) return false
  try {
    const url = new URL(value)
    const match = url.pathname.match(/^\/photos\/([A-Za-z0-9_-]{1,128})\/download$/)
    if (url.origin !== 'https://api.unsplash.com' || url.username || url.password || url.port || url.hash
      || !match || match[1] !== photoId || value.split('?')[0] !== `https://api.unsplash.com${url.pathname}`) return false
    // Current official examples specify ixid. Reject new/unknown parameters, never silently strip tracking.
    return [...url.searchParams.keys()].every(name => name === 'ixid')
      && url.searchParams.getAll('ixid').length <= 1
      && (!url.searchParams.has('ixid') || (/^[A-Za-z0-9_+=/-]{1,2048}$/.test(url.searchParams.get('ixid'))))
  } catch { return false }
}

export function validImageResource(value) {
  if (typeof value !== 'string' || value.length > 4096 || value !== value.trim()) return false
  try {
    const url = new URL(value)
    return ['https://images.unsplash.com', 'https://plus.unsplash.com'].includes(url.origin)
      && !url.username && !url.password && !url.port && !url.hash && url.pathname !== '/'
      && ![...url.searchParams.keys()].some(name => /^(client_id|access_key|secret_key|authorization)$/i.test(name))
  } catch { return false }
}
