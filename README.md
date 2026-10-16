# STILL-FRAME - Grid-Based Image Gallery with Search

Educational/demo React internship project: Unsplash image search, explicit user input, CSS Grid/Flexbox and responsive image cards. **Phase 9 provides live search; Phase 10 adds server-side download registration and browser-initiated image downloads.** Hard Gate A passed under the authorized actual-AT deferral policy before this phase. This is not production/deployment approval or an approved Unsplash replacement.

## Beginner local setup — USER SETUP REQUIRED

Use Node 24.x and npm 11.x. Install from the committed lockfile on your own machine if needed:

```sh
npm ci
# Only when .env.local does not already exist:
cp -n .env.example .env.local
```

Edit **`.env.local` in the project root privately**:

```dotenv
UNSPLASH_ACCESS_KEY=YOUR_UNSPLASH_ACCESS_KEY
```

Replace the placeholder with your Unsplash **ACCESS KEY**, **not the Secret Key**. Never paste the real value into chat, reports, screenshots, source or tests. `.env.local` is Git-ignored and must remain uncommitted. Do not create a `VITE_` credential: those variables are client-visible. No Secret Key is required or used. Restart the dev/preview process after changing the environment file.

```sh
npm run dev
```

Open the local address Vite prints. This **one command starts both the frontend and its same-origin search and download-registration middleware**. The initial empty input fetches the committed default `nature` query. Enter a subject and explicitly press Enter/Search for another request. Typing alone never fetches. Clear restores `nature`; a completed identical query can be refreshed. Retry uses the committed failed query, not an unsent draft.

Without a key (or with the untouched placeholder), the real boundary returns safe configuration/auth feedback. It does not silently fall back to sample photos, issue a placeholder-authenticated request, or crash. Request errors do not reveal server secrets. Supplying your key enables the genuine provider path; credential-free automated checks use stubs, not quota.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Frontend + same-origin API middleware using server-only `.env.local` configuration |
| `npm test` | Deterministic sample, live-shaped, service and server-boundary tests; **no real Unsplash requests** |
| `npm run test:watch` | Watch the same tests |
| `npm run lint` | ESLint |
| `npm run build` | Build browser assets into ignored `dist/`; no credentials embedded |
| `npm run preview` | Local compiled-frontend preview **with the same API middleware**, reading server-only configuration |

Vite preview is for local validation, **not a production server**. A static-only deployment cannot supply `/api/photos/search` or `/api/photos/download`. No host/deployment was selected or performed in Phase 9. At deployment authorization, mount the exported Web Request/Response `createUnsplashSearchHandler` and `createUnsplashDownloadHandler` behind the same origin using a host-appropriate minimal server/serverless adapter and server-only environment configuration. Vite's Node/Connect adapter demonstrates that boundary locally; it is not a general URL/image proxy. Reassess production abuse/rate controls and policy fit before release.

## Phase 9 architecture

```text
React App effect
  → searchPhotos({ query, signal })
  → GET /api/photos/search?query=...
  → server-only fixed-purpose native-fetch handler
  → GET https://api.unsplash.com/search/photos
```

- `server/unsplashSearch.js`: host-neutral handler. Only GET; exactly one string query, trimmed/nonblank and at most **200 UTF-16 code units**, matching the input's native maximum. Reject duplicate/unsupported parameters rather than blindly forwarding them.
- Upstream URL is constructed in code: **page=1, per_page=24** (below the documented maximum 30); no pagination UI or caller-controlled upstream URL.
- Only the server sends `Authorization: Client-ID <ACCESS_KEY>` and `Accept-Version: v1`. No SDK, backend framework, new runtime dependency, arbitrary proxy, credential-bearing redirect following or automatic retry.
- Ten-second upstream timeout, client-disconnect cancellation, a two-MiB response bound and at most four concurrent upstream searches per handler instance. These are small resource bounds, not a production per-user rate-limiting guarantee. Demo access is documented as starting at 50 requests/hour; explicit submits and user-initiated retries avoid wasteful request loops.
- The server returns only selected primitive photo fields, not totals, provider headers/errors or entire user records. The frontend service applies the existing `normalizePhotoResponse` **once** to produce canonical `GalleryPhoto` records. Malformed envelopes/all-invalid collections fail safely; mixed collections skip invalid records, preserving the locked normalizer policy.
- React retains draft query, submittedQuery, requestAttempt, useEffect, AbortController, immediate pending-query guard, active-attempt protection and mutually exclusive loading/success/empty/error. Initial live fetch replaces the old sample bootstrap; a microtask before the service call avoids a discarded StrictMode mount request. Search fetching remains outside ImageCard; card download actions delegate to separate registration/delivery services.

The existing canonical contract remains unchanged, including provider `links.downloadLocation` used unchanged by Phase 10. Images use the returned Unsplash `urls.*` directly, preserving parameters, dimensions, aspect ratios, first-two eager/rest-lazy strategy and card-local media fallback. No image bytes are fetched by the server, copied into the repo, rehosted or converted.

## Attribution and Download boundary

Live cards show **Photo by [photographer] on [Unsplash]**. The photographer destination uses the returned profile URL; the Unsplash destination is `https://unsplash.com/`. Both receive `utm_source=grid-image-gallery&utm_medium=referral`; existing provider parameters and fragments survive. **`grid-image-gallery`** is the non-secret referral identifier, matching the existing package/app slug. Local provenance is only used by explicit offline fixture compositions, never to label live provider photos.

## Phase 10 download flow

```text
Selected card → registerPhotoDownload(photo, { signal })
  → POST /api/photos/download { photoId, downloadLocation }
  → server/unsplashDownload.js
  → GET the selected photo's API-provided links.download_location (Authorization server-only)
  ← { url: validated image resource }
Browser → direct CORS fetch of that returned Unsplash image URL → Blob → native download anchor
```

Download registration follows the [official triggering-a-download guideline](https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download). The event endpoint is **not** image data and is never constructed from the ID, embedded, or opened as an image. The server forwards the supplied validated URL unchanged, including `ixid`; it never downloads/proxies image bytes. All image delivery is browser-to-Unsplash CDN, not rehosting.

- `POST /api/photos/download` only, JSON object with exactly `photoId` and `downloadLocation`; JSON body capped at 8 KiB. IDs allow letters/digits/underscore/hyphen (maximum 128). Registration URL must be HTTPS on exactly `api.unsplash.com`, path `/photos/<matching ID>/download`, without credentials, custom ports, fragments, encoded/traversal ambiguity or arbitrary destination parameters.
- The current query allowlist is **one optional `ixid`** (maximum 2048 decoded characters). Unknown parameters are **rejected, never silently stripped**. If future official returned URLs add tracking parameters, review and explicitly extend this allowlist rather than weakening host/path validation.
- Uses the existing server-only `UNSPLASH_ACCESS_KEY`, **never the Secret Key**, `Authorization: Client-ID …`, and `Accept-Version: v1`. No new variable/dependency is needed; `.env.example` remains a placeholder. Both dev and compiled preview install the same handlers.
- Registration has a 10-second upstream timeout, disconnect cancellation, four concurrent requests per handler instance and a 16-KiB JSON response limit. Upstream redirects are rejected. Only the validated resource URL is returned; no provider error details or sensitive headers. These are resource bounds, not production per-user abuse protection.
- Returned resource must use HTTPS on exactly `images.unsplash.com` or `plus.unsplash.com`, without URL credentials, custom ports, fragments or credential query parameters. Its provider parameters are retained unchanged.
- Each card independently disables its native Download button while pending and announces registration, delivery, or safe local failure through its existing status region. Other cards/Search remain usable. Unmount/search replacement cancels pending work and prevents a late file download; focus is restored only when another control has not taken it.
- Browser delivery uses credentials-omitted CORS fetch, a 30-second timeout and a 64-MiB in-memory bound. Only nonempty JPEG/PNG/WebP/AVIF responses are accepted. A native Blob download is initiated with a safe `stillframe-<photoId>` filename; the Blob URL is released after 60 seconds. This is an on-demand browser transfer, not a repository asset/image relay.
- **“Download initiated” means only that the browser download action was invoked. It does not prove a file was saved.** Browser preferences/security may still affect saving. There is no false saved-file claim.
- Registration failures offer another user-initiated registration attempt with safe auth/rate-limit/network/API feedback. Delivery failures are explicitly distinguished; an **Open image to save** link uses the registered, validated resource in a new tab for manual saving. Retrying delivery reuses that resource without repeating registration. A later new Download after an initiated action is a new registered action. No automatic retries.
- If CORS, a browser restriction, unsupported content type, timeout, or size limit prevents Blob delivery, use the explicit registered-resource link to save manually. This fallback does not claim automatic file delivery succeeded. Browser behavior and genuinely returned provider resources must still be checked with your configured key.

No real key was available to the implementation environment. Real Unsplash registration and genuine provider image delivery were **not executed** there. Controlled tests exercise the actual same-origin handlers and browser download code with synthetic provider JSON and local image bytes; they do not establish live provider success.

## Error states

Safe frontend errors preserve `{ type, message, retryable }` with types `network`, `auth`, `rate-limit`, `api`, `unknown`:

- Missing server configuration and provider 401 → nonretryable auth/configuration guidance (Search/Clear remain usable).
- Provider 403 → rate-limit guidance only for recognizable quota evidence: `X-Ratelimit-Remaining: 0` with a positive integer `X-Ratelimit-Limit`, or a bounded JSON `errors` array containing the exact message “Rate Limit Exceeded” (case-insensitive, optional final period/exclamation). Both handlers inspect at most 8 KiB of error JSON, at most 10 error entries, and only message strings up to 128 characters. Genuine permission failures and ambiguous/malformed/oversized 403 responses conservatively retain auth/configuration classification. Raw provider errors/headers are never returned; cancellation remains a network/cancellation outcome.
- Provider 429 / local concurrency bound → rate-limit guidance; wait before user-initiated Retry.
- Network/timeout → retryable network guidance.
- Other non-2xx, malformed JSON/envelope or unusable records → safe API error, never Empty by coercion.
- Unexpected middleware failure → unknown; no raw exception/provider text exposed.
- Superseding/unmount AbortError → cancellation, not visible Error.

No automatic retries, dashboard or provider error payloads. Empty remains distinct and offers native form-reset recovery to `nature`. Stale cards/counts are removed during loading; the stable status and busy region remain separate.

## Deterministic samples and testing

Approved local NASA fixtures/provenance, sample filter/search/download services and earlier tests remain for isolated/offline regression work. They are not the production search path and there is no automatic offline fallback. Test-only `src/test/SampleApp.jsx` explicitly injects initial fixtures, mock search and mock Download; the optional App `initialPhotos`, `searchService`, `onDownload` composition seam supports those tests. Those modules are not imported by the production entry point. The old sample initial-attempt-zero behavior remains in that explicit composition, not the live default.

Synthetic provider-shaped test records are authored examples, not an API capture. Tests inject native-fetch stubs and never require the user's key. They cover server validation/auth/version/projection/limits/cancellation, service normalization/error safety, initial live request, explicit submit/draft behavior, retry, Clear, races, attribution, download URL validation, registration, separate delivery failures, per-card concurrency/cancellation, keyboard/focus and truthful status messages. Genuine provider/rate-limit behavior and full cross-browser/device QA remain manual work. Run `npm test`, `npm run lint`, `npm run build`, then `npm run preview` for compiled local validation. No automated test requires a real key or calls the public API.

## Accessibility, design and policy scope

The approved editorial design, source-ordered capped four-column Grid, focus, keyboard/skip behavior, semantics, meaningful alt fallback, contrast and reduced-motion baseline remain. Actual AT status stays **DEFERRED MANUAL ACCESSIBILITY VERIFICATION — ACTUAL AT UNAVAILABLE**; no real screen-reader speech/browse-mode compatibility claim is made. AX/component/keyboard checks are not equivalent to actual AT. Perform the deferred session when suitable tools are reasonably available, preferably before public production release.

Official requirements applied in this authorization: [Unsplash documentation](https://unsplash.com/documentation) and [API guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines): public Client-ID auth, v1, returned-image hotlinking, photographer/Unsplash attribution and referral parameters. The authorization supplied a fresh official-requirements review; implementation/testing does not constitute production access or legal/policy approval. The guideline against replicating Unsplash's core experience remains an **unresolved public-release/deployment policy-fit risk**. No production application/access request, deployment or commercial claims are made. Current official download documentation/guidelines were consulted for Phase 10; reverify them again before release; stop/report conflicts.

The previous sample-stage README is preserved verbatim in [Phases 1–8 history](docs/PHASES-1-8-HISTORY.md); its old Gate/status statements are explicitly historical, not current instructions. Historical governing documents remain in `docs/planning/`. They preserve the original assignment, sample-first history and phased approvals; this README describes the current Phase 9 search and Phase 10 download implementation, not a rewrite of that history.

## Manual download check after local setup

Keep your existing `.env.local` private and unchanged when applying Phase 10 source changes. If already configured, do **not** overwrite it with the example. Run `npm run dev`, search for an image, then activate Download. Expect registration → image preparation → download initiated, or a specific local error with retry/manual-save recovery. Confirm your browser actually received the expected image yourself; the app cannot verify saved-file completion. Repeat with `npm run build` followed by `npm run preview`. Neither command deploys the app. Do not share credential-bearing screenshots/logs or include `.env.local`/`node_modules` in source archives.

A production deployment still requires host-appropriate same-origin adapters for **both** handlers, private server environment configuration, HTTPS, reviewed abuse/rate controls and current Unsplash policy fit. Vite preview is not a production server. No deployment, accounts, database, production access application or unrelated future-phase feature is included.
