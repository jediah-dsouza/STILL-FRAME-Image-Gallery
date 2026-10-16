# Technical Requirements Document (TRD)

## Grid-Based Image Gallery with Search

**Authority:** INTERNSHIP-TASK.md → MASTER-FRONTEND-WEB-DEVELOPMENT-WORKFLOW.md → 01-PRD.md → 02-TRD.md → 03-APP-FLOW.md → 04-DESIGN-BRIEF.md → 05-IMPLEMENTATION-PLAN.md → existing implementation, once implementation begins. 00-PLANNING-INDEX.md summarizes the pack and does not override it.

**Amendment status:** Approved specification decisions recorded; application development, Phase 1, proxy implementation, credential setup and authenticated requests remain unauthorized until their separate approvals.

**Status:** Approved decisions amended; execution awaits separate authorization\
**Architecture:** React SPA with a narrowly scoped credential proxy for later live integration\
**Primary external dependency:** Unsplash API\
**Implementation philosophy:** smallest stack capable of solving the
task

------------------------------------------------------------------------

## 1. Technical Objectives

The implementation must make the assigned concepts obvious:

-   React functional components
-   `useState` for local UI state
-   `useEffect` for external data synchronization/fetching
-   native `fetch`
-   async/await + try/catch
-   CSS Grid for gallery layout
-   Flexbox for local alignment
-   semantic HTML
-   responsive CSS
-   accessible interaction states

Avoid introducing libraries that obscure the learning goals.

------------------------------------------------------------------------

## 2. Proposed Stack

React + Vite + JavaScript, authored CSS, native fetch, one route `/`. No router, TypeScript, Tailwind, Redux/Zustand/global-state library, React Query/equivalent fetching abstraction, UI component framework, masonry library or animation framework. Preserve visible useEffect fetching, user input handling, Grid, Flexbox, responsive behavior, Unsplash integration and per-image Download learning objectives.

- Small inline SVG icon set; no heavy icon package.
- ESLint from the Vite React JavaScript template.
- Vitest + React Testing Library with DOM test environment and user-interaction utilities, introduced before Gate A; manual behavior/visual checks supplement them.
- Git after Phase 1 approval.
- Server-side/serverless handlers only for the narrow live credential boundary; no unnecessary framework.
- Deployment must support the server credential runtime; static-only hosting alone is insufficient. Choose provider/runtime and same-origin routing before Phase 9.

### Explicit non-dependencies and non-goals

No authentication, accounts, favorites persistence, collections, uploads, comments, admin, database, sessions, general backend, infinite scroll, lightbox, theme switching, advanced filters or pagination unless separately approved. The only approved server-side scope is the minimal credential proxy for later live search/download registration.

------------------------------------------------------------------------

## 3. Application Architecture

``` text
Browser
  ↓
React App
  ├── App shell
  ├── Search feature
  ├── Gallery feature
  ├── UI states
  └── Download interaction
        ↓
Frontend service (native fetch to same-origin API)
        ↓
Minimal credential proxy (server-held Access Key)
        ↓
Unsplash REST API
```

### Component hierarchy

``` text
App
├── SkipLink
├── Header
├── main
│   ├── HeroSection
│   │   └── SearchForm
│   │       ├── SearchInput
│   │       ├── ClearSearchButton
│   │       └── SearchButton
│   ├── ResultsHeader
│   └── GallerySection
│       ├── GallerySkeleton
│       ├── ErrorState
│       ├── EmptyState
│       └── ImageGrid
│           └── ImageCard[]
│               ├── ImageMedia
│               ├── PhotographerAttribution
│               └── DownloadButton
└── Footer
```

------------------------------------------------------------------------

Component hierarchy names responsibilities, not required files. Simple input/buttons/media/attribution may remain inline. Shared search/result coordination belongs in App; per-card download state/inline feedback belongs in ImageCard. No global toast system.

## 4. Folder Architecture

``` text
src/
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── search/
│   │   └── SearchForm.jsx
│   ├── gallery/
│   │   ├── GallerySection.jsx
│   │   ├── ImageGrid.jsx
│   │   ├── ImageCard.jsx
│   │   └── GallerySkeleton.jsx
│   └── states/
│       ├── EmptyState.jsx
│       └── ErrorState.jsx
├── data/
│   └── samplePhotos.js
├── services/
│   └── unsplash.js
├── styles/
│   ├── tokens.css
│   ├── global.css
│   └── components.css
├── utils/
│   └── normalizePhoto.js
├── App.jsx
└── main.jsx
```

For a project this size, avoid excessive fragmentation. Components
should represent stable responsibilities, not arbitrary `<div>`
boundaries.

------------------------------------------------------------------------

The frontend tree above is intentionally small. When authorized later, local licensed fixture assets belong in the app's asset area and deterministic mock service logic may sit beside the frontend service. Host-appropriate proxy handlers belong outside client source and are not created during sample development. No scaffold/source/proxy is authorized by this amendment.

## 5. State Model

Conceptual JavaScript state contract (not application implementation):

- DEFAULT_QUERY = "nature".
- query: initially empty, editable input.
- submittedQuery: initially DEFAULT_QUERY, committed request.
- requestAttempt: integer attempt trigger, initially zero.
- photos: normalized records; initial sample fixtures render immediately.
- status: idle / loading / success / empty / error. Sample initial populated data is success; live entry transitions to loading.
- error: safe normalized error or null.

`query` is editable input; `submittedQuery` is the committed request; `requestAttempt` is an explicit attempt trigger. Default query is exactly `nature`; initial input is empty. Enter/Search explicitly submit after trimming leading/trailing whitespace; blank-only input creates no request. Keystrokes never fetch. A completed identical query may intentionally refresh; an identical in-flight duplicate is suppressed. A different valid query may supersede the pending request. ClearSearchButton empties input, restores the nature gallery and focuses the input. Reuse an identical pending nature request; otherwise reset triggers a default attempt even if submittedQuery already equals nature. Retry increments requestAttempt for the last submittedQuery through the same effect path, not duplicated fetching logic or unsent input edits.

At application coordination level, batch a changed submittedQuery and incremented requestAttempt within the same valid submit event so there is one intended request. Stable mock/live service selection is not a user-facing credential switch.

Derive counts from photos.length only when settled; do not duplicate derived state. Loading clears error; success/empty clears error; error does not render stale cards as the active result set. Each card owns download busy/error and an immediate in-flight guard. No optional global downloadingId. Other cards/search remain usable.

------------------------------------------------------------------------

## 6. `useEffect` Data Flow

```text
input → query → explicit valid submit / reset / Retry
  → submittedQuery + requestAttempt
  → useEffect → AbortController + active/current-attempt guard
  → loading / skeletons / busy region
  → searchPhotos({ query: submittedQuery, signal })
  → active attempt only → photos → success / empty / error
cleanup → mark inactive + abort
```

The fetching effect conceptually depends on submittedQuery and requestAttempt. At request start clear stale request errors, replace the active results with gallery skeletons, hide stale counts, and mark the stable result region busy. AbortController cancels obsolete requests; a local active/current-attempt guard prevents obsolete success, rejection and finalization from committing any state or clearing a newer loading state. Cleanup marks the attempt inactive and aborts it. Abort is cancellation, not a user-visible error. The mock service must support the same abortable contract and reproducible out-of-order scenarios. Keep Strict Mode cleanup correct; do not disable it to conceal defects. Render settled success/empty/error deliberately; show “N images shown” from rendered photos only, not the API-wide total or a stale count.

Keep useEffect synchronization visible. Do not make the effect callback itself async. Declare any stable injected service dependency correctly rather than suppressing hook lint rules. Sample default fixtures render immediately: initial sample attempt zero reuses fixtures rather than issuing a redundant mount request. Explicit attempts/previews exercise abortable mock loading; live mode is not given a blanket skip-first-effect workaround. Live mode later performs the default nature request on mount. No duplicated Retry fetching or automatic retry loop.

------------------------------------------------------------------------

## 7. Unsplash Service Contract

### Search service and minimal proxy

`searchPhotos({ query, signal }) → Promise<{ photos: GalleryPhoto[] }>`

Sample mode implements this contract deterministically and abortably. Live mode uses native fetch to planned same-origin `GET /api/photos/search?query=...`.

The proxy validates/trims bounded nonblank query input, encodes it, fixes first page/per_page=24 intentionally, attaches the server-held Access Key, validates upstream HTTP/JSON and returns only the raw-field projection needed by normalizePhoto. No pagination controls or arbitrary forwarded query parameters. The frontend service validates the response, normalizes each live record once and returns photos; the API-wide total is not displayed.

Before Phase 9 document bounded input, safe error mapping and minimal abuse/rate handling. Do not create an open forwarding proxy or account/database infrastructure.

### Pure normalizePhoto

`normalizePhoto(rawPhoto) → GalleryPhoto | null`

- Pure: no fetching, DOM/state effects or mutation.
- Preserve PRD GalleryPhoto: id; positive width/height; nullable color/description/altDescription; urls.regular/small/thumb; links.html/download/downloadLocation; user.name/username/profileUrl.
- Tolerate nullable optional descriptions/alt/color. Missing image variants may use another validated available variant; never invent image text.
- Required live fields: nonempty id, positive dimensions, at least one usable image URL, photographer identity/profile, photo source URL and download/delivery/registration links. Missing required fields or invalid approved URL forms return null.
- Service skips malformed records in a mixed batch. A structurally valid empty results array means empty; an invalid envelope or nonempty all-malformed batch produces a safe api error, not a deceptive empty state. Non-sensitive diagnostics may record skipped records, never credentials/raw errors.
- Validate permitted live URL protocols/origins. Fixtures use the same model with explicitly permitted local asset/mock URLs. Components consume GalleryPhoto only; fixtures are already normalized.

### Download service and registration boundary

`registerDownload({ photoId, downloadLocation, signal }) → Promise<{ url: string }>`

Live transport: planned `POST /api/photos/download`, with photoId and the photo-provided downloadLocation, not browser credentials.

Validate HTTPS, exact approved Unsplash API origin, no userinfo/custom port/fragment, and the expected photo-download path matching photoId before attaching credentials. Preserve only documented required query parameters through an allowlist reverified before Phase 9. Do not fetch arbitrary client-supplied URLs or forward credential-bearing redirects.

The proxy calls the validated photo-provided download_location, validates HTTP/JSON and the returned image resource URL, and returns only `{ url }`. The registration endpoint is not the image file. Reverify supported image-delivery origins before integration; both proxy and client reject unsafe/unexpected protocols/origins. No binary image relay, caching/storage service or general backend.

### Per-card lifecycle and browser delivery

Each ImageCard owns download busy/error state, an immediate same-card in-flight guard and inline feedback; no global downloadingId or initial global toast architecture. Other cards and search remain usable. Activation → guard → “Preparing download...” → required registration through the approved API boundary → validated image resource → supported browser delivery/navigation or an explicit “Open image to save” ready link → restore/update local UI. Registration failure stays local and never intentionally falls back to bypassing required registration. Registration, delivery initiation and proving an actual save are distinct: do not display “Downloaded” merely because registration succeeded; JavaScript generally cannot prove the user saved a file. An explicit user-activated ready link is the fallback for blocked asynchronous popups/navigation; cross-origin download hints may be ignored. Use the prepared resource within that attempt without duplicate registration. On unmount/supersession, abort or ignore pending work and prevent unexpected late navigation; cancellation cannot undo an already processed upstream registration, so do not automatically repeat it.

### Attribution and supported live images

Preserve photographer name/profile, photo/source URL and Unsplash attribution context. Links back to Unsplash include required `utm_source=<approved_app_name>&utm_medium=referral`, preserving necessary existing parameters. Use API-returned hotlinked image URLs and preserve required parameters, including ixid where applicable; do not locally mirror API photos for live display.

Current official pre-Phase-9 verification and the distinct pre-public-release policy-fit checkpoint are specified in §8. Educational/demo intent does not imply production approval.

------------------------------------------------------------------------

## 8. Environment Configuration

Live architecture: React → frontend service → native fetch to our same-origin API boundary → minimal server-side/serverless credential proxy → Unsplash. Keep both Access Key and Secret Key out of browser-delivered code, source maps, requests and logs. A VITE_ variable is not a confidentiality boundary. The proxy keeps the Access Key server-side, validates/normalizes allowed inputs, performs only required search/download-registration requests and returns only data needed by the frontend. No database, authentication system, accounts, sessions, persistence, business-domain backend or unnecessary server framework. This public search/download flow does not need the Secret Key; do not request it. No proxy implementation, authenticated request or credential provisioning is authorized by this amendment.

Later server runtime variable: `UNSPLASH_ACCESS_KEY`. Do not use `VITE_UNSPLASH_ACCESS_KEY`. During Phase 1 only placeholder setup documentation/.env.example is allowed; no credentials or authenticated request. Configure the server-only value only when live integration is separately authorized.

Ignore actual `.env`, `.env.local` and `.env.*` files while explicitly retaining `.env.example`. Never commit credentials; inspect staged files/history without printing values. No Secret Key is required for this public flow.

Select provider/runtime, same-origin development/deployment routing, server environment configuration and application referral identifier before Phase 9. Static frontend hosting alone cannot keep an Access Key confidential.

Immediately before Phase 9, reverify current official Unsplash documentation/guidelines for credential confidentiality, API-returned hotlinked image URLs, preservation of required parameters (including ixid where applicable), photographer + Unsplash attribution, required referral parameters on Unsplash links, and photo-provided download_location registration. All links back to Unsplash use required utm_source=<approved_app_name>&utm_medium=referral parameters while retaining required existing parameters. Registration is not the image file. Record sources, verification date, decisions and explicit integration approval. Official checkpoint sources: https://unsplash.com/documentation and https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines . Educational/demo intent and technical API success are not public production-policy approval. The search/browse/download concept may overlap restrictions on replicating Unsplash's core experience; verify policy fit before any public production release that depends on Unsplash. Stop/report a conflict instead of silently redesigning the internship assignment.

------------------------------------------------------------------------

## 9. Sample Data Architecture

Use approximately 8–12 already-normalized GalleryPhoto records with appropriately licensed local fixture assets and documented provenance. Cover landscape, portrait, long photographer name, missing description, local image failure and normal successful records. All required scenarios are deterministic and work without credentials, live Unsplash requests or external network/assets/fonts. A deliberate missing local image can exercise failure. The same production ImageGrid/ImageCard render fixtures and later live-normalized data; no disposable second UI. Abortable mock search/registration provides loading/success/empty/error/retry, stale-request and per-card download busy/success/failure scenarios. Mock actions use local resources and do not claim a real save. Do not locally mirror API-returned photos as a substitute for live hotlinking compliance.

```text
Local normalized fixtures ────────────┐
                                     ├→ GalleryPhoto[] → same ImageGrid → same ImageCard
API projection → normalizePhoto once ─┘
```

Use deterministic development/test scenarios for default/loading/success/empty/error, retry, cancellation, out-of-order responses and local download busy/success/failure. Remove temporary visual debug controls from final submission unless intentionally documented developer tooling. No disposable mock-only UI or production credentials/mode switch.

Testing starts during sample development, not after live integration: query/normalization/error unit tests during Phase 3, card component tests during Phase 4, search integration tests during Phase 6, and state/retry/cancellation/download tests during Phase 7. Before Gate A, unit/component/integration tests, manual accessibility, responsive checks and visual QA must exist and pass, with lint, production build and preview smoke testing. Phase 12 expands the existing suite for live API/network/authentication/rate-limit/download-registration behavior and production regressions; it is not the first testing phase.

------------------------------------------------------------------------

## 10. Styling Architecture

### CSS responsibilities

`tokens.css` - color tokens - typography tokens - spacing - radii -
borders - shadows - container sizes - motion timing

`global.css` - reset/base - body - typography defaults - focus styles -
utility accessibility classes

`components.css` - header - hero/search - gallery - cards - state
panels - footer - responsive queries

### Grid

Normal CSS Grid follows DOM/reading order, never masonry or dense visual reordering. Small mobile: one column; wider mobile: two only when content/actions stay usable; tablet: two to three; desktop: three to four; maximum intended columns: four. Do not allow illustrative auto-fit rules to generate five or more columns. Verify 320, 375, 430, 768, 1024, 1280 and 1440+ pixels plus intermediate transitions. Long photographer names wrap without pushing actions outside cards; avoid fixed metadata heights and horizontal page overflow.

Tune actual track sizing/gaps against the brief rather than copying an unlimited auto-fit/minmax example.

### Flexbox

Use for: - header alignment - search form controls - card
metadata/action row - result header - footer alignment

------------------------------------------------------------------------

## 11. Responsive Requirements

Normal CSS Grid follows DOM/reading order, never masonry or dense visual reordering. Small mobile: one column; wider mobile: two only when content/actions stay usable; tablet: two to three; desktop: three to four; maximum intended columns: four. Do not allow illustrative auto-fit rules to generate five or more columns. Verify 320, 375, 430, 768, 1024, 1280 and 1440+ pixels plus intermediate transitions. Long photographer names wrap without pushing actions outside cards; avoid fixed metadata heights and horizontal page overflow.

Use fluid gutters, capped containers and fluid H1 scaling. Search controls stack when necessary; card attribution/actions remain visible without hover. Reserve image space and maintain intentional image proportions. Verify enlarged text/zoom as well as named viewport widths.

------------------------------------------------------------------------

## 12. Accessibility Requirements

Use semantic landmarks, one H1, associated search label and native form/button/link semantics. Keyboard users must complete primary flows. Provide contextual Download names, meaningful alt/fallback without invented image details, visible focus and a stable usable skip-link destination in every result state. Preserve focus when Clear/Retry controls disappear; reset focuses input. Use one concise results announcement, decorative skeletons and appropriate aria-busy; local download feedback must not steal focus. No hover-only essential functionality. Respect reduced motion; test 320 CSS-pixel reflow and enlarged text/zoom. A real baseline screen-reader session SHOULD be performed when a suitable actual assistive-technology environment is reasonably available. If unavailable in the authorized testing environment, explicitly disclose and defer manual AT verification; tooling absence alone is not a Hard Gate A blocker or a bar to Phase 9 entry, provided the remaining required accessibility baseline passes. Apply the project-specific screen-reader policy in 05-IMPLEMENTATION-PLAN.md; keyboard testing and accessibility-tree inspection are not equivalent to a real screen-reader session. Normal text contrast ≥4.5:1; large text ≥3:1; essential non-text UI/focus boundaries meet applicable contrast (normally ≥3:1). Aim for approximately 44×44 CSS-pixel important targets where practical. Cream #F6F1E8 on ember #F06A2A is about 2.74:1 and must not be used where it fails text contrast. Ink #10100F on ember is about 6.16:1 and may be used after measuring the rendered pair. Decorative low-contrast borders cannot be the sole essential control/state indicator.

------------------------------------------------------------------------

## 13. Error Model

Normalized UI errors:

``` js
{
  type: "network" | "auth" | "rate-limit" | "api" | "unknown",
  message: string,
  retryable: boolean
}
```

Behavior: - `network`: explain connection issue; retry - `auth`:
configuration message for development; do not expose credential
details - `rate-limit`: explain temporary request limit; avoid immediate
request loop - `api`: generic service issue; retry when appropriate -
`unknown`: safe fallback

Never render raw stack traces or credentials to users. Abort is cancellation, not one of these visible errors. Validate response status/headers/body rather than assuming every 403 is auth or every rate limit is 429. No immediate retry loop. Invalid envelope/all-malformed nonempty data is api error, while a valid empty array is empty.

------------------------------------------------------------------------

## 14. Performance Requirements

-   gallery thumbnails use `small` or appropriately parameterized image
    URLs
-   do not use `raw`/`full` for grid thumbnails
-   below-fold `loading="lazy"`
-   width/height or `aspect-ratio` reserves space
-   avoid layout-shifting overlays
-   avoid unnecessary rerenders
-   abort obsolete requests
-   production build inspected
-   keep dependencies minimal

------------------------------------------------------------------------

## 15. Testing Requirements

### Unit

-   query normalization
-   API response normalization
-   error mapping

### Component

-   SearchForm submission
-   blank query prevention
-   clear behavior
-   ImageCard attribution rendering
-   Download button state
-   EmptyState/Retry

### Integration

-   submit search → loading → results
-   submit search → empty
-   submit search → error → retry
-   stale resolution/rejection/finalization protection and abort behavior

### Manual E2E

-   load app
-   search "mountains"
-   inspect results
-   open photographer attribution
-   trigger download
-   search nonsense string
-   simulate offline/error
-   keyboard-only pass
-   mobile viewport pass

------------------------------------------------------------------------

Testing starts during sample development, not after live integration: query/normalization/error unit tests during Phase 3, card component tests during Phase 4, search integration tests during Phase 6, and state/retry/cancellation/download tests during Phase 7. Before Gate A, unit/component/integration tests, manual accessibility, responsive checks and visual QA must exist and pass, with lint, production build and preview smoke testing. Phase 12 expands the existing suite for live API/network/authentication/rate-limit/download-registration behavior and production regressions; it is not the first testing phase.

Pre-Gate-A integration tests include completed same-query refresh, pending duplicate suppression, same-query Retry, old resolution/rejection/finalization guards, focus persistence, local download repeated-click guards and image failure. Later browser tests distinguish registration from delivery and actual file saving.

## 16. Technical Acceptance Gate Before Live API

HARD GATE A remains before all live integration/proxy implementation. Its authoritative full criterion checklist and evidence format are in 05-IMPLEMENTATION-PLAN.md. Review exact revision/commit, evidence, per-criterion pass/fail (or disclosed actual-screen-reader deferral under that policy), unresolved issues and explicit human approval. This amendment does not pass Gate A; no application exists yet. Even a passing Gate A does not automatically authorize integration: the approved credential boundary, current immediately pre-Phase-9 compliance checkpoint and explicit human integration approval are additionally required. Public production release separately requires policy-fit verification.

------------------------------------------------------------------------

## 17. Technical Definition of Done

``` text
[ ] npm install succeeds
[ ] npm run dev succeeds
[ ] npm run build succeeds
[ ] lint passes
[ ] core tests pass
[ ] no runtime console errors in normal flow
[ ] no committed credentials or browser-delivered Access Key/Secret Key
[ ] live API search works through approved minimal proxy
[ ] current compliance checkpoint recorded
[ ] public production policy-fit verified before public release
[ ] download behavior works
[ ] loading/empty/error/retry work
[ ] responsive QA complete
[ ] accessibility baseline complete
[ ] README documents setup and env
```
