import App from '../App.jsx'
import { samplePhotos } from '../data/samplePhotos.js'
import { searchPhotos } from '../services/mockPhotoSearch.js'
import { mockCardDownload } from '../services/mockCardDownload.js'

// Explicit offline composition: never imported by the production entry point.
export default function SampleApp({ searchService = searchPhotos, ...props }) {
  return <App initialPhotos={samplePhotos} searchService={searchService} onDownload={mockCardDownload} {...props} />
}
