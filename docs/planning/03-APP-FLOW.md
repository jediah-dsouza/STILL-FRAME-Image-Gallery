# Application Flow Specification

## Grid-Based Image Gallery with Search

**Authority:** INTERNSHIP-TASK.md → MASTER-FRONTEND-WEB-DEVELOPMENT-WORKFLOW.md → 01-PRD.md → 02-TRD.md → 03-APP-FLOW.md → 04-DESIGN-BRIEF.md → 05-IMPLEMENTATION-PLAN.md → existing implementation, once implementation begins. 00-PLANNING-INDEX.md summarizes the pack and does not override it.

**Amendment status:** Approved specification decisions recorded; application development, Phase 1, proxy implementation, credential setup and authenticated requests remain unauthorized until their separate approvals.

------------------------------------------------------------------------

## 1. Primary Journey

``` text
ENTER APP
   ↓
App shell renders
   ↓
Default/sample gallery state
   ↓
User focuses search
   ↓
User enters a keyword
   ↓
User submits
   ↓
Validate/normalize query
   ├── invalid/blank → remain on page + no request
   └── valid
          ↓
       Loading state
          ↓
       Fetch images
      ↙     ↓      ↘
  Success  Empty   Error
     ↓       ↓       ↓
 ImageGrid  Empty   Error + Retry
     ↓
 User scans photos
     ├── opens photographer/source
     ├── performs another search
     └── clicks Download
               ↓
       register through approved API boundary
          ↙         ↘
       success      failure
          ↓            ↓
   delivery/link    non-blocking
      target        error feedback
```

------------------------------------------------------------------------

## 2. Entry Flow

### Entry

User opens `/`.

### Immediate UI

-   Header visible
-   H1 and explanatory copy visible
-   Search form visible
-   Gallery region present
-   During sample-data stage: local normalized nature fixtures render immediately, without network dependency
-   During live stage: skeleton/loading appears while the nature request resolves through the approved proxy

### Success

User understands within a few seconds: 1. this is an image gallery 2.
they can search 3. images are sourced from Unsplash

### Failure

If the initial live request fails: - hero/search remain usable - gallery
region shows error state - Retry available

------------------------------------------------------------------------

## 3. Search Flow

```text
input → query (typing only)
  → Enter/Search → trim → blank? no request
  → identical pending query? suppress duplicate
  → otherwise commit submittedQuery + requestAttempt
  → useEffect → abortable sample service OR authorized frontend service → proxy → Unsplash
  → loading → active success / empty / error
```

`query` is editable input; `submittedQuery` is the committed request; `requestAttempt` is an explicit attempt trigger. Default query is exactly `nature`; initial input is empty. Enter/Search explicitly submit after trimming leading/trailing whitespace; blank-only input creates no request. Keystrokes never fetch. A completed identical query may intentionally refresh; an identical in-flight duplicate is suppressed. A different valid query may supersede the pending request. ClearSearchButton empties input, restores the nature gallery and focuses the input. Reuse an identical pending nature request; otherwise reset triggers a default attempt even if submittedQuery already equals nature. Retry increments requestAttempt for the last submittedQuery through the same effect path, not duplicated fetching logic or unsent input edits.

The fetching effect conceptually depends on submittedQuery and requestAttempt. At request start clear stale request errors, replace the active results with gallery skeletons, hide stale counts, and mark the stable result region busy. AbortController cancels obsolete requests; a local active/current-attempt guard prevents obsolete success, rejection and finalization from committing any state or clearing a newer loading state. Cleanup marks the attempt inactive and aborts it. Abort is cancellation, not a user-visible error. The mock service must support the same abortable contract and reproducible out-of-order scenarios. Keep Strict Mode cleanup correct; do not disable it to conceal defects. Render settled success/empty/error deliberately; show “N images shown” from rendered photos only, not the API-wide total or a stale count.

Keep focus stable after results. If conditional controls disappear, restore a sensible stable destination such as the search input. Announce searching/completion concisely without forcing focus into results.

------------------------------------------------------------------------

## 4. Empty Search Result Flow

``` text
Valid search
  ↓
API success
  ↓
results.length === 0
  ↓
EmptyState
```

Empty state content: - "No images found for '{query}'." - short
suggestion: try a broader or different term - "Clear search" or
return-to-default action

The user must not encounter a blank white/black gallery with no
explanation.

------------------------------------------------------------------------

## 5. Error & Retry Flow

```text
active request failure → safe ErrorState
  → Retry increments requestAttempt for last submittedQuery
  → same useEffect / service path → loading → success / empty / error
```

No duplicate Retry fetching or unchanged-query setter as the only trigger. Unsent input edits do not change the retried request; input stays editable. Aborts/obsolete failures never show as errors. Handle network/auth/rate-limit safely with no raw credential detail or rapid automatic retry. If Retry disappears while focused, move focus to a stable logical control.

------------------------------------------------------------------------

## 6. Download Flow

Each ImageCard owns download busy/error state, an immediate same-card in-flight guard and inline feedback; no global downloadingId or initial global toast architecture. Other cards and search remain usable. Activation → guard → “Preparing download...” → required registration through the approved API boundary → validated image resource → supported browser delivery/navigation or an explicit “Open image to save” ready link → restore/update local UI. Registration failure stays local and never intentionally falls back to bypassing required registration. Registration, delivery initiation and proving an actual save are distinct: do not display “Downloaded” merely because registration succeeded; JavaScript generally cannot prove the user saved a file. An explicit user-activated ready link is the fallback for blocked asynchronous popups/navigation; cross-origin download hints may be ignored. Use the prepared resource within that attempt without duplicate registration. On unmount/supersession, abort or ignore pending work and prevent unexpected late navigation; cancellation cannot undo an already processed upstream registration, so do not automatically repeat it.

Sample flow uses only abortable local mock registration/delivery. Later live flow uses `registerDownload({ photoId, downloadLocation, signal })` through the approved credential proxy, with URL validation and image-resource response defined in TRD §7. Essential attribution remains available throughout.

------------------------------------------------------------------------

## 7. Clear / Reset Flow

```text
ClearSearchButton / EmptyState reset
  → query = ""
  → focus search input
  → restore submittedQuery = DEFAULT_QUERY ("nature")
  → reuse identical pending nature request, otherwise trigger requestAttempt
  → loading → default results / error
```

Reset works even if the previous committed value already equals nature. No input-only alternative is part of the locked behavior. ClearSearchButton may disappear when input empties; do not let focus fall to document body.

------------------------------------------------------------------------

## 8. Keyboard Flow

``` text
Tab
 ↓
Skip link
 ↓
Header interactive element(s)
 ↓
Search input
 ↓
ClearSearchButton (when present)
 ↓
Search
 ↓
Gallery card links/actions in visual order
 ↓
Footer links
```

Rules: - Enter submits search - Enter/Space activates buttons - focus
indicators never removed - image overlays must not create inaccessible
hidden controls

------------------------------------------------------------------------

## 9. Responsive Flow Changes

Normal CSS Grid follows DOM/reading order, never masonry or dense visual reordering. Small mobile: one column; wider mobile: two only when content/actions stay usable; tablet: two to three; desktop: three to four; maximum intended columns: four. Do not allow illustrative auto-fit rules to generate five or more columns. Verify 320, 375, 430, 768, 1024, 1280 and 1440+ pixels plus intermediate transitions. Long photographer names wrap without pushing actions outside cards; avoid fixed metadata heights and horizontal page overflow.

Use semantic landmarks, one H1, associated search label and native form/button/link semantics. Keyboard users must complete primary flows. Provide contextual Download names, meaningful alt/fallback without invented image details, visible focus and a stable usable skip-link destination in every result state. Preserve focus when Clear/Retry controls disappear; reset focuses input. Use one concise results announcement, decorative skeletons and appropriate aria-busy; local download feedback must not steal focus. No hover-only essential functionality. Respect reduced motion; test 320 CSS-pixel reflow and enlarged text/zoom. A real baseline screen-reader session SHOULD be performed when a suitable actual assistive-technology environment is reasonably available. If unavailable in the authorized testing environment, explicitly disclose and defer manual AT verification; tooling absence alone is not a Hard Gate A blocker or a bar to Phase 9 entry, provided the remaining required accessibility baseline passes. Apply the project-specific screen-reader policy in 05-IMPLEMENTATION-PLAN.md; keyboard testing and accessibility-tree inspection are not equivalent to a real screen-reader session. Normal text contrast ≥4.5:1; large text ≥3:1; essential non-text UI/focus boundaries meet applicable contrast (normally ≥3:1). Aim for approximately 44×44 CSS-pixel important targets where practical. Cream #F6F1E8 on ember #F06A2A is about 2.74:1 and must not be used where it fails text contrast. Ink #10100F on ember is about 6.16:1 and may be used after measuring the rendered pair. Decorative low-contrast borders cannot be the sole essential control/state indicator.

------------------------------------------------------------------------

## 10. State Transition Model

``` text
sample default success / live initial request / valid submit / reset / Retry
 ↓
loading
 ├── results > 0 → success
 ├── results = 0 → empty
 └── request fails → error

error
 ├── Retry increments requestAttempt → loading
 └── new search → loading

empty
 └── new search/reset → loading

success
 ├── new search / completed same-query refresh → loading
 └── download → success remains + local card busy state
```

------------------------------------------------------------------------

## 11. Sample-Data Development Flow

Use approximately 8–12 already-normalized GalleryPhoto records with appropriately licensed local fixture assets and documented provenance. Cover landscape, portrait, long photographer name, missing description, local image failure and normal successful records. All required scenarios are deterministic and work without credentials, live Unsplash requests or external network/assets/fonts. A deliberate missing local image can exercise failure. The same production ImageGrid/ImageCard render fixtures and later live-normalized data; no disposable second UI. Abortable mock search/registration provides loading/success/empty/error/retry, stale-request and per-card download busy/success/failure scenarios. Mock actions use local resources and do not claim a real save. Do not locally mirror API-returned photos as a substitute for live hotlinking compliance.

Testing starts during sample development, not after live integration: query/normalization/error unit tests during Phase 3, card component tests during Phase 4, search integration tests during Phase 6, and state/retry/cancellation/download tests during Phase 7. Before Gate A, unit/component/integration tests, manual accessibility, responsive checks and visual QA must exist and pass, with lint, production build and preview smoke testing. Phase 12 expands the existing suite for live API/network/authentication/rate-limit/download-registration behavior and production regressions; it is not the first testing phase.

```text
semantic shell → local normalized fixtures → same production card/grid
  → abortable deterministic search/reset/retry/download and complete states
  → sample tests + accessibility/responsive/visual QA + lint/build/preview
  → Gate A evidence + explicit human approval → STOP
  → approved credential boundary + current compliance checkpoint
  → explicit integration authorization → Phase 9
```

HARD GATE A remains before all live integration/proxy implementation. Its authoritative full criterion checklist and evidence format are in 05-IMPLEMENTATION-PLAN.md. Review exact revision/commit, evidence, per-criterion pass/fail (or disclosed actual-screen-reader deferral under that policy), unresolved issues and explicit human approval. This amendment does not pass Gate A; no application exists yet. Even a passing Gate A does not automatically authorize integration: the approved credential boundary, current immediately pre-Phase-9 compliance checkpoint and explicit human integration approval are additionally required. Public production release separately requires policy-fit verification.

Live architecture and official pre-integration/public-release policy checkpoints are specified in TRD §§7–8. Educational/demo development is not production-policy approval.

------------------------------------------------------------------------

## 12. Critical Flow Acceptance Tests

  Flow                     Expected outcome
  ------------------------ ------------------------------------
  First load               app purpose/search/gallery obvious
  Search valid term        loading then relevant cards
  Search blank             no unnecessary request
  Search no-match          explanatory empty state
  Network failure          error + retry
  Retry                    requestAttempt repeats last intended query
  New search after error   normal loading/results path
  Download                 local busy → registered-resource delivery/link
  Keyboard-only            every action reachable
  Mobile                   no hidden critical controls
