export default function Footer({ sampleMode = false }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>{sampleMode ? 'Educational sample gallery. No live Unsplash search.' : 'Educational Unsplash demo. Downloads register with Unsplash; your browser handles saving.'}</p>
      </div>
    </footer>
  )
}
