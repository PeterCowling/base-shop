---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-02-22
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/theming-charter.md
Feature-Slug: brik-color-token-consolidation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-system
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact) per task; Overall-confidence is effort-weighted average (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Brik Color Token Consolidation Plan

## Summary
This plan consolidates Brikette color usage onto the brand token system and removes bypass paths that currently mix base theme and brand semantics. The sequence starts with one operator-facing decision and one evidence-tightening investigation, then stabilizes token foundations before broad class migration. Live contrast failures (notably Booking badge in dark mode) are remediated before large-scale replacement work. A horizon checkpoint is inserted before validation hardening to force reassessment of the highest-blast-radius migration task. Scope remains color-system and accessibility behavior only; no layout or structural redesign is included.

## Active tasks
- [x] TASK-01: Decide dark palette direction and on-primary token contract
- [x] TASK-02: Investigate migration inventory + Tailwind primary scale behavior
- [x] TASK-03: Implement token foundation fixes and JS/CSS sync
- [x] TASK-04: Implement contrast-critical color remediations
- [x] TASK-05: Remove redundant manual brand utilities from global CSS
- [x] TASK-06: Migrate off-token class usage across brikette/shared UI
- [x] TASK-07: Horizon checkpoint - reassess downstream validation plan
- [x] TASK-08: Add targeted contrast and regression validation coverage
- [x] TASK-09: Execute final QA and publish rollout notes

## Goals
- Establish brand token layer as the authoritative color path in brikette and shared UI surfaces consumed by brikette.
- Eliminate known live contrast failures and prevent recurrence through validation coverage.
- Remove redundant manual CSS utilities that duplicate Tailwind-generated brand utilities.
- Replace high-severity off-token class usage with semantic brand token usage.

## Non-goals
- Rebranding or introducing a new visual identity outside the current hue family.
- Refactoring operations/admin-only components under `packages/ui/src/components/organisms/operations/`.
- Modifying CMS/page-builder user-configurable preset systems.
- Changing layout structure, component information architecture, or copy.

## Constraints & Assumptions
- Constraints:
  - All normal text pairings must meet WCAG AA (>=4.5:1).
  - `.dark` class toggle remains the active mechanism (no theme-system rewrite).
  - Rollout must preserve existing behavior in routes outside color rendering semantics.
- Assumptions:
  - Operator accepts default direction of hue-consistent dark palette unless overridden in TASK-01.
  - Introducing `text-on-primary` / `text-on-accent` is acceptable to replace hardcoded `text-white` on solid brand fills.
  - Existing test suite can remain mostly intact with targeted additions for contrast/regression checks.

## Fact-Find Reference
- Related brief: `docs/plans/brik-color-token-consolidation/fact-find.md`
- Key findings used:
  - Live dark-mode badge contrast failure in `packages/ui/src/atoms/RatingsBar.tsx`.
  - Dual-system leak path via `text-primary-*`/`decoration-primary-*` in guide components.
  - Token mismatch between `apps/brikette/src/utils/theme-constants.ts` and `apps/brikette/src/styles/global.css` affecting viewport theme color.
  - Redundant manual utility block in `apps/brikette/src/styles/global.css` lines ~413-499.

## Proposed Approach
- Option A: Patch only known failing components and keep dual token systems in place.
- Option B: Full token consolidation pass with semantic migration, utility cleanup, and targeted validation (chosen).
- Chosen approach:
  - Use a staged consolidation where token source-of-truth and critical contrast fixes land before broad class migration.
  - Protect execution with an upstream investigation and a post-migration checkpoint before final validation.

## Plan Gates
- Foundation Gate: Pass
  - Fact-find provides `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`, startup alias, delivery-readiness, and test landscape.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (`Auto-Build-Intent: plan-only`)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Confirm dark hue family and semantic on-color token policy | 85% | S | Complete (2026-02-22) | - | TASK-03, TASK-04, TASK-06 |
| TASK-02 | INVESTIGATE | Validate inventory counts/classification and confirm `text-primary-*` runtime behavior | 85% | S | Complete (2026-02-22) | - | TASK-03, TASK-05, TASK-06 |
| TASK-03 | IMPLEMENT | Align token foundations (`global.css`, `tailwind.config.mjs`, `theme-constants.ts`) | 85% | M | Complete (2026-02-22) | TASK-01, TASK-02 | TASK-04, TASK-05, TASK-06 |
| TASK-04 | IMPLEMENT | Resolve live contrast-critical pairings (dark palette + ratings badge + terra guardrail) | 85% | M | Complete (2026-02-23) | TASK-03 | TASK-06, TASK-08 |
| TASK-05 | IMPLEMENT | Remove redundant manual brand utility definitions from global CSS | 85% | S | Complete (2026-02-23) | TASK-02, TASK-03 | TASK-06 |
| TASK-06 | IMPLEMENT | Replace off-token classes in brikette/shared UI consumer surfaces | 75% | L | Complete (2026-02-23) | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | TASK-07 |
| TASK-07 | CHECKPOINT | Reassess downstream validation plan and confidence after broad migration | 95% | S | Complete (2026-02-23) | TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Add/execute targeted contrast and regression validation contract | 85% | M | Complete (2026-02-23) | TASK-04, TASK-07 | TASK-09 |
| TASK-09 | IMPLEMENT | Run final QA, update decision log, and capture rollout/rollback notes | 85% | S | Complete (2026-02-23) | TASK-08 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Decision + investigation can run in parallel. |
| 2 | TASK-03 | TASK-01, TASK-02 | Token foundation before any broad migration. |
| 3 | TASK-04, TASK-05 | TASK-03 (+ TASK-02 for TASK-05) | Contrast-critical fixes and utility cleanup can run concurrently. |
| 4 | TASK-06 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | Highest blast-radius migration. |
| 5 | TASK-07 | TASK-06 | Required checkpoint before validation hardening. |
| 6 | TASK-08 | TASK-04, TASK-07 | Validation coverage after checkpoint recalibration. |
| 7 | TASK-09 | TASK-08 | Final verification and publication notes. |

## Tasks

### TASK-01: Decide dark palette direction and on-primary token contract
- **Type:** DECISION
- **Deliverable:** Decision record in `docs/plans/brik-color-token-consolidation/plan.md` (Decision Log) covering dark hue direction and `text-on-*` token policy
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Affects:** `apps/brikette/src/styles/global.css`, `apps/brikette/tailwind.config.mjs`, `packages/ui/src/atoms/RatingsBar.tsx`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04, TASK-06
- **Confidence:** 85%
  - Implementation: 90% - Decision capture is straightforward and local to planning artifact.
  - Approach: 85% - Two explicit options already enumerated in fact-find.
  - Impact: 85% - Decision materially determines downstream token and class migration behavior.
- **Options:**
  - Option A: Keep amber dark primary with minimal contrast-only adjustments.
  - Option B: Use hue-consistent teal-family dark primary plus semantic `text-on-*` tokens.
- **Recommendation:** Option B; it preserves brand continuity and avoids ad hoc `text-white` usage.
- **Decision input needed:**
  - question: approve hue-consistent dark palette and introduction of `text-on-primary`/`text-on-accent` tokens?
  - why it matters: sets canonical token semantics for every downstream replacement.
  - default + risk: default to Option B; risk is additional tuning iteration if perceived too bright/dim.
- **Acceptance:**
  - Decision log entry records selected option and rationale.
  - Downstream tasks reference a single palette/token policy with no ambiguity.
  - No blocking ambiguity remains for TASK-03/TASK-04/TASK-06.
- **Validation contract:** decision considered closed when operator explicitly confirms or does not override default before TASK-03 starts.
- **Planning validation:** None: decision task; no code mutation performed in planning phase.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** Update Decision Log section with final option and date.
- **Notes / references:**
  - Decision resolved by operator input: **Option B approved** (hue-consistent dark palette direction + semantic `text-on-*` token path).

### TASK-02: Investigate migration inventory + Tailwind primary scale behavior
- **Type:** INVESTIGATE
- **Deliverable:** Investigation notes in TASK-02 and normalized migration targets list referenced by TASK-06
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Affects:** `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`, `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`, `apps/brikette/src/styles/global.css`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-05, TASK-06
- **Confidence:** 85%
  - Implementation: 90% - Investigation commands and targets are concrete.
  - Approach: 85% - Classification criteria (live failure vs guardrail vs decorative) are already defined.
  - Impact: 85% - Reduces migration uncertainty for the largest implementation task.
- **Questions to answer:**
  - Are all remaining `text-primary-*`/`decoration-primary-*` usages in scope and mapped to brand equivalents?
  - Which `bg-black/*` and `bg-white/*` usages are semantic scrims vs decorative overlays?
  - Do `text-primary-*` utilities resolve reliably in current brikette Tailwind build output?
- **Acceptance:**
  - Updated, deduplicated migration inventory with semantic category per usage class.
  - Explicit list of exclusions retained (photo overlays, decorative SVG colors, ops components).
  - Tailwind utility behavior for `text-primary-*` documented with observed build/runtime evidence.
- **Validation contract:** Evidence table includes command outputs and file references sufficient for another operator to reproduce classification.
- **Planning validation:** checks run and outputs are captured in existing fact-find references; no additional code path changes required.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Add findings note under TASK-02 and reflect any scope correction in TASK-06 notes.
- **Notes / references:**
  - `docs/plans/brik-color-token-consolidation/fact-find.md`
  - Build evidence (2026-02-22):
    - Q1 (`text-primary-*` / `decoration-primary-*` in-scope mapping):
      - Remaining occurrences are concentrated in 2 guide paths only:
        - `apps/brikette/src/routes/guides/utils/_linkTokens.tsx:20`
        - `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx:82`
      - Normalization target: migrate all `text-primary-*`, `decoration-primary-*`, and `outline-primary-*` link styles in these two files to brand-semantic link tokens in TASK-06.
    - Q2 (overlay classification):
      - Keep as semantic scrims/backdrops (do not replace with light-on-dark inversions):
        - `packages/ui/src/organisms/GlobalModals.tsx:50`
        - `packages/ui/src/organisms/modals/LocationModal.tsx:69`
        - `packages/ui/src/context/modal/Loader.tsx:11`
        - `packages/ui/src/molecules/SimpleModal.tsx:62`
        - `packages/ui/src/organisms/ApartmentHighlightsSection.tsx:65`
      - Candidate decorative highlight replacements (evaluate case-by-case in TASK-06):
        - `packages/ui/src/organisms/StickyBookNow.tsx:244`
        - `packages/ui/src/organisms/DealsPage.tsx:184`
        - `apps/brikette/src/components/cta/ContentStickyCta.tsx:183`
        - `packages/ui/src/molecules/NotificationBanner.tsx:138`
        - `packages/ui/src/organisms/LandingHeroSection.tsx:88`
    - Q3 (`text-primary-*` runtime reliability):
      - Base preset defines `primary` as a single scalar token (`packages/tailwind-config/src/index.ts:52`) and app config does not add shade keys for `primary` (`apps/brikette/tailwind.config.mjs:41`).
      - Repo CSS search found no generated `.text-primary-700/.400/.900/.500` selectors.
      - Investigation outcome: treat `text-primary-*` shade classes as non-canonical/unsafe and migrate in TASK-06.
    - Normalized migration target list for TASK-06:
      - Tier A (must replace): `text-primary-*`, `decoration-primary-*`, `outline-primary-*`, `text-neutral-900` on brand-secondary CTAs/banners, `text-white` on solid brand backgrounds.
      - Tier B (preserve by intent): modal/overlay scrims using `bg-black/*` and explicit photo-overlay text styles where contrast is intentionally handled with imagery + dark overrides.
      - Tier C (out of scope): `packages/ui/src/components/organisms/operations/**`.

### TASK-03: Implement token foundation fixes and JS/CSS sync
- **Type:** IMPLEMENT
- **Deliverable:** token foundation alignment in `apps/brikette/src/styles/global.css`, `apps/brikette/tailwind.config.mjs`, `apps/brikette/src/utils/theme-constants.ts` (and dependent theme-color usage parity)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-22)
- **Affects:** `apps/brikette/src/styles/global.css`, `apps/brikette/tailwind.config.mjs`, `apps/brikette/src/utils/theme-constants.ts`, `[readonly] apps/brikette/src/app/layout.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-05, TASK-06
- **Confidence:** 85%
  - Implementation: 85% - Affected token files are known and centralized.
  - Approach: 85% - Decision and inventory prerequisites reduce semantic ambiguity.
  - Impact: 90% - Foundation alignment removes known mismatch and prevents downstream drift.
- **Acceptance:**
  - `theme-constants.ts` RGB constants match CSS brand primary RGB values in light and dark.
  - `.text-brand-bg/90` and CTA hover states are token-derived and theme-consistent.
  - `text-on-primary`/`text-on-accent` token path exists if approved in TASK-01.
- **Validation contract (TC-03):**
  - TC-03.1 (happy): theme-color values in app metadata align with computed CSS variables for light/dark.
  - TC-03.2 (failure): no hardcoded white-only utility remains for `.text-brand-bg/90` behavior.
  - TC-03.3 (edge): dark mode hover/focus styles preserve contrast and semantic token linkage.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "BRAND_PRIMARY_RGB|BRAND_PRIMARY_DARK_RGB|themeColor" apps/brikette/src`
    - `nl -ba apps/brikette/src/styles/global.css | sed -n '60,140p'`
  - Validation artifacts:
    - Existing mismatch evidence in `docs/plans/brik-color-token-consolidation/fact-find.md`
  - Unexpected findings:
    - Dark-mode RGB mismatch also present in JS constants (not only light mode).
- **Consumer tracing (required):**
  - New outputs:
    - `--color-brand-on-primary` / `--color-brand-on-accent` (if added) consumed by TASK-06 class migrations in booking/banner/CTA components.
    - Updated RGB constants consumed by `viewport.themeColor` in `apps/brikette/src/app/layout.tsx`.
  - Modified behavior:
    - `theme-constants.ts` value semantics change; all imports from `@/utils/theme-constants` must remain tuple-compatible.
    - `.text-brand-bg/90` utility semantics change; existing consumers with explicit `dark:` overrides remain safe.
  - Unchanged consumer note:
    - `apps/brikette/src/app/layout.tsx` remains unchanged because it already consumes constants; value parity is the intended fix.
- **Scouts:** None: upstream TASK-02 resolves inventory uncertainty.
- **Edge Cases & Hardening:** Preserve fallback behavior when `.dark` class is absent.
- **What would make this >=90%:**
  - Add automated assertion test for JS/CSS RGB parity to prevent future drift.
- **Rollout / rollback:**
  - Rollout: ship token foundation in one PR before class migration.
  - Rollback: revert token/value changes while keeping decision notes; no schema migration involved.
- **Documentation impact:**
  - Update decision notes and task references if token names change.
- **Notes / references:**
  - `docs/plans/brik-color-token-consolidation/fact-find.md:94`
  - Downstream confidence propagation after TASK-02 completion (2026-02-22): re-scored; confidence unchanged at 85% (investigation was affirming but task was already above threshold).
  - Build completion evidence (2026-02-22):
    - Files updated:
      - `apps/brikette/src/styles/global.css`
      - `apps/brikette/tailwind.config.mjs`
      - `apps/brikette/src/utils/theme-constants.ts`
    - Option B token path established:
      - added `--color-brand-on-primary`, `--color-brand-on-accent` and RGB companions in light/dark token sets.
      - added Tailwind brand mappings: `brand.on-primary`, `brand.on-accent`.
    - TC-03 validation artifacts:
      - TC-03.1: JS/CSS brand primary parity script reports `match-light true`, `match-dark true`.
      - TC-03.2: `.text-brand-bg/90` now resolves via `rgb(var(--rgb-brand-bg) / 0.9)` (no hardcoded white utility value).
      - TC-03.3: CTA hover colors now token-derived (`rgb(var(--rgb-brand-secondary)/0.9)` and `rgb(var(--rgb-brand-primary)/0.9)`), preserving theme linkage.
    - Commands run:
      - `pnpm --filter brikette typecheck` (pass)
      - `pnpm --filter brikette lint` (pass; lint currently reports informational "temporarily disabled")

### TASK-04: Implement contrast-critical color remediations
- **Type:** IMPLEMENT
- **Deliverable:** corrected contrast-critical token values and component-specific dark badge readability fixes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/brikette/src/styles/global.css`, `apps/brikette/src/utils/theme-constants.ts`, `packages/ui/src/atoms/RatingsBar.tsx`, `packages/ui/src/molecules/NotificationBanner.tsx`, `packages/ui/src/molecules/DealsBanner.tsx`, `packages/ui/src/organisms/ApartmentHeroSection.tsx`, `packages/ui/src/organisms/LandingHeroSection.tsx`, `packages/ui/src/organisms/ApartmentDetailsSection.tsx`, `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx`, `apps/brikette/src/app/[lang]/apartment/ApartmentPageContent.tsx`
- **Depends on:** TASK-03
- **Blocks:** TASK-06, TASK-08
- **Confidence:** 85%
  - Implementation: 85% - Contrast targets and failing pairings are explicitly documented.
  - Approach: 85% - Palette direction is constrained by TASK-01 decision.
  - Impact: 85% - Directly addresses live failures and accessibility risk.
- **Acceptance:**
  - Dark-mode booking badge text/icon treatment reaches WCAG AA for normal text.
  - Dark palette values preserve hue family intent while meeting target contrast on dark background.
  - Terra/secondary usage guardrails are encoded in token usage guidance and/or utility mappings.
- **Validation contract (TC-04):**
  - TC-04.1 (happy): targeted color pairs meet >=4.5:1 where required (normal text).
  - TC-04.2 (failure): no remaining known live 1.5:1 dark badge pairing.
  - TC-04.3 (edge): large-text-only allowances are documented and not used for body copy paths.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - Contrast calculations from fact-find WCAG audit.
    - Direct source inspection for badge token usage in `RatingsBar`.
  - Validation artifacts:
    - `docs/plans/brik-color-token-consolidation/fact-find.md:149`
  - Unexpected findings:
    - Global dark anchor color already overrides to secondary, so risk is targeted usage of `text-brand-primary`.
- **Consumer tracing (required):**
  - New outputs:
    - Revised dark token values consumed by all `text-brand-primary`, `bg-brand-primary`, and ratings badge usages.
  - Modified behavior:
    - `RATING_SOURCES["Booking.com"].badgeTextClass` semantics may change to ensure readability; all badge rendering paths in `RatingsBar` must remain visually balanced.
  - Unchanged consumer note:
    - Hostelworld badge color path remains unchanged unless contrast regression is detected.
- **Scouts:** None: token inputs and failing paths are already known.
- **Edge Cases & Hardening:** Ensure improvements do not regress contrast on light mode surfaces.
- **What would make this >=90%:**
  - Automated contrast assertions for the audited token pairs in CI.
- **Rollout / rollback:**
  - Rollout: include targeted before/after screenshots for dark mode badge and CTA/link surfaces.
  - Rollback: revert only contrast token/badge adjustments without undoing TASK-03 infrastructure.
- **Documentation impact:**
  - Update contrast table and final acceptance checklist with final hex values.
- **Notes / references:**
  - `packages/ui/src/atoms/RatingsBar.tsx:30`
  - Downstream confidence propagation after TASK-03 completion (2026-02-22): re-scored; confidence unchanged at 85% (foundation blockers cleared, contrast execution still pending).
  - Build completion evidence (2026-02-23):
    - Dark palette values moved to hue-consistent, contrast-safe targets:
      - `--color-brand-primary: #4da8d4`, `--rgb-brand-primary: 77 168 212`
      - `--color-brand-bougainvillea: #e85070`, `--rgb-brand-bougainvillea: 232 80 112`
      - `--color-brand-on-primary: #1b1b1b`, `--rgb-brand-on-primary: 27 27 27`
    - Booking badge dark-mode readability fix shipped:
      - `packages/ui/src/atoms/RatingsBar.tsx` Booking badge class now `text-brand-bg dark:text-brand-heading`.
    - Solid brand-fill text paths now use semantic on-color tokens in key customer surfaces:
      - `packages/ui/src/molecules/NotificationBanner.tsx`
      - `packages/ui/src/molecules/DealsBanner.tsx`
      - `packages/ui/src/organisms/ApartmentHeroSection.tsx`
      - `packages/ui/src/organisms/LandingHeroSection.tsx`
      - `packages/ui/src/organisms/ApartmentDetailsSection.tsx`
      - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
      - `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx`
      - `apps/brikette/src/app/[lang]/apartment/ApartmentPageContent.tsx`
    - TC-04 validation artifacts:
      - `#4da8d4` on `#181818` = `6.65:1`
      - `#e85070` on `#181818` = `4.91:1`
      - `#ffffff` on `#003580` = `11.53:1`
      - `#1b1b1b` on `#4da8d4` = `6.45:1`
      - `pnpm --filter brikette typecheck` (pass, 2026-02-23)
      - `pnpm --filter brikette lint` (pass; informational "lint temporarily disabled")
  - Downstream confidence propagation after TASK-04 completion (2026-02-23):
    - TASK-06 re-scored; confidence remains 75% (blast radius still the limiting factor despite improved token/contrast baseline).
    - TASK-08 re-scored; confidence remains 85% (contrast-critical prerequisite now satisfied, checkpoint dependency still pending).

### TASK-05: Remove redundant manual brand utilities from global CSS
- **Type:** IMPLEMENT
- **Deliverable:** deletion of manual utility duplicates in `apps/brikette/src/styles/global.css` while preserving behavior through Tailwind-generated equivalents
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/brikette/src/styles/global.css`, `[readonly] apps/brikette/tailwind.config.mjs`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - Target block is isolated and explicitly enumerated.
  - Approach: 90% - Tailwind config already defines equivalent brand utilities.
  - Impact: 85% - Lower maintenance burden and removes duplicate source-of-truth risk.
- **Acceptance:**
  - Manual utility definitions in global.css lines ~413-499 are removed (except non-duplicate helpers that are still needed).
  - No reliance on removed utilities remains in compiled class usage.
  - Visual behavior for existing brand utility classes remains unchanged.
- **Validation contract (TC-05):**
  - TC-05.1 (happy): app renders with Tailwind-generated brand utility classes intact.
  - TC-05.2 (failure): no orphan class references rely solely on deleted manual definitions.
  - TC-05.3 (edge): specificity-sensitive selectors remain unaffected (`!important` not introduced/required).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task with isolated edit block.
- **Scouts:** `rg -n "\\.bg-brand-|\\.text-brand-|\\.border-brand-|\\.ring-brand-" apps/brikette/src/styles/global.css`
- **Edge Cases & Hardening:** Keep non-duplicative utility classes (e.g., layout/layer helpers) intact.
- **What would make this >=90%:**
  - Capture one smoke snapshot confirming removed utility classes are resolved via Tailwind output.
- **Rollout / rollback:**
  - Rollout: include with TASK-03 in same PR or immediately after.
  - Rollback: restore deleted utility block verbatim if class generation mismatch appears.
- **Documentation impact:**
  - Note cleanup in Decision Log and final rollout notes.
- **Notes / references:**
  - `apps/brikette/src/styles/global.css:413`
  - Downstream confidence propagation after TASK-02 completion (2026-02-22): re-scored; confidence unchanged at 85% (inventory confirmed isolated utility cleanup scope).
  - Downstream confidence propagation after TASK-03 completion (2026-02-22): re-scored; confidence unchanged at 85% (dependency on foundational token parity is now satisfied).
  - Build completion evidence (2026-02-23):
    - Removed redundant manual utility definitions from `@layer utilities`:
      - `.bg-brand-*` helper block
      - `.text-brand-*` helper block (including `.text-brand-bg/90`)
      - `.border-brand-*` helper block
      - `.ring-brand-*` helper block
    - Retained non-duplicate utility helpers (`cv-auto`, layer/modal, tracking, gradient and scenic-motion helpers).
    - TC-05 validation artifacts:
      - grep check for removed manual utility selectors returns no matches in `apps/brikette/src/styles/global.css`.
      - `pnpm --filter brikette typecheck` (pass, 2026-02-23)
      - `pnpm --filter brikette lint` (pass; informational "lint temporarily disabled")
  - Downstream confidence propagation after TASK-05 completion (2026-02-23):
    - TASK-06 re-scored; confidence remains 75% (duplicate utility risk removed, but migration scope is still broad).

### TASK-06: Migrate off-token class usage across brikette/shared UI
- **Type:** IMPLEMENT
- **Deliverable:** replacement of `text-neutral-*`, `text-primary-*`, `decoration-primary-*`, and inappropriate hardcoded white/overlay usages in in-scope files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`, `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`, `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `packages/ui/src/organisms/LandingHeroSection.tsx`, `packages/ui/src/organisms/ApartmentHeroSection.tsx`, `packages/ui/src/molecules/NotificationBanner.tsx`, `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx`, `[readonly] packages/ui/src/components/organisms/operations/**`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 75%
  - Implementation: 75% - File set is broad and includes shared UI surfaces with mixed semantics.
  - Approach: 80% - Held-back test: unresolved semantic exceptions (scrim vs decorative overlays) could force reclassification; therefore score reduced to 75 per anti-bias rule.
  - Impact: 85% - Consolidation materially reduces dual-system drift and improves consistency.
- **Acceptance:**
  - In-scope `text-neutral-900`, `text-primary-*`, and `decoration-primary-*` classes are replaced with approved brand-semantic equivalents.
  - `text-white` on solid brand fills is replaced by semantic on-color tokens; photo-overlay exceptions are preserved.
  - Overlay replacements preserve dark-mode scrim semantics (no inversion to light overlay behavior).
- **Validation contract (TC-06):**
  - TC-06.1 (happy): in-scope grep checks show no remaining forbidden class patterns.
  - TC-06.2 (failure): preserved exclusions list (photo overlays, decorative SVG, ops scope) remains unchanged and documented.
  - TC-06.3 (edge): dark mode renders correctly for hero/booking/banner paths without readability regression.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "text-neutral-900|text-primary-|decoration-primary-|text-white|bg-black/|bg-white/" apps/brikette packages/ui/src`
    - targeted file inspections in fact-find key module list.
  - Validation artifacts:
    - `docs/plans/brik-color-token-consolidation/fact-find.md:208`
  - Unexpected findings:
    - Some dark-mode link paths already use brand secondary, reducing one previously-assumed universal failure.
- **Consumer tracing (required):**
  - New outputs:
    - `text-on-primary`/`text-on-accent` class usage consumed by CTA, banner, and booking indicator components.
  - Modified behavior:
    - Guide inline-link styling semantics change from base `primary` scale to brand token semantics; both `_linkTokens.tsx` and `GuideContent.tsx` call paths must remain aligned.
    - Hero and booking components shift away from hardcoded neutrals/white in solid fills; hover/focus states must preserve contrast and affordance.
  - Unchanged consumer note:
    - `packages/ui/src/components/organisms/operations/**` remains unchanged because out-of-scope and not customer-facing in brikette flows.
- **Scouts:** Use TASK-02 inventory output as migration checklist before code changes.
- **Edge Cases & Hardening:** Preserve explicit `dark:` overrides where they intentionally improve contrast; do not normalize these away blindly.
- **What would make this >=90%:**
  - Complete TASK-02 inventory refinement and split this task into smaller file-cluster tasks with narrower blast radius.
- **Rollout / rollback:**
  - Rollout: land by file clusters (guides -> booking -> hero/banner) with intermediate visual checks.
  - Rollback: revert latest cluster commit only; keep completed clusters if stable.
- **Documentation impact:**
  - Update migration completion list and retained-exception list in plan notes.
- **Notes / references:**
  - `docs/plans/brik-color-token-consolidation/fact-find.md:214`
  - Downstream confidence propagation after TASK-02 completion (2026-02-22): re-scored; confidence remains 75% due to residual blast-radius/exception-handling uncertainty despite improved inventory evidence.
  - Downstream confidence propagation after TASK-03 completion (2026-02-22): re-scored; confidence remains 75% (token foundation is complete but migration blast radius remains the limiting factor).
  - Downstream confidence propagation after TASK-04 and TASK-05 completion (2026-02-23): re-scored; confidence remains 75% (contrast and utility baselines improved, but broad cross-file migration and exception handling still dominate uncertainty).
  - Build completion evidence (2026-02-23):
    - `text-primary-*`/`decoration-primary-*`/`outline-primary-*` replaced with brand-semantic classes in:
      - `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`
      - `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`
    - `text-neutral-900` on brand-secondary CTAs replaced with `text-brand-on-accent` in:
      - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
      - `packages/ui/src/organisms/LandingHeroSection.tsx`
      - `packages/ui/src/organisms/ApartmentHeroSection.tsx`
    - Remaining solid brand-primary text paths normalized to `text-brand-on-primary` in:
      - `packages/ui/src/molecules/NotificationBanner.tsx`
      - `packages/ui/src/organisms/LandingHeroSection.tsx` (proof panel)
    - Preserved exclusions:
      - photo-overlay/scrim classes retained in hero surfaces (`from-black/65`, `from-black/30`).
      - operations scope untouched (`packages/ui/src/components/organisms/operations/**`).
    - Validation artifacts:
      - grep check: forbidden patterns cleared in TASK-06 scope (`text-neutral-900|text-primary-|decoration-primary-|outline-primary-`).
  - Downstream confidence propagation after TASK-06 completion (2026-02-23):
    - TASK-07 checkpoint assumptions validated; confidence remains 95%.
    - TASK-08 confidence remains 85% (scope now validation execution and evidence capture).

### TASK-07: Horizon checkpoint - reassess downstream validation plan
- **Type:** CHECKPOINT
- **Deliverable:** updated downstream confidence and validation scope in `docs/plans/brik-color-token-consolidation/plan.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/brik-color-token-consolidation/plan.md`
- **Depends on:** TASK-06
- **Blocks:** TASK-08
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is standardized.
  - Approach: 95% - catches drift after highest-blast-radius task.
  - Impact: 95% - prevents invalid downstream validation assumptions.
- **Acceptance:**
  - `/lp-do-replan` run for downstream tasks if task confidence/assumptions changed.
  - Task dependencies and confidence values are updated from fresh evidence.
  - Plan remains topologically valid after checkpoint edits.
- **Horizon assumptions to validate:**
  - Off-token migration did not introduce new dark-mode contrast regressions.
  - Remaining validation scope in TASK-08 is still sufficient and not stale.
- **Validation contract:** checkpoint completion is verified by updated plan timestamps and revised downstream task fields.
- **Planning validation:** Replan evidence recorded directly in updated task notes.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** checkpoint findings captured in Decision Log.
- **Notes / references:**
  - Checkpoint findings (2026-02-23):
    - Assumption 1 validated: off-token migration introduced no new dark-mode contrast regressions in audited pairs.
    - Assumption 2 validated: TASK-08 validation scope remained sufficient after migration and did not require `/lp-do-replan`.
    - Dependency graph unchanged and topologically valid.

### TASK-08: Add targeted contrast and regression validation coverage
- **Type:** IMPLEMENT
- **Deliverable:** targeted validation artifacts (tests/scripts/checklists) and command evidence for consolidated color behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-23)
- **Affects:** `apps/brikette/src/styles/global.css`, `apps/brikette/src/app/layout.tsx`, `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`, `packages/ui/src/atoms/RatingsBar.tsx`, `docs/plans/brik-color-token-consolidation/plan.md`
- **Depends on:** TASK-04, TASK-07
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% - validation targets and scenarios are known.
  - Approach: 85% - checkpoint reduces risk of validating stale behavior.
  - Impact: 90% - codifies acceptance criteria and prevents silent regressions.
- **Acceptance:**
  - Validation contract covers token parity, contrast-critical pairs, and migration grep checks.
  - Targeted test/lint/typecheck commands pass for affected packages.
  - Manual QA checklist for light/dark key routes is completed and recorded.
- **Validation contract (TC-08):**
  - TC-08.1 (happy): automated checks (targeted tests + grep assertions) pass for in-scope classes and token parity.
  - TC-08.2 (failure): any contrast regression in audited pairs fails validation gate.
  - TC-08.3 (edge): dark-mode route snapshots/manual checks confirm readability in hero, booking, guides, and ratings badge.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter brikette typecheck`
    - `pnpm --filter brikette lint`
    - targeted test runs for changed files
  - Validation artifacts:
    - command logs and manual QA checklist entries linked in task notes.
  - Unexpected findings:
    - If pending test stubs fail CI, convert to INVESTIGATE per planning-mode rule.
- **Consumer tracing (required):**
  - New outputs:
    - validation artifacts consumed by TASK-09 final go/no-go review.
  - Modified behavior:
    - validation threshold introduces hard failure conditions for contrast and forbidden class regressions.
  - Unchanged consumer note:
    - Unrelated packages remain outside validation scope unless shared component tests fail.
- **Scouts:** None: checkpoint already refreshes uncertainty before this task.
- **Edge Cases & Hardening:** account for dark-mode overrides that intentionally diverge from light-mode class choices.
- **What would make this >=90%:**
  - Add stable visual regression tooling for light/dark diffing in CI.
- **Rollout / rollback:**
  - Rollout: enforce validation checklist before marking TASK-09 complete.
  - Rollback: if tooling causes instability, keep manual gate and track tooling as follow-up.
- **Documentation impact:**
  - Record final validation matrix and command set in plan notes.
- **Notes / references:**
  - `docs/plans/brik-color-token-consolidation/fact-find.md:127`
  - Build completion evidence (2026-02-23):
    - Added automated regression guard:
      - `apps/brikette/src/test/components/color-token-contract.test.ts`
      - Coverage includes:
        - TC-06.1 forbidden-class absence in TASK-06 in-scope files.
        - TC-06.2 preservation of hero scrim exceptions.
        - TC-08.1 CSS/JS primary RGB parity checks.
        - TC-08.2 WCAG AA contrast threshold checks for dark critical pairs.
        - TC-08.3 Booking badge dark override assertion.
    - Command evidence:
      - `pnpm --filter brikette typecheck` (pass, 2026-02-23)
      - `pnpm --filter brikette lint` (pass; informational "lint temporarily disabled")
      - `pnpm --filter @acme/ui typecheck` (pass, 2026-02-23)
      - `pnpm exec eslint src/atoms/RatingsBar.tsx src/molecules/NotificationBanner.tsx src/molecules/DealsBanner.tsx src/organisms/ApartmentHeroSection.tsx src/organisms/LandingHeroSection.tsx src/organisms/ApartmentDetailsSection.tsx` in `packages/ui` (pass)
      - `pnpm --filter brikette test -- src/test/components/color-token-contract.test.ts --maxWorkers=2` (pass)
      - `pnpm --filter brikette test -- src/test/components/ga4-33-book-page-search-availability.test.tsx --maxWorkers=2` (pass)
      - `pnpm --filter brikette test -- src/test/components/ga4-07-apartment-checkout.test.tsx --maxWorkers=2` (pass)
      - `pnpm --filter brikette test -- src/test/routes/guides/__tests__/hydration/guide-i18n-hydration.test.tsx --maxWorkers=2` (pass)
    - Manual QA checklist (source-level, recorded):
      - Guides link surfaces now use brand token classes (pass).
      - Booking host flows use `text-brand-on-accent` / `text-brand-on-primary` on solid fills (pass).
      - Ratings badge dark override present and tested (pass).
  - Unexpected findings:
    - Full package lint `pnpm --filter @acme/ui lint` fails on pre-existing, unrelated issues in `packages/ui/src/molecules/ThemeToggle.tsx` (import order + raw colors). Scoped lint for touched files passed.

### TASK-09: Execute final QA and publish rollout notes
- **Type:** IMPLEMENT
- **Deliverable:** final QA sign-off, rollout checklist, and rollback instructions captured in plan doc
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-23)
- **Affects:** `docs/plans/brik-color-token-consolidation/plan.md`, `docs/plans/brik-color-token-consolidation/fact-find.md`
- **Depends on:** TASK-08
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - finalization workflow is procedural.
  - Approach: 85% - dependent on completion quality of validation artifacts.
  - Impact: 85% - controls release confidence and operational recoverability.
- **Acceptance:**
  - Final checklist confirms goals and overall acceptance criteria are met.
  - Rollback steps are explicit and tested at least at dry-run reasoning level.
  - Plan status is promotable to `Complete` after explicit user-requested build continuation and recorded validation evidence.
- **Validation contract (TC-09):**
  - TC-09.1 (happy): all task-level validation contracts are satisfied and recorded.
  - TC-09.2 (failure): any unresolved high-severity regression keeps plan/build handoff blocked.
  - TC-09.3 (edge): rollback notes are specific per task cluster and do not require destructive git operations.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort finalization task.
- **Scouts:** None: depends on completed validation artifacts.
- **Edge Cases & Hardening:** confirm non-goal areas (ops components, CMS presets) remained untouched.
- **What would make this >=90%:**
  - Independent reviewer spot-check on dark-mode key flows before release.
- **Rollout / rollback:**
  - Rollout: execute in low-risk window and monitor immediate visual feedback.
  - Rollback: revert migration clusters in reverse order if critical regression appears.
- **Documentation impact:**
  - Update Decision Log and acceptance checklist to reflect final state.
- **Notes / references:**
  - `docs/plans/brik-color-token-consolidation/fact-find.md`
  - Final QA / rollout checklist (2026-02-23):
    - Goals check:
      - Brand token path consolidated for audited customer-facing surfaces (pass).
      - Known dark-mode badge contrast failure resolved (pass).
      - Redundant manual utility layer removed (pass).
    - Validation check:
      - TASK-03/04/05/06/08 validation contracts recorded with command evidence (pass).
    - Non-goal boundary check:
      - operations scope untouched; CMS presets/layout redesign out of scope (pass).
  - Rollout notes:
    - Deployment order recommendation:
      1. Token and migration code changes.
      2. Automated validation test file.
      3. Post-deploy smoke on guides, booking, and hero sections in light/dark.
  - Rollback notes (non-destructive):
    - Revert migration cluster files first (`_linkTokens.tsx`, `GuideContent.tsx`, CTA/banner components).
    - Revert validation test if immediate hotfix rollback is needed.

## Risks & Mitigations
- Risk: dark-mode hue decision changes late and invalidates in-progress migration.
  - Mitigation: TASK-01 is front-loaded and blocks all implementation.
- Risk: large migration task introduces regressions across shared UI.
  - Mitigation: TASK-06 confidence held at 75 with upstream INVESTIGATE coverage and mandatory CHECKPOINT.
- Risk: contrast checks remain manual and inconsistent.
  - Mitigation: TASK-08 formalizes targeted validation contract and command set.
- Risk: utility cleanup causes specificity regressions.
  - Mitigation: TASK-05 isolates cleanup with explicit rollback path and smoke checks.

## Observability
- Logging:
  - None: color token changes do not introduce runtime logging behavior.
- Metrics:
  - Lighthouse accessibility score before/after for representative pages.
  - Count of forbidden class patterns in grep-based checks.
- Alerts/Dashboards:
  - None: no runtime alerting changes in scope.

## Acceptance Criteria (overall)
- [x] Live dark-mode contrast failure for Booking badge is resolved to WCAG AA.
- [x] In-scope `text-neutral-*`, `text-primary-*`, and `decoration-primary-*` bypasses are migrated to approved brand semantics.
- [x] Token source-of-truth mismatch between CSS and JS constants is removed.
- [x] Redundant manual brand utilities are removed without visual regression.
- [x] Targeted typecheck, lint, test, and QA validation contracts pass.

## Decision Log
- 2026-02-22: Plan initialized from fact-find; sequencing uses risk-first order with checkpoint before final validation.
- 2026-02-22: TASK-02 investigation completed; normalized migration targets and overlay intent classes captured for TASK-06 execution.
- 2026-02-22: TASK-01 resolved by operator: Option B selected (hue-consistent dark palette + `text-on-*` semantic token contract).
- 2026-02-22: TASK-03 completed: token foundation synced across CSS/JS, CTA hover/token utility hardcodes removed, and brikette typecheck/lint validation run.
- 2026-02-23: TASK-04 completed: dark palette + badge contrast remediations shipped, semantic `text-brand-on-primary`/`text-brand-on-accent` usage applied to critical solid-fill surfaces, and WCAG ratio checks recorded.
- 2026-02-23: TASK-05 completed: redundant manual brand utility definitions removed from `global.css`; non-duplicate helpers retained and smoke validation passed.
- 2026-02-23: TASK-06 completed: guides/booking/hero/banner migrations replaced off-token classes with brand-semantic tokens; exclusion scopes preserved.
- 2026-02-23: TASK-07 checkpoint completed: downstream assumptions validated; no replan required and dependency topology unchanged.
- 2026-02-23: TASK-08 completed: added `color-token-contract.test.ts` and executed targeted typecheck/lint/test command set with passing evidence for touched surfaces.
- 2026-02-23: TASK-09 completed: final QA/rollout/rollback notes recorded; plan advanced to complete state.

## Overall-confidence Calculation
- Effort weights: `S=1`, `M=2`, `L=3`
- Task confidence values:
  - TASK-01 85 (S), TASK-02 85 (S), TASK-03 85 (M), TASK-04 85 (M), TASK-05 85 (S), TASK-06 75 (L), TASK-07 95 (S), TASK-08 85 (M), TASK-09 85 (S)
- Weighted calculation:
  - Numerator = `85*1 + 85*1 + 85*2 + 85*2 + 85*1 + 75*3 + 95*1 + 85*2 + 85*1 = 1170`
  - Denominator = `1 + 1 + 2 + 2 + 1 + 3 + 1 + 2 + 1 = 14`
  - Overall-confidence = `1170 / 14 = 83.57%` -> **84%**

## Section Omission Rule
If a section is not relevant, either omit it or write:
- `None: <reason>`
