export default function GallerySkeleton() {
  return (
    <div className="gallery-skeleton" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="skeleton-photo" key={index}>
          <div className="skeleton-media" />
          <div className="skeleton-caption"><span /><span /></div>
        </div>
      ))}
    </div>
  )
}
