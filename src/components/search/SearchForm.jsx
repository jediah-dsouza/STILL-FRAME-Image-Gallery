import { MAX_QUERY_LENGTH } from '../../../shared/searchConfig.js'
import { useState } from 'react'

export default function SearchForm({ sampleMode = false, query, onQueryChange, onSearch, onClear, canClear, inputRef, isSearching = false, submittedQuery }) {
  const [invalid, setInvalid] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = query.trim()
    setInvalid(!trimmed || trimmed.length > MAX_QUERY_LENGTH)
    if (!trimmed || trimmed.length > MAX_QUERY_LENGTH) {
      inputRef.current?.focus()
      return
    }
    onSearch(trimmed)
  }

  function handleClear(event) {
    event.preventDefault()
    setInvalid(false)
    onClear()
    inputRef.current?.focus({ preventScroll: true })
  }

  return (
    <form id="photograph-search-form" className="search-form" role="search" aria-label="Photograph search" onSubmit={handleSubmit} onReset={handleClear}>
      <label htmlFor="photograph-search">Search photographs</label>
      <div className="search-controls">
        <input
          ref={inputRef}
          id="photograph-search"
          name="search"
          type="search"
          maxLength={MAX_QUERY_LENGTH}
          value={query}
          onChange={event => { setInvalid(false); onQueryChange(event.target.value) }}
          placeholder="Subject or contributor"
          aria-controls="gallery-results"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? 'search-help search-validation' : 'search-help'}
        />
        {canClear && <button className="search-clear" type="button" aria-label="Clear search" onClick={handleClear}>Clear</button>}
        <button className="search-submit" type="submit" aria-busy={isSearching}>
          Search<span className="search-progress" aria-hidden="true">{isSearching ? '…' : ''}</span>
        </button>
      </div>
      <p id="search-help" className="search-help">{isSearching
        ? <>Searching “<bdi>{submittedQuery}</bdi>”. You can submit a different search.</>
        : sampleMode ? 'Search local sample photographs by subject or contributor.' : 'Search Unsplash photographs by subject or contributor.'}</p>
      {invalid && <p id="search-validation" className="search-validation" role="alert">{query.trim().length > MAX_QUERY_LENGTH ? `Use at most ${MAX_QUERY_LENGTH} characters.` : 'Enter a subject or contributor before searching.'}</p>}
    </form>
  )
}
