export default function HeroSection({ children, sampleMode = false }) {
  return (
    <section className="hero-section" aria-labelledby="intro-heading">
      <div className="hero-copy">
        <h1 id="intro-heading">
          Find the frame.<br />Keep the feeling.
        </h1>
        <p className="intro-copy">{sampleMode ? 'Search the sample collection.' : 'Search photographs from Unsplash.'}</p>
      </div>
      {children}
    </section>
  )
}
