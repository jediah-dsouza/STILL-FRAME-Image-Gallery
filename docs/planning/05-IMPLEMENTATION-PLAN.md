# Implementation Plan

## Grid-Based Image Gallery with Search

**Authority:** INTERNSHIP-TASK.md → MASTER-FRONTEND-WEB-DEVELOPMENT-WORKFLOW.md → 01-PRD.md → 02-TRD.md → 03-APP-FLOW.md → 04-DESIGN-BRIEF.md → 05-IMPLEMENTATION-PLAN.md → existing implementation, once implementation begins. 00-PLANNING-INDEX.md summarizes the pack and does not override it.

**Amendment status:** Approved specification decisions recorded; application development, Phase 1, proxy implementation, credential setup and authenticated requests remain unauthorized until their separate approvals.

**Execution model:** gated, vertical-slice frontend development\
**Hard rule:** do not advance to live API integration until the
application is fully built, designed, tested, and working with sample
data.

------------------------------------------------------------------------

## Phase 0 --- Planning Gate

### Tasks

-   approve PRD
-   approve TRD
-   approve App Flow
-   approve Design Brief
-   record the user-reported prior successful technical API test; do not repeat authenticated requests during planning
-   confirm project remains one route
-   confirm MVP/non-goals
-   confirm approved minimal credential-proxy architecture, never browser VITE_ keys
-   confirm locked stack/exclusions and search/reset/retry/count/cancellation contracts
-   record later compliance/public-policy checkpoints and available no-application workspace

### Exit criteria

``` text
[ ] product understood
[ ] primary user defined
[ ] primary flow defined
[ ] all pages/routes known
[ ] all major components inventoried
[ ] responsive strategy known
[ ] data model known
[ ] UI states known
[ ] MVP locked
```

**Do not code before this gate passes and explicit Phase 1 authorization is given.** Specification amendment approval is not implementation authorization. Confirm the intended project directory before authorized setup; the available workspace currently contains no application.

------------------------------------------------------------------------

## Phase 1 --- Project Initialization

### Tasks

1.  Only after explicit authorization, create the Vite React JavaScript project (no TypeScript).
2.  Remove demo boilerplate.
3.  Configure ESLint.
4.  Initialize Git.
5.  Create folder structure from TRD.
6.  Add placeholder-only `.env.example` and later server-only UNSPLASH_ACCESS_KEY setup documentation; no VITE_UNSPLASH_ACCESS_KEY or credentials.
7.  Ignore actual `.env*` files while explicitly retaining `.env.example`; review staged files without printing values.
8.  Create README skeleton.
9.  Add design token CSS in this later authorized phase.
10. Establish Vitest + React Testing Library/DOM test tooling and scripts before sample development; do not defer testing to Phase 12.
11. Keep locked exclusions; do not implement the proxy during sample development.

### Suggested commits

-   `chore: initialize vite react project`
-   `chore: establish project structure and environment docs`
-   `style: add foundational design tokens`

### Exit criteria

-   dev server works
-   no console errors
-   repository clean
-   no credentials committed

------------------------------------------------------------------------

React + Vite + JavaScript, authored CSS, native fetch, one route `/`. No router, TypeScript, Tailwind, Redux/Zustand/global-state library, React Query/equivalent fetching abstraction, UI component framework, masonry library or animation framework. Preserve visible useEffect fetching, user input handling, Grid, Flexbox, responsive behavior, Unsplash integration and per-image Download learning objectives.

No authentication, accounts, favorites persistence, collections, uploads, comments, admin, database, sessions, general backend, infinite scroll, lightbox, theme switching, advanced filters or pagination unless separately approved. The only approved server-side scope is the minimal credential proxy for later live search/download registration.

## Phase 2 --- Semantic App Shell

### Build

-   `AppShell`
-   `SkipLink`
-   `Header`
-   `main`
-   `HeroSection`
-   `SearchForm` markup
-   `GallerySection`
-   `Footer`

### Rules

-   semantic HTML first
-   no API yet
-   controls are functional at basic event level
-   one H1
-   labels/contextual action names, stable skip destination and focus persistence in place
-   apply measurable TRD/Design Brief accessibility criteria from the start

### Exit criteria

-   document makes sense without CSS
-   keyboard can reach controls
-   form can submit a test handler

------------------------------------------------------------------------

## Phase 3 --- Sample Data & UI Model

### Tasks

-   create `GalleryPhoto` normalized shape
-   create approximately 8–12 normalized sample records with licensed local assets/provenance
-   include portrait, landscape, long name, missing description, image failure and normal successful cases
-   define pure normalizePhoto and explicit malformed-record policy per TRD; normalize live data once, not fixtures/rendering
-   add query/normalization/error mapping unit tests as utilities are introduced

### Exit criteria

-   sample data uses exactly the shape the final components will consume
-   no raw Unsplash response assumptions inside card markup

------------------------------------------------------------------------

Use approximately 8–12 already-normalized GalleryPhoto records with appropriately licensed local fixture assets and documented provenance. Cover landscape, portrait, long photographer name, missing description, local image failure and normal successful records. All required scenarios are deterministic and work without credentials, live Unsplash requests or external network/assets/fonts. A deliberate missing local image can exercise failure. The same production ImageGrid/ImageCard render fixtures and later live-normalized data; no disposable second UI. Abortable mock search/registration provides loading/success/empty/error/retry, stale-request and per-card download busy/success/failure scenarios. Mock actions use local resources and do not claim a real save. Do not locally mirror API-returned photos as a substitute for live hotlinking compliance.

## Phase 4 --- First Vertical Slice: Image Card

Build one complete card:

``` text
sample data
  ↓
ImageCard
  ├── image
  ├── alt text
  ├── attribution
  ├── source link
  ├── download control (mock behavior)
  ├── hover
  ├── focus
  └── responsive/touch behavior
```

### Test

-   keyboard
-   long photographer name
-   missing description
-   portrait/landscape
-   image loading/failure fallback strategy

### Exit criteria

One card is visually and behaviorally production-quality with local fixtures before multiplying it. Card component tests already cover attribution, alt fallback, image failure, mock local download busy/success/failure and repeated-click guard. A mock registration never proves a saved file.

------------------------------------------------------------------------

## Phase 5 --- Gallery Grid & Responsive Layout

### Tasks

-   `ImageGrid`
-   CSS Grid implementation
-   fluid container
-   Flexbox metadata rows
-   normal Grid/DOM order, no masonry/dense reordering; maximum four columns
-   responsive one-column small mobile, two wider mobile only when usable, two–three tablet, three–four desktop
-   transition-width checks, wrapping long names and no fixed metadata heights
-   image aspect handling
-   spacing/rhythm

### Viewports

-   320
-   375
-   430
-   768
-   1024
-   1280
-   1440+

### Exit criteria

-   no horizontal overflow
-   cards remain legible
-   touch actions available
-   gallery rhythm feels intentional

------------------------------------------------------------------------

Normal CSS Grid follows DOM/reading order, never masonry or dense visual reordering. Small mobile: one column; wider mobile: two only when content/actions stay usable; tablet: two to three; desktop: three to four; maximum intended columns: four. Do not allow illustrative auto-fit rules to generate five or more columns. Verify 320, 375, 430, 768, 1024, 1280 and 1440+ pixels plus intermediate transitions. Long photographer names wrap without pushing actions outside cards; avoid fixed metadata heights and horizontal page overflow.

## Phase 6 --- Search with Sample Data

### Tasks

`query` is editable input; `submittedQuery` is the committed request; `requestAttempt` is an explicit attempt trigger. Default query is exactly `nature`; initial input is empty. Enter/Search explicitly submit after trimming leading/trailing whitespace; blank-only input creates no request. Keystrokes never fetch. A completed identical query may intentionally refresh; an identical in-flight duplicate is suppressed. A different valid query may supersede the pending request. ClearSearchButton empties input, restores the nature gallery and focuses the input. Reuse an identical pending nature request; otherwise reset triggers a default attempt even if submittedQuery already equals nature. Retry increments requestAttempt for the last submittedQuery through the same effect path, not duplicated fetching logic or unsent input edits.

Use a stable deterministic abortable mock service with the same final frontend service signature. Keep request synchronization in useEffect driven by submittedQuery/requestAttempt, not duplicated event-handler fetch logic. Results context uses “N images shown.” No live API/proxy implementation.

### Tests and exit criteria

Component/integration tests cover Enter, Search, blank input, trimming, reset/focus, completed same-query refresh and identical pending duplicate suppression. Search/default/reset/context work with local fixtures and the same production UI.

------------------------------------------------------------------------

## Phase 7 --- Complete UI States with Sample Data

The fetching effect conceptually depends on submittedQuery and requestAttempt. At request start clear stale request errors, replace the active results with gallery skeletons, hide stale counts, and mark the stable result region busy. AbortController cancels obsolete requests; a local active/current-attempt guard prevents obsolete success, rejection and finalization from committing any state or clearing a newer loading state. Cleanup marks the attempt inactive and aborts it. Abort is cancellation, not a user-visible error. The mock service must support the same abortable contract and reproducible out-of-order scenarios. Keep Strict Mode cleanup correct; do not disable it to conceal defects. Render settled success/empty/error deliberately; show “N images shown” from rendered photos only, not the API-wide total or a stale count.

Each ImageCard owns download busy/error state, an immediate same-card in-flight guard and inline feedback; no global downloadingId or initial global toast architecture. Other cards and search remain usable. Activation → guard → “Preparing download...” → required registration through the approved API boundary → validated image resource → supported browser delivery/navigation or an explicit “Open image to save” ready link → restore/update local UI. Registration failure stays local and never intentionally falls back to bypassing required registration. Registration, delivery initiation and proving an actual save are distinct: do not display “Downloaded” merely because registration succeeded; JavaScript generally cannot prove the user saved a file. An explicit user-activated ready link is the fallback for blocked asynchronous popups/navigation; cross-origin download hints may be ignored. Use the prepared resource within that attempt without duplicate registration. On unmount/supersession, abort or ignore pending work and prevent unexpected late navigation; cancellation cannot undo an already processed upstream registration, so do not automatically repeat it.

### Deterministic scenarios

Preview default, hover/focus/active/disabled, loading, success, empty/reset, error/same-query Retry, image failure and local download busy/success/error without network. Tests cover active-attempt commitment, old resolutions/rejections/finalization, abort cancellation and repeated-click guards.

### Exit criteria

All relevant states work interactively with fixtures. Unit/component/integration tests and manual accessibility/responsive checks already run; complete visual review follows in Phase 8, before Gate A.

------------------------------------------------------------------------

Testing starts during sample development, not after live integration: query/normalization/error unit tests during Phase 3, card component tests during Phase 4, search integration tests during Phase 6, and state/retry/cancellation/download tests during Phase 7. Before Gate A, unit/component/integration tests, manual accessibility, responsive checks and visual QA must exist and pass, with lint, production build and preview smoke testing. Phase 12 expands the existing suite for live API/network/authentication/rate-limit/download-registration behavior and production regressions; it is not the first testing phase.

## Phase 8 --- Design Polish / Anti-Slop Pass

Use the installed design skills as review lenses.

### Pass A --- anti-generic

-   remove generic SaaS patterns
-   remove unnecessary pills/gradients/glow
-   check card radius/shadows
-   strengthen editorial composition

### Pass B --- typography

-   H1 scale
-   line lengths
-   metadata hierarchy
-   control typography

### Pass C --- spacing

-   consistent token use
-   optical alignment
-   gallery gaps
-   mobile density

### Pass D --- interaction

-   hover
-   focus
-   active
-   disabled
-   reduced motion

### Pass E --- distinctive identity

-   ensure the experience is memorable without becoming decorative

### Exit criteria

Design Brief QA passes.

------------------------------------------------------------------------

# HARD GATE A --- SAMPLE-DATA COMPLETION

**STOP HERE. No live Unsplash integration or proxy implementation yet.**

Required scenarios run without credentials, live Unsplash requests or network dependency, using licensed local fixtures, the normalized model and production UI.

```text
FUNCTIONAL
[ ] default sample nature gallery
[ ] valid search
[ ] Enter submission
[ ] Search button submission
[ ] trimming and blank-query prevention
[ ] completed same-query refresh and identical in-flight duplicate suppression
[ ] clear/reset to nature with input focus
[ ] loading
[ ] success
[ ] empty and recovery
[ ] error and same-query Retry via requestAttempt
[ ] stale/obsolete resolution, rejection and finalization protection
[ ] abortable mocks; cancellation is not a visible error
[ ] mock per-card download success / registered-resource delivery-link behavior
[ ] mock per-card download busy state / inline feedback
[ ] mock per-card download failure, no registration bypass
[ ] immediate repeated-click guard; other cards/search remain usable

STATE
[ ] default
[ ] hover
[ ] focus
[ ] active
[ ] disabled
[ ] loading
[ ] success
[ ] empty
[ ] error
[ ] download busy/error
[ ] image failure

RESPONSIVE
[ ] 320px
[ ] 375px
[ ] 430px
[ ] 768px
[ ] 1024px
[ ] 1280px
[ ] 1440px+
[ ] intermediate transition widths
[ ] maximum four columns, DOM/reading order, no horizontal overflow
[ ] long names/actions usable; no fixed metadata heights

ACCESSIBILITY
[ ] semantic landmarks and one H1
[ ] labeled search; native form/button/link semantics
[ ] keyboard-only primary flows
[ ] stable usable skip link in every result state
[ ] visible focus and focus persistence
[ ] contextual action names and meaningful alt fallback
[ ] concise announcements and result-region busy semantics
[ ] normal text >=4.5:1, large text >=3:1 contrast
[ ] adequate essential non-text UI/focus boundaries; no failing cream-on-ember text
[ ] no hover-only essentials; approximately 44x44 important targets where practical
[ ] reduced motion
[ ] enlarged text/zoom and 320 CSS-pixel reflow
[ ] baseline actual screen-reader check: record PASS / FAIL-BLOCKER / DEFERRED MANUAL VERIFICATION under the policy below

QUALITY
[ ] sample unit tests pass
[ ] component tests pass
[ ] integration tests pass
[ ] lint passes
[ ] production build succeeds
[ ] production preview smoke test succeeds
[ ] no relevant unhandled console errors/warnings
[ ] visual QA against Design Brief, including inspected screenshots
[ ] no obvious layout shift
[ ] known limitations and fixture license/provenance documented
```

### Project-specific actual screen-reader verification policy

This internal QA amendment does not change the internship assignment or the general Master workflow's accessibility guidance. A real baseline screen-reader session SHOULD be performed when a suitable actual assistive-technology environment is reasonably available. Record the actual environment, execution status and evidence; never mark an unexecuted session PASS.

| Actual screen-reader verification | Hard Gate A classification |
| --- | --- |
| EXECUTED / PASS | Successfully performed with acceptable results. |
| EXECUTED / MATERIAL DEFECT → BLOCK | FAIL/BLOCKER while a material accessibility defect remains unresolved. |
| UNAVAILABLE → DEFERRED MANUAL VERIFICATION | Classify as **DEFERRED MANUAL ACCESSIBILITY VERIFICATION** and record **NOT EXECUTED — TOOLING UNAVAILABLE / DEFERRED MANUAL VERIFICATION**. |

When actual AT is unavailable in the authorized testing environment, absence of that session alone does NOT fail Hard Gate A or prevent Phase 9 entry, provided the rest of the required accessibility baseline has passed. Gate A must still fail for material unresolved accessibility defects or failures of its remaining required accessibility criteria. No unrelated Gate criterion is waived; a passing Gate review and explicit integration authorization remain necessary.

The available accessibility baseline remains mandatory as applicable: semantic HTML; sensible landmarks/headings; accessible control names/labels; native control semantics; keyboard operation; visible focus and focus management; meaningful alt/fallback behavior; status/live-region and loading/empty/error semantics; contrast; responsive/reflow and long-content stress; reduced-motion behavior. Accessibility-tree inspection and automated/component accessibility-oriented checks supplement this baseline where useful. Neither accessibility-tree inspection nor keyboard testing is equivalent to an actual screen-reader session.

Missing execution alone establishes no known screen-reader defect. Actual spoken announcements/timing and browse-mode interoperability remain unverified. Perform the deferred real AT session later if suitable tooling becomes available, preferably before public production release; evaluate and correct any discovered defect according to severity. Do not claim "screen-reader tested", "NVDA compatible", "VoiceOver compatible", "JAWS compatible", "screen-reader accessible" or universal WCAG conformance unless corresponding testing actually occurred and supports the precise claim.

**Observed verification limitation:** at application checkpoint `60edf2fe7bd8a51839756726d79895b1a85850de`, the authorized Amazon Linux 2023 environment had no actual supported screen reader available during the attempted baseline verification; NVDA, VoiceOver and Orca were unavailable. Actual AT status: **NOT EXECUTED — TOOLING UNAVAILABLE / DEFERRED MANUAL VERIFICATION**. This describes that observed environment only, not a claim that Amazon Linux generally cannot support AT. Prior automated/keyboard/semantic/AX/contrast/reflow evidence is not actual screen-reader evidence.

This amendment does not retroactively pass the prior Gate A review or assert screen-reader compatibility. Hard Gate A must be rerun under this policy. Phase 9 remains unauthorized by this amendment.

### Required evidence and approval record

1. Exact revision/commit and reproducible environment/commands.
2. Evidence reviewed: test/lint/build/preview results, inspected viewport/state screenshots, accessibility observations and sample-network isolation.
3. Pass/fail for **each criterion**, or explicit actual-screen-reader deferral under the policy above; a deferred session is not PASS, and a screenshot alone does not prove an interaction.
4. Unresolved issues/limitations and disposition; never silently waive failed criteria.
5. Explicit human approval of the evidence-backed decision.

**Current status: NOT RUN / NOT PASSED. No application exists yet.** Document approval is not execution evidence.

Passing Gate A does not automatically authorize live integration. Additionally require the approved minimal credential boundary, the immediately pre-Phase-9 official compliance checkpoint and explicit human integration authorization. Public production release separately requires policy-fit verification.

------------------------------------------------------------------------

## Phase 9 --- Live Unsplash Integration

### Mandatory pre-integration checkpoint

Verify Gate A's passing revision/evidence/human approval first. Immediately before integration:

Immediately before Phase 9, reverify current official Unsplash documentation/guidelines for credential confidentiality, API-returned hotlinked image URLs, preservation of required parameters (including ixid where applicable), photographer + Unsplash attribution, required referral parameters on Unsplash links, and photo-provided download_location registration. All links back to Unsplash use required utm_source=<approved_app_name>&utm_medium=referral parameters while retaining required existing parameters. Registration is not the image file. Record sources, verification date, decisions and explicit integration approval. Official checkpoint sources: https://unsplash.com/documentation and https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines . Educational/demo intent and technical API success are not public production-policy approval. The search/browse/download concept may overlap restrictions on replicating Unsplash's core experience; verify policy fit before any public production release that depends on Unsplash. Stop/report a conflict instead of silently redesigning the internship assignment.

Record approved host/runtime, same-origin development/deployment routing, server-only environment setup, application referral identifier, bounded input validation and minimal abuse/rate handling. If current requirements conflict with scope, stop/report. Obtain explicit integration authorization; do not request/provision credentials during this amendment.

### Service and credential boundary

Live architecture: React → frontend service → native fetch to our same-origin API boundary → minimal server-side/serverless credential proxy → Unsplash. Keep both Access Key and Secret Key out of browser-delivered code, source maps, requests and logs. A VITE_ variable is not a confidentiality boundary. The proxy keeps the Access Key server-side, validates/normalizes allowed inputs, performs only required search/download-registration requests and returns only data needed by the frontend. No database, authentication system, accounts, sessions, persistence, business-domain backend or unnecessary server framework. This public search/download flow does not need the Secret Key; do not request it. No proxy implementation, authenticated request or credential provisioning is authorized by this amendment.

In this later authorized phase only, implement the narrow host-appropriate handlers from TRD §7. `searchPhotos({ query, signal }) → { photos }` uses native fetch to GET /api/photos/search?query=...; upstream first page/per_page=24 is intentional, not pagination scope. Proxy returns only required fields; frontend service applies normalizePhoto once using TRD's malformed-record policy.

### React integration and exit criteria

The fetching effect conceptually depends on submittedQuery and requestAttempt. At request start clear stale request errors, replace the active results with gallery skeletons, hide stale counts, and mark the stable result region busy. AbortController cancels obsolete requests; a local active/current-attempt guard prevents obsolete success, rejection and finalization from committing any state or clearing a newer loading state. Cleanup marks the attempt inactive and aborts it. Abort is cancellation, not a user-visible error. The mock service must support the same abortable contract and reproducible out-of-order scenarios. Keep Strict Mode cleanup correct; do not disable it to conceal defects. Render settled success/empty/error deliberately; show “N images shown” from rendered photos only, not the API-wide total or a stale count.

Default nature/search work through the approved proxy with no browser credentials, using the same components as fixtures. Same-query refresh/Retry/cancellation tests pass. Prepare the narrow download-registration handler contract for Phase 10, not general backend features.

------------------------------------------------------------------------

## Phase 10 --- Real Download Integration

### Tasks

Wire `registerDownload({ photoId, downloadLocation, signal })` to POST /api/photos/download. Validate the photo-provided origin/path/ID/allowed parameters before attaching credentials; do not forward arbitrary URLs or credential-bearing redirects. Validate registration response and image-resource target; registration endpoint is not image data. Verify attribution/referral/hotlinked-image parameter requirements.

Each ImageCard owns download busy/error state, an immediate same-card in-flight guard and inline feedback; no global downloadingId or initial global toast architecture. Other cards and search remain usable. Activation → guard → “Preparing download...” → required registration through the approved API boundary → validated image resource → supported browser delivery/navigation or an explicit “Open image to save” ready link → restore/update local UI. Registration failure stays local and never intentionally falls back to bypassing required registration. Registration, delivery initiation and proving an actual save are distinct: do not display “Downloaded” merely because registration succeeded; JavaScript generally cannot prove the user saved a file. An explicit user-activated ready link is the fallback for blocked asynchronous popups/navigation; cross-origin download hints may be ignored. Use the prepared resource within that attempt without duplicate registration. On unmount/supersession, abort or ignore pending work and prevent unexpected late navigation; cancellation cannot undo an already processed upstream registration, so do not automatically repeat it.

### Exit criteria

Every card has a usable browser-compatible registered-resource delivery flow, local graceful failure, honest feedback and repeat-click protection. Test supported browsers, popup blocking and cross-origin download limitations. No global blocking, unsafe forwarding, unregistered bypass or unsupported saved-file assertion.

------------------------------------------------------------------------

## Phase 11 --- Real-Network State QA

Test: - fast success - throttled network - offline - 401/403 simulation
where possible - 429/rate-limit behavior - empty query result - rapid
consecutive searches - stale request cancellation - image load failure

### Exit criteria

Network is never assumed to be instant or reliable.

------------------------------------------------------------------------

## Phase 12 --- Expanded Live Integration & Regression Testing

This phase expands the already-passing pre-Gate-A test suite for live API behavior, network/authentication failures, rate limits, download registration/delivery and production regressions. It is not the start of testing.

### Unit

-   normalize query
-   normalize API photo
-   error mapping

### Component

-   SearchForm
-   EmptyState
-   ErrorState
-   ImageCard
-   download busy state

### Integration

-   search → loading → success
-   search → empty
-   search → error → retry

### Manual user-behavior script

1.  Open app.
2.  Tab through header/search.
3.  Search `mountains`.
4.  Confirm loading feedback.
5.  Confirm image results.
6.  Open photographer link.
7.  Trigger download.
8.  Search an improbable nonsense term.
9.  Confirm empty state.
10. Simulate offline.
11. Retry.
12. Repeat at mobile width.

### Exit criteria

All critical flows pass.

------------------------------------------------------------------------

## Phase 13 --- Visual QA

Compare against Design Brief:

``` text
[ ] spacing
[ ] alignment
[ ] typography
[ ] colors
[ ] borders
[ ] radii
[ ] image treatment
[ ] icon consistency
[ ] state consistency
[ ] mobile composition
[ ] tablet composition
[ ] desktop composition
```

Perform a specific "AI-slop scan": - no default gradient hero - no glass
cards - no excessive pills - no giant rounded containers - no decorative
blobs - no inconsistent shadows - no generic dashboard visual language

------------------------------------------------------------------------

## Phase 14 --- Cross-Browser QA

Test: - Chrome - Edge - Firefox - Safari if available

Inputs: - mouse - keyboard - touch/mobile emulation

Check: - CSS Grid - focus styles - image rendering - download/navigation
behavior - form submit - responsive breakpoints

------------------------------------------------------------------------

## Phase 15 --- Performance Pass

### Images

-   appropriate Unsplash size
-   lazy load below fold
-   reserved aspect space
-   no raw/full thumbnails

### JS

-   minimal dependencies
-   no unnecessary state
-   no redundant effects
-   abort stale requests

### CSS

-   token consistency
-   remove dead rules
-   avoid expensive effects

### Exit criteria

-   no obvious layout shifts
-   reasonable initial render
-   production bundle reviewed

------------------------------------------------------------------------

## Phase 16 --- Production Readiness Gate

``` text
FUNCTIONALITY
[ ] core search flow works
[ ] download works

RESPONSIVENESS
[ ] mobile works
[ ] tablet works
[ ] desktop works

ACCESSIBILITY
[ ] keyboard works
[ ] focus works
[ ] semantics sound

ERROR HANDLING
[ ] network error
[ ] empty results
[ ] invalid input
[ ] rate-limit behavior

QUALITY
[ ] tests pass
[ ] visual QA complete
[ ] cross-browser QA complete

SECURITY / CONFIG
[ ] Access Key and Secret Key absent from browser-delivered code
[ ] server-held Access Key only; no Secret Key required for this public flow
[ ] current pre-Phase-9 compliance recorded
[ ] policy-fit verified before any public production release
[ ] no committed credentials
[ ] environment setup documented

BUILD
[ ] npm run build succeeds
[ ] production preview smoke-tested
```

------------------------------------------------------------------------

**Public production release checkpoint:** verify and record current Unsplash policy fit for the search/browse/download concept before any public production release that depends on Unsplash. Educational/demo implementation or API success is not automatic approval. An unresolved policy fit blocks that release; do not silently redesign the assignment.

## Phase 17 --- Deployment

### Tasks

-   use the approved host/runtime with the minimal credential boundary
-   configure server-only environment; no browser VITE_ credential
-   deploy production build
-   verify deployed search
-   verify deployed image URLs
-   verify download behavior
-   check mobile production URL
-   smoke test console/network

Do not call deployment complete until the live URL passes the critical
flow.

------------------------------------------------------------------------

## Phase 18 --- Documentation & Submission

README must include: - project summary - feature list - stack - setup -
server-only environment instructions (placeholder only; no credentials) - development commands - build
command - architecture overview - Unsplash attribution/API notes - known
limitations - screenshots - deployed URL - repository URL

### Final internship submission evidence

-   responsive screenshots
-   search demonstration
-   loading/empty/error screenshots
-   download demonstration
-   code showing submittedQuery/requestAttempt → useEffect → frontend service → native fetch to approved API boundary
-   CSS Grid implementation
-   concise explanation of state flow

------------------------------------------------------------------------

## Recommended Commit Sequence

``` text
chore: initialize react project
docs: add project planning artifacts
style: establish design tokens and global foundation
feat: build semantic app shell
feat: add sample photo model and fixtures
feat: build accessible image card
feat: build responsive css grid gallery
feat: add sample-data search flow
feat: add loading empty and error states
style: complete editorial visual polish
test: verify sample-data application gate
feat: integrate unsplash search api
feat: implement unsplash download flow
test: expand live API registration and regression coverage
fix: resolve responsive and accessibility qa issues
perf: optimize image and request behavior
docs: complete setup and deployment guide
```

------------------------------------------------------------------------

## Final Rule

A stage is complete only when its exit criteria pass.

**"It renders" is not completion.**\
Completion means it works, communicates clearly, adapts responsively,
handles states, is accessible, is tested, is visually correct, performs
acceptably, and remains maintainable.
