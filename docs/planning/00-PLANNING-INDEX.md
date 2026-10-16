# Grid-Based Image Gallery with Search --- Planning Pack

**Authority:** INTERNSHIP-TASK.md → MASTER-FRONTEND-WEB-DEVELOPMENT-WORKFLOW.md → 01-PRD.md → 02-TRD.md → 03-APP-FLOW.md → 04-DESIGN-BRIEF.md → 05-IMPLEMENTATION-PLAN.md → existing implementation, once implementation begins. 00-PLANNING-INDEX.md summarizes the pack and does not override it.

This amended pack records approved specification decisions only. No application exists yet; Phase 1 still requires explicit authorization.

## Documents

- **INTERNSHIP-TASK.md** — unchanged governing assignment.
- **MASTER-FRONTEND-WEB-DEVELOPMENT-WORKFLOW.md** — unchanged governing operating system.
- **01-PRD.md** — users, locked MVP/non-goals, route/component responsibilities, UI model and acceptance.
- **02-TRD.md** — state/effect/service/normalization contracts, narrow credential proxy, CSS, accessibility and testing.
- **03-APP-FLOW.md** — search/reset/retry/cancellation/download, keyboard and sample-data journeys.
- **04-DESIGN-BRIEF.md** — preserved editorial visual direction, responsive/accessibility constraints and optional review lenses.
- **05-IMPLEMENTATION-PLAN.md** — phased execution, sample testing, full Gate A evidence and integration/release checkpoints.

## Locked Product and Stack

React + Vite + JavaScript + authored CSS + native fetch; one route `/`. No router, TypeScript, Tailwind, global-state library, fetching abstraction, UI framework, masonry library or animation framework. Preserve visible React/useEffect, user-input search, CSS Grid, Flexbox, responsive layout, Unsplash and per-image Download learning objectives.

No accounts/authentication, favorites persistence, collections, uploads, comments, admin, database, infinite scroll, lightbox, themes, advanced filters or pagination without later approval. No general backend; only the approved minimal live credential proxy.

## Locked Interaction Summary

- Default query `nature`; query is editable input, submittedQuery is committed search, requestAttempt supports same-query Retry/intentional refresh.
- Explicit Enter/Search submission; trim input, reject blanks, suppress identical pending duplicates; typing does not fetch.
- ClearSearchButton empties input, restores nature and focuses input.
- Effect depends on submittedQuery/requestAttempt. Abort plus active-attempt guarding protects all commits, including rejection/finalization; abort is not error.
- Skeletons replace active results; clear stale errors/counts and mark the region busy. Settled count is “N images shown,” not API-wide total.
- Shared search/results stay in the coordinator; per-card download guard/busy/error and inline feedback stay local. Registration, delivery and actual saving are distinct; no unsupported “Downloaded” claim.

## Sample Development and Gate A

Approximately 8–12 normalized records, licensed local assets, representative image/name/description/failure cases, deterministic abortable mocks and the same production UI. Required scenarios need no credentials, live Unsplash requests or network.

Testing starts in sample development. Unit/component/integration tests, accessibility/responsive checks, visual QA, lint, build and production preview pass before Gate A. Normal Grid follows DOM order, caps at four columns and is checked at 320/375/430/768/1024/1280/1440+ plus intermediate widths. The brief/TRD define measurable contrast, focus, target-size, reflow and zoom criteria. Actual screen-reader execution follows the project-specific three-way policy in 05-IMPLEMENTATION-PLAN.md: EXECUTED / PASS; EXECUTED / MATERIAL DEFECT → BLOCK; UNAVAILABLE → DEFERRED MANUAL VERIFICATION. Unavailable AT must be disclosed, not marked PASS; tooling absence alone does not block Gate A or Phase 9 entry if the remaining required accessibility baseline passes. Keyboard/AX checks are not a real AT session or proof of screen-reader compatibility.

Gate A's full checklist is in 05-IMPLEMENTATION-PLAN.md. Review exact revision/commit, evidence, every criterion's pass/fail (or disclosed actual-screen-reader deferral under that policy), unresolved issues and explicit human approval. **Gate A is NOT RUN / NOT PASSED.** Passing it does not automatically authorize integration.

## Live Architecture and Compliance

React → frontend service/native fetch → minimal server-side/serverless credential proxy → Unsplash.

The server-held Access Key never enters browser code; VITE_ is not confidentiality. Do not request/use a Secret Key for this public flow. The proxy only validates allowed inputs, performs search/download registration and returns required data: no accounts, sessions, database, persistence or general backend.

Immediately before Phase 9, reverify official credential/hotlink/URL-parameter/attribution/referral/download-registration requirements, select the narrow runtime/routing configuration, and obtain explicit integration approval. API-returned image URLs/required parameters and photographer + Unsplash attribution must be preserved; the registration endpoint is not the image file. See TRD §§7–8.

Educational/demo intent is not public production-policy approval. The search/browse/download concept may overlap restrictions on replicating Unsplash's core experience; verify policy fit before public production release. Do not silently redesign the assignment to settle that question.

## Visual Direction and Authorization

Preserve photography-first dark editorial design, warm-paper contrast, serif display/restraint in sans UI, sparse ember, crisp borders, restrained radii/minimal shadows, negative space and quiet functional motion. Skills are optional review lenses, not replacement sources of truth.

This amendment authorizes no scaffolding, installation, Git initialization, source/CSS/proxy implementation, credential creation or authenticated requests. Stop after the amendment; await explicit Phase 1 authorization.
