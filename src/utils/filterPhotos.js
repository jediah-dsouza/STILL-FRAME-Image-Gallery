/** Pure, order-preserving matching over normalized display/credit text only. */
export function filterPhotos(photos, query) {
  const term = query.trim().toLowerCase()
  if (!term) return photos
  return photos.filter(photo => [
    photo.description, photo.altDescription, photo.user.name, photo.user.username,
  ].some(text => text?.toLowerCase().includes(term)))
}
