import { validDownloadLocation, validImageResource } from '../../../shared/downloadPolicy.js'
import { downloadImage } from '../../utils/downloadImage.js'
import { DownloadError } from '../../services/downloadErrors.js'
import { isUnsplashPhoto, unsplashReferral } from '../../utils/attribution.js'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

/**
 * @param {{photo: import('../../utils/normalizePhoto.js').GalleryPhoto,
 * onDownload: (photo: import('../../utils/normalizePhoto.js').GalleryPhoto) => Promise<{url: string}>,
 * loading?: 'eager'|'lazy'}} props
 */
export default function ImageCard(props) {
  // State belongs to this photo/media identity, not a previous reused card.
  return <ImageCardContent key={`${props.photo.id}:${props.photo.urls.regular}`} {...props} />
}

function ImageCardContent({ photo, onDownload, deliverDownload = downloadImage, loading = 'lazy' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [download, setDownload] = useState({ status: 'idle', url: null })
  const operation = useRef(null)
  const buttonRef = useRef(null)
  const restoreFocus = useRef(false)
  const statusId = useId()
  const alt = photo.altDescription?.trim() || photo.description?.trim()
    || `Photograph credited to ${photo.user.name}`
  const contextCharacters = Array.from(alt)
  const downloadContext = contextCharacters.length > 80
    ? `${contextCharacters.slice(0, 77).join('').trimEnd()}…` : alt
  const busy = download.status === 'busy'
  const live = isUnsplashPhoto(photo)
  const available = !live || (onDownload && validDownloadLocation(photo.id, photo.links.downloadLocation))

  // Lifecycle cleanup only: no fetching. Ignore late completion after unmount.
  useEffect(() => () => { operation.current?.controller?.abort(); operation.current = null }, [])

  // Native disabling can blur the button. Restore only if no new control owns
  // focus, and never scroll the user back to a completed action.
  useLayoutEffect(() => {
    if (!busy && restoreFocus.current) {
      restoreFocus.current = false
      const button = buttonRef.current
      if (button && button.ownerDocument.activeElement === button.ownerDocument.body) {
        button.focus({ preventScroll: true })
      }
    }
  }, [busy])

  async function handleDownload() {
    if (!onDownload || operation.current || (live && !validDownloadLocation(photo.id, photo.links.downloadLocation))) return
    restoreFocus.current = buttonRef.current?.ownerDocument.activeElement === buttonRef.current
    const attempt = { controller: new AbortController() }
    const signal = attempt.controller.signal
    const current = () => operation.current === attempt && !signal.aborted
    operation.current = attempt
    let resource = live && download.status === 'delivery-error' ? download.url : null
    setDownload({ status: 'busy', stage: resource ? 'delivery' : 'registration', url: resource })
    try {
      const result = resource ? { url: resource } : await (live ? onDownload(photo, { signal }) : onDownload(photo))
      if (!current()) return
      if (!live) { setDownload({ status: 'ready', url: result.url }); return }
      if (!validImageResource(result?.url)) throw new DownloadError('registration')
      resource = result.url
      setDownload({ status: 'busy', stage: 'delivery', url: resource })
      await deliverDownload(resource, { photoId: photo.id, signal })
      if (current()) setDownload({ status: 'initiated', url: resource })
    } catch (error) {
      if (current()) setDownload(live
        ? { status: resource ? 'delivery-error' : 'registration-error', url: resource,
            message: new DownloadError(resource ? 'delivery' : 'registration').message,
            ...(error instanceof DownloadError ? { message: error.message } : {}) }
        : { status: 'error', url: null })
    } finally {
      if (operation.current === attempt) operation.current = null
    }
  }

  let message = imageFailed
    ? 'Image unavailable. Attribution and sample action remain available.'
    : 'No automatic file save.'
  if (live) message = available ? 'Your browser handles saving after download registration.' : 'Download unavailable for this image.'
  if (busy) message = live
    ? (download.stage === 'delivery' ? 'Preparing image download…' : 'Registering download…')
    : 'Preparing sample download…'
  if (download.status === 'ready') message = 'Sample ready. No automatic file save.'
  if (download.status === 'error') message = 'Sample preparation failed. Try Download again.'
  if (download.status === 'initiated') message = 'Download initiated. Your browser handles saving; a saved file cannot be verified.'
  if (download.status.endsWith('-error')) message = download.message

  return (
    <article className="image-card" data-photo-id={photo.id} aria-label={`Photograph credited to ${photo.user.name}`}>
      <figure className="image-card-figure">
        <div
          className="image-card-media"
          style={{ aspectRatio: `${photo.width} / ${photo.height}`, backgroundColor: photo.color || undefined }}
        >
          {imageFailed ? (
            <div className="image-card-fallback" role="img" aria-label={`Photograph unavailable. ${alt}`}>
              <span>Photograph unavailable</span>
              <p>{live ? 'The photograph could not be displayed.' : 'The local image could not be displayed.'}</p>
            </div>
          ) : (
            <img
              src={photo.urls.regular}
              width={photo.width}
              height={photo.height}
              alt={alt}
              loading={loading}
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
        <figcaption className="image-card-caption">
          <div className="image-card-rail">
            <div className="image-card-credit">
              {live ? (
                <>
                  <p className="image-card-author">Photo by <a className="image-card-source" href={unsplashReferral(photo.user.profileUrl)}>{photo.user.name}</a></p>
                  <a className="image-card-source" href={unsplashReferral('https://unsplash.com/')}>on Unsplash</a>
                </>
              ) : (
                <>
                  <p className="image-card-author">{photo.user.name}</p>
                  <a className="image-card-source" href="/fixtures/PROVENANCE.md">Photo source</a>
                </>
              )}
            </div>
            <button
              className="image-card-download"
              ref={buttonRef}
              type="button"
              aria-label={`Download${live ? ' photograph' : ' sample photograph'}: ${downloadContext}`}
              aria-describedby={statusId}
              aria-busy={busy}
              disabled={busy || !available}
              onClick={handleDownload}
            >
              {busy ? 'Preparing…' : 'Download'}
            </button>
          </div>
          <p
            className={`image-card-status${download.status.includes('error') ? ' image-card-status-error' : ''}`}
            id={statusId}
            role="status"
            aria-atomic="true"
          >
            {message}
          </p>
          {live && ['initiated', 'delivery-error'].includes(download.status) && validImageResource(download.url) && (
            <a className="image-card-ready" href={download.url} target="_blank" rel="noopener noreferrer">
              Open image to save
            </a>
          )}
          {download.status === 'ready' && (
            <a className="image-card-ready" href={download.url} target="_blank" rel="noreferrer">
              Open local image
            </a>
          )}
        </figcaption>
      </figure>
    </article>
  )
}
