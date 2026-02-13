---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: ds-skylar-migration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Overall-confidence: 78%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: pending
---

# P4 — Design System: Skylar CSS Variable Migration Plan

## Summary

Migrate `apps/skylar/` from its custom CSS variable system (26 `--skylar-*` vars, 8 `--it-*` vars) and extensive hardcoded `rgba()` values to the centralised token system. Investigation reveals the scope is significantly larger than originally estimated: 42 CSS files containing 224 custom variable references, 353 `rgba/hsla` values, and 72 hex colour codes — totalling ~649 CSS-level violations. The TSX layer is cleaner (already partially using semantic tokens), with 27 baselined Tailwind violations.

Skylar does **not** currently import `@themes/base/tokens.css` — it relies on Tailwind 4's CSS-first system to pick up base tokens via the shared root config. The custom `--skylar-*` variables in `shell.css` operate as a completely parallel colour system.

## Goals

- Replace the `--skylar-*` / `--it-*` custom variable system with base theme token references
- Replace hardcoded `rgba()` and hex values with token-based alternatives
- Fix 27 baselined `ds/no-raw-tailwind-color` violations in TSX components
- Add scoped ESLint `error` config for Skylar
- Remove Skylar entries from baseline file

## Non-goals

- Redesigning Skylar's visual identity
- Restructuring CSS from module CSS to Tailwind utilities
- Creating a Skylar-specific theme package (defaulting to base tokens; escalate only if >5 unmapped colours)

## Constraints & Assumptions

- Skylar is a marketing/branding site — visual fidelity is critical
- The `--skylar-*` system spans 3 locale variants (English, Italian/Milan, Chinese/ZH) with different palettes per locale
- Many `rgba()` values are gradient overlays and box shadows — these need design decisions, not mechanical replacement
- Defaulting to base theme tokens; if mapping leaves >5 unmapped colours, escalate to create a Skylar theme package

## Fact-Find Reference

- Brief: `docs/plans/ds-skylar-migration-fact-find.md`
- Key finding update: 42 CSS files (vs fact-find's 22); 649 CSS violations (vs fact-find's estimate); TSX already partially migrated

## Existing System Notes

- Custom vars defined in: `apps/skylar/src/app/styles/shell.css`
- No `@import "@themes/base/tokens.css"` in any Skylar CSS
- 27 baselined TSX violations (all `zinc-*` and `slate-*` overlays)
- CSS files organised by variant: `loket-*` (base), `milan-*` (Italian), `products-en` / `people-en` / `real-estate` (English), `zh/*` (Chinese)

## Proposed Approach

**Phase 1 — Shell foundation:** Map `--skylar-*` and `--it-*` variables to base theme tokens in `shell.css`. This is the critical dependency — all other CSS files reference these variables.

**Mapping decision (defaulting to base tokens):**

| Custom Variable | Base Token Candidate | Confidence |
|---|---|---|
| `--skylar-gold` (#d5b169) | `--color-accent` | Medium — accent is gold in some themes |
| `--skylar-cream` (#f8f4ed) | `--color-bg` | High — warm page background |
| `--skylar-charcoal` (#080808) | `--color-fg` | High — near-black text |
| `--skylar-en-accent` (#E43D12) | `--color-primary` | Medium — bold red-orange |
| `--skylar-en-gold` (#EFB11D) | `--color-accent` | Medium |
| `--it-gold` (#D8B072) | `--color-accent` | Medium |
| `--it-ground` | `--color-bg` | High |
| `--it-ink` | `--color-fg` | High |

For variables that don't map cleanly, use CSS custom properties that reference base tokens with overrides:
```css
:root {
  --skylar-gold: hsl(var(--color-accent));  /* was #d5b169 */
}
```

**Phase 2 — CSS file migration (by variant):** Migrate each CSS file group, replacing `rgba()` values with token references. For shadows and gradients that need alpha channels, use the HSL pattern: `hsl(var(--color-fg) / 0.25)`.

**Phase 3 — TSX violations:** Fix the 27 baselined zinc/slate violations.

**Phase 4 — Config + baseline cleanup.**

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| SKY-01 | IMPLEMENT | Migrate shell.css custom variable definitions | 78% | M | Pending | - | SKY-02..06 |
| SKY-02 | IMPLEMENT | Migrate Loket CSS files (17 files) | 75% | M | Pending | SKY-01 | SKY-07 |
| SKY-03 | IMPLEMENT | Migrate Milan CSS files (4 files, ~1,400 lines) | 72% | L | Pending | SKY-01 | SKY-07 |
| SKY-04 | IMPLEMENT | Migrate English variant CSS files (3 files, ~900 lines) | 75% | M | Pending | SKY-01 | SKY-07 |
| SKY-05 | IMPLEMENT | Migrate ZH variant CSS files (13 files, ~800 lines) | 78% | M | Pending | SKY-01 | SKY-07 |
| SKY-06 | IMPLEMENT | Fix TSX Tailwind violations + Nav.module.css (8 files) | 85% | S | Pending | SKY-01 | SKY-07 |
| SKY-07 | IMPLEMENT | ESLint config escalation + baseline cleanup | 95% | S | Pending | SKY-02..06 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | SKY-01 | - | Foundation — all CSS files reference shell.css vars |
| 2 | SKY-02, SKY-03, SKY-04, SKY-05, SKY-06 | SKY-01 | All variant groups independent |
| 3 | SKY-07 | Wave 2 complete | Config + baseline |

**Max parallelism:** 5 | **Critical path:** 3 waves | **Total tasks:** 7

## Tasks

### SKY-01: Migrate shell.css custom variable definitions

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/skylar/src/app/styles/shell.css`
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/skylar/src/app/styles/shell.css` (324 lines, 81 var refs, 22 rgba, 36 hex)
  - **[readonly]** `packages/themes/base/src/tokens.ts`
- **Depends on:** -
- **Blocks:** SKY-02, SKY-03, SKY-04, SKY-05, SKY-06
- **Confidence:** 78%
  - Implementation: 80% — 34 custom variables to map; some have clear token equivalents, others need design judgement
  - Approach: 78% — defaulting to base tokens; may need fallback if accent colours are too different
  - Impact: 75% — shell.css is the foundation; incorrect mapping here cascades to all pages
- **Acceptance:**
  - All 26 `--skylar-*` variables redefined as base token references or removed
  - All 8 `--it-*` variables redefined as base token references or removed
  - `rgba()` values in shell.css replaced with `hsl(var(--token) / alpha)` pattern
  - Hex colour codes eliminated
  - Add `@import "@themes/base/tokens.css"` if not already present via Tailwind
- **Validation contract:**
  - TC-01: `grep -c '#[0-9a-fA-F]' shell.css` → 0
  - TC-02: `grep -c 'rgba(' shell.css` → 0 (or only in `hsl()` wrapper patterns)
  - TC-03: All pages render without CSS errors (dev server)
  - TC-04: Visual comparison of each locale homepage before/after
  - Validation type: grep + visual comparison
  - Run/verify: `pnpm dev --filter skylar`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Confirmed 1:1 visual match for each locale homepage; or explicit sign-off that slight palette shift is acceptable
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None
- **Notes:** This is the riskiest task in the plan. The gold/cream/charcoal palette has specific brand meaning — mapping to generic `--color-accent` may shift the visual identity. If >5 variables have no good base token, escalate to creating `packages/themes/skylar/`.

### SKY-02: Migrate Loket CSS files (17 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 17 CSS files in `apps/skylar/src/app/styles/loket-*.css`
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/skylar/src/app/styles/loket-*.css` (17 files, ~1,100 lines total)
- **Depends on:** SKY-01
- **Blocks:** SKY-07
- **Confidence:** 75%
  - Implementation: 78% — 17 files; many reference `--skylar-*` vars (which SKY-01 redefines); remaining `rgba()` values need alpha-channel token patterns
  - Approach: 80% — once shell.css vars are token-based, these files mostly "just work"; remaining inline colours need individual mapping
  - Impact: 75% — base variant pages; any visual issues visible immediately
- **Acceptance:**
  - All `--skylar-*` and `--it-*` references resolve to token-based values (via SKY-01)
  - Remaining hardcoded `rgba()` → `hsl(var(--token) / alpha)`
  - Remaining hex colours → `hsl(var(--token))`
  - Zero hardcoded colour values in any loket-*.css file
- **Validation contract:**
  - TC-01: `grep -rc 'rgba\|hsla\|#[0-9a-fA-F]' apps/skylar/src/app/styles/loket-*.css` → 0 per file
  - TC-02: Visual check of base variant homepage, products, real-estate, services pages
  - Validation type: grep + visual
  - Run/verify: dev server check
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### SKY-03: Migrate Milan CSS files (4 files, ~1,400 lines)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 4 CSS files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/skylar/src/app/styles/milan-base.css` (335 lines)
  - **Primary:** `apps/skylar/src/app/styles/milan-home.css` (570 lines)
  - **Primary:** `apps/skylar/src/app/styles/milan-people.css` (157 lines)
  - **Primary:** `apps/skylar/src/app/styles/milan-products.css` (142 lines)
  - **Primary:** `apps/skylar/src/app/styles/milan-real-estate.css` (300 lines)
- **Depends on:** SKY-01
- **Blocks:** SKY-07
- **Confidence:** 72%
  - Implementation: 75% — 5 files, ~1,500 lines total; milan-home alone has 50 rgba values and 23 var refs; highest density of gradient/shadow patterns
  - Approach: 75% — Italian variant has its own `--it-*` palette; needs careful mapping to avoid losing locale-specific warmth
  - Impact: 70% — Milan variant is a distinct brand expression; visual fidelity is critical
- **Acceptance:**
  - All `--it-*` and `--skylar-*` references resolve to tokens
  - All `rgba()` gradients and shadows use `hsl(var(--token) / alpha)` pattern
  - All hex colours eliminated
  - Milan homepage gradient overlays maintain visual character
- **Validation contract:**
  - TC-01: `grep -rc 'rgba\|hsla\|#[0-9a-fA-F]' apps/skylar/src/app/styles/milan-*.css` → 0 per file
  - TC-02: Visual comparison of Milan homepage, products page, real-estate page before/after
  - Validation type: grep + visual comparison
  - Run/verify: dev server with Milan locale
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Side-by-side screenshot comparison showing equivalent visual output
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None
- **Notes:** Highest-risk file group. Milan home has 570 lines with 50 rgba values — many are gradient overlays that define the Italian brand feeling.

### SKY-04: Migrate English variant CSS files (3 files, ~900 lines)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 3 CSS files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/skylar/src/app/styles/people-en.css` (192 lines)
  - **Primary:** `apps/skylar/src/app/styles/products-en.css` (448 lines)
  - **Primary:** `apps/skylar/src/app/styles/real-estate.css` (260 lines)
- **Depends on:** SKY-01
- **Blocks:** SKY-07
- **Confidence:** 75%
  - Implementation: 78% — 3 files; products-en is the densest (31 rgba, 4 hex, 13 var refs)
  - Approach: 78% — English variant uses `--skylar-en-*` vars; mapping to base tokens
  - Impact: 72% — English variant is the primary marketing surface
- **Acceptance:**
  - All `--skylar-en-*` references resolve to tokens
  - All `rgba()` → `hsl(var(--token) / alpha)`
  - All hex → token references
- **Validation contract:**
  - TC-01: `grep -rc 'rgba\|hsla\|#[0-9a-fA-F]' people-en.css products-en.css real-estate.css` → 0
  - TC-02: Visual check of English products page, people page, real-estate page
  - Validation type: grep + visual
  - Run/verify: dev server with English locale
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### SKY-05: Migrate ZH variant CSS files (13 files, ~800 lines)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 13 CSS files in `apps/skylar/src/app/styles/zh/`
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/skylar/src/app/styles/zh/*.css` (13 files, ~800 lines total)
- **Depends on:** SKY-01
- **Blocks:** SKY-07
- **Confidence:** 78%
  - Implementation: 80% — 13 files but smaller (avg 60 lines); no `--skylar-*` refs (use inline hex/rgba directly)
  - Approach: 80% — ZH files don't reference shell.css vars — they use standalone hex/rgba; need direct token mapping
  - Impact: 75% — Chinese variant; lower traffic but still customer-facing
- **Acceptance:**
  - All `rgba()` → `hsl(var(--token) / alpha)` or eliminated
  - All hex → token references
  - Zero hardcoded colour values in zh/ directory
- **Validation contract:**
  - TC-01: `grep -rc 'rgba\|hsla\|#[0-9a-fA-F]' apps/skylar/src/app/styles/zh/` → 0
  - TC-02: Visual check of Chinese homepage and products page
  - Validation type: grep + visual
  - Run/verify: dev server with ZH locale
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### SKY-06: Fix TSX Tailwind violations + Nav.module.css (8 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — TSX files + `Nav.module.css`
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/skylar/src/app/[lang]/page.tsx`
  - **Primary:** `apps/skylar/src/app/[lang]/products/components/StandardProductsPage.tsx`
  - **Primary:** `apps/skylar/src/app/[lang]/real-estate/components/DefaultRealEstatePage.tsx`
  - **Primary:** `apps/skylar/src/components/HeroSection.tsx`
  - **Primary:** `apps/skylar/src/components/PeopleCard.tsx`
  - **Primary:** `apps/skylar/src/components/ServicesSection.tsx`
  - **Primary:** `apps/skylar/src/components/Nav.module.css`
- **Depends on:** SKY-01
- **Blocks:** SKY-07
- **Confidence:** 85%
  - Implementation: 88% — 27 baselined violations, all `zinc-*`/`slate-*` overlay patterns; Nav.module.css has 11 rgba values
  - Approach: 88% — `bg-zinc-900/60` → `bg-overlay-scrim-1`, `text-zinc-100` → `text-fg-inverse`
  - Impact: 82% — hero sections and navigation are primary brand surfaces
- **Acceptance:**
  - All 27 baselined violations fixed (zinc/slate → semantic tokens)
  - Nav.module.css: all `rgba()` → token-based; all `--skylar-*` refs resolve
  - Zero raw palette classes in TSX files
- **Validation contract:**
  - TC-01: `grep -rcE 'zinc-[0-9]|slate-[0-9]|text-white|bg-white|bg-black' apps/skylar/src/ --include='*.tsx'` → 0
  - TC-02: Skylar entries removed from baseline file (done in SKY-07)
  - TC-03: `pnpm lint -- --filter skylar` → zero violations
  - Validation type: lint + grep
  - Run/verify: `pnpm lint -- --filter skylar`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### SKY-07: ESLint config escalation + baseline cleanup

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `eslint.config.mjs` + baseline file
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `eslint.config.mjs`
  - **Primary:** `tools/eslint-baselines/ds-no-raw-tailwind-color.json`
- **Depends on:** SKY-02, SKY-03, SKY-04, SKY-05, SKY-06
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — add scoped config block; remove 27 baseline entries
  - Approach: 95% — standard enforcement pattern
  - Impact: 95% — lint-only
- **Acceptance:**
  - Scoped `error` block for `apps/skylar/**`
  - 27 Skylar entries removed from baseline file
  - `pnpm lint` passes repo-wide
- **Validation contract:**
  - TC-01: `grep 'skylar' tools/eslint-baselines/ds-no-raw-tailwind-color.json` → 0
  - TC-02: `pnpm lint` → passes
  - Validation type: lint + grep
  - Run/verify: `pnpm lint`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Brand identity shift from generic token mapping | High | Medium | If >5 colours don't map, create `packages/themes/skylar/` with brand-specific overrides |
| Milan gradient overlays lose visual warmth | Medium | Medium | Side-by-side comparison before committing; preserve alpha patterns |
| ZH variant uses standalone colours (no shell.css vars) | Low | Low | Direct hex→token mapping; simpler but needs per-file attention |
| Shell.css mapping cascades visual issues to all locales | Medium | High | Test each locale variant after SKY-01 before proceeding to Wave 2 |

## Acceptance Criteria (overall)

- [ ] Zero `--skylar-*` or `--it-*` custom variables with hardcoded values (all reference base tokens)
- [ ] Zero hardcoded hex/rgba/hsla in CSS files (or only in token-based `hsl(var() / alpha)` patterns)
- [ ] Zero `ds/no-raw-tailwind-color` violations in TSX files
- [ ] `ds/no-raw-tailwind-color` at `error` level for Skylar
- [ ] Skylar entries removed from baseline file
- [ ] Visual sign-off: each locale homepage maintains visual character

## Decision Log

- 2026-02-12: Investigation reveals 42 CSS files / 649 CSS violations (much larger than fact-find's 22 files)
- 2026-02-12: Default to base theme tokens (no Skylar theme package) — escalate if >5 unmapped colours
- 2026-02-12: TSX layer already partially migrated — some files use semantic tokens already
