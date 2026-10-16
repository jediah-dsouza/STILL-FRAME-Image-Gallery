# Product Requirements Document (PRD)

## Grid-Based Image Gallery with Search

**Authority:** INTERNSHIP-TASK.md → MASTER-FRONTEND-WEB-DEVELOPMENT-WORKFLOW.md → 01-PRD.md → 02-TRD.md → 03-APP-FLOW.md → 04-DESIGN-BRIEF.md → 05-IMPLEMENTATION-PLAN.md → existing implementation, once implementation begins. 00-PLANNING-INDEX.md summarizes the pack and does not override it.

**Amendment status:** Approved specification decisions recorded; application development, Phase 1, proxy implementation, credential setup and authenticated requests remain unauthorized until their separate approvals.

**Project type:** React virtual/remote internship task\
**Product stage:** Planning / pre-implementation\
**Primary objective:** Build a polished, responsive image discovery
gallery that fetches photographs from the Unsplash API, supports keyword
search, and provides a compliant download action for each image.\
**Scope principle:** Frontend-first with only the approved minimal server-side/serverless credential proxy for later live integration; no general backend. The governing hierarchy is stated above.

> **Naming note:** The assignment text contains the heading "Random
> Quote Generator," but every stated feature and learning objective
> describes a grid-based image gallery. This PRD therefore treats
> **Grid-Based Image Gallery with Search** as the actual product.

------------------------------------------------------------------------

## 1. Product Summary

The application is a focused image-discovery experience. A visitor lands
on a visually strong gallery, sees a curated/default set of photographs,
searches for a subject, receives responsive image results, can inspect
photographer attribution, and can trigger a download action.

The project is intentionally small in page count but complete in product
states. It must demonstrate:

-   API fetching with React `useEffect`
-   user input and search handling
-   CSS Grid for the gallery
-   Flexbox for local alignment and controls
-   responsive behavior
-   loading, success, empty, and error states
-   accessible interactions
-   a download action per image
-   high-quality visual design rather than generic "AI SaaS" styling

------------------------------------------------------------------------

## 2. Product Problem

Users need a fast, pleasant way to discover high-quality photographs by
topic without navigating a dense or distracting interface.

The internship evaluator additionally needs clear evidence that the
implementation demonstrates the assigned frontend concepts rather than
hiding them behind unnecessary abstractions or dependencies.

------------------------------------------------------------------------

## 3. Users

### Primary user

A general visitor who wants to browse and search photographs quickly.

### Secondary user

The internship evaluator/reviewer, who needs to verify React
fundamentals, API consumption, responsive CSS, component structure,
search handling, and code quality.

### User job story

> When I want visual inspiration for a topic, I want to search a clean
> image gallery and quickly scan useful results, so that I can find and
> download an image with minimal friction.

------------------------------------------------------------------------

## 4. Product Goals

1.  Make image search immediately understandable.
2.  Return and display relevant Unsplash results reliably.
3.  Make the gallery visually memorable and image-first.
4.  Demonstrate React `useEffect` and state management clearly.
5.  Make the experience work across mobile, tablet, laptop, and desktop.
6.  Handle network and content states intentionally.
7.  Make image download discoverable without overwhelming the
    photography.
8.  Meet baseline accessibility and keyboard usability.
9.  Keep implementation understandable enough to explain in an
    internship review.

### Success criteria

-   A first-time user can understand the purpose and search without
    instruction.
-   Default/sample gallery renders successfully.
-   A valid search updates the gallery with relevant API results.
-   Search can be submitted by button and Enter key.
-   Loading feedback appears during requests.
-   Empty results produce a useful empty state.
-   API/network failure produces a useful retry path.
-   Every rendered image has meaningful alt text/fallback text.
-   Every image exposes photographer attribution.
-   Every image exposes a download control.
-   Layout has no horizontal overflow at supported widths.
-   Keyboard focus is visible and logical.
-   Production build completes without errors.
-   No Secret Key is committed to source control.

------------------------------------------------------------------------

## 5. MVP Definition

### Must have

- Single-route React application with visible useEffect-driven fetching.
- Initial/default nature gallery, explicit user-input keyword search, loading/success/empty/error and same-query Retry.
- Responsive CSS Grid, Flexbox where appropriate, image cards, attribution and per-image Download.
- Semantic/keyboard accessibility, request/rate-limit awareness and tested sample/mock mode before live integration.
- Later compliant Unsplash integration through the approved minimal credential boundary.

### Included supporting behavior

- Rendered result count/context: “N images shown.”
- Skeleton replacement, query context, reset to default and duplicate pending-request guard.
- Below-fold lazy loading, reduced motion and visible photographer/source links.

### Locked stack

React + Vite + JavaScript, authored CSS, native fetch, one route `/`. No router, TypeScript, Tailwind, Redux/Zustand/global-state library, React Query/equivalent fetching abstraction, UI component framework, masonry library or animation framework. Preserve visible useEffect fetching, user input handling, Grid, Flexbox, responsive behavior, Unsplash integration and per-image Download learning objectives.

### Not now / separately approved changes only

No authentication, accounts, favorites persistence, collections, uploads, comments, admin, database, sessions, general backend, infinite scroll, lightbox, theme switching, advanced filters or pagination unless separately approved. The only approved server-side scope is the minimal credential proxy for later live search/download registration.

------------------------------------------------------------------------

## 6. Information Architecture

``` text
Application
└── Gallery / Home (/)
    ├── App Header
    ├── Intro / Search Hero
    ├── Search Controls
    ├── Results Context
    ├── Gallery
    │   └── Image Card × N
    ├── Loading State
    ├── Empty State
    ├── Error State
    └── Footer / Attribution
```

This is deliberately a **one-route application**. Additional pages would
not improve the assigned learning goals and would add unnecessary scope.

------------------------------------------------------------------------

## 7. Complete Page / Route Inventory

### Route: `/` --- Gallery / Home

**Purpose:** Search, browse, attribute, and download photographs.\
**Audience:** All users.\
**Primary action:** Search for images.\
**Secondary actions:** Browse default results, open photographer/photo
source, download an image, retry failed requests, clear search.\
**Required data:** Unsplash photo results or local sample data.\
**Authentication:** None.\
**SEO:** Basic title, description, semantic heading structure, image alt
text.

### Every component responsibility on `/`

This inventory defines UI responsibilities, not one source file for every anatomical element. Use stable responsibility/behavior/reuse to justify extraction; keep simple controls and wrappers inline when clearer. Shared search/result state belongs at application coordination level. Download state belongs locally to each ImageCard; no global downloadingId.

#### A. `AppShell`

-   page-level wrapper
-   max-width/container behavior
-   global background and foreground system
-   skip-link target

#### B. `SkipLink`

-   "Skip to gallery"
-   keyboard-visible only when focused

#### C. `Header`

-   compact wordmark/product name
-   short descriptor such as "Image Search"
-   optional API/source label
-   no unnecessary navigation for a single-page tool

#### D. `HeroSection`

-   eyebrow/utility label
-   H1
-   concise supporting copy
-   search form

#### E. `SearchForm`

-   visible label or accessible label
-   `SearchInput`
-   `SearchButton`
-   `ClearSearchButton` when query exists; resets to nature and returns focus to input
-   submit via Enter
-   disabled/loading behavior
-   validation for blank-only submission

#### F. `ResultsHeader`

-   current query label
-   rendered result count “N images shown”; not total API matches
-   optional "showing results for ..."
-   status announcement using an appropriate live region

#### G. `GallerySection`

-   semantic section heading (visually hidden if needed)
-   `ImageGrid`
-   state switching among skeleton/error/empty/results

#### H. `ImageGrid`

-   CSS Grid container
-   responsive column strategy
-   list semantics if implemented as a list

#### I. `ImageCard`

Every card contains: - `ImageMedia` - responsive image - alt text from
`alt_description` / description fallback - lazy loading after initial
viewport - `ImageOverlay` or metadata rail - `PhotographerAttribution` -
photographer name - source/profile link - "on Unsplash" attribution -
`DownloadButton` - accessible name containing image/photographer
context - loading/disabled state while registering download - optional
external-link control to source photo - focus-visible treatment - hover
treatment that does not hide essential actions on touch devices

#### J. `GallerySkeleton`

-   representative card placeholders
-   no excessive shimmer
-   respects reduced motion

#### K. `EmptyState`

-   message: no images found
-   current query
-   suggestion to broaden/change terms
-   clear/reset action

#### L. `ErrorState`

-   concise error explanation
-   retry button
-   special copy for rate limiting when detectable
-   preserves the user's query

#### M. `Footer`

-   concise Unsplash attribution/source notice
-   project context if desired
-   no large marketing footer

#### N. Inline download status

-   local preparation/registration/delivery feedback
-   non-blocking accessible inline announcement
-   no initial global toast architecture or unsupported saved-file success claim

------------------------------------------------------------------------

## 8. User Stories & Acceptance Criteria

### Search and initial gallery

**As a visitor, I want to browse useful default photos and explicitly search by subject.**

`query` is editable input; `submittedQuery` is the committed request; `requestAttempt` is an explicit attempt trigger. Default query is exactly `nature`; initial input is empty. Enter/Search explicitly submit after trimming leading/trailing whitespace; blank-only input creates no request. Keystrokes never fetch. A completed identical query may intentionally refresh; an identical in-flight duplicate is suppressed. A different valid query may supersede the pending request. ClearSearchButton empties input, restores the nature gallery and focuses the input. Reuse an identical pending nature request; otherwise reset triggers a default attempt even if submittedQuery already equals nature. Retry increments requestAttempt for the last submittedQuery through the same effect path, not duplicated fetching logic or unsent input edits.

Sample records render immediately on entry; live entry later requests nature with skeletons through the approved proxy.

### Async recovery and result context

**As a visitor, I want understandable feedback and recovery without losing search access.**

The fetching effect conceptually depends on submittedQuery and requestAttempt. At request start clear stale request errors, replace the active results with gallery skeletons, hide stale counts, and mark the stable result region busy. AbortController cancels obsolete requests; a local active/current-attempt guard prevents obsolete success, rejection and finalization from committing any state or clearing a newer loading state. Cleanup marks the attempt inactive and aborts it. Abort is cancellation, not a user-visible error. The mock service must support the same abortable contract and reproducible out-of-order scenarios. Keep Strict Mode cleanup correct; do not disable it to conceal defects. Render settled success/empty/error deliberately; show “N images shown” from rendered photos only, not the API-wide total or a stale count.

Shell/search remain visible and editable; Retry uses the last committed query, not unsent input. Network/auth/rate-limit errors have safe understandable copy and no rapid automatic retries.

### Responsive gallery

**As a visitor, I want usable photographs, attribution and actions at every supported width.**

Normal CSS Grid follows DOM/reading order, never masonry or dense visual reordering. Small mobile: one column; wider mobile: two only when content/actions stay usable; tablet: two to three; desktop: three to four; maximum intended columns: four. Do not allow illustrative auto-fit rules to generate five or more columns. Verify 320, 375, 430, 768, 1024, 1280 and 1440+ pixels plus intermediate transitions. Long photographer names wrap without pushing actions outside cards; avoid fixed metadata heights and horizontal page overflow.

### Download

**As a visitor, I want an easy and honestly described way to save an image.**

Each ImageCard owns download busy/error state, an immediate same-card in-flight guard and inline feedback; no global downloadingId or initial global toast architecture. Other cards and search remain usable. Activation → guard → “Preparing download...” → required registration through the approved API boundary → validated image resource → supported browser delivery/navigation or an explicit “Open image to save” ready link → restore/update local UI. Registration failure stays local and never intentionally falls back to bypassing required registration. Registration, delivery initiation and proving an actual save are distinct: do not display “Downloaded” merely because registration succeeded; JavaScript generally cannot prove the user saved a file. An explicit user-activated ready link is the fallback for blocked asynchronous popups/navigation; cross-origin download hints may be ignored. Use the prepared resource within that attempt without duplicate registration. On unmount/supersession, abort or ignore pending work and prevent unexpected late navigation; cancellation cannot undo an already processed upstream registration, so do not automatically repeat it.

------------------------------------------------------------------------

## 9. UI State Matrix

| Area | Default | Loading | Success | Empty | Error / disabled |
| --- | --- | --- | --- | --- | --- |
| Search | Editable, initially empty | Editable; busy feedback, identical pending duplicate guarded | Completed same-query refresh permitted | Editable/reset | Editable; blank requests prevented |
| Results | Nature context | Searching; no stale count | N images shown | 0 images shown + query | Safe context, no stale count |
| Gallery | Immediate sample gallery or live initial loading | Skeleton replacement + busy region | Cards | Helpful message/reset | Error + appropriate Retry |
| Download | Per-card action | Local Preparing download... | Registered-resource delivery/link; not proof of save | Not applicable | Local inline failure; guard busy activation |

Also verify hover, focus, active, disabled, image failure and download busy/error. Default is a UX condition, not extra duplicated boolean state.

------------------------------------------------------------------------

## 10. Data Requirements

### UI photo model

The following is documentation-only shape notation; the implementation language is JavaScript, not TypeScript.

```text
GalleryPhoto = {
  id: string;
  width: number;
  height: number;
  color: string | null;
  description: string | null;
  altDescription: string | null;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
    download: string;
    downloadLocation: string;
  };
  user: {
    name: string;
    username: string;
    profileUrl: string;
  };
};
```

The frontend should map the external API response into this UI-oriented
model rather than scattering raw response assumptions throughout
components.

------------------------------------------------------------------------

### Normalization contract

normalizePhoto is a pure boundary transformation, applied once per live record by the frontend service. Preserve the GalleryPhoto model; tolerate nullable optional descriptions/alt/color. Sample fixtures are already normalized. Components do not understand raw response fields or normalize again.

Reject malformed records lacking required identity, positive dimensions, a usable image URL, attribution/source identity/links, or required download information. Allow validated image-variant fallback; use null for absent optional text, never invented content. TRD §7 specifies required fields and the mixed/all-invalid batch policy. A valid empty result differs from an invalid payload.

## 11. Sample Data Requirement & Gate

Use approximately 8–12 already-normalized GalleryPhoto records with appropriately licensed local fixture assets and documented provenance. Cover landscape, portrait, long photographer name, missing description, local image failure and normal successful records. All required scenarios are deterministic and work without credentials, live Unsplash requests or external network/assets/fonts. A deliberate missing local image can exercise failure. The same production ImageGrid/ImageCard render fixtures and later live-normalized data; no disposable second UI. Abortable mock search/registration provides loading/success/empty/error/retry, stale-request and per-card download busy/success/failure scenarios. Mock actions use local resources and do not claim a real save. Do not locally mirror API-returned photos as a substitute for live hotlinking compliance.

Testing starts during sample development, not after live integration: query/normalization/error unit tests during Phase 3, card component tests during Phase 4, search integration tests during Phase 6, and state/retry/cancellation/download tests during Phase 7. Before Gate A, unit/component/integration tests, manual accessibility, responsive checks and visual QA must exist and pass, with lint, production build and preview smoke testing. Phase 12 expands the existing suite for live API/network/authentication/rate-limit/download-registration behavior and production regressions; it is not the first testing phase.

HARD GATE A remains before all live integration/proxy implementation. Its authoritative full criterion checklist and evidence format are in 05-IMPLEMENTATION-PLAN.md. Review exact revision/commit, evidence, per-criterion pass/fail (or disclosed actual-screen-reader deferral under that policy), unresolved issues and explicit human approval. This amendment does not pass Gate A; no application exists yet. Even a passing Gate A does not automatically authorize integration: the approved credential boundary, current immediately pre-Phase-9 compliance checkpoint and explicit human integration approval are additionally required. Public production release separately requires policy-fit verification.

------------------------------------------------------------------------

## 12. Non-Functional Requirements

### Accessibility

Use semantic landmarks, one H1, associated search label and native form/button/link semantics. Keyboard users must complete primary flows. Provide contextual Download names, meaningful alt/fallback without invented image details, visible focus and a stable usable skip-link destination in every result state. Preserve focus when Clear/Retry controls disappear; reset focuses input. Use one concise results announcement, decorative skeletons and appropriate aria-busy; local download feedback must not steal focus. No hover-only essential functionality. Respect reduced motion; test 320 CSS-pixel reflow and enlarged text/zoom. A real baseline screen-reader session SHOULD be performed when a suitable actual assistive-technology environment is reasonably available. If unavailable in the authorized testing environment, explicitly disclose and defer manual AT verification; tooling absence alone is not a Hard Gate A blocker or a bar to Phase 9 entry, provided the remaining required accessibility baseline passes. Apply the project-specific screen-reader policy in 05-IMPLEMENTATION-PLAN.md; keyboard testing and accessibility-tree inspection are not equivalent to a real screen-reader session. Normal text contrast ≥4.5:1; large text ≥3:1; essential non-text UI/focus boundaries meet applicable contrast (normally ≥3:1). Aim for approximately 44×44 CSS-pixel important targets where practical. Cream #F6F1E8 on ember #F06A2A is about 2.74:1 and must not be used where it fails text contrast. Ink #10100F on ember is about 6.16:1 and may be used after measuring the rendered pair. Decorative low-contrast borders cannot be the sole essential control/state indicator.

### Performance

-   use `small`/`regular` image variants intentionally
-   `loading="lazy"` for below-fold images
-   reserve image space using aspect ratio to reduce layout shift
-   avoid downloading `full`/`raw` images for gallery thumbnails
-   avoid unnecessary dependencies
-   prevent redundant requests where practical

### Security/configuration and compliance

Live architecture: React → frontend service → native fetch to our same-origin API boundary → minimal server-side/serverless credential proxy → Unsplash. Keep both Access Key and Secret Key out of browser-delivered code, source maps, requests and logs. A VITE_ variable is not a confidentiality boundary. The proxy keeps the Access Key server-side, validates/normalizes allowed inputs, performs only required search/download-registration requests and returns only data needed by the frontend. No database, authentication system, accounts, sessions, persistence, business-domain backend or unnecessary server framework. This public search/download flow does not need the Secret Key; do not request it. No proxy implementation, authenticated request or credential provisioning is authorized by this amendment.

Immediately before Phase 9, reverify current official Unsplash documentation/guidelines for credential confidentiality, API-returned hotlinked image URLs, preservation of required parameters (including ixid where applicable), photographer + Unsplash attribution, required referral parameters on Unsplash links, and photo-provided download_location registration. All links back to Unsplash use required utm_source=<approved_app_name>&utm_medium=referral parameters while retaining required existing parameters. Registration is not the image file. Record sources, verification date, decisions and explicit integration approval. Official checkpoint sources: https://unsplash.com/documentation and https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines . Educational/demo intent and technical API success are not public production-policy approval. The search/browse/download concept may overlap restrictions on replicating Unsplash's core experience; verify policy fit before any public production release that depends on Unsplash. Stop/report a conflict instead of silently redesigning the internship assignment.

Never commit credentials; local actual .env files are ignored, with a placeholder-only .env.example retained. Server-only runtime configuration is documented before live integration.

### Browser targets

Latest stable: - Chrome - Edge - Firefox - Safari

------------------------------------------------------------------------

## 13. Edge Cases

-   whitespace-only query
-   very long query
-   special characters
-   no results
-   slow network
-   offline/network failure
-   API 401/403
-   API 429/rate limit
-   malformed/unexpected response
-   missing `alt_description`
-   missing `description`
-   missing photographer optional fields
-   image load failure
-   download registration failure
-   repeated fast searches
-   stale response arriving after a newer search
-   narrow 320px viewport
-   keyboard-only navigation

------------------------------------------------------------------------

## 14. Product Constraints

-   React is required by the learning goals.
-   `useEffect` must visibly participate in data fetching.
-   CSS Grid must structure the image gallery.
-   Flexbox must be used where appropriate for one-dimensional component
    layout.
-   Search must be user-input driven.
-   Download must exist per image.
-   The product must not grow into an Unsplash clone; keep it a focused
    educational gallery experience.
-   Photographer/source attribution must be preserved.
-   Only the explicitly approved minimal credential proxy is in server-side scope; no general backend is silently added.

------------------------------------------------------------------------

## 15. Definition of Done

The product is done only when it:

-   works end-to-end
-   is understandable
-   is responsive
-   handles loading/empty/error/success states
-   is accessible at baseline
-   passes defined tests
-   is visually correct against the Design Brief
-   performs acceptably
-   is maintainable
-   builds successfully for production
-   has setup and environment documentation
-   meets Gate A, pre-Phase-9 compliance and pre-public-release policy-fit requirements at their respective checkpoints
