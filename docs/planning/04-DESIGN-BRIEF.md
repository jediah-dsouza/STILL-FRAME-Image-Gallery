# Design Brief

## Grid-Based Image Gallery with Search

**Authority:** INTERNSHIP-TASK.md → MASTER-FRONTEND-WEB-DEVELOPMENT-WORKFLOW.md → 01-PRD.md → 02-TRD.md → 03-APP-FLOW.md → 04-DESIGN-BRIEF.md → 05-IMPLEMENTATION-PLAN.md → existing implementation, once implementation begins. 00-PLANNING-INDEX.md summarizes the pack and does not override it.

**Amendment status:** Approved specification decisions recorded; application development, Phase 1, proxy implementation, credential setup and authenticated requests remain unauthorized until their separate approvals.

**Design intent:** A photography-first editorial utility that feels
curated, tactile, and deliberate---not a generic AI-generated SaaS
dashboard.

------------------------------------------------------------------------

## 1. Experience Statement

The interface should feel like a **contemporary photography contact
sheet crossed with an editorial art book**: quiet enough to let imagery
dominate, but distinctive enough that the product has a recognizable
visual voice.

The user should feel: - visually invited - calm, not overwhelmed -
confident about what to do - rewarded by the photography - aware that
the interface has been designed, not merely decorated

------------------------------------------------------------------------

## 2. Anti-Slop Direction

Avoid: - purple/blue neon gradients - glassmorphism everywhere - giant
rounded cards floating in empty space - pill-shaped everything - generic
"Discover amazing images" SaaS hero copy - excessive blur/glow -
arbitrary icon bubbles - dashboard sidebars - fake metrics - oversized
gradient CTA buttons - identical cards with excessive chrome - motion
for motion's sake

Prefer: - editorial typography - strong composition - crisp borders -
restrained radius - deliberate asymmetry in hero composition - image-led
rhythm - useful metadata - visible typographic hierarchy - tactile
micro-interactions - negative space that serves the photography

------------------------------------------------------------------------

## 3. Visual Theme & Atmosphere

### Theme

**Dark editorial gallery with warm paper contrast.**

Recommended palette direction:

  Role                   Token                Value
  ---------------------- -------------------- ---------------------------
  Canvas                 `--color-ink`        `#10100F`
  Raised dark            `--color-charcoal`   `#191917`
  Paper                  `--color-paper`      `#F2EFE8`
  Primary text on dark   `--color-cream`      `#F6F1E8`
  Muted text             `--color-muted`      `#A7A39A`
  Hairline border        `--color-line`       `#34332F`
  Accent                 `--color-ember`      `#F06A2A`
  Error                  `--color-error`      accessible warm red
  Focus                  `--color-focus`      high-contrast ember/cream

The orange/ember accent is intentionally sparse: search focus, important
action emphasis, selected/status details. Photography remains the
dominant color source.

------------------------------------------------------------------------

### Measured semantic token constraints

Cream #F6F1E8 on ember #F06A2A is approximately 2.74:1 and fails normal/large text thresholds. Do not use that text pairing where it fails. Ink #10100F on ember is approximately 6.16:1 and may be used after actual state measurement. Hairline #34332F on ink is approximately 1.51:1: decorative borders cannot be the sole essential control/state cue. Choose the accessible warm-red error token by measurement while preserving the brief. Verify all actual rendered pairs; these calculations are not visual QA certification.

## 4. Typography

### Direction

Use an editorial serif for expressive headings and a clean sans-serif
for controls/body.

Recommended web-safe/open options: - Display: `Playfair Display` or
`DM Serif Display` - Body/UI: `Manrope`, `Inter`, or a system sans
fallback - Metadata: optional mono accent such as `IBM Plex Mono`, used
sparingly

### Hierarchy

``` text
H1: fluid 44–76px, editorial serif, tight leading
Intro: 16–20px sans, constrained measure
Search input: 16–18px
Results label: 12–14px, uppercase/letter-spaced only if readable
Photographer: 13–15px
Utility/meta: 12–13px
```

Do not turn every label into tiny uppercase text.

------------------------------------------------------------------------

## 5. Layout Concept

### Desktop composition

``` text
┌─────────────────────────────────────────────────────────────┐
│ wordmark                                      source label   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Find the frame.          ┌──────────────────────────────┐   │
│  Keep the feeling.        │ Search photographs...  [→]  │   │
│                           └──────────────────────────────┘   │
│  concise supporting copy                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  RESULTS / “MOUNTAINS”                         24 IMAGES     │
│                                                             │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐ ┌───────────┐ │
│  │          │ │              │ │           │ │           │ │
│  │  IMAGE   │ │    IMAGE     │ │   IMAGE   │ │   IMAGE   │ │
│  │          │ │              │ │           │ │           │ │
│  └──────────┘ └──────────────┘ └───────────┘ └───────────┘ │
│   author ↓      author ↓        author ↓       author ↓     │
└─────────────────────────────────────────────────────────────┘
```

### Mobile

-   compact header
-   H1 remains expressive but not oversized
-   search becomes full-width
-   grid uses one strong column or two compact columns when cards remain
    legible
-   metadata/actions remain visible

------------------------------------------------------------------------

## 6. Gallery Treatment

The gallery should feel **modular rather than monotonous**.

MVP uses normal CSS Grid in DOM/reading order, never masonry/dense reordering, and caps intended columns at four. Preserve source
aspect ratios inside cards where practical. Avoid forcing every photo
into the same square unless that is an explicit art direction.

Recommended: - media edge-to-edge inside card - metadata below image or
on a restrained bottom rail - 1px border/hairline - radius 8--12px
maximum - no huge floating shadows - image hover: very subtle scale
(1.01--1.02) or contrast shift - card hover: border/metadata emphasis
rather than dramatic lift

Touch users must see actions without hover.

------------------------------------------------------------------------

## 7. Search Component

Search is the product's primary control and should feel intentional.

### Visual treatment

-   large, editorial search field
-   strong border rather than floating pill
-   clear Search action
-   ember focus accent
-   search icon optional, not required
-   clear button appears only when useful

### Interaction

-   immediate focus clarity
-   Enter/Search explicitly submit; no keystroke fetch
-   ClearSearchButton resets to nature and focuses input
-   completed same-query refresh allowed; identical pending duplicate suppressed
-   Search button changes to busy state
-   avoid animated placeholder gimmicks

------------------------------------------------------------------------

Search/state contracts follow PRD/TRD: editable query, committed submittedQuery, requestAttempt, default nature, trimmed/blank prevention, and rendered count “N images shown,” never API-total wording.

## 8. Image Card Anatomy

``` text
┌──────────────────────────────┐
│                              │
│          PHOTOGRAPH          │
│                              │
├──────────────────────────────┤
│ Photographer Name       ↓    │
│ Unsplash / source            │
└──────────────────────────────┘
```

Desktop hover may reveal secondary source action, but: - photographer
attribution stays available - Download stays discoverable -
focus-visible mirrors hover affordance - touch does not depend on
overlay hover

------------------------------------------------------------------------

## 9. State Design

### Loading

Use static/low-motion skeleton blocks matching image proportions, replacing the active results. Clear stale errors/counts and mark the stable region busy; skeletons are decorative. Avoid aggressive shimmer.

### Empty

Treat it as editorial copy, not an error box: - large "Nothing in this
frame." - smaller practical guidance - reset action

### Error

Use a bordered paper/dark panel with: - concise title - plain-language
explanation - Retry - no scary technical dump

### Download busy

Local spinner/progress and “Preparing download...” with inline feedback; no global toast system or blocking other cards/search. Registration is not proof of saving; use registered-resource delivery/ready-link wording, never unsupported “Downloaded.” Include local failure and repeated-click guard.

------------------------------------------------------------------------

## 10. Motion Personality

Motion should be: - short - physical - functional - quiet

Recommended: - 120--220ms - ease-out - opacity/transform only where
useful - staggered gallery entrance only if subtle and not expensive -
no scroll hijacking - no cursor gimmicks - respect
`prefers-reduced-motion`

------------------------------------------------------------------------

## 11. Design Tokens

### Spacing

8px base family: `4, 8, 12, 16, 24, 32, 48, 64, 96`

### Radius

-   controls: 8px
-   cards: 10px
-   large state panel: 12px
-   avoid 24--32px "AI card" rounding

### Border

-   1px hairline
-   contrast-driven hierarchy

### Shadow

Use almost none on dark surfaces. Prefer borders and tonal contrast.

### Container

-   max width around 1440px
-   fluid side padding: `clamp(16px, 3vw, 48px)`

------------------------------------------------------------------------

## 12. Responsive Breakpoints

Design behavior, not device labels:

- **<480px:** one column; stack search controls when needed.
- **480–767px:** two columns only when metadata/actions remain usable.
- **768–1023px:** two to three columns.
- **1024–1439px:** three columns.
- **1440px+:** four columns with capped container.

Normal CSS Grid follows DOM/reading order, never masonry or dense visual reordering. Small mobile: one column; wider mobile: two only when content/actions stay usable; tablet: two to three; desktop: three to four; maximum intended columns: four. Do not allow illustrative auto-fit rules to generate five or more columns. Verify 320, 375, 430, 768, 1024, 1280 and 1440+ pixels plus intermediate transitions. Long photographer names wrap without pushing actions outside cards; avoid fixed metadata heights and horizontal page overflow.

Use explicitly capped tracks/breakpoints or an equivalent capped fluid strategy. Do not mechanically copy an auto-fit rule that exceeds four intended columns.

------------------------------------------------------------------------

## 13. Accessibility Design Rules

Use semantic landmarks, one H1, associated search label and native form/button/link semantics. Keyboard users must complete primary flows. Provide contextual Download names, meaningful alt/fallback without invented image details, visible focus and a stable usable skip-link destination in every result state. Preserve focus when Clear/Retry controls disappear; reset focuses input. Use one concise results announcement, decorative skeletons and appropriate aria-busy; local download feedback must not steal focus. No hover-only essential functionality. Respect reduced motion; test 320 CSS-pixel reflow and enlarged text/zoom. A real baseline screen-reader session SHOULD be performed when a suitable actual assistive-technology environment is reasonably available. If unavailable in the authorized testing environment, explicitly disclose and defer manual AT verification; tooling absence alone is not a Hard Gate A blocker or a bar to Phase 9 entry, provided the remaining required accessibility baseline passes. Apply the project-specific screen-reader policy in 05-IMPLEMENTATION-PLAN.md; keyboard testing and accessibility-tree inspection are not equivalent to a real screen-reader session. Normal text contrast ≥4.5:1; large text ≥3:1; essential non-text UI/focus boundaries meet applicable contrast (normally ≥3:1). Aim for approximately 44×44 CSS-pixel important targets where practical. Cream #F6F1E8 on ember #F06A2A is about 2.74:1 and must not be used where it fails text contrast. Ink #10100F on ember is about 6.16:1 and may be used after measuring the rendered pair. Decorative low-contrast borders cannot be the sole essential control/state indicator.

------------------------------------------------------------------------

## 14. Design Skill Invocation Plan for the Coding Agent

Skills are optional, scoped review lenses, not mandatory all-skills execution or independent sources of truth. Inspect the actually available full instructions/references before using a skill. In Notion, invoke by natural-language name rather than assuming slash commands are registered. Do not invent commands or automatically install launchers/hooks/packages.

| Later review checkpoint | Optional lens | Guardrail |
| --- | --- | --- |
| Early anti-generic review | antislop | Resolve required review mode; filter only |
| Phase 8 composition/hierarchy | design-taste-frontend (taste-skill reference) | Preserve approved editorial direction |
| Phase 8 interaction detail | emil-design-eng | Focus, busy states, alignment, restrained motion |
| Pre-Gate-A / later scoped polish | impeccable | Accessibility/responsive/visual review; no automatic redesign |
| Targeted UX question | ui-ux-pro-max | Specific usability check, not a new design system |
| Final distinctiveness audit if needed | hallmark | Audit only, no automatic theme/catalog/redesign |

Do not combine every lens indiscriminately or require every skill at every phase.

### Conflict rule

1. Internship requirements.
2. Accessibility/usability.
3. Project specifications under the governing hierarchy above.
4. Established project design system.
5. Optional skill advice.

Preserve photography-first editorial design, dark canvas, warm-paper contrast, serif display/restained sans UI, sparse ember, crisp borders, restrained radii/minimal shadows, image-led hierarchy, deliberate negative space and quiet functional motion. No redesign is authorized.

------------------------------------------------------------------------

## 15. Design QA Questions

-   Does the photography dominate?
-   Is the search action obvious without being oversized?
-   Does the page look designed at 375px, not merely compressed?
-   Are card actions usable without hover?
-   Is the typography distinctive but readable?
-   Are radii restrained?
-   Are borders/spacing consistent?
-   Is there any gratuitous gradient/glow/glass?
-   Does the empty/error state feel like the same product?
-   Would a reviewer mistake this for a generic generated dashboard?
-   Does every visual choice help hierarchy, usability, or character?

------------------------------------------------------------------------

## 16. Final Visual Standard

The interface is not approved merely because it is clean. It is approved
when it is:

**coherent + image-first + editorial + responsive + accessible +
restrained + distinctive.**
