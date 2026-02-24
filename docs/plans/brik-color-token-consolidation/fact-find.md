---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-22
Last-updated: 2026-02-22
Feature-Slug: brik-color-token-consolidation
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-system
Related-Plan: docs/plans/brik-color-token-consolidation/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
direct-inject: true
direct-inject-rationale: Operator audit of live site identified excess color proliferation and contrast failures
---

# Brik Color Token Consolidation — Fact-Find Brief

## Scope

### Summary

The Brikette site has two independent color systems running in parallel (base theme HSL tokens and brand hex/RGB tokens), dark mode accent colors that shift hue entirely (teal→amber, crimson→yellow), hardcoded `text-white`/`bg-black`/`text-neutral-*` bypassing the token system in ~50+ locations across brikette and shared UI components, and multiple WCAG contrast failures. This fact-find documents the full evidence for a consolidation pass.

### Goals

- Eliminate dual color system confusion by establishing brand tokens as the single source
- Fix WCAG contrast failures (4 pairings fail AA normal text)
- Replace hardcoded color classes with semantic brand tokens
- Ensure dark mode colors maintain brand hue identity while passing contrast thresholds
- Remove redundant manual CSS utilities that duplicate Tailwind-generated classes

### Non-goals

- Redesigning the brand color palette from scratch
- Migrating operations/admin components (packages/ui/src/components/organisms/operations/) — these are internal-facing
- Changing the CMS/page-builder color system (effectPresets.ts etc.) — these are user-configurable
- ThemeToggle SVG illustration colors — decorative, not semantic

### Constraints & Assumptions

- Constraints:
  - All text pairings must pass WCAG AA (4.5:1 normal text, 3:1 large text)
  - Brand primary in dark mode must remain recognizably related to the light mode hue
  - Changes must work with the existing `.dark` class toggle mechanism
  - No layout or structural changes — color-only
- Assumptions:
  - The brand layer (`--color-brand-*` / `--rgb-brand-*`) is the intended single source of truth
  - Base theme colors (`--color-primary`, `--color-accent` etc.) should be mapped to brand values or hidden from brikette
  - `text-white` on image overlays (hero sections over photos) is acceptable — the background is a photo, not a theme color

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/styles/global.css` — brand token definitions (light: lines 23-88, dark: lines 90-143)
- `apps/brikette/tailwind.config.mjs` — brand color Tailwind mappings (lines 41-56)
- `packages/themes/base/src/tokens.ts` — base theme token definitions
- `packages/tailwind-config/src/index.ts` — base theme Tailwind mappings

### Key Modules / Files

1. `apps/brikette/src/styles/global.css` — brand token definitions + redundant utilities (lines 413-499)
2. `apps/brikette/tailwind.config.mjs` — brand color namespace
3. `apps/brikette/src/utils/theme-constants.ts` — hardcoded JS RGB duplicates of CSS vars
4. `packages/ui/src/organisms/LandingHeroSection.tsx` — 25+ hardcoded white/black/neutral uses
5. `packages/ui/src/organisms/ApartmentHeroSection.tsx` — 6 hardcoded neutral-900/white uses
6. `packages/ui/src/organisms/ApartmentHighlightsSection.tsx` — black overlay + white text
7. `packages/ui/src/molecules/NotificationBanner.tsx` — white text on brand-primary
8. `apps/brikette/src/routes/guides/utils/_linkTokens.tsx` — raw `text-primary-700` etc.
9. `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — `text-neutral-900`
10. `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx` — `text-white` on brand-primary

### Patterns & Conventions Observed

- Brand tokens use hex definitions with RGB triplet companions for Tailwind alpha — `global.css:34-79`
- Base theme uses HSL triplets — `packages/themes/base/src/tokens.ts`
- Components broadly use `bg-brand-*`, `text-brand-*`, `border-brand-*`, and `ring-brand-*` classes across brikette and shared UI (token path is established; bypasses are localized exceptions)
- Hero sections use hardcoded `text-white` over image backgrounds (semi-justified) — `LandingHeroSection.tsx`, `ApartmentHeroSection.tsx`
- CTA buttons use `text-white` on `bg-brand-primary` — needs token (`text-brand-bg` or dedicated `text-on-primary`)
- Guide links use raw Tailwind `text-primary-700` scale — `_linkTokens.tsx:20`

### Data & Contracts

- Types/schemas:
  - `theme-constants.ts` exports `BRAND_PRIMARY_RGB` and `BRAND_PRIMARY_DARK_RGB` as `readonly [number, number, number]`
  - These duplicate the CSS vars `--rgb-brand-primary` (light: `0 88 135`, dark: `143 95 0`)
  - JS/CSS values diverge in both schemes: light `[0, 98, 154]` vs CSS `[0, 88, 135]`; dark `[159, 107, 0]` vs CSS `[143, 95, 0]` — this can desync browser `theme-color` from rendered CSS

### Dependency & Impact Map

- Upstream dependencies:
  - `@themes/base/tokens.css` — imported by global.css line 9
  - `packages/tailwind-config` — base Tailwind color mappings consumed by brikette config
- Downstream dependents:
  - Every brikette/shared UI component using `brand-*` Tailwind classes (repo-wide footprint is large; prioritize high-traffic surfaces first)
  - Shared UI organisms/molecules imported by brikette (token bypasses are concentrated in hero, booking, banner, and modal-related components)
  - `theme-constants.ts` consumers (search showed it's imported in theme initialization code)
- Likely blast radius:
  - CSS variable renames: broad impact across brand-token consumers (no per-component code changes if variable names remain stable)
  - Dark mode hue changes: visual difference on every dark-mode page
  - Hardcoded class replacements: ~50 files need individual edits

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library, Playwright
- Commands: `pnpm --filter brikette test`, `pnpm -w run test:governed`
- CI: reusable workflow, typecheck + lint + test

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Theme toggle | Unit | ThemeToggle tests | Tests toggle behavior, not rendered colors |
| Guide content | Unit | guide tests | Tests structure, not link colors |
| Booking page | Unit | booking tests | Tests flow, not color classes |

#### Coverage Gaps
- No visual regression tests for color changes
- No contrast ratio validation in CI
- No test verifying dark mode token values match light mode hue family

#### Testability Assessment
- Easy to test: CSS variable value changes (instant visual verification via browser)
- Hard to test: contrast ratios programmatically without a visual regression tool
- Test seams needed: none — these are CSS/class changes

#### Recommended Test Approach
- Manual visual QA in light + dark mode after each change batch
- Spot-check contrast with browser DevTools accessibility audit
- Existing unit tests should continue passing (class names may change but behavior unchanged)

### Recent Git History (Targeted)

- `global.css` last modified in current dev branch (unstaged) — brand tokens were recently adjusted for WCAG AAA
- `LandingHeroSection.tsx` — modified in dev branch
- `ApartmentHeroSection.tsx` — modified in dev branch
- Token files have been stable; the dual-system issue predates recent work

## WCAG Contrast Ratio Audit

### Light Mode (bg: #ffffff)

| Pairing | Ratio | AA Normal | AA Large | AAA Normal |
|---|---:|:---:|:---:|:---:|
| `#005887` primary on white | 7.6:1 | PASS | PASS | PASS |
| `#f4d35e` secondary on white | **1.5:1** | **FAIL** | **FAIL** | FAIL |
| `#c4572e` terra on white | **4.4:1** | **FAIL** | PASS | FAIL |
| `#9b1b33` bougainvillea on white | 8.1:1 | PASS | PASS | PASS |
| `#646464` muted on white | 5.9:1 | PASS | PASS | FAIL |
| `#3c3c3c` paragraph on white | 11.0:1 | PASS | PASS | PASS |
| White on `#005887` primary CTA | 7.6:1 | PASS | PASS | PASS |
| White on `#9b1b33` bougainvillea CTA | 8.1:1 | PASS | PASS | PASS |
| `#1b1b1b` on `#f2f3f4` surface | 15.5:1 | PASS | PASS | PASS |

### Dark Mode (bg: #181818)

| Pairing | Ratio | AA Normal | AA Large | AAA Normal |
|---|---:|:---:|:---:|:---:|
| `#8f5f00` primary on dark bg | **3.2:1** | **FAIL** | PASS | FAIL |
| `#d2b53f` secondary on dark bg | 8.8:1 | PASS | PASS | PASS |
| `#ff5722` terra on dark bg | 5.6:1 | PASS | PASS | FAIL |
| `#ffeb3b` bougainvillea on dark bg | 14.5:1 | PASS | PASS | PASS |
| `#b4b4b4` muted on dark bg | 8.6:1 | PASS | PASS | PASS |
| `#d2d2d2` paragraph on dark bg | 11.7:1 | PASS | PASS | PASS |
| `#f7f7f7` on `#8f5f00` primary CTA | 5.2:1 | PASS | PASS | FAIL |
| White on `#8f5f00` primary CTA | 5.5:1 | PASS | PASS | FAIL |
| White on `#1f1f1f` surface | 16.5:1 | PASS | PASS | PASS |

### Partner Badge Dark Mode

| Pairing | Ratio | AA Normal | AA Large |
|---|---:|:---:|:---:|
| `#003580` booking.com on `#181818` | **1.5:1** | **FAIL** | **FAIL** |
| `#ff6a00` hostelworld on `#181818` | 6.2:1 | PASS | PASS |

### Critical Failures Summary

1. **`#f4d35e` secondary as text on white (1.5:1)** — essentially invisible. Must never be used as text color on white. Only safe as background with dark text on top. **Usage audit: `text-brand-secondary` is not observed as text-on-white in any brikette component. This is a preventive guardrail, not a live rendered failure.**
2. **`#003580` booking.com blue on dark bg (1.5:1)** — two dark colors. Needs a light container/pill in dark mode. **Usage audit: rendered in `packages/ui/src/atoms/RatingsBar.tsx` as provider badge text/icon — live failure on dark backgrounds.**
3. **`#c4572e` terra as text on white (4.4:1)** — misses AA normal by 0.1. Darken slightly to `~#b8502a` to cross 4.5:1. **Usage audit: current `text-brand-terra` usages are mostly icon/accent contexts; treat this as a guardrail unless a body-text usage is identified in planning.**
4. **`#8f5f00` dark-mode primary as text on dark bg (3.2:1)** — fails AA normal, so direct `text-brand-primary` on dark surfaces is unsafe for normal-size copy. **Usage audit correction: global anchors are currently overridden in dark mode via `.dark a { color: var(--color-brand-secondary) }`, so this is a targeted `text-brand-primary` audit item, not a universal dark-link failure.**

## Color Identity Hue Shift Analysis (Dark Mode)

| Token | Light | Dark | Hue shift |
|---|---|---|---|
| primary | `#005887` (teal ~200°) | `#8f5f00` (amber ~40°) | ~160° |
| bougainvillea | `#9b1b33` (crimson ~348°) | `#ffeb3b` (yellow ~52°) | ~64° |

Both dark mode accents are entirely different hues from their light mode counterparts. The comments in `global.css` say "darkened to keep text contrast on primary surfaces" but the values are not darkened variants — they are different colors.

**Proposed fix direction:** Replace with lightened/brightened variants of the same hue that pass WCAG 4.5:1 on the dark background:
- Primary: lighten the teal, e.g. `#4da8d4` (~200° hue preserved, ~5.8:1 on `#181818`)
- Bougainvillea: lighten the crimson, e.g. `#e85070` (~350° hue preserved, ~5.0:1 on `#181818`)

These preserve brand recognition while maintaining contrast. Exact values to be determined in planning.

## Off-Token Color Usage Inventory

### High Severity (semantic bypass — should use brand tokens)

| Pattern | Occurrences | Files affected | Proposed replacement |
|---|---|---|---|
| `text-neutral-900` | 7 | BookPageContent, LandingHeroSection, ApartmentHeroSection | `text-brand-heading` |
| `text-primary-700/400/900/500` | 2 files | _linkTokens.tsx, GuideContent.tsx | `text-brand-primary` + dedicated link token |
| `decoration-primary-300/500/600` | 2 files | _linkTokens.tsx, GuideContent.tsx | `decoration-brand-primary` or remove |
| `text-white` on brand bg | multiple | ApartmentBookContent, NotificationBanner, RoomFilters, DealsBanner, ApartmentDetailsSection | `text-brand-bg` or new `text-on-primary` token |

### Medium Severity (opacity overlays — functional but off-token)

| Pattern | Occurrences | Context | Proposed action |
|---|---|---|---|
| `bg-black/20..60` | 6 | Modal backdrops, image overlays | Keep `bg-black/<opacity>` for scrims (black overlays are mode-independent by convention) or introduce a dedicated `--color-scrim` token. Do NOT replace with `bg-brand-text/<opacity>` — in dark mode brand-text is `#f7f7f7`, producing a light overlay instead of a dark scrim. |
| `bg-white/10..90` | 8 | Hover overlays, card backgrounds, glassmorphism | Replace with `bg-brand-bg/<opacity>` where semantically correct. For hover highlights on dark backgrounds (e.g. `bg-white/10` on hero), keep as-is — these are intentional light-on-dark effects. |
| `border-white/N` | 6 | Hero borders, card borders | Replace with `border-brand-bg/<opacity>` |

### Low Severity (decorative/justified)

| Pattern | Context | Action |
|---|---|---|
| `text-white` on photo overlays | Hero sections over images | Keep — background is a photo, not a theme color |
| ThemeToggle hex colors | SVG sun/moon illustration | Keep — decorative |
| CostBreakdown inline style | Chart legend swatches from data | Keep — dynamic |

## Redundant Code

### Manual CSS utilities duplicating Tailwind config (global.css lines 413-499)

These are all generated by the brand color namespace in `tailwind.config.mjs` and can be deleted:
- `.bg-brand-primary`, `.bg-brand-secondary`, `.bg-brand-bougainvillea`, `.bg-brand-bg`, `.bg-brand-surface`
- `.text-brand-heading`, `.text-brand-text`, `.text-brand-primary`, `.text-brand-bougainvillea`, `.text-brand-bg`
- `.border-brand-bougainvillea`, `.border-brand-primary`
- `.ring-brand-text`, `.ring-brand-primary`, `.ring-brand-bougainvillea`

### Bug: `.text-brand-bg\/90` hardcoded white

```css
/* global.css:470-472 */
.text-brand-bg\/90 { color: rgb(255 255 255 / 0.9); }
```
Always white regardless of theme. Should be `color: rgb(var(--rgb-brand-bg) / 0.9)` — or just use Tailwind's `text-brand-bg/90`. Note: all 4 current consumers (`CareersHero.tsx:94`, `Footer.tsx:230,251`, `FooterLegalRow.tsx:79`) include explicit `dark:text-brand-text/90` or `dark:text-brand-heading/90` overrides that mask this bug in production. The CSS utility is still incorrect and should be fixed, but the actual dark-mode visual impact is currently zero.

### Bug: CTA hover colors hardcoded to light-mode values

```css
/* global.css:337 */
.cta-light:hover { background-color: rgb(244 211 94 / 0.9); }
/* global.css:345 */
.cta-dark:hover { background-color: rgb(0 72 119 / 0.9); }
```
Neither adapts to dark mode.

### JS/CSS token mismatch

`theme-constants.ts` exports `BRAND_PRIMARY_RGB: [0, 98, 154]` but `global.css` defines `--rgb-brand-primary: 0 88 135`. The G and B channels differ. This affects `<meta name="theme-color">` in `layout.tsx:35-36`, causing the browser tab/address bar color to differ from the CSS-rendered brand primary.

## Questions

### Resolved
- Q: Are the operations UI components (packages/ui/src/components/organisms/operations/) visible to brikette users?
  - A: No — they are admin/ops-facing components, out of scope
  - Evidence: import graph shows no brikette routes importing from operations/

### Open (User Input Needed)

- Q: Should dark mode primary stay in the teal hue family (lightened teal) or keep the current amber?
  - Why it matters: determines whether we're fixing a bug or changing the design intent
  - Decision impacted: all dark mode primary-colored elements
  - Decision owner: operator
  - Default assumption: revert to teal family (preserves brand identity) + risk: may need multiple iterations to find a teal that passes 4.5:1

- Q: Should we introduce a `text-on-primary` / `text-on-accent` token pair for text placed on colored backgrounds?
  - Why it matters: cleaner than using `text-brand-bg` (which is semantically "background color as text color")
  - Decision impacted: 18+ files with `text-white` on brand backgrounds
  - Decision owner: operator
  - Default assumption: yes, add `--color-brand-on-primary` and `--color-brand-on-accent` + risk: minor — adds 2 tokens

## Confidence Inputs

- Implementation: 90% — all affected files identified, changes are CSS/class level, no architectural risk
  - Evidence: comprehensive file-level audit with line numbers
  - To 90+: already there
- Approach: 80% — dark mode hue direction needs operator decision
  - Evidence: contrast ratios calculated, hue shift documented
  - To 90: confirm dark mode palette direction
- Impact: 85% — improves visual consistency and accessibility compliance
  - Evidence: 4 WCAG AA failures documented, 160° hue shift in dark mode primary
  - To 90: visual QA confirms changes look right
- Delivery-Readiness: 85% — all evidence gathered, template + token structure clear
  - Evidence: complete file inventory, contrast calculations, proposed replacements
  - To 90: resolve the 2 open questions
- Testability: 70% — no visual regression tests; rely on manual QA
  - Evidence: no Playwright visual tests exist for color
  - To 80: add a contrast-check script or use Lighthouse CI accessibility audit
  - To 90: add Percy/Chromatic visual regression

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Dark mode hue change looks wrong to operator | Medium | Medium | Get approval on specific hex values before implementing |
| Removing manual CSS utilities breaks specificity cascading | Low | Medium | Tailwind-generated classes have same specificity; verify with grep for `!important` |
| Base theme tokens bleed through in unexpected places | Low | Medium | Grep for `bg-primary`, `text-accent` etc. in brikette imports |
| JS theme-constants.ts consumers break if values change | Low | Low | Search for imports and update in sync |
| `text-white` removal on hero sections causes contrast issues | Low | Medium | Keep `text-white` on photo overlays; only replace on solid brand-color backgrounds |
| `bg-brand-text/<opacity>` replacement for `bg-black` inverts scrim semantics in dark mode | Medium | Medium | In dark mode `brand-text` is light — use dedicated scrim token or keep `bg-black` for overlays |
| `text-primary-700` may not resolve to any color in Tailwind v4 (single-value `primary`) | Low | Low | Check computed CSS in browser DevTools before replacing |

## Suggested Task Seeds (Non-binding)

1. **Fix dark mode palette hue** — replace amber primary + yellow bougainvillea with hue-consistent lightened variants
2. **Fix WCAG failures** — darken terra, add booking.com dark mode pill, ensure secondary never used as text
3. **Fix bugs** — `.text-brand-bg/90` hardcoded white, CTA hover hardcoded colors, JS/CSS value mismatch
4. **Remove redundant manual utilities** — delete global.css lines 413-499 (verify no specificity breakage first)
5. **Replace `text-neutral-900`** → `text-brand-heading` across 3 files (7 occurrences)
6. **Replace `text-primary-700` guide link tokens** → brand-aware link tokens in `_linkTokens.tsx` and `GuideContent.tsx`
7. **Replace `text-white` on solid brand backgrounds** → `text-on-primary` token (multiple locations)
8. **Normalize overlay semantics by intent** — keep `bg-black/<opacity>` for scrims (or introduce a dedicated scrim token), and only replace decorative `bg-white/<opacity>` cases where brand-token alternatives preserve visual intent
9. **Add `text-on-primary` / `text-on-accent` tokens** to global.css and tailwind config

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: lp-design-system
- Deliverable acceptance package:
  - Zero WCAG AA failures for brand color pairings
  - Dark mode accents remain within 30° hue of light mode counterparts
  - Zero `text-neutral-*`, `text-primary-N` in brikette source
  - Manual utility classes removed from global.css
  - All existing tests pass
- Post-delivery measurement plan:
  - Lighthouse accessibility score before/after
  - Manual dark mode visual QA

## Evidence Gap Review

### Gaps Addressed
- All 20 key contrast pairings computed with WCAG formula
- Complete file-level inventory of off-token colors with line numbers
- Both color system layers fully documented
- Dark mode hue shift quantified in degrees

### Confidence Adjustments
- Implementation raised to 90% after exhaustive file audit
- Testability kept at 70% due to lack of visual regression infrastructure

### Remaining Assumptions
- Base theme `text-primary-*` shades are confirmed used in 2 brikette files (`_linkTokens.tsx:20`, `GuideContent.tsx:82`). These resolve through `--color-primary` (base theme HSL blue 220°), not `--color-brand-primary` (brand teal ~200°). These must be replaced during this work.
- `text-white` on photo overlays is intentionally correct (operator assumption)
- Operations UI components are out of scope (confirmed by import graph)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None if default assumption is accepted (`teal-family` dark primary). If operator explicitly prefers amber, re-run the dark-mode contrast sweep before implementation.
- Recommended next step:
  - `/lp-do-plan` to sequence the 9 task seeds into implementation order
