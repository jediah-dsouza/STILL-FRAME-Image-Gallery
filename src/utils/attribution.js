// Non-secret referral identifier, matching the package/app slug.
export const UNSPLASH_APPLICATION_ID = 'grid-image-gallery'
export function unsplashReferral(href) {
  const url = new URL(href)
  if (url.origin !== 'https://unsplash.com' || url.username || url.password || url.port) throw new Error('Invalid attribution URL')
  url.searchParams.set('utm_source', UNSPLASH_APPLICATION_ID)
  url.searchParams.set('utm_medium', 'referral')
  return url.href
}
export function isUnsplashPhoto(photo) {
  try { return new URL(photo.user.profileUrl).origin === 'https://unsplash.com' } catch { return false }
}
