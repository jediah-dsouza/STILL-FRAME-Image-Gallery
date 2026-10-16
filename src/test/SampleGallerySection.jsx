import GallerySection from '../components/gallery/GallerySection.jsx'
import { mockCardDownload } from '../services/mockCardDownload.js'
export default function SampleGallerySection(props) {
  return <GallerySection sampleMode onDownload={mockCardDownload} {...props} />
}
