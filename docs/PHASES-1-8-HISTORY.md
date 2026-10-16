# Historical sample-stage README (Phases 1-8)

Archived verbatim from application/planning checkpoint `0ef656ae84b52667119d6e5bed012a9c12aafa0d` during Phase 9 so the sample-first implementation history is not erased. **The snapshot below is historical, not current status or authority to override later approvals.** Its statements about Gate A, future authorization, sample-only behavior and configuration describe that earlier README. Current run instructions, live-search behavior and Phase 10 boundary are in the root README. The eight locked planning inputs remain unchanged.

---

# Grid-Based Image Gallery with Search

React internship assignment: image discovery with Unsplash, explicit search, CSS Grid/Flexbox, responsive layout and per-image Download.

## Current status

Phase 8 editorial polish with local sample data. Input is controlled and only explicit Enter/Search submission commits a trimmed query. Typing never starts a request. A stable abortable mock service returns normalized records after deterministic 600ms sample latency; no search network request occurs. Clear/reset restores the default local collection through the same request path and returns focus to the input.

All ten approved fixtures render immediately on first load. Initial sample attempt zero does not issue a redundant mount request, as specified in TRD §6. The initial input is empty; submittedQuery is `nature`. In the mock service, the `nature` default fixture scenario deliberately represents the entire approved local collection, not a live Unsplash result or a claim that every fixture matches a literal nature substring.

Request status supports loading/success/empty/error, identical completed-query refresh, identical pending-query suppression, cancellation, stale-outcome protection and Retry through the original Phase 6 effect. GallerySkeleton, EmptyState and ErrorState provide deliberate sample-mode presentation. Phase 8 refines shared composition, responsive controls and copy without changing the request/card mechanisms. Gate A has **not** been evaluated or passed. No live Unsplash integration, credentials, proxy or deployment exists.

## Locked stack

React, Vite, JavaScript, authored CSS and native fetch for later integration. No router, TypeScript, CSS/UI framework, global store, fetching abstraction, masonry/animation library or backend framework.

## Local setup

Use Node 24.x (24.0.0 or later) and npm 11.x. Install from the committed lockfile:

```sh
npm ci
npm run dev
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm run lint` | ESLint JavaScript/JSX, including hook and refresh rules |
| `npm test` | Run shell/data/Grid/card regressions plus filter, abortable service and search lifecycle tests |
| `npm run test:watch` | Watch tests during later authorized development |
| `npm run build` | Build production output into dist/ |
| `npm run preview` | Preview the production build locally; not deployment |

Tests use jsdom 29 because jsdom 30 requires a newer Node patch than the initialization environment. RTL/user-event cover shell, card, collection and controlled search/request lifecycle behavior. Fake timers test sample latency without sleeping; deferred promises prove behavior even when an obsolete injected service ignores abort.

## Architecture foundation

App composes SkipLink, Header, HeroSection/SearchForm, GallerySection and Footer. AppShell behavior is an ordinary wrapper/container, not another component. App coordinates query/submittedQuery/requestAttempt and request data/status; HeroSection composes the controlled SearchForm, while GallerySection receives request state and renders mutually exclusive production state components and supplies the unchanged card mock callback to ImageGrid. ImageGrid and ImageCard state mechanisms are unchanged; Phase 8 changes card presentation copy only.

The native “Skip to main content” link accurately names its permanent `main#gallery` (`tabIndex=-1`) destination, which contains intro/search and the stable named Gallery section. `#gallery-results` remains in place across request states. Skip navigation works before any images exist and does not depend on changing result content.

Styles remain tokens/global/components: dark canvas and readable foreground, editorial serif hierarchy, fluid capped container, wrapping Flexbox shell/search controls and visible focus. The gallery uses normal CSS Grid, with no motion or decorative additions. Phase 8 tightens shell rhythm and metadata hierarchy and themes native browser surfaces. No external fonts/assets are requested. The stack names Playfair Display, but no web font is loaded: Chromium in the review environment actually renders Georgia for display text and Noto Sans through system-ui for controls/credits. Other operating systems may choose different local fallbacks.

Three sizing tokens support the structural shell: 24px section headings for H1/H2 hierarchy, 24rem column basis for content-driven hero/form wrapping, and 44px important-control targets for the locked accessibility aim. No new palette or parallel design system.

The app-state directory remains an empty tracking marker: the small coordination state is readable in App, not hidden in a global store. Services now contain the independent mock card action and abortable sample photo-search boundary. No live service exists.

## Phase 3 data foundation

- `src/utils/normalizePhoto.js` documents `GalleryPhoto` in JSDoc: id, positive width/height, nullable color/description/altDescription, urls.regular/small/thumb, links.html/download/downloadLocation and user.name/username/profileUrl. The code stays JavaScript.
- `normalizePhoto(rawPhoto)` maps the minimal provider-shaped fields to that contract, without mutation, React, browser APIs or network access. Required invalid data returns null; optional missing text becomes null. Approved usable image variants can supply a missing variant. URL strings and query parameters are preserved, not reconstructed.
- `normalizePhotoCollection(rawPhotos)` accepts an extracted array, skips malformed individual records, preserves valid order and returns [] for a valid empty array. Non-array or nonempty all-malformed input throws a small `PhotoDataError` (`code: 'api'`, stable reason). This is a data-boundary exception, not the TRD UI-error object; a later service maps it to the documented safe UI error.
- `normalizePhotoResponse(rawResponse)` validates a provider-shaped `{ results: [...] }` envelope before using the collection helper. This is a pure testable boundary, not a request service or a claim that the later proxy transport is implemented.
- HTTPS/origin validation admits the specified Unsplash image/source/registration origins and narrow fixture-only local paths. Registration paths must match photo identity. Reverify current live origins/query policy immediately before Phase 9; these utilities do not make authenticated requests or replace the later proxy's security validation.
- `src/data/samplePhotos.js` exports ten explicit **already-normalized** records. They are not normalized again on import/render and do not invoke a provider service. `src/data/imageFailurePhoto.js` exports one separate opt-in record with a deliberately missing local image.
- All primary imagery is under `public/fixtures/photos/`. See `public/fixtures/PROVENANCE.md` and `provenance.json` for NASA catalog URLs, credits, educational-use basis, restrictions, processing, real dimensions and source/local SHA-256 hashes. No invented photographer or blanket public-domain/CC0 license claim. NASA is not endorsing this project.
- `regular`, `small` and `thumb` currently reference the same local image per record. Provider-only `/fixtures/mock/...` links are inert fixture identifiers, not working endpoints; later mock adapters must interpret them locally. Runtime and tests do not acquire remote images.
- Normalized fixtures cover portrait/landscape/square/wide imagery, long institutional contributor credit, nullable descriptions/alt/color, bright and dark compositions. The failure asset remains absent even if the dev server returns HTML through SPA fallback; decoding must fail.
- The Phase 3 data/normalization/provenance remain unchanged. Phase 6 searches these already-normalized records; it does not normalize again or acquire remote assets. Gate A is **not passed**.

## Phase 4 ImageCard vertical slice

- `ImageCard` consumes `photo: GalleryPhoto`, an `onDownload(photo) -> Promise<{ url }>` callback, and optional browser loading hint. No normalization, raw-provider fields or photo mutation inside the card.
- The internal keyed state boundary resets media/download state when photo or media identity changes. Its effects only handle cleanup/focus; there is **no useEffect fetching**.
- Real images retain width/height and their intrinsic aspect ratio with object-fit: contain; ImageGrid prioritizes the first two initial records, while the remaining eight are natively lazy; decoding remains async. No forced square or custom loader.
- Alt order: nonblank altDescription, nonblank description, then conservative contributor credit. Download names use a concise Unicode-safe subject excerpt; full image alt and contributor identity remain available. Missing imagery keeps the reserved frame, replaces the broken img with meaningful fallback semantics, and announces local feedback while preserving attribution/action access.
- Attribution shows the complete credited person/institution. Inert provider-only source/profile fixture URLs are not made navigable. A real local `Photo source` anchor documents NASA source/usage basis; no false Unsplash attribution/referral behavior.
- `mockCardDownload` performs no network request, registration, navigation or save. A deterministic 700ms delay exposes busy behavior, then returns only the approved local image URL or fails when a test supplies the existing failure option. Remote/unsafe resource paths are rejected.
- Each card owns its busy/ready/error UI, immediate repeated-activation guard and inline status. No global downloadingId or toast architecture. Other cards/search controls remain usable. Failure scenarios are exercised through tests rather than a production review switch.
- Success says “Sample ready. No automatic file save.” and offers an explicit `Open local image` link. It does not claim Downloaded/Saved, initiate an automatic save, or represent live registration. Failure clears ready delivery links and restores the same Download action.
- Native disabled controls can blur. After completion, focus is restored only when no new control owns it, with preventScroll; it is never moved to a status message. Obsolete/unmounted completions are ignored.
- Styling remains token-based and image-first: intrinsic media, crisp border, restrained radius, readable attribution, wrapping metadata/actions, clear hover/focus/active states, no shadows/gradients/overlays. No animated motion; reduced-motion mode remains static.
- New reusable tokens: 14px metadata size and measured warm-red inline-error color #f3a095. No palette redesign. Phase 5 adds no new tokens.
- The Phase 4 showcase is decommissioned; the same approved ImageCard now renders throughout the real sample Grid, unchanged.

## Phase 5 responsive ImageGrid

- `ImageGrid({ photos, onDownload })` consumes normalized records, preserves supplied order, uses stable `photo.id` keys and delegates media/action behavior to ImageCard. It does not normalize, fetch, sort, mutate, own search state or handle app-level async states. An empty array renders an empty container without cards or an invented EmptyState.
- Semantics remain the named Gallery section containing article/figure/caption cards. The Grid wrapper is an ordinary div: no unnecessary landmark or fake list role.
- Native CSS Grid uses explicit one/two/three/four `minmax(0, 1fr)` tracks, ordinary row flow and `align-items: start`. Card heights follow intrinsic imagery and natural metadata, without equal-height stretching, dense packing, masonry, fixed image heights or visual reordering.
- Gap is the existing `--space-5` (24px). The existing 1440px capped container and fluid 16–48px gutters remain unchanged. Maximum four tracks is explicit even at ultrawide widths.

| Viewport width | Columns | Reason |
| --- | --- | --- |
| Below 560px | 1 | 480px would leave cramped ~212px cards in two columns; retain comfortable metadata/actions |
| 560–1023px | 2 | At the first transition, gutters/gap leave ~251px tracks, within validated card reflow; tablet tracks grow naturally |
| 1024–1439px | 3 | At 1024px, ~305px tracks accommodate the card rail and long credit |
| 1440px and wider | 4 | ~320px at 1440px; capped content prevents additional columns or excessively wide cards |

- First two photos are eager for predictable initial presentation without eagerly prioritizing all ten. Remaining eight use browser-native lazy loading, which still loads in/near-viewport images as needed. Intrinsic dimensions reserve media space.
- Mixed ratios naturally leave some space below shorter cards within a row. This is intentional ordinary Grid behavior; row starts stay aligned and reading/tab order is predictable. No attempt to pack gaps by changing order or cropping.
- Image/download failures remain testable through existing fixtures and injected action callbacks. The intentionally missing fixture and review switches are not in the normal gallery.
- The unchanged Grid now receives Phase 6 request results, including safe one/zero-record inputs. Breakpoints, keys, card behavior and loading priority remain as approved in Phase 5.

## Phase 6 search / request contract

- `query` is editable input; `submittedQuery` is the trimmed committed term; `requestAttempt` is the repeat/reset/Retry trigger. App owns them alongside `{ photos, status, error }`. Counts derive only from settled `photos.length`, not separate mutable count state.
- SearchForm receives `query`, intent callbacks `onQueryChange`/`onSearch`/`onClear`, `canClear`, and the stable input ref used for reset/Retry focus. It owns only local blank validation, not data/filtering/request effects. Native label/search input/form/submit/Clear semantics are preserved; Clear is type=button and appears for draft text, active nondefault search or request error.
- `filterPhotos(photos, query)` is pure trim/case-insensitive substring matching on description, altDescription, user.name and user.username independently. Null optional text is safe. IDs, URLs, dimensions and serialized objects are not searchable. Source order/references are preserved without mutation. A blank filter term returns its input, but the service/form reject blank requests.
- Exact TRD §7 service: `searchPhotos({ query, signal }) -> Promise<{ photos: GalleryPhoto[] }>`. No page/perPage/total from the illustrative prompt: the locked service is more precise. The default `nature` sample scenario returns all ten approved records; other terms use the pure matcher.
- The mock's deterministic 600ms timer is development/sample infrastructure only. An already-aborted signal rejects immediately; abort during latency clears the timer and listener and rejects with AbortError; completion removes the listener. No fetch/API/SDK/provider-shaped result is involved.
- A valid intent batches committed query, incremented requestAttempt and loading data with stale cards/count/error cleared before paint. Only useEffect calls the service. Its dependencies are submittedQuery/requestAttempt/stable searchService; AbortController cleanup plus a local active flag guards both resolution and rejection. Only the current attempt releases the pending-query guard; no old finalization clears newer loading or enables duplicate work.
- Pending-query identity compares trimmed submitted text case-insensitively. Identical pending requests are reused; completed identical searches intentionally refresh. Clear resets input/context to default nature, reuses an identical pending nature attempt, otherwise triggers a new default attempt even when the previous committed query already was nature. Unsent edits do not alter Retry's committed query.
- Results announce one concise loading/completed/error context outside the busy result container. Keystrokes do not change that announcement. Settled wording is `N images shown`, singular `1 image shown`, with human-readable committed context; the default says local sample collection. No API-wide total or stale loading count.
- Blank submissions preserve current results/request and show associated form-local validation. Clear removes validation and focuses input. Enter/Search keep native focus; disappearing Retry focuses the same stable input rather than the gallery.
- Empty success reports zero and an editorial EmptyState; service failure uses a safe normalized `{ type: 'api', message, retryable: true }` error with ErrorState and a native Retry button. Abort/obsolete failure is not visible error. No raw injected error details are rendered.
- A stable optional `App.searchService` injection exists for tests/review only; normal search has no magic failure query or public debug switch. Tests inject rejection/noncooperative deferred work to prove error, Retry and stale-result safeguards. The existing mock card action remains independent; cards removed during loading ignore late preparation completions.
- Representative fixture queries: `earth` → 2, `river` → 1 (nullable description), `STEReO` → 1 (description), `airtanker` → 1 (alt), `Jim Ross` → 2 (credit), `nasa-joel-kowsky` → 1 (username), `zz-no-match` → 0. Padded/case variants retain the same matches while visible input casing is preserved.
- The user's corrected Phase 6 authorization supersedes the earlier synchronous-only restrictions. It does not alter the locked planning pack: request mechanics belong here; the final production state components and state matrix were subsequently authorized in Phase 7. Phase 8 polish remains unauthorized.

## Locked planning inputs

The exact accepted eight-file planning pack is in docs/planning/. Authority: internship task → Master Workflow → PRD → TRD → App Flow → Design Brief → Implementation Plan → implementation. The Planning Index is a summary only. Do not edit these locked inputs or silently change scope; report genuine contradictions for a decision.

## Security / future integration

No credentials or remote content are required to run this phase. Never commit keys, local .env files or sensitive logs. .env.example contains comments only; actual .env files are ignored. Never request/place the Secret Key in frontend code or use a VITE_ Access Key.

Later live integration is React/useEffect → frontend service/native fetch → narrowly scoped server/serverless credential proxy → Unsplash, **not implemented here**. It requires passing Gate A, current official compliance verification and explicit authorization. Public production release separately requires Unsplash policy-fit verification; educational/demo intent is not automatic approval.

## Phase 7 state presentation

- GallerySection retains one named Gallery section, permanent result container and concise status region. Loading renders only GallerySkeleton, success only existing ImageGrid, empty only EmptyState and request error only ErrorState. Stale cards/counts/errors do not appear as current content while replacing a request.
- GallerySkeleton uses four deterministic decorative placeholders with 4:5, 3:2, 1:1 and 4:3 media ratios. Four fills one maximum-width desktop row and flows through the exact same 1/2/3/4 track CSS declarations as ImageGrid. Neutral blocks and two short abstract lines do not imitate real records or interactive buttons. It is aria-hidden, static in normal and reduced-motion modes, with no timer, shimmer or animation library.
- EmptyState follows the locked editorial “Nothing in this frame.” direction, names the committed query and offers “Show all sample photographs.” Its native reset button targets the existing SearchForm. The form's onReset invokes the same Clear handler, clears form-local validation and returns focus to input; App's proven nature/reset request path is unchanged. This also handles blank validation after an empty result, without duplicating request logic.
- ErrorState is a compact, left-aligned dark bordered panel, with safe fixed copy and a native Retry button only when retryable. Raw errors are not accepted as display copy. A single outer result-status region communicates error/loading/settled transitions; state components do not add competing live regions or automatic heading focus.
- Search stays enabled during requests so another submitted query can supersede the current one. Its button retains the accessible name Search and reserves space for a static busy ellipsis; aria-busy and committed-query help communicate current work without changing button width. Input drafts do not change the committed query. Duplicate suppression remains the original request guard, not a new UI-side request mechanism.
- Existing ImageCard media-failure and Download idle/busy/ready/error states remain unchanged. Failed media keeps its reserved slot/credit/actions; Download disables only its own busy action and offers the truthful “Sample ready. No automatic file save.” link after success. Failures never become gallery ErrorState. Tests/review injection remain bounded outside normal UI; no debug switch, magic query or random failure is shipped.
- The Phase 6 useEffect/service/controller/guard/reset/Retry implementation is unchanged; App only passes presentation props to SearchForm. The sample service remains deterministic 600ms and card preparation 700ms. No new dependencies, palette, typography system, hero composition or Grid behavior were introduced.
- Component/integration tests cover exclusive states, stable region identity, native empty recovery, safe retryable/nonretryable errors, busy replacement, retry outcomes and collection-level card failures. Existing lifecycle regressions remain. Browser/keyboard/reflow/contrast/reduced-motion results and the explicit state matrix accompany the Phase 7 review evidence; no cross-browser or screen-reader certification is claimed.

## Phase 8 editorial polish

- Fresh pre-change review used the approved Phase 7 checkpoint `652c363` and 191 passing baseline tests. Compact header/hero rhythm brings photography forward; the redundant kicker is removed while the locked headline, serif scale, dark palette and asymmetric desktop composition remain.
- Below 560px, the query input owns a full row and native Clear/Search controls wrap beneath it. Gallery title/disclosure share a wrapping heading row; live status remains separate and stable. Existing Grid breakpoints, mixed intrinsic ratios, source order and maximum four columns are unchanged.
- Credit/action rails use a smaller readable metadata tier and natural wrapping. Photo source retains the exact provenance destination; idle status is “No automatic file save.” Full credits, image fallback, dynamic sample statuses, 44px controls and explicit ready links remain available.
- Native dark color-scheme, palette-based caret/selection and accurate skip wording improve consistency/accessibility without new features, dependencies, fonts, assets or animation.
- Validation: 194 passing tests, lint/build/diff checks, development and compiled-preview Chromium state checks at all nine required widths plus breakpoint boundaries, body/control text-enlargement and long-content stress. Separate final anti-slop and before/after evidence accompany the Phase 8 report.
- These are local Chromium checks, not cross-browser, physical-device, native-browser-zoom or actual screen-reader certification. Simulated 200% body/control text enlargement leaves independently fixed display/metadata sizes unchanged.

## Next authorization boundary

Stop after the Phase 8 local commit, report and evidence package. The next action requires a **separate Hard Gate A review**; Gate A remains unevaluated and unpassed. Phase 9 is not authorized. Do not begin live Unsplash/proxy/credential work, real download registration, deployment or production-readiness claims.
