export default function ErrorState({ retryable, onRetry }) {
  return (
    <div className="gallery-state gallery-error">
      <h3>Photographs could not be loaded.</h3>
      <p>{retryable
        ? 'Your search is still here. Try it again, or choose another subject.'
        : 'Try a different subject using the search above.'}</p>
      {retryable && <button className="request-retry" type="button" onClick={onRetry}>Retry search</button>}
    </div>
  )
}
