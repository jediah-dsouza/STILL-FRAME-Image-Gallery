import { useEffect, useRef, useState } from 'react'
import Footer from './components/layout/Footer.jsx'
import Header from './components/layout/Header.jsx'
import HeroSection from './components/layout/HeroSection.jsx'
import SkipLink from './components/layout/SkipLink.jsx'
import SearchForm from './components/search/SearchForm.jsx'
import GallerySection from './components/gallery/GallerySection.jsx'
import { DEFAULT_QUERY } from '../shared/searchConfig.js'
import { searchPhotos } from './services/photoSearch.js'
import { toSearchError } from './services/searchErrors.js'

export default function App({ searchService = searchPhotos, initialPhotos, onDownload }) {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState(DEFAULT_QUERY)
  const [requestAttempt, setRequestAttempt] = useState(0)
  const [result, setResult] = useState({ photos: initialPhotos || [], status: initialPhotos ? 'success' : 'loading', error: null })
  const pendingQuery = useRef(initialPhotos ? null : DEFAULT_QUERY)
  const sampleMode = initialPhotos !== undefined
  const inputRef = useRef(null)

  useEffect(() => {
    // Optional preloaded data is for isolated offline fixtures only; live attempt zero fetches nature.
    if (requestAttempt === 0 && initialPhotos !== undefined) return
    const controller = new AbortController()
    let active = true
    async function loadPhotos() {
      try {
        // StrictMode cleanup precedes this microtask, avoiding its discarded mount request.
        await Promise.resolve()
        if (!active) return
        const { photos } = await searchService({ query: submittedQuery, signal: controller.signal })
        if (active) setResult({ photos, status: photos.length ? 'success' : 'empty', error: null })
      } catch (error) {
        if (active && !controller.signal.aborted && error?.name !== 'AbortError') {
          setResult({ photos: [], status: 'error', error: toSearchError(error) })
        }
      } finally {
        // An obsolete attempt must not release the newer attempt's duplicate guard.
        if (active) pendingQuery.current = null
      }
    }
    loadPhotos()
    return () => {
      active = false
      controller.abort()
    }
  }, [submittedQuery, requestAttempt, searchService, initialPhotos])

  function startRequest(nextQuery) {
    const identity = nextQuery.toLowerCase()
    if (pendingQuery.current === identity) return
    pendingQuery.current = identity
    setSubmittedQuery(nextQuery)
    setRequestAttempt(attempt => attempt + 1)
    // Batch request intent with removal of stale cards/count/errors before paint.
    setResult({ photos: [], status: 'loading', error: null })
  }

  function handleQueryChange(value) {
    setQuery(value)
  }

  function handleClear() {
    setQuery('')
    startRequest(DEFAULT_QUERY)
  }

  function handleRetry() {
    inputRef.current?.focus({ preventScroll: true })
    startRequest(submittedQuery)
  }

  return (
    <div className="app-shell">
      <SkipLink />
      <Header />
      <main id="gallery" className="container" tabIndex={-1}>
        <HeroSection sampleMode={sampleMode}>
          <SearchForm
            sampleMode={sampleMode}
            query={query}
            isSearching={result.status === 'loading'}
            submittedQuery={submittedQuery}
            onQueryChange={handleQueryChange}
            onSearch={startRequest}
            onClear={handleClear}
            canClear={query.length > 0 || submittedQuery.toLowerCase() !== DEFAULT_QUERY || result.status === 'error'}
            inputRef={inputRef}
          />
        </HeroSection>
        <GallerySection sampleMode={sampleMode} onDownload={onDownload} {...result} submittedQuery={submittedQuery} onRetry={handleRetry} />
      </main>
      <Footer sampleMode={sampleMode} />
    </div>
  )
}
