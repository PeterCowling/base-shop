---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: ds-reception-migration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: pending
---

# P5 — Design System: Reception Full Migration Plan

## Summary

Migrate `apps/reception/` — the property management system used daily for hostel operations — from raw Tailwind palette colours and hardcoded hex constants to the centralised token system. Investigation reveals a better starting position than expected: the token system is **already integrated** (`@themes/base/tokens.css` imported), legacy colour constants are **already migrated** to token mappings, and a reception-to-hospitality-token bridge layer exists in `globals.css`. The main work is migrating ~323 TSX component files from raw palette classes to semantic tokens. All 36 DS lint rules are currently OFF.

## Goals

- Phase 1: Enable DS colour rules at `warn` to surface the full violation inventory
- Phase 2: Migrate components directory-by-directory using semantic tokens
- Phase 3: Migrate room grid subsystem (custom theme object + status colours)
- Phase 4: Escalate DS colour rules to `error`

## Non-goals

- Migrating non-colour DS violations (spacing, typography, layout primitives) — separate phase
- Visual redesign of Reception
- Adding dark mode beyond what exists
- Migrating all 36 DS rules at once — colour first, others later

## Constraints & Assumptions

- `...offAllDsRules` currently disables ALL 36 DS rules for Reception in `eslint.config.mjs`
- Only `DarkModeToggle.tsx` and `dashboard/**` have DS rules at `warn`
- No automated visual regression tests; no Storybook
- Must not disrupt daily operations (check-ins, bookings, financial reporting)
- Room grid uses `@daminort/reservation-grid` with a custom theme object (dot-notation keys)

## Fact-Find Reference

- Brief: `docs/plans/ds-reception-migration-fact-find.md`
- Key finding update: Token system already integrated, legacy constants already migrated, reception-hospitality bridge exists
- 323 TSX files across 30 component directories
- `statusColors.ts` has mixed notation (hex + Tailwind + pseudo-MUI)
- Room grid `theme.ts` has 9 hardcoded hex colours
- Only 11 inline `style=` occurrences across entire app (very low!)

## Existing System Notes

- Token integration: `globals.css` imports `@themes/base/tokens.css` ✅
- Bridge layer: `--reception-dark-bg`, `--reception-signal-ready-bg/fg`, etc. ✅
- Legacy constants (`colors.ts`): already migrated to token map, marked deprecated ✅
- Tailwind config: `receptionColorBridge` extends base with `hsl(var(--reception-*))` ✅
- Room grid: custom `THEME` object with `"color.text": "#30424F"` etc. — needs special handling

## Proposed Approach

**Phase 1 — Visibility:** Turn on `ds/no-raw-color` and `ds/no-raw-tailwind-color` at `warn` for all of `apps/reception/`. Run lint and record the real violation inventory. This replaces guesswork with data.

**Phase 2 — Component migration (by directory, smallest first):**
Start with small directories to establish patterns, then tackle the large ones. The token bridge layer in `globals.css` means hospitality-specific colours (`--reception-signal-ready-bg`) are already available as Tailwind utilities.

**Phase 3 — Room grid subsystem:** Special handling for `THEME` object and `statusColors.ts`. Map hex values to CSS custom properties that reference hospitality tokens.

**Phase 4 — Lock-down:** Replace `...offAllDsRules` with selective colour rules at `error`.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| REC-01 | INVESTIGATE | Enable warn + capture violation inventory | 95% | S | Pending | - | REC-02..08 |
| REC-02 | IMPLEMENT | Migrate small directories (~20 files) | 85% | M | Pending | REC-01 | REC-09 |
| REC-03 | IMPLEMENT | Migrate common/ shared components (16 files) | 82% | M | Pending | REC-01 | REC-09 |
| REC-04 | IMPLEMENT | Migrate room grid subsystem (27 files + theme + statusColors) | 72% | L | Pending | REC-01 | REC-09 |
| REC-05 | IMPLEMENT | Migrate checkins/ (62 files) | 78% | L | Pending | REC-03 | REC-09 |
| REC-06 | IMPLEMENT | Migrate till/ (49 files) | 78% | L | Pending | REC-03 | REC-09 |
| REC-07 | IMPLEMENT | Migrate bar/ (38 files) | 78% | L | Pending | REC-03 | REC-09 |
| REC-08 | IMPLEMENT | Migrate remaining directories (~110 files) | 75% | L | Pending | REC-03 | REC-09 |
| CHECKPOINT | CHECKPOINT | Reassess after core migration | 95% | - | Pending | REC-04 | REC-05..08 |
| REC-09 | IMPLEMENT | ESLint config: replace offAllDsRules with error | 95% | S | Pending | REC-02..08 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | REC-01 | - | Investigation: enable warn, capture inventory |
| 2 | REC-02, REC-03, REC-04 | REC-01 | Small dirs + common + room grid |
| CHECKPOINT | — | REC-04 | Reassess remaining plan with evidence from Waves 1-2 |
| 3 | REC-05, REC-06, REC-07, REC-08 | REC-03 + CHECKPOINT | Large feature directories |
| 4 | REC-09 | Wave 3 complete | Lock-down |

**Max parallelism:** 4 | **Critical path:** 4 waves + checkpoint | **Total tasks:** 10

## Tasks

### REC-01: Enable warn + capture violation inventory

- **Type:** INVESTIGATE
- **Deliverable:** Violation inventory report (comment in plan) + ESLint config change
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `eslint.config.mjs` (change `offAllDsRules` to selective warn for colour rules)
- **Depends on:** -
- **Blocks:** REC-02, REC-03, REC-04, REC-05, REC-06, REC-07, REC-08
- **Confidence:** 95%
  - Implementation: 95% — ESLint config change is straightforward
  - Approach: 95% — warn-first surfaces the real count before committing to timeline
  - Impact: 95% — warn doesn't break CI
- **Blockers / questions to answer:**
  - Exact violation count per directory
  - Which files have the most violations
  - Whether any violations are in dynamically constructed class strings (harder to fix)
- **Acceptance:**
  - `eslint.config.mjs` updated: Reception's `offAllDsRules` replaced with selective colour rules at `warn`
  - Violation inventory captured: per-directory counts, top offending files, total count
  - Plan updated with precise scope data
- **Validation contract:**
  - TC-01: `pnpm lint -- --filter reception 2>&1 | grep 'ds/no-raw-tailwind-color' | wc -l` → captured count
  - TC-02: `pnpm lint` still passes (warn doesn't fail CI)
  - Validation type: lint
  - Run/verify: `pnpm lint -- --filter reception`
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** Update this plan with actual violation counts
- **Notes:** This task replaces guesswork with data. The plan's confidence scores and task scoping should be revised after this task completes.

### REC-02: Migrate small directories (~20 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — ~20 files across small directories
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/reception/src/components/analytics/` (2 files)
  - **Primary:** `apps/reception/src/components/live/` (2 files)
  - **Primary:** `apps/reception/src/components/prime-requests/` (2 files)
  - **Primary:** `apps/reception/src/components/stats/` (2 files)
  - **Primary:** `apps/reception/src/components/dashboard/` (4 files)
  - **Primary:** `apps/reception/src/components/inventory/` (4 files)
  - **Primary:** `apps/reception/src/components/prepare/` (4 files)
- **Depends on:** REC-01
- **Blocks:** REC-09
- **Confidence:** 85%
  - Implementation: 88% — small, isolated components; standard mapping
  - Approach: 88% — establishes migration patterns for larger batches
  - Impact: 85% — low-traffic internal pages
- **Acceptance:**
  - All raw palette classes replaced with semantic tokens
  - Per-directory violation count drops to zero
- **Validation contract:**
  - TC-01: `pnpm lint -- --filter reception` → zero `ds/no-raw-tailwind-color` violations in these directories
  - Validation type: lint
  - Run/verify: `pnpm lint -- --filter reception`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### REC-03: Migrate common/ shared components (16 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 16 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/reception/src/components/common/` (16 files)
- **Depends on:** REC-01
- **Blocks:** REC-05, REC-06, REC-07, REC-08, REC-09
- **Confidence:** 82%
  - Implementation: 85% — shared components may have more complex styling patterns
  - Approach: 85% — these are imported by other directories; migrating them first avoids duplicate work
  - Impact: 80% — high-impact: used across the app; incorrect migration here propagates
- **Acceptance:**
  - All raw palette classes in common/ replaced with semantic tokens
  - No regressions in components that import from common/
- **Validation contract:**
  - TC-01: Zero violations in `apps/reception/src/components/common/` from lint
  - TC-02: `Login.tsx` uses semantic tokens (was one of the top offending files)
  - Validation type: lint + visual spot-check of login page
  - Run/verify: `pnpm lint -- --filter reception`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Knowing the exact violation count from REC-01
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### REC-04: Migrate room grid subsystem (27 files + theme + statusColors)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — ~30 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/reception/src/components/roomgrid/` (27 TSX files)
  - **Primary:** `apps/reception/src/components/roomgrid/constants/statusColors.ts`
  - **Primary:** `apps/reception/src/components/roomgrid/constants/theme.ts`
  - **Primary:** `apps/reception/src/components/roomgrid/constants/__theme.ts` (duplicate — delete)
- **Depends on:** REC-01
- **Blocks:** CHECKPOINT, REC-09
- **Confidence:** 72%
  - Implementation: 75% — `statusColors.ts` has mixed notation (hex + Tailwind + pseudo-MUI); `theme.ts` passes hex to `@daminort/reservation-grid` which may not support CSS variables
  - Approach: 75% — hospitality tokens exist and map well semantically; but `@daminort/reservation-grid`'s theme interface may require hex strings
  - Impact: 70% — room grid is the primary operational view; staff use colour cues for booking states hourly
- **Acceptance:**
  - `statusColors.ts`: all values use semantic tokens or CSS custom properties referencing hospitality tokens
  - `theme.ts`: hex values replaced with CSS custom property references where the library supports it; documented exemptions where it doesn't
  - `__theme.ts`: deleted (duplicate file)
  - 27 TSX files: all raw palette classes → semantic tokens
  - Room grid renders correctly with token-based colours
- **Validation contract:**
  - TC-01: Status colours are visually distinguishable in the room grid
  - TC-02: `grep -c '#[0-9a-fA-F]' statusColors.ts theme.ts` → 0 (or documented exemptions)
  - TC-03: Zero violations in roomgrid/ from lint
  - Validation type: lint + visual check of room grid with various booking states
  - Run/verify: `pnpm lint -- --filter reception` + manual room grid check
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Confirming `@daminort/reservation-grid` accepts CSS variables for theme colours; verifying room grid renders correctly with all booking states
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None
- **Notes:** The `@daminort/reservation-grid` library may require hex strings in its theme object. If so, create a runtime bridge that reads CSS variable computed values — or document as a ticketed exemption.

### CHECKPOINT: Reassess after core migration

- **Type:** CHECKPOINT
- **Depends on:** REC-04
- **Blocks:** REC-05, REC-06, REC-07, REC-08
- **Confidence:** 95%
- **Acceptance:**
  - Run `/lp-replan` on REC-05 through REC-08
  - Reassess violation counts from REC-01 against completed work
  - Confirm migration patterns established in REC-02/03/04 work for large directories
  - Update task confidence based on actual velocity from Waves 1-2
- **Horizon assumptions to validate:**
  - Standard mapping table covers all patterns in large directories (no new patterns)
  - Room grid migration didn't reveal integration issues with third-party library
  - Common components migrated without downstream breakage

### REC-05: Migrate checkins/ (62 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 62 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/reception/src/components/checkins/` (62 files)
- **Depends on:** REC-03, CHECKPOINT
- **Blocks:** REC-09
- **Confidence:** 78%
  - Implementation: 80% — largest directory; patterns should be established from earlier batches
  - Approach: 80% — mechanical mapping
  - Impact: 75% — check-in flow is mission-critical for daily operations
- **Acceptance:**
  - Zero violations in checkins/ from lint
  - Check-in workflow functions correctly
- **Validation contract:**
  - TC-01: Zero `ds/no-raw-tailwind-color` violations in checkins/
  - TC-02: Manual check-in flow test (visual spot-check)
  - Validation type: lint + visual
  - Run/verify: `pnpm lint -- --filter reception`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Exact violation count from REC-01 + established patterns from earlier waves
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### REC-06: Migrate till/ (49 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 49 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/reception/src/components/till/` (49 files)
- **Depends on:** REC-03, CHECKPOINT
- **Blocks:** REC-09
- **Confidence:** 78%
  - Implementation: 80% — second largest; till/POS patterns
  - Approach: 80% — mechanical mapping
  - Impact: 75% — till is used for guest transactions
- **Acceptance:**
  - Zero violations in till/ from lint
- **Validation contract:**
  - TC-01: Zero violations in till/
  - Validation type: lint
  - Run/verify: `pnpm lint -- --filter reception`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### REC-07: Migrate bar/ (38 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 38 files
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/reception/src/components/bar/` (38 files)
- **Depends on:** REC-03, CHECKPOINT
- **Blocks:** REC-09
- **Confidence:** 78%
  - Implementation: 80% — bar service components
  - Approach: 80% — mechanical mapping
  - Impact: 75% — bar POS is used for food/drink service
- **Acceptance:**
  - Zero violations in bar/ from lint
- **Validation contract:**
  - TC-01: Zero violations in bar/
  - Validation type: lint
  - Run/verify: `pnpm lint -- --filter reception`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### REC-08: Migrate remaining directories (~110 files)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — ~110 files across remaining directories
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/reception/src/components/loans/` (19 files)
  - **Primary:** `apps/reception/src/components/prepayments/` (19 files)
  - **Primary:** `apps/reception/src/components/safe/` (18 files)
  - **Primary:** `apps/reception/src/components/search/` (14 files)
  - **Primary:** `apps/reception/src/components/reports/` (11 files)
  - **Primary:** `apps/reception/src/components/man/` (10 files)
  - **Primary:** `apps/reception/src/components/appNav/` (7 files)
  - **Primary:** `apps/reception/src/components/checkout/` (6 files)
  - **Primary:** `apps/reception/src/components/emailAutomation/` (6 files)
- **Depends on:** REC-03, CHECKPOINT
- **Blocks:** REC-09
- **Confidence:** 75%
  - Implementation: 78% — large batch but individual files should be small; patterns established
  - Approach: 78% — mechanical mapping
  - Impact: 72% — search and reports are heavily used; FinancialTransactionSearch was a top offending file
- **Acceptance:**
  - Zero violations in all remaining directories
  - FinancialTransactionSearch and EndOfDayPacket render correctly
- **Validation contract:**
  - TC-01: Zero violations in all remaining directories
  - TC-02: Visual spot-check of search results and financial reports
  - Validation type: lint + visual
  - Run/verify: `pnpm lint -- --filter reception`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Exact violation count from REC-01 + established patterns
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

### REC-09: ESLint config: replace offAllDsRules with error for colour rules

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `eslint.config.mjs`
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `eslint.config.mjs`
- **Depends on:** REC-02, REC-03, REC-04, REC-05, REC-06, REC-07, REC-08
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — replace `...offAllDsRules` with selective config: colour rules at `error`, other DS rules remain `off`
  - Approach: 95% — incremental enforcement (colour first, then other rules in future phases)
  - Impact: 95% — lint-only
- **Acceptance:**
  - Reception's `...offAllDsRules` replaced with:
    - `ds/no-raw-color: "error"`
    - `ds/no-raw-tailwind-color: "error"`
    - Other DS rules remain `off` (for now)
  - `pnpm lint` passes repo-wide
- **Validation contract:**
  - TC-01: `eslint.config.mjs` no longer uses `offAllDsRules` for reception's main scope
  - TC-02: `pnpm lint` → passes
  - Validation type: lint
  - Run/verify: `pnpm lint`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:** direct commit / `git revert`
- **Documentation impact:** None

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `@daminort/reservation-grid` doesn't accept CSS variables in theme | Medium | Medium | Runtime bridge to read computed values; or ticketed exemption for theme.ts |
| Staff confusion from colour changes in room grid | Medium | Medium | Map to visually similar hospitality tokens; brief staff if notable changes |
| Scope much larger than expected after REC-01 reveals real count | Medium | Low | CHECKPOINT gate after core migration; replan if patterns don't hold |
| Migration takes many sessions; risk of half-migrated state | Medium | Low | Each directory commit is self-contained; partial migration is safe |

## Acceptance Criteria (overall)

- [ ] DS colour rules at `error` for Reception (colour rules only; other DS rules remain off)
- [ ] `...offAllDsRules` no longer used for Reception's main colour enforcement
- [ ] `statusColors.ts` uses token-based values
- [ ] Room grid `theme.ts` uses tokens or has documented exemptions
- [ ] `__theme.ts` duplicate deleted
- [ ] `pnpm lint` passes repo-wide
- [ ] Manual spot-check: room grid, check-in flow, till, financial reports

## Decision Log

- 2026-02-12: Investigation reveals token system already integrated + bridge layer exists — better positioned than expected
- 2026-02-12: CHECKPOINT inserted after Wave 2 (small dirs + common + room grid) — replan before committing to 260-file large-directory migration
- 2026-02-12: Defaulting to hospitality tokens for booking status colours (already bridged in globals.css)
- 2026-02-12: Colour-only enforcement first; other DS rules (spacing, typography, layout) deferred to future phase
