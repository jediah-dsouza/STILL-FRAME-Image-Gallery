import ImageCard from './ImageCard.jsx'

/**
 * @param {{photos: import('../../utils/normalizePhoto.js').GalleryPhoto[],
 * onDownload: (photo: import('../../utils/normalizePhoto.js').GalleryPhoto) => Promise<{url: string}>}} props
 */
export default function ImageGrid({ photos, onDownload }) {
  return (
    <div className="image-grid">
      {photos.map((photo, index) => (
        <ImageCard
          key={photo.id}
          photo={photo}
          onDownload={onDownload}
          loading={index < 2 ? 'eager' : 'lazy'}
        />
      ))}
    </div>
  )
}
