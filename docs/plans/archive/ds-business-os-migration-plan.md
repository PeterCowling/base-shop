---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-12
Last-updated: 2026-02-13
Feature-Slug: ds-business-os-migration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: BOS
Card-ID: pending
---

# P2 — Design System: Business-OS Token Migration Plan

## Summary

Migrate `apps/business-os/` from raw Tailwind palette colours and a duplicate CSS custom-property layer to the centralised design token system. Investigation reveals 30 files with 292 Tailwind violations plus 10 hardcoded hex colours in `global.css` that define a parallel `--color-*` variable system duplicating the base theme. The app uses consistent patterns so migration is mechanical despite the volume.

## Goals

- Replace all raw Tailwind palette colours with semantic token utilities across 30 files
- Remove the duplicate CSS custom-property system in `global.css` (replace with base theme import)
- Add scoped ESLint config escalating `ds/no-raw-tailwind-color` to `error`
- Prevent future regression

## Non-goals

- Visual redesign or branding
- Adding dark mode beyond what the token system provides automatically
- Migrating non-colour DS violations (spacing, typography, etc.)
- Restructuring component architecture

## Constraints & Assumptions

- Business-OS uses base theme tokens (no dedicated theme package)
- Internal tool — no customer-facing impact
- No automated visual regression tests
- `global.css` defines its own `--color-bg`, `--color-text`, `--color-border`, `--color-primary` — these must be removed in favour of base theme tokens

## Fact-Find Reference

- Brief: `docs/plans/ds-business-os-migration-fact-find.md`
- Key finding update: 30 files with 292 violations (vs fact-find estimate of ~50 files)
- `global.css` has a duplicate CSS variable system that needs elimination

## Existing System Notes

- `global.css` defines: `--color-bg: #ffffff`, `--color-text: #1b1b1b`, `--color-border: #e5e7eb`, `--color-primary: #2563eb` (+ dark variants)
- These duplicate and shadow the base theme tokens
- ESLint: global `warn` level only; no scoped DS config

## Proposed Approach

**Phase 1 — Foundation:** Remove the duplicate CSS variable system in `global.css`. Ensure base theme tokens are imported. This unblocks all component migrations since components may reference the local `--color-*` vars.

**Phase 2 — Component migration:** Batch by feature area, using the standard mapping:

| Raw Tailwind | Semantic Token | Usage |
|---|---|---|
| `bg-white` | `bg-panel` | Card/container surfaces |
| `bg-gray-50` | `bg-bg` | Page backgrounds |
| `bg-gray-100` | `bg-surface-1` | Subtle surfaces |
| `text-gray-900` | `text-fg` | Primary text |
| `text-gray-700/800` | `text-secondary` | Secondary text |
| `text-gray-600` | `text-muted` | Muted text |
| `text-gray-500` | `text-muted` | Placeholder text |
| `border-gray-200` | `border-1` | Default borders |
| `border-gray-300` | `border-2` | Stronger borders |
| `bg-blue-600 text-white` | `bg-accent text-accent-fg` | Primary action buttons |
| `hover:bg-blue-700` | `hover:bg-accent/90` | Primary hover |
| `bg-green-600 text-white` | `bg-success text-success-fg` | Success actions |
| `bg-purple-600 text-white` | `bg-primary text-primary-fg` | Secondary actions |
| `bg-green-50 text-green-600` | `bg-success-soft text-success-fg` | Success badges |
| `bg-amber-50 text-amber-600` | `bg-warning-soft text-warning-fg` | Warning badges |
| `bg-red-50 text-red-600` | `bg-danger-soft text-danger-fg` | Error badges |
| `bg-blue-50 text-blue-600` | `bg-info-soft text-info-fg` | Info badges |

**Phase 3 — Lock-down:** Add scoped ESLint error config.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| BOS-01 | IMPLEMENT | Remove duplicate CSS variable system in global.css | 95% | S | Complete (2026-02-12) | - | BOS-02..07 |
| BOS-02 | IMPLEMENT | Migrate foundation batch (nav, board, archive, agent-runs — 4 files) | 95% | S | Complete (2026-02-13) | BOS-01 | BOS-08 |
| BOS-03 | IMPLEMENT | Migrate ideas components (3 files, 47 violations) | 95% | S | Complete (2026-02-13) | BOS-01 | BOS-08 |
| BOS-04 | IMPLEMENT | Migrate card-detail components (6 files, 57 violations) | 95% | M | Complete (2026-02-13) | BOS-01 | BOS-08 |
| BOS-05 | IMPLEMENT | Migrate ideas + cards app routes (8 files, 61 violations) | 95% | M | Complete (2026-02-13) | BOS-01 | BOS-08 |
| BOS-06 | IMPLEMENT | Migrate guides feature (7 files, 83 violations) | 92% | M | Complete (2026-02-13) | BOS-01 | BOS-08 |
| BOS-07 | IMPLEMENT | Migrate shared components (2 files, 26 violations) | 95% | S | Complete (2026-02-13) | BOS-01 | BOS-08 |
| BOS-08 | IMPLEMENT | ESLint config escalation + lint verification | 95% | S | Complete (2026-02-13) | BOS-02..07 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | BOS-01 | - | CSS foundation — must land first |
| 2 | BOS-02, BOS-03, BOS-04, BOS-05, BOS-06, BOS-07 | BOS-01 | All component migrations independent |
| 3 | BOS-08 | Wave 2 complete | Config escalation |

**Max parallelism:** 6 | **Critical path:** 3 waves | **Total tasks:** 8

## Tasks

### BOS-01: Remove duplicate CSS variable system in global.css

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/business-os/src/styles/global.css`
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/business-os/src/styles/global.css`
  - **[readonly]** `packages/themes/base/tokens.css`
- **Depends on:** -
- **Blocks:** BOS-02, BOS-03, BOS-04, BOS-05, BOS-06, BOS-07
- **Confidence:** 90%
  - Implementation: 92% — remove custom `:root` block with 10 hex colours; verify base theme tokens are imported via Tailwind config
  - Approach: 95% — duplicate variables shadow base theme; removing them lets components see the real tokens
  - Impact: 85% — any component referencing `var(--color-bg)` etc. will now resolve to base theme values; need to verify no visual breakage
- **Acceptance:**
  - `:root` block with hardcoded hex colours removed from `global.css`
  - `.dark` block with hardcoded hex colours removed
  - Base theme tokens resolve correctly (via Tailwind config → `@themes/base/tokens.css`)
  - No hex colours remain in `global.css`
- **Validation contract:**
  - TC-01: `grep -c '#[0-9a-fA-F]' apps/business-os/src/styles/global.css` → 0
  - TC-02: App renders without CSS errors (dev server loads)
  - Validation type: grep + manual visual check
  - Run/verify: `grep '#' apps/business-os/src/styles/global.css`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None
- **Notes:** Check if any component uses `var(--color-bg)` etc. directly — these would need updating to use the base theme's variable names.

#### Build Completion (2026-02-12)
- **Status:** Complete
- **Commits:** 05aa2658bd
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02
  - Cycles: 1
  - Initial validation: PASS (no test-first for CSS-only config change)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 90%
  - Post-validation: 95%
  - Delta reason: Scout confirmed zero component files reference var(--color-*); only global.css body selector needed updating
- **Validation:**
  - Ran: `grep '#[0-9a-fA-F]' global.css` → 0 matches — PASS
  - Ran: `pnpm --filter business-os exec next build` → success — PASS
- **Documentation updated:** None required
- **Implementation notes:** Added `@import "@themes/base/tokens.css"` and replaced body selector with `@apply bg-bg text-fg`. Removed 5 hex custom properties (:root) and 5 dark-mode overrides (.dark).

### BOS-02: Migrate foundation batch (4 files, 18 violations)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 4 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/business-os/src/components/navigation/NavigationHeader.tsx`
  - **Primary:** `apps/business-os/src/components/board/BoardLane.tsx`
  - **Primary:** `apps/business-os/src/app/archive/page.tsx`
  - **Primary:** `apps/business-os/src/components/agent-runs/RunStatus.tsx`
- **Depends on:** BOS-01
- **Blocks:** BOS-08
- **Confidence:** 92%
  - Implementation: 95% — small files, standard mappings
  - Approach: 95% — isolated components
  - Impact: 90% — NavigationHeader is app-wide but change is cosmetic
- **Acceptance:**
  - All raw palette classes replaced with semantic tokens
  - Zero violations in these files from `pnpm lint`
- **Validation contract:**
  - TC-01: `grep -cE '(gray|slate|blue|red|green|amber|purple)-[0-9]|bg-white|text-white' <files>` → 0
  - TC-02: `pnpm lint -- --filter business-os` → zero violations for these files
  - Validation type: lint + grep
  - Run/verify: `pnpm lint -- --filter business-os`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### BOS-03: Migrate ideas components (3 files, 47 violations)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 3 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/business-os/src/components/ideas/IdeasList.tsx`
  - **Primary:** `apps/business-os/src/components/ideas/IdeasFilters.tsx`
  - **Primary:** `apps/business-os/src/components/ideas/IdeasPagination.tsx`
- **Depends on:** BOS-01
- **Blocks:** BOS-08
- **Confidence:** 88%
  - Implementation: 90% — 47 violations; table/list/filter patterns
  - Approach: 90% — standard mapping
  - Impact: 85% — ideas list is a primary UI surface
- **Acceptance:**
  - All raw palette classes replaced with semantic tokens
  - Filter active/inactive states use semantic tokens
  - Zero violations from lint
- **Validation contract:**
  - TC-01: `grep -cE '(gray|slate|blue|red|green|amber|purple)-[0-9]|bg-white|text-white' <files>` → 0
  - TC-02: `pnpm lint -- --filter business-os` → zero violations for these files
  - Validation type: lint + grep
  - Run/verify: `pnpm lint -- --filter business-os`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### BOS-04: Migrate card-detail components (6 files, 57 violations)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 6 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/business-os/src/components/card-detail/CardMetadata.tsx`
  - **Primary:** `apps/business-os/src/components/card-detail/CardDetail.tsx`
  - **Primary:** `apps/business-os/src/components/card-detail/CardActionsPanel.tsx`
  - **Primary:** `apps/business-os/src/components/card-detail/RecentActivity.tsx`
  - **Primary:** `apps/business-os/src/components/card-detail/CardHeader.tsx`
  - **Primary:** `apps/business-os/src/components/card-detail/CardStageDocs.tsx`
- **Depends on:** BOS-01
- **Blocks:** BOS-08
- **Confidence:** 88%
  - Implementation: 90% — 57 violations; card detail has coloured action buttons (blue, green, purple)
  - Approach: 88% — purple action buttons → `bg-primary` (need to verify primary vs accent semantics)
  - Impact: 85% — card detail is heavily used for daily card management
- **Acceptance:**
  - All `bg-blue-600 text-white` → `bg-accent text-accent-fg`
  - All `bg-green-600 text-white` → `bg-success text-success-fg`
  - All `bg-purple-600 text-white` → `bg-primary text-primary-fg`
  - All container/text/border colours → semantic tokens
  - Zero violations from lint
- **Validation contract:**
  - TC-01: `grep -cE '(gray|slate|blue|red|green|amber|purple)-[0-9]|bg-white|text-white' <files>` → 0
  - TC-02: `pnpm lint -- --filter business-os` → zero violations for these files
  - Validation type: lint + grep + visual spot-check of card detail page
  - Run/verify: `pnpm lint -- --filter business-os`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### BOS-05: Migrate ideas + cards app routes (8 files, 61 violations)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 8 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/business-os/src/app/ideas/[id]/page.tsx`
  - **Primary:** `apps/business-os/src/app/ideas/page.tsx`
  - **Primary:** `apps/business-os/src/app/ideas/new/page.tsx`
  - **Primary:** `apps/business-os/src/app/ideas/[id]/IdeaEditorForm.tsx`
  - **Primary:** `apps/business-os/src/app/ideas/[id]/ConvertToCardButton.tsx`
  - **Primary:** `apps/business-os/src/app/ideas/[id]/WorkIdeaButton.tsx`
  - **Primary:** `apps/business-os/src/app/cards/[id]/edit/page.tsx`
  - **Primary:** `apps/business-os/src/app/cards/new/page.tsx`
- **Depends on:** BOS-01
- **Blocks:** BOS-08
- **Confidence:** 85%
  - Implementation: 88% — 61 violations across 8 files; page-level components with forms and actions
  - Approach: 88% — standard mappings; form validation errors → `text-danger`
  - Impact: 82% — ideas and cards are primary workflows; multiple route pages
- **Acceptance:**
  - All page backgrounds, headings, descriptions → semantic tokens
  - Form inputs and validation → semantic tokens
  - Action buttons → semantic accent/success/primary tokens
  - Zero violations from lint
- **Validation contract:**
  - TC-01: `grep -rcE '(gray|slate|blue|red|green|amber|purple)-[0-9]|bg-white|text-white' apps/business-os/src/app/ideas/ apps/business-os/src/app/cards/ --include='*.tsx'` → 0
  - TC-02: `pnpm lint -- --filter business-os` → zero violations for these files
  - Validation type: lint + grep
  - Run/verify: `pnpm lint -- --filter business-os`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### BOS-06: Migrate guides feature (7 files, 83 violations)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 7 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/business-os/src/app/guides/validation/ValidationDashboard.tsx`
  - **Primary:** `apps/business-os/src/app/guides/edit/[guideKey]/tabs/ValidationTab.tsx`
  - **Primary:** `apps/business-os/src/app/guides/page.tsx`
  - **Primary:** `apps/business-os/src/app/guides/edit/[guideKey]/components/SeoAuditBadge.tsx`
  - **Primary:** `apps/business-os/src/app/guides/edit/[guideKey]/tabs/RawJsonTab.tsx`
  - **Primary:** `apps/business-os/src/app/guides/edit/[guideKey]/components/EditorialSidebar.tsx`
  - **Primary:** `apps/business-os/src/app/guides/edit/[guideKey]/GuideEditor.tsx`
- **Depends on:** BOS-01
- **Blocks:** BOS-08
- **Confidence:** 82%
  - Implementation: 85% — 83 violations; ValidationDashboard alone has 50 violations with complex conditional colouring for validation states
  - Approach: 85% — status badges use soft semantic variants; conditional class logic needs careful mapping
  - Impact: 80% — guide validation is a key workflow; incorrect status colours could confuse editors
- **Acceptance:**
  - ValidationDashboard: all status indicators → `bg-success-soft/text-success-fg`, `bg-warning-soft/text-warning-fg`, `bg-danger-soft/text-danger-fg`, `bg-info-soft/text-info-fg`
  - ValidationTab: validation pass/fail → semantic colours
  - SeoAuditBadge: badge colours → semantic soft variants
  - All container/text/border → semantic tokens
  - Zero violations from lint
- **Validation contract:**
  - TC-01: `grep -rcE '(gray|slate|blue|red|green|amber|purple)-[0-9]|bg-white|text-white' apps/business-os/src/app/guides/ --include='*.tsx'` → 0
  - TC-02: `pnpm lint -- --filter business-os` → zero violations for these files
  - TC-03: ValidationDashboard status colours are visually distinguishable (manual check)
  - Validation type: lint + grep + visual spot-check
  - Run/verify: `pnpm lint -- --filter business-os`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Visual side-by-side of ValidationDashboard with pass/fail/warning states before/after
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None
- **Notes:** ValidationDashboard.tsx (50 violations) is the densest file in the entire BOS migration. Take care with conditional class strings.

### BOS-07: Migrate shared components (2 files, 26 violations)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 2 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/business-os/src/components/comments/CommentThread.tsx`
  - **Primary:** `apps/business-os/src/components/my-work/MyWorkView.tsx`
- **Depends on:** BOS-01
- **Blocks:** BOS-08
- **Confidence:** 90%
  - Implementation: 92% — 26 violations; standard patterns
  - Approach: 92% — straightforward mapping
  - Impact: 88% — shared components used across features
- **Acceptance:**
  - All raw palette classes replaced with semantic tokens
  - Zero violations from lint
- **Validation contract:**
  - TC-01: `grep -cE '(gray|slate|blue|red|green|amber|purple)-[0-9]|bg-white|text-white' <files>` → 0
  - TC-02: `pnpm lint -- --filter business-os` → zero violations for these files
  - Validation type: lint + grep
  - Run/verify: `pnpm lint -- --filter business-os`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### BOS-08: ESLint config escalation + lint verification

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `eslint.config.mjs`
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `eslint.config.mjs`
- **Depends on:** BOS-02, BOS-03, BOS-04, BOS-05, BOS-06, BOS-07
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — add scoped config block (CMS pattern as precedent)
  - Approach: 95% — error-level enforcement prevents regression
  - Impact: 95% — lint-only, no runtime impact
- **Acceptance:**
  - New scoped block for `apps/business-os/**` with `ds/no-raw-tailwind-color: "error"`
  - `pnpm lint` passes repo-wide
- **Validation contract:**
  - TC-01: `eslint.config.mjs` contains `"apps/business-os/**"` scope with `"ds/no-raw-tailwind-color": "error"`
  - TC-02: `pnpm lint` → passes (exit 0)
  - Validation type: lint
  - Run/verify: `pnpm lint`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

#### Build Completion (2026-02-13)
- **Status:** Complete
- **Commits:** 40cdbcc644
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02
  - Cycles: 1
  - Initial validation: PASS
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 95%
  - Post-validation: 95%
  - Delta reason: Validation confirmed — `pnpm lint` passes repo-wide (67 tasks, 0 failures)
- **Validation:**
  - Ran: `pnpm lint` → 67 tasks successful, exit 0 — PASS
  - Verified: eslint.config.mjs contains scoped business-os block with `ds/no-raw-tailwind-color: "error"` — PASS
- **Documentation updated:** None required
- **Implementation notes:** Added scoped ESLint override block after existing Dashboard block, following CMS pattern precedent.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `global.css` custom vars used by components via `var()` | Medium | Medium | Search for `var(--color-` before removing; update any references |
| ValidationDashboard conditional styling is complex | Medium | Low | Map each condition carefully; test all status states visually |
| Purple action buttons → `bg-primary` may not match original purple | Low | Low | `--color-primary` is blue-ish in base theme; verify this is acceptable for BOS |

## Acceptance Criteria (overall)

- [x] Zero `ds/no-raw-tailwind-color` violations in `apps/business-os/`
- [x] Duplicate CSS variable system removed from `global.css`
- [x] `ds/no-raw-tailwind-color` at `error` level for Business-OS
- [x] `pnpm lint` passes repo-wide
- [ ] Manual spot-check: board, ideas list, card detail, validation dashboard

## Decision Log

- 2026-02-12: Investigation reveals 30 files / 292 violations (vs fact-find estimate of 50 files)
- 2026-02-12: `global.css` has duplicate token system — must be removed as Phase 1 foundation
- 2026-02-12: Purple buttons mapped to `bg-primary` (base theme primary is blue; acceptable for internal tool)
