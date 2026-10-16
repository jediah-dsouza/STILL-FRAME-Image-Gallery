export default function EmptyState({ query, resetFormId, sampleMode = true }) {
  return (
    <div className="gallery-state gallery-empty">
      <h3>Nothing in this frame.</h3>
      <p>No {sampleMode ? 'sample photographs' : 'photographs'} match “<bdi>{query}</bdi>”. Try another subject or contributor.</p>
      <button className="state-reset" type="reset" form={resetFormId}>{sampleMode ? 'Show all sample photographs' : 'Show nature photographs'}</button>
    </div>
  )
}
