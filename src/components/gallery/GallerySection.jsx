import { registerPhotoDownload } from '../../services/registerDownload.js'
import { DEFAULT_QUERY } from '../../../shared/searchConfig.js'
import { searchError } from '../../services/searchErrors.js'
import ImageGrid from './ImageGrid.jsx'
import GallerySkeleton from './GallerySkeleton.jsx'
import EmptyState from './EmptyState.jsx'
import ErrorState from './ErrorState.jsx'

export default function GallerySection({ photos, status, error, submittedQuery, onRetry, sampleMode = false, onDownload }) {
  const safeError = searchError(error?.type === undefined ? 'api' : error.type)
  let context = sampleMode ? 'Searching local photographs…' : 'Searching photographs…'
  if (status === 'success' || status === 'empty') {
    const count = `${photos.length} ${photos.length === 1 ? 'image' : 'images'} shown`
    context = sampleMode && submittedQuery.toLowerCase() === DEFAULT_QUERY
      ? `${count} · Local sample collection.` : `${count} for “${submittedQuery}”.`
  } else if (status === 'error') {
    context = sampleMode ? (error?.retryable ? 'Sample search could not be completed. Try again.' : 'Sample search could not be completed.') : safeError.message
  }
  return (
    <section className="gallery-section" aria-labelledby="gallery-heading">
      <div className="gallery-heading">
        <h2 id="gallery-heading">Gallery</h2>
        <p className="sample-gallery-context">{sampleMode ? 'Local sample photographs · Sample downloads only.' : 'Photos from Unsplash · Download registration enabled.'}</p>
      </div>
      <p className="results-context" id="gallery-status" role="status" aria-atomic="true">{context}</p>
      <div id="gallery-results" aria-busy={status === 'loading'}>
        {status === 'loading' && <GallerySkeleton />}
        {status === 'success' && <ImageGrid photos={photos} onDownload={onDownload || (sampleMode ? undefined : registerPhotoDownload)} />}
        {status === 'empty' && <EmptyState sampleMode={sampleMode} query={submittedQuery} resetFormId="photograph-search-form" />}
        {status === 'error' && <ErrorState retryable={error?.retryable === true} onRetry={onRetry} />}
      </div>
    </section>
  )
}
