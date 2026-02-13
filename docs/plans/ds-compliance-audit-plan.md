---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: ds-compliance-audit
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Overall-confidence: 89%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: pending
---

# Design System Compliance Audit — Plan

## Summary

Close all remaining `ds/no-raw-tailwind-color` compliance gaps across the monorepo. Seven major apps are already at `error` level (P1–P4 migrations). This plan escalates the remaining 7 warn-level apps (211 violations), cleans up 16 baselined shared-package violations, resolves the RatingsBar design decision, and archives stale fact-find docs. Reception is excluded (separate active plan).

## Goals

- Escalate `ds/no-raw-tailwind-color` to `error` in all 7 warn-level apps
- Reduce the 16-entry baseline to zero (or justified minimum)
- Archive stale fact-find docs for completed migrations
- Resolve RatingsBar opacity design decision

## Non-goals

- Migrating `apps/reception/` (separate plan: `ds-reception-migration-plan.md`)
- Creating new design tokens beyond what the existing token set provides
- Migrating non-color DS rules (spacing, typography, radius, shadow, etc.)
- Addressing cochlearfit's `ds/no-unsafe-viewport-units: off` / `ds/no-nonlayered-zindex: off`

## Constraints & Assumptions

- Constraints:
  - `pnpm lint` must pass after every task
  - Baseline entries removed only when underlying code is fixed
  - Reception excluded
- Assumptions:
  - xa-j and xa-b share component code (verified: identical file lists and violation counts)
  - All status tokens exist: `text-success-fg`, `text-warning-fg`, `text-danger-fg`, `bg-success-soft`, `bg-warning-soft`, `bg-danger-soft` (verified in `tokens.static.css`)

## Fact-Find Reference

- Brief: `docs/plans/ds-compliance-audit-fact-find.md`
- Key findings:
  - All 7 warn-level apps already import base tokens — no onboarding needed
  - Status tokens (`success-fg`, `warning-fg`, `danger-fg`) confirmed available — product-pipeline can migrate without new tokens
  - 16 baseline violations: 5 easy (template-app), 2 medium (SplitPane), 9 hard (RatingsBar 8 + modals 1)
  - 2 stale fact-find docs need archiving

## Existing System Notes

- ESLint scoped error pattern: `eslint.config.mjs` — 7 existing `ds/no-raw-tailwind-color: "error"` blocks for migrated apps
- Baseline file: `tools/eslint-baselines/ds-no-raw-tailwind-color.json` — 16 entries across `packages/template-app` (5) and `packages/ui` (11)
- Token source: `packages/themes/base/tokens.static.css` — HSL triplets with light/dark variants

## Proposed Approach

Follow the proven P1–P4 migration pattern: fix violations → add scoped `error` rule in `eslint.config.mjs` → verify lint passes → commit.

- **Quick wins first:** Cochlearfit (2) and handbag-configurator (2) are single-commit fixes
- **Batch xa-j + xa-b:** Shared code means fixing one fixes both; escalate together
- **Product-pipeline:** Status indicators map cleanly to existing `success-fg/warning-fg/danger-fg` tokens
- **Baseline cleanup:** Template-app (mechanical swap), SplitPane (`bg-primary`), modals (`bg-overlay-scrim`)
- **RatingsBar:** DECISION task — accept baseline exceptions or create opacity tokens

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| DSA-01 | IMPLEMENT | Archive stale fact-find docs | 95% | S | Pending | - | - |
| DSA-02 | IMPLEMENT | Fix cochlearfit (2 violations) + escalate | 95% | S | Pending | - | - |
| DSA-03 | IMPLEMENT | Fix handbag-configurator (2 violations) + escalate | 95% | S | Pending | - | - |
| DSA-04 | IMPLEMENT | Fix template-app baseline (5 violations) | 92% | S | Pending | - | - |
| DSA-05 | IMPLEMENT | Fix cover-me-pretty (10 violations) + escalate | 88% | M | Pending | - | - |
| DSA-06 | IMPLEMENT | Fix xa-j + xa-b (78 violations) + escalate both | 85% | M | Pending | - | - |
| DSA-07 | IMPLEMENT | Fix xa-uploader (80 violations) + escalate | 85% | M | Pending | - | - |
| DSA-08 | IMPLEMENT | Fix product-pipeline (39 violations) + escalate | 85% | M | Pending | - | - |
| DSA-09 | IMPLEMENT | Fix SplitPane + modals baseline (3 violations) | 90% | S | Pending | - | - |
| DSA-10 | DECISION | RatingsBar: baseline exception vs new tokens | 60% | S | Needs-Input | - | DSA-11 |
| DSA-11 | IMPLEMENT | Execute RatingsBar decision (9 violations) | 80% | S | Pending | DSA-10 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | DSA-01, DSA-02, DSA-03, DSA-04 | - | All independent; quick wins + housekeeping |
| 2 | DSA-05, DSA-06, DSA-07, DSA-08, DSA-09 | - | All independent; medium apps + baseline |
| 3 | DSA-10 | - | DECISION — requires user input |
| 4 | DSA-11 | DSA-10 | Execute the RatingsBar decision |

**Max parallelism:** 5 | **Critical path:** 2 waves (Waves 1-2 are independent) | **Total tasks:** 11

## Tasks

### DSA-01: Archive stale fact-find docs

- **Type:** IMPLEMENT
- **Deliverable:** code-change — move 2 files to `docs/plans/archive/`
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `docs/plans/ds-skylar-migration-fact-find.md`
  - **Primary:** `docs/plans/ds-business-os-migration-fact-find.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — `mv` two files; trivial
  - Approach: 95% — standard archive pattern
  - Impact: 95% — no code affected; documentation housekeeping
- **Acceptance:**
  - Both files moved to `docs/plans/archive/`
  - No references broken (these are standalone fact-find docs)
- **Validation contract:**
  - TC-01: `ls docs/plans/ds-skylar-migration-fact-find.md` → file not found
  - TC-02: `ls docs/plans/archive/ds-skylar-migration-fact-find.md` → exists
  - TC-03: Same for ds-business-os-migration-fact-find.md
  - Acceptance coverage: TC-01..03 cover file relocation
  - Validation type: filesystem check
  - Run: `ls` verification
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### DSA-02: Fix cochlearfit (2 violations) + escalate to error

- **Type:** IMPLEMENT
- **Deliverable:** code-change — fix 2 raw color classes + add scoped error rule
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/cochlearfit/` (2 files with violations — error state styling)
  - **Primary:** `eslint.config.mjs` (add scoped error block)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — 2 violations; `text-red-700` → `text-danger-fg`, `border-red-200` → `border-danger`, `bg-red-50` → `bg-danger-soft`; tokens confirmed available
  - Approach: 95% — proven pattern from 7 prior escalations
  - Impact: 95% — cochlearfit is low-traffic internal tool; 2 files changed
- **Acceptance:**
  - Zero `ds/no-raw-tailwind-color` violations in cochlearfit
  - Scoped `error` rule added for `apps/cochlearfit/**`
  - `pnpm lint` passes
- **Validation contract:**
  - TC-01: `pnpm lint --filter @apps/cochlearfit` → 0 errors on `ds/no-raw-tailwind-color`
  - TC-02: `pnpm typecheck --filter @apps/cochlearfit` → passes
  - Acceptance coverage: TC-01 covers violation elimination + escalation; TC-02 covers type safety
  - Validation type: lint + typecheck
  - Run: `pnpm turbo lint typecheck --filter=@apps/cochlearfit`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### DSA-03: Fix handbag-configurator (2 violations) + escalate to error

- **Type:** IMPLEMENT
- **Deliverable:** code-change — fix 2 raw color classes + add scoped error rule
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/handbag-configurator/src/` (1 file — `ViewerCanvas.tsx` loading state)
  - **Primary:** `eslint.config.mjs`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — 2 violations; `text-white` → `text-primary-fg`, `bg-black` → `bg-foreground`; tokens confirmed
  - Approach: 95% — proven pattern
  - Impact: 95% — single file; loading indicator only
- **Acceptance:**
  - Zero `ds/no-raw-tailwind-color` violations in handbag-configurator
  - Scoped `error` rule added for `apps/handbag-configurator/**`
  - `pnpm lint` passes
- **Validation contract:**
  - TC-01: `pnpm lint --filter @apps/handbag-configurator` → 0 errors on `ds/no-raw-tailwind-color`
  - TC-02: `pnpm typecheck --filter @apps/handbag-configurator` → passes
  - Acceptance coverage: TC-01 covers elimination + escalation; TC-02 covers types
  - Validation type: lint + typecheck
  - Run: `pnpm turbo lint typecheck --filter=@apps/handbag-configurator`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### DSA-04: Fix template-app baseline (5 violations)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — fix 5 violations + remove 5 baseline entries
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `packages/template-app/src/app/[lang]/product/[slug]/PdpClient.client.tsx`
  - **Primary:** `packages/template-app/src/app/account/returns/ReturnForm.tsx`
  - **Primary:** `packages/template-app/src/app/edit-preview/page.tsx`
  - **Primary:** `packages/template-app/src/app/returns/mobile/Scanner.tsx`
  - **Primary:** `packages/template-app/src/app/upgrade-preview/page.tsx`
  - **Primary:** `tools/eslint-baselines/ds-no-raw-tailwind-color.json`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 95% — mechanical swaps: `text-gray-700` → `text-muted-foreground`, `text-red-600` → `text-danger-fg` (4x)
  - Approach: 92% — 1:1 token replacements; tokens confirmed used in other migrated apps
  - Impact: 90% — template-app is scaffolding; 5 files, all error-state or product-page text
- **Acceptance:**
  - All 5 violations fixed (0 raw color classes)
  - 5 entries removed from baseline JSON
  - `pnpm lint` passes
- **Validation contract:**
  - TC-01: `grep -c 'template-app' tools/eslint-baselines/ds-no-raw-tailwind-color.json` → 0
  - TC-02: `pnpm lint` → passes (no new errors from removed baseline entries)
  - Acceptance coverage: TC-01 covers baseline cleanup; TC-02 covers no regressions
  - Validation type: grep + lint
  - Run: `pnpm lint`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### DSA-05: Fix cover-me-pretty (10 violations) + escalate to error

- **Type:** IMPLEMENT
- **Deliverable:** code-change — fix 10 violations across 8 files + add scoped error rule
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/cover-me-pretty/src/` (8 files — links, panels, buttons)
  - **Primary:** `eslint.config.mjs`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% — 10 violations; `text-blue-600` → `text-primary`, `bg-gray-800` → `bg-foreground`, `bg-gray-100` → `bg-muted`, `text-white` → `text-primary-fg`, `bg-emerald-600` → `bg-success-fg`
  - Approach: 90% — standard token swaps; all tokens exist
  - Impact: 85% — cover-me-pretty is customer-facing try-on tool; 8 files but low-traffic
- **Acceptance:**
  - Zero `ds/no-raw-tailwind-color` violations in cover-me-pretty
  - Scoped `error` rule added for `apps/cover-me-pretty/**`
  - `pnpm lint` passes
- **Validation contract:**
  - TC-01: `pnpm lint --filter @apps/cover-me-pretty` → 0 errors on `ds/no-raw-tailwind-color`
  - TC-02: `pnpm typecheck --filter @apps/cover-me-pretty` → passes
  - Acceptance coverage: TC-01 covers elimination + escalation; TC-02 covers types
  - Validation type: lint + typecheck
  - Run: `pnpm turbo lint typecheck --filter=@apps/cover-me-pretty`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Verify all 10 mappings individually against running dev server
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### DSA-06: Fix xa-j + xa-b (78 violations) + escalate both to error

- **Type:** IMPLEMENT
- **Deliverable:** code-change — fix violations in xa-j (39) + xa-b (39, shared code) + add 2 scoped error rules
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/xa-j/src/` (~10 files: XaProductCard, XaImageGallery, XaMegaMenu, XaSupportDock, XaFiltersDrawer, XaBuyBox, access/*)
  - **Primary:** `apps/xa-b/src/` (same files — verify shared or fix independently)
  - **Primary:** `eslint.config.mjs` (add 2 scoped error blocks)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — dominant pattern is `bg-white` (60) → `bg-surface` + `text-white/black` → `text-primary-fg/foreground`; tokens confirmed
  - Approach: 88% — mechanical replacements; same pattern as xa (already migrated)
  - Impact: 82% — xa-j and xa-b are customer-facing storefronts; `bg-white` → `bg-surface` is visually identical in light mode
- **Acceptance:**
  - Zero `ds/no-raw-tailwind-color` violations in xa-j and xa-b
  - 2 scoped `error` rules added (one per app)
  - `pnpm lint` passes
- **Validation contract:**
  - TC-01: `pnpm lint --filter @apps/xa-j` → 0 errors on `ds/no-raw-tailwind-color`
  - TC-02: `pnpm lint --filter @apps/xa-b` → 0 errors on `ds/no-raw-tailwind-color`
  - TC-03: `pnpm typecheck --filter @apps/xa-j --filter @apps/xa-b` → passes
  - Acceptance coverage: TC-01,02 cover elimination + escalation per app; TC-03 covers types
  - Validation type: lint + typecheck
  - Run: `pnpm turbo lint typecheck --filter=@apps/xa-j --filter=@apps/xa-b`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Confirm xa-j and xa-b share source (symlinks or workspace refs); if so, single fix covers both
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### DSA-07: Fix xa-uploader (80 violations) + escalate to error

- **Type:** IMPLEMENT
- **Deliverable:** code-change — fix 80 violations across 11 files + add scoped error rule
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/xa-uploader/src/` (11 files — catalog form components)
  - **Primary:** `eslint.config.mjs`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — dominant pattern: `bg-white` (61) → `bg-surface`, `text-red-700` (15) → `text-danger-fg`, `text-white` (4) → `text-primary-fg`
  - Approach: 88% — mechanical replacements; internal tool with no dark mode
  - Impact: 82% — xa-uploader is internal catalog management tool; low user count but actively used
- **Acceptance:**
  - Zero `ds/no-raw-tailwind-color` violations in xa-uploader
  - Scoped `error` rule added for `apps/xa-uploader/**`
  - `pnpm lint` passes
- **Validation contract:**
  - TC-01: `pnpm lint --filter @apps/xa-uploader` → 0 errors on `ds/no-raw-tailwind-color`
  - TC-02: `pnpm typecheck --filter @apps/xa-uploader` → passes
  - Acceptance coverage: TC-01 covers elimination + escalation; TC-02 covers types
  - Validation type: lint + typecheck
  - Run: `pnpm turbo lint typecheck --filter=@apps/xa-uploader`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Verify `bg-surface` renders white on xa-uploader's light-only theme
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### DSA-08: Fix product-pipeline (39 violations) + escalate to error

- **Type:** IMPLEMENT
- **Deliverable:** code-change — fix 39 violations across 17 files + add scoped error rule
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/product-pipeline/src/` (17 files — stage cards, decision scorecards, scenario lab)
  - **Primary:** `eslint.config.mjs`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — `text-emerald-600` → `text-success-fg` (13), `text-red-600` → `text-danger-fg` (12), `text-amber-800/600` → `text-warning-fg` (8), `bg-emerald-100` → `bg-success-soft` (3), `bg-red-100` → `bg-danger-soft` (3)
  - Approach: 88% — semantic status tokens map cleanly to status indicators; same pattern used in business-os, brikette
  - Impact: 82% — product-pipeline is internal pipeline management; status colours are semantic (success/danger/warning) which maps perfectly to token semantics
- **Acceptance:**
  - Zero `ds/no-raw-tailwind-color` violations in product-pipeline
  - Scoped `error` rule added for `apps/product-pipeline/**`
  - Status indicator semantics preserved (green=success, red=danger, amber=warning)
  - `pnpm lint` passes
- **Validation contract:**
  - TC-01: `pnpm lint --filter @apps/product-pipeline` → 0 errors on `ds/no-raw-tailwind-color`
  - TC-02: `pnpm typecheck --filter @apps/product-pipeline` → passes
  - TC-03: Grep for remaining `emerald|amber` classes → 0
  - Acceptance coverage: TC-01 covers elimination + escalation; TC-02 covers types; TC-03 covers completeness
  - Validation type: lint + typecheck + grep
  - Run: `pnpm turbo lint typecheck --filter=@apps/product-pipeline`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Visual check of stage cards in dev server confirming status colours render correctly
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### DSA-09: Fix SplitPane + modals baseline (3 violations)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — fix 3 violations + remove 3 baseline entries
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `packages/ui/src/components/organisms/operations/SplitPane/SplitPane.tsx` (lines 351, 369)
  - **Primary:** `packages/ui/src/organisms/modals/primitives.tsx` (line 19)
  - **Primary:** `tools/eslint-baselines/ds-no-raw-tailwind-color.json`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% — `bg-blue-500` → `bg-primary` (2x), `bg-black/60` → `bg-[var(--overlay-scrim-2)]` or `bg-foreground/60`
  - Approach: 90% — primary for interactive indicator; overlay-scrim for modal backdrop
  - Impact: 88% — SplitPane is internal operations UI; modal backdrop is widely used but visually equivalent
- **Acceptance:**
  - 3 violations fixed
  - 3 entries removed from baseline JSON
  - `pnpm lint` passes
- **Validation contract:**
  - TC-01: `grep -c 'SplitPane\|primitives' tools/eslint-baselines/ds-no-raw-tailwind-color.json` → 0
  - TC-02: `pnpm lint` → passes
  - TC-03: `pnpm typecheck --filter @acme/ui` → passes
  - Acceptance coverage: TC-01 covers baseline cleanup; TC-02,03 cover no regressions
  - Validation type: grep + lint + typecheck
  - Run: `pnpm lint && pnpm typecheck --filter @acme/ui`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### DSA-10: DECISION — RatingsBar: baseline exception vs new opacity tokens

- **Type:** DECISION
- **Deliverable:** Decision recorded in plan Decision Log
- **Execution-Skill:** /lp-build
- **Affects:** `packages/ui/src/atoms/RatingsBar.tsx` (8 violations)
- **Depends on:** -
- **Blocks:** DSA-11
- **Confidence:** 60% ⚠️ BELOW THRESHOLD
  - Implementation: 80% — both options are implementable
  - Approach: 50% — genuinely equivalent options; requires design preference
  - Impact: 70% — RatingsBar is Brikette-specific; limited blast radius either way
- **Options:**
  - **Option A — Baseline exception:** Add `// eslint-disable-next-line ds/no-raw-tailwind-color -- brand-specific opacity` to each line. Remove from baseline JSON. Baseline reaches 0 entries. Document exception policy.
  - **Option B — Create opacity tokens:** Add `--color-rating-text`, `--color-rating-border`, `--color-rating-bg`, `--color-rating-ring` tokens to theme package. More tokens but zero raw colours.
- **Recommendation:** Option A — the 5 distinct opacity values (`/10`, `/15`, `/25`, `/40`, `/85`) serve a single component. Creating tokens for one consumer adds system complexity without reuse value.
- **Question for user:**
  - Should RatingsBar use inline eslint-disable comments (Option A) or should we create dedicated opacity tokens (Option B)?
  - Why it matters: Sets precedent for brand-specific opacity exceptions vs token system purity
  - Default if no answer: Option A (inline exceptions) + risk: other components may request similar exceptions
- **Acceptance:**
  - Decision recorded in plan Decision Log
  - DSA-11 unblocked with clear implementation direction

### DSA-11: Execute RatingsBar decision (9 violations)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — fix or annotate 9 violations + update baseline
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `packages/ui/src/atoms/RatingsBar.tsx` (8 violations)
  - **Primary:** `packages/ui/src/organisms/modals/primitives.tsx` (1 violation — if not already fixed in DSA-09)
  - **Primary:** `tools/eslint-baselines/ds-no-raw-tailwind-color.json`
- **Depends on:** DSA-10
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — depends on DSA-10 decision; both paths are clear
  - Approach: 80% — confidence depends on which option is chosen
  - Impact: 80% — RatingsBar is Brikette-only; low blast radius
- **Acceptance:**
  - If Option A: all 8 lines annotated with eslint-disable; 8 baseline entries removed
  - If Option B: 4+ new tokens created; 8 violations fixed with token references; 8 baseline entries removed
  - Baseline entry count for RatingsBar: 0 (entries removed regardless of approach)
  - `pnpm lint` passes
- **Validation contract:**
  - TC-01: `grep -c 'RatingsBar' tools/eslint-baselines/ds-no-raw-tailwind-color.json` → 0
  - TC-02: `pnpm lint` → passes
  - TC-03: `pnpm typecheck --filter @acme/ui` → passes
  - Acceptance coverage: TC-01 covers baseline cleanup; TC-02,03 cover no regressions
  - Validation type: grep + lint + typecheck
  - Run: `pnpm lint && pnpm typecheck --filter @acme/ui`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None
- **Notes:** Actual implementation depends on DSA-10 decision. If DSA-09 already fixes the modals/primitives.tsx violation, skip that file here.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `bg-surface` doesn't render white in xa apps | Low | Medium | Verify `bg-surface` = `hsl(var(--surface-1))` = white in light mode; confirmed in tokens.static.css |
| Product-pipeline status colours lose meaning | Low | Low | `success-fg` = green, `danger-fg` = red, `warning-fg` = amber — semantic match confirmed |
| xa-j and xa-b not actually shared code | Low | Medium | If independent, treat xa-b as additional scope within same task; total violations unchanged |
| Multiple tasks editing eslint.config.mjs cause merge conflicts | Medium | Low | Writer lock serialises commits; each task adds a distinct scoped block |
| RatingsBar decision delays baseline reaching zero | Medium | Low | DSA-10 is independent of all other tasks; proceed with Waves 1-2 regardless |

## Observability

- Logging: N/A (lint config changes only)
- Metrics: Baseline entry count (target: 0); apps at error count (target: 14)
- Alerts/Dashboards: CI lint check is the enforcement mechanism

## Acceptance Criteria (overall)

- [x] All 7 warn-level apps have tokens imported (already true)
- [ ] `ds/no-raw-tailwind-color` at `error` level for cochlearfit, handbag-configurator, cover-me-pretty, xa-j, xa-b, xa-uploader, product-pipeline
- [ ] Baseline entry count: 0 (or 0 with inline eslint-disable for RatingsBar)
- [ ] Stale fact-find docs archived
- [ ] `pnpm lint` green repo-wide
- [ ] `pnpm typecheck` green repo-wide

## Decision Log

- 2026-02-13: Plan created. All status tokens confirmed available (`success-fg`, `warning-fg`, `danger-fg`). Product-pipeline does not need new tokens.
- 2026-02-13: xa-j / xa-b confirmed identical violation patterns — treated as single task.
