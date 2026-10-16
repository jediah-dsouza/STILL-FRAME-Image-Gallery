// Synthetic provider-shaped records, not a real API capture. No network or credential.
export function providerPhoto(overrides = {}) {
  return {
    id: 'demo-photo', width: 800, height: 1200, color: '#345678',
    description: 'A quiet mountain lake', alt_description: 'Mountain reflected in a lake',
    urls: {
      regular: 'https://images.unsplash.com/photo-demo?ixid=preserve&w=800',
      small: 'https://images.unsplash.com/photo-demo?ixid=preserve&w=400',
      thumb: 'https://images.unsplash.com/photo-demo?ixid=preserve&w=100',
    },
    links: {
      html: 'https://unsplash.com/photos/demo-photo?keep=photo',
      download: 'https://unsplash.com/photos/demo-photo/download?ixid=preserve',
      download_location: 'https://api.unsplash.com/photos/demo-photo/download?ixid=preserve',
    },
    user: { name: 'Example Photographer', username: 'example', links: { html: 'https://unsplash.com/@example?keep=profile' } },
    ...overrides,
  }
}
