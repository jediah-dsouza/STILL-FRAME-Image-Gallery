# Local photographic fixture provenance

These ten photographs are stored solely for deterministic educational/informational development and QA. They are not Unsplash records and are not currently rendered by the application.

## Usage basis and limits

Official guidance reviewed: https://www.nasa.gov/nasa-brand-center/images-and-media/

NASA permits educational/informational use of its content, with NASA acknowledged as source and no implication of endorsement. Its guidance says content generally is not subject to copyright in the United States, but this is **not a blanket public-domain/CC0 license** for everything hosted by NASA. Third-party copyrighted material and insignia have separate restrictions. This pack uses NASA-credited photographs without third-party copyright notices in the reviewed catalog records; candidates credited to Getty Images or Rocket Lab were excluded. No permission for promotional, merchandising, AI-training, or other unrelated uses is claimed.

The astronaut portrait includes an identifiable person: do not treat fixture inclusion as clearance for advertising/promotional reuse or endorsement. Reassess the guidance if the use changes. Metadata observations and source URLs are recorded below and in provenance.json; no individual photographer is invented when the catalog only credits NASA.

## Processing and deterministic runtime

- Downloaded explicitly from the NASA Image and Video Library asset URLs listed below, not scraped from arbitrary websites or fetched through Unsplash.
- Converted locally to RGB WebP (quality 85), proportionally limited to 1280px on the longest edge. No crop or generated pixels/artwork. These are photographic fixtures, not synthetic substitutes.
- Every record uses actual decoded fixture dimensions. regular/small/thumb intentionally share one local file; responsive derivatives are not required for this data foundation.
- Source and processed SHA-256 checksums are in provenance.json. Running the project/tests never downloads source images.
- Sample contributor fields preserve catalog credit. One institutional NASA credit is expanded to its full name to exercise long-name layout; it is not a fictional photographer.
- /fixtures/mock/... links are explicitly inert local fixture identifiers. No matching endpoint exists. Later authorized mock adapters must interpret them locally and must not perform live registration/navigation.
- sourcePage/sourceAsset URLs in this provenance documentation are source references, not component-facing image URLs or runtime dependencies.
- The intentionally missing /fixtures/photos/intentionally-missing.webp is reserved for separate failure testing. Depending on Vite history fallback it may return HTML rather than HTTP 404; image decoding must fail either way. Never add a real file at that path.

## Asset inventory

### ED04-0056-103

Glacier Grey in front of The Cuernos del Paine mountains, photographed from Lago Grey (Grey Lake) during NASA's AirSAR 2004 campaign in Chile

- Local file: `photos/ed04-0056-103.webp` (845 × 1280)
- Catalog credit: NASA/Jim Ross
- Source page: https://images.nasa.gov/details/ED04-0056-103
- Acquired asset: https://images-assets.nasa.gov/image/ED04-0056-103/ED04-0056-103~medium.jpg
- Local SHA-256: `4d1b231b1d360c88f74f49e8377ba7ecc6d1fb4bfe12b1d796580e602623139b`

### ED04-0056-108

View of Glacier Grey from Lago Grey (Grey Lake), with the Cuernos del Paine mountains in the background, seen during NASA's AirSAR 2004 campaign in Chile

- Local file: `photos/ed04-0056-108.webp` (1280 × 845)
- Catalog credit: NASA/Jim Ross
- Source page: https://images.nasa.gov/details/ED04-0056-108
- Acquired asset: https://images-assets.nasa.gov/image/ED04-0056-108/ED04-0056-108~medium.jpg
- Local SHA-256: `15b995f087ebe00042c3fe66711b6cdcf6b97d9dc9700f039f47949074f7cd17`

### NHQ202105040016

STEReO Field Testing

- Local file: `photos/nhq202105040016.webp` (1280 × 740)
- Catalog credit: NASA/Joel Kowsky
- Source page: https://images.nasa.gov/details/NHQ202105040016
- Acquired asset: https://images-assets.nasa.gov/image/NHQ202105040016/NHQ202105040016~medium.jpg
- Local SHA-256: `1930e34f54a67a71760f591978fb6546551614172e6537d30b58e22aeff0c81f`

### iss071e378171

Mangoro River on Madagascar's east coast leads to the Indian Ocean

- Local file: `photos/iss071e378171.webp` (1280 × 853)
- Catalog credit: NASA
- Source page: https://images.nasa.gov/details/iss071e378171
- Acquired asset: https://images-assets.nasa.gov/image/iss071e378171/iss071e378171~medium.jpg
- Local SHA-256: `db6ac5694ff1562422664eb8278a862ee123539b301289afe98fdba3260371b4`

### iss072e862085

The hot and arid desert coast of Angola on the Atlantic Ocean

- Local file: `photos/iss072e862085.webp` (1280 × 853)
- Catalog credit: NASA
- Source page: https://images.nasa.gov/details/iss072e862085
- Acquired asset: https://images-assets.nasa.gov/image/iss072e862085/iss072e862085~medium.jpg
- Local SHA-256: `0fb024a45f913703a14bfdbf977463965e7f3c13c65e3c771497122bad6fab0a`

### s64-31845

Portrait of Astronaut Eugene A. Cernan

- Local file: `photos/s64-31845.webp` (1026 × 1280)
- Catalog credit: NASA
- Source page: https://images.nasa.gov/details/s64-31845
- Acquired asset: https://images-assets.nasa.gov/image/s64-31845/s64-31845~medium.jpg
- Local SHA-256: `3dc65f9db7bd787a9a0008be9625899c777f356e0ca4ac68e61a7b5438d1861b`

### as8-14-2392

High-oblique view of Moon's surface showing earth rising above horizon

- Local file: `photos/as8-14-2392.webp` (1274 × 1280)
- Catalog credit: NASA
- Source page: https://images.nasa.gov/details/as8-14-2392
- Acquired asset: https://images-assets.nasa.gov/image/as8-14-2392/as8-14-2392~medium.jpg
- Local SHA-256: `21dfe4a6679c38a6af74a755ddac297f8d7dc88b1cac58f5dd9b041788ab4aaf`

### as11-37-5505

Shadow of the Apollo 11 Lunar module silhouetted against Moon's surface

- Local file: `photos/as11-37-5505.webp` (1280 × 1280)
- Catalog credit: NASA
- Source page: https://images.nasa.gov/details/as11-37-5505
- Acquired asset: https://images-assets.nasa.gov/image/as11-37-5505/as11-37-5505~medium.jpg
- Local SHA-256: `3baba3d1c76a64466074a67bb779f878876f069a7353099d188298411fc10470`

### iss071e457356

The Moon illuminates a cloud-covered Pacific Ocean

- Local file: `photos/iss071e457356.webp` (1280 × 853)
- Catalog credit: NASA
- Source page: https://images.nasa.gov/details/iss071e457356
- Acquired asset: https://images-assets.nasa.gov/image/iss071e457356/iss071e457356~medium.jpg
- Local SHA-256: `3d6245fed3141d5cc130bfc42e12e5c7225612d9c49f845bdfa27d871bc08996`

### iss074e0089803

Earth's thin blue atmosphere traces the planet's horizon above the Pacific Ocean

- Local file: `photos/iss074e0089803.webp` (1279 × 718)
- Catalog credit: NASA
- Source page: https://images.nasa.gov/details/iss074e0089803
- Acquired asset: https://images-assets.nasa.gov/image/iss074e0089803/iss074e0089803~medium.jpg
- Local SHA-256: `0584209ecd6c28e69303772c7bc8851ce6252bc1835a4eb3115afbbeafceae7d`
