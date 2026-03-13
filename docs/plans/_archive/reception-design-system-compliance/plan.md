---
Type: Plan
Status: Archived
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-design-system-compliance
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-design-system-compliance/analysis.md
---

# Reception Design System Compliance Plan

## Summary

Migrates the reception app from raw Tailwind flex/grid layout classes to DS layout primitives (`<Inline>`, `<Stack>`, `<Cluster>`, `<Grid>`), fixes 2 inline-style overrides that bypass the token cascade, and enables the `ds/enforce-layout-primitives` ESLint rule as a permanent CI error gate. Work spans ~268 instances across 15 component folders. Task structure: (1) fix 2 inline-style files, (2) migrate shared `common/` components first (blast radius guard), (3) 9 parallel screen-group migrations, (4) ESLint error-gate activation. All layout changes are mechanical substitutions — no visual redesign, no color changes, no new tokens.

## Active tasks
- [x] TASK-01: Fix inline style overrides in _BookingTooltip and KeycardDepositMenu
- [x] TASK-02: Migrate common/ layout primitives (26 violations)
- [x] TASK-03: Migrate checkins/ layout primitives (~53 violations)
- [x] TASK-04: Migrate inbox/ layout primitives (~46 violations)
- [x] TASK-05: Migrate till/ layout primitives (~40 violations)
- [x] TASK-06: Migrate bar/ layout primitives (~24 violations)
- [x] TASK-07: Migrate prepayments/ + inventory/ layout primitives (~25 violations)
- [x] TASK-08: Migrate loans/ + safe/ layout primitives (~18 violations)
- [x] TASK-09: Migrate man/ + userManagement/ layout primitives (~13 violations)
- [x] TASK-10: Migrate appNav/ + eodChecklist/ + cash/ layout primitives (~10 violations)
- [x] TASK-11: Migrate roomgrid/ layout primitives (~6 violations, excl. _BookingTooltip)
- [x] TASK-12: Enable ds/enforce-layout-primitives as ESLint error gate

## Goals
- Eliminate all inline `style={{` overrides in production components (except JS-computed coordinates)
- Migrate all raw flex/grid layout class patterns to DS layout primitives
- Enable `ds/enforce-layout-primitives` as a permanent CI error-level gate

## Non-goals
- New token definitions or color changes
- Visual redesign of any component
- Test file changes
- Arbitrary Tailwind bracket values (3 already formally suppressed with justification comments — no action needed)

## Constraints & Assumptions
- Constraints:
  - `_BookingTooltip` and `KeycardDepositMenu` use JS-computed `top`/`left` mouse/click coordinates — these must remain as inline styles; only `position` property migrated to Tailwind class
  - Both files already have `z-50` in their className — no `zIndex` arbitrary-value concern
  - `KeycardDepositButton` wrapper (line 280) has `className="relative"` — `absolute` class on the menu is positionally safe
  - DS `<Inline>` uses `alignY` prop (not `align`); default is `"center"` — so `<Inline>` alone = `flex items-center gap-2 flex-wrap`; always set `alignY` explicitly when NOT center
  - DS `<Inline>` default `gap={2}` and `wrap={true}` — for `flex items-center` (no gap), use `<Inline gap={0}>`; for `flex-nowrap` patterns, use `<Inline wrap={false}>`
  - DS `<Cluster>` has `justify` prop (`"start"|"center"|"end"|"between"`) — use for `justify-between` / `justify-center` patterns
  - Gap values in DS primitives are numbers not strings: `gap={2}` not `gap="2"`; non-standard gap values (e.g. `gap-1.5`) must keep className approach
  - `ds/enforce-layout-primitives` ESLint rule is currently `"off"` in root `.eslintrc.cjs` — no lint failures during migration; final task activates it
  - `common/` components are shared across multiple screens — TASK-02 must complete (or be in its own merge) before screen-group tasks begin
- Assumptions:
  - DS `<Inline>` `gap` prop uses the same token scale as Tailwind `gap-*` — confirmed equivalent (`gap="2"` = `gap-2` = 0.5rem)
  - `<Inline className="flex-col">` antipattern is not used — `<Stack>` is the correct DS primitive for column layout
  - Primitives are used only with supported props, not with `className` overrides that override their layout semantics

## Inherited Outcome Contract

- **Why:** Inline styles and arbitrary layout classes make future theme changes, dark-mode maintenance, and design-system upgrades fragile. Centralising all layout through DS primitives and eliminating inline styles ensures that token changes propagate correctly throughout the app.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception app production components are free of inline `style={{` overrides; arbitrary Tailwind bracket values are either replaced with tokens or formally suppressed with justification; raw flex/grid layout class patterns are migrated to DS layout primitives.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-design-system-compliance/analysis.md`
- Selected approach inherited:
  - Option A chosen: full DS primitive migration (not suppress-and-document)
  - Execute in parallel screen-group tasks with `common/` as a prerequisite wave
- Key reasoning used:
  - Option B (suppress 266 violations) doesn't achieve the compliance goal; suppressed patterns are invisible to token changes
  - Option A is mechanical with 1:1 substitutions; safe to parallelise across non-overlapping file sets

## Selected Approach Summary
- What was chosen:
  - Replace all `className="flex ..."` patterns with `<Inline>`, `<Stack>`, `<Cluster>`, or `<Grid>` DS primitives
  - Fix 2 inline-style files by moving `position` property to Tailwind class, retaining computed `top`/`left`
  - Activate `ds/enforce-layout-primitives` as ESLint error in final task
- Why planning is not reopening option selection:
  - Analysis settled the decision with score 4.5/5.0 — no operator questions remain open
  - 1:1 mapping for every flex/grid pattern is confirmed; risk of gap/align mismatch is managed by always setting `align` explicitly

## Fact-Find Support
- Supporting brief: `docs/plans/reception-design-system-compliance/fact-find.md`
- Evidence carried forward:
  - Inline style violations: exactly 2 files (confirmed via grep)
  - DS Button already fully adopted (zero raw `<button>` in production — pre-gathered claim of 97 was wrong)
  - Raw flex violations: ~268 instances across 15 component folders (per-folder counts verified)
  - 3 arbitrary bracket values already formally suppressed — no action needed

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix inline style overrides (_BookingTooltip, KeycardDepositMenu) | 90% | S | Complete (2026-03-13) | - | TASK-12 |
| TASK-02 | IMPLEMENT | Migrate common/ layout primitives (26 violations) | 85% | M | Complete (2026-03-13) | - | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11 |
| TASK-03 | IMPLEMENT | Migrate checkins/ layout primitives (~53 violations) | 85% | M | Complete (2026-03-13) | TASK-02 | TASK-12 |
| TASK-04 | IMPLEMENT | Migrate inbox/ layout primitives (~46 violations) | 85% | M | Complete (2026-03-13) | TASK-02 | TASK-12 |
| TASK-05 | IMPLEMENT | Migrate till/ layout primitives (~40 violations) | 85% | M | Complete (2026-03-13) | TASK-02 | TASK-12 |
| TASK-06 | IMPLEMENT | Migrate bar/ layout primitives (~24 violations) | 87% | S | Complete (2026-03-13) | TASK-02 | TASK-12 |
| TASK-07 | IMPLEMENT | Migrate prepayments/ + inventory/ layout primitives (~25 violations) | 87% | S | Complete (2026-03-13) | TASK-02 | TASK-12 |
| TASK-08 | IMPLEMENT | Migrate loans/ + safe/ layout primitives (~18 violations) | 87% | S | Complete (2026-03-13) | TASK-02 | TASK-12 |
| TASK-09 | IMPLEMENT | Migrate man/ + userManagement/ layout primitives (~13 violations) | 87% | S | Complete (2026-03-13) | TASK-02 | TASK-12 |
| TASK-10 | IMPLEMENT | Migrate appNav/ + eodChecklist/ + cash/ layout primitives (~10 violations) | 90% | S | Complete (2026-03-13) | TASK-02 | TASK-12 |
| TASK-11 | IMPLEMENT | Migrate roomgrid/ layout primitives (~6 violations, excl. _BookingTooltip) | 90% | S | Complete (2026-03-13) | TASK-02 | TASK-12 |
| TASK-12 | IMPLEMENT | Enable ds/enforce-layout-primitives as ESLint error gate | 90% | S | Complete (2026-03-13) | TASK-01, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Each screen-group task must spot-check affected layouts in browser; DS primitive gap/align defaults verified as equivalent to replaced Tailwind classes; explicit `align` set where `items-center` was present | All TASK-01 to TASK-11 | Visual regression risk is low (mechanical swap) but requires post-build browser verification per group |
| UX / states | JS-computed `top`/`left` positions retained in inline style; only `position` migrated to class; tooltip/dropdown positioning preserved | TASK-01 | No UX regression for other tasks — layout-only, no interactive state changes |
| Security / privacy | N/A — layout/structural change only; no auth, input, or data exposure involved | N/A | None |
| Logging / observability / audit | N/A — no log, metric, or audit trail affected by layout class changes | N/A | None |
| Testing / validation | Existing RTL tests provide structural regression guard; CI test pass required per task; snapshot updates expected and intentional | All TASK-01 to TASK-11 | Visual equivalence is unverifiable via RTL; manual browser spot-check required per screen group |
| Data / contracts | N/A — no schema, API, or type changes | N/A | None |
| Performance / reliability | N/A — CSS class swaps have negligible runtime impact; no hot paths affected | N/A | None |
| Rollout / rollback | Single deploy per task group or all together; rollback is git revert of task-scoped commit | All tasks | No migration ordering for rollback; each task commit is independently revertable |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent of each other; TASK-02 blocks Wave 2 |
| 2 | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11 | TASK-02 complete | Non-overlapping file sets — fully parallelisable; TASK-01 may already be complete from Wave 1 |
| 3 | TASK-12 | TASK-01, TASK-03–TASK-11 complete | Final gate — enables ESLint error rule |

## Delivered Processes

None: no material process topology change. This plan adds a permanent CI lint gate (activating an existing rule from `"off"` to `"error"`) but does not alter any operator workflow, approval path, lifecycle state, or deploy lane.

## Tasks

---

### TASK-01: Fix inline style overrides (_BookingTooltip, KeycardDepositMenu)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 2 production component files; inline styles reduced to computed coordinates only
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/roomgrid/_BookingTooltip.tsx`
  - `apps/reception/src/components/checkins/keycardButton/KeycardDepositMenu.tsx`
- **Depends on:** -
- **Blocks:** TASK-12
- **Confidence:** 90%
  - Implementation: 92% — pattern is clear: move `position: "fixed"` / `position: "absolute"` from inline style to className; keep computed `top`/`left` as inline style; both files verified
  - Approach: 95% — approach confirmed in analysis; parent `relative` at line 280 of KeycardDepositButton confirmed; both files already have `z-50` in className
  - Impact: 90% — inline styles eliminated; token cascade restored for positioning; `top`/`left` remain computed so no UX regression
- **Acceptance:**
  - `_BookingTooltip.tsx`: inline style contains only `top` and `left` properties; `fixed` appears in className; no `position` in style prop
  - `KeycardDepositMenu.tsx`: inline style contains only `top` and `left` properties; `absolute` appears in containerClass string; no `position` in style prop
  - Browser: tooltip follows cursor correctly in both light and dark mode
  - Browser: deposit menu positions correctly relative to its trigger button
  - `pnpm --filter reception typecheck` passes
  - `pnpm --filter reception lint` passes (rule is `"off"` during migration — no new violations introduced)
  - **Expected user-observable behavior:** Tooltip appears at cursor position unchanged; deposit menu opens at button position unchanged; no visible layout shift in light or dark mode
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to `roomgrid/` and `checkins/keycardButton/`; auto-fix Critical/Major findings before marking complete; Minor findings may be deferred with documented rationale
- **Engineering Coverage:**
  - UI / visual: Required — position migration must produce identical visual output; tooltip and menu appearance unchanged
  - UX / states: Required — tooltip mouse-follow and dropdown positioning must work after `position` is moved to class; verify in browser
  - Security / privacy: N/A — layout change only
  - Logging / observability / audit: N/A
  - Testing / validation: Required — existing RTL tests pass; no snapshot regressions (these components render position dynamically, not in snapshots)
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — single task commit; rollback is git revert
- **Validation contract (TC-01):**
  - TC-01: `_BookingTooltip.tsx` style prop has only `{ top: ..., left: ... }` and className includes `fixed` → verified via code read
  - TC-02: `KeycardDepositMenu.tsx` style prop has only `{ top: ..., left: ... }` and containerClass string includes `absolute` → verified via code read
  - TC-03: typecheck + lint pass
- **Execution plan:**
  - Red: Identify exact lines in both files; confirm current inline style structure
  - Green: In `_BookingTooltip.tsx`, add `fixed` to className string; remove `position: "fixed"` from style prop. In `KeycardDepositMenu.tsx`, add `absolute` to containerClass template string; remove `position: "absolute"` from style prop.
  - Refactor: Read both files fully after edits; confirm no orphaned style props; confirm no lint errors introduced
- **Planning validation (required for M/L):** N/A (S effort)
- **Scouts:** None: approach verified — both files read in fact-find session
- **Edge Cases & Hardening:**
  - `_BookingTooltip`: className is a string literal on the div — add `fixed` before `pointer-events-none` for consistency
  - `KeycardDepositMenu`: containerClass is a template literal — add `absolute` at the start of the string
  - Both: `z-50` is already present — do not add a second z-index class
- **What would make this >=90%:**
  - Already at 90% — confirmed by reading both files; approach is unambiguous
- **Rollout / rollback:**
  - Rollout: commit as standalone change; deploy with next reception release
  - Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:**
  - `_BookingTooltip.tsx` lines 31-36: current inline style `{ position: "fixed", top: position.y + 10, left: position.x + 10 }`
  - `KeycardDepositMenu.tsx` lines 61-65: current inline style `{ position: "absolute", top: menuPosition.top, left: menuPosition.left }`
  - `KeycardDepositButton.tsx` line 280: `className="relative"` — parent positioning anchor confirmed

---

### TASK-02: Migrate common/ layout primitives (26 violations)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — all files in `apps/reception/src/components/common/` migrated to DS layout primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/common/` (all .tsx files with flex/grid violations)
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11
- **Confidence:** 85%
  - Implementation: 87% — common/ contains shared components with multiple consumers; grep-verified 26 violations; no unusual patterns identified
  - Approach: 90% — substitution mapping is 1:1; `align` set explicitly where `items-center` present; `<Stack>` used for `flex-col`
  - Impact: 85% — shared components have wider blast radius; visual equivalence must be verified across all screens that consume them
- **Acceptance:**
  - All files in `common/` have zero raw `className="flex ..."` layout patterns (grep confirms)
  - Each replaced pattern uses correct DS primitive with explicit `align` where `items-center` was present
  - `pnpm --filter reception typecheck` passes
  - `pnpm --filter reception lint` passes
  - Existing RTL tests in `apps/reception/src/__tests__/` pass
  - Browser spot-check: PageShell, ActionRail, FilterToolbar, FormContainer render correctly
  - **Expected user-observable behavior:** All screens that use common/ components (all 12+ reception screens) render with identical layout to pre-migration; no gap, alignment, or spacing regressions visible
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to changed common/ component paths; auto-fix Critical/Major findings before marking complete
- **Engineering Coverage:**
  - UI / visual: Required — shared components affect all screens; spot-check PageShell and ActionRail in browser after migration
  - UX / states: Required — no interactive state changes; confirm no layout collapse in empty/loading states
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — existing tests pass; snapshot updates for any components with layout snapshots
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — commit as standalone change before Wave 2 tasks begin
- **Validation contract (TC-02):**
  - TC-01: `grep -r "className=\"flex\|className={.*flex" apps/reception/src/components/common/` returns zero matches
  - TC-02: typecheck + lint pass
  - TC-03: RTL test suite passes (or snapshot updates documented as intentional)
- **Execution plan:**
  - Red: Run grep to enumerate all flex/grid violations in common/; list each file and line
  - Green: For each file, replace raw flex patterns with DS primitives using correct prop names: `<Inline>` (default = `flex items-center gap-2`); `<Inline gap={N}>` for different gap; `<Inline alignY="start">` for `items-start`; `<Inline gap={0}>` for no-gap flex-row; `<Cluster justify="between">` for `justify-between`; `<Stack gap={N}>` for `flex-col`; non-standard gap values (e.g. `gap-1.5`) keep as className; import from `@acme/design-system/primitives`
  - Refactor: Re-read each edited file; confirm no remaining raw flex patterns; confirm DS primitive props match original Tailwind intent
- **Planning validation:**
  - Checks run: grep for violations in common/ — 26 instances across ~20 files in `apps/reception/src/components/common/`
  - Validation artifacts: grep output from fact-find confirms count
  - Unexpected findings: None
  - Consumer tracing: N/A — no new outputs introduced; no function signatures or return types modified; existing consumers of common/ components are unchanged by this layout class substitution
- **Scouts:** None: common/ folder contents verified; DS primitive imports available at `@acme/design-system/primitives`
- **Edge Cases & Hardening:**
  - `<Inline className="flex-col">` antipattern: if found, replace with `<Stack>` instead (do not use `<Inline>` with `flex-col` className override)
  - Multi-class flex patterns (e.g. `flex items-center justify-between gap-2`): use `<Inline align="center" justify="between" gap="2">`
  - Verify DS `<Inline>` supports `justify` prop; if not, use `<Cluster>` for justify-between patterns
- **What would make this >=90%:**
  - Confirm DS `<Inline>` prop surface covers all justify variants used in common/ — currently 85% due to unknown edge props
- **Rollout / rollback:**
  - Rollout: commit before Wave 2 tasks begin; deploy as part of migration release
  - Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:**
  - 26 violations across common/ — highest blast radius of any folder due to shared usage

---

### TASK-03: Migrate checkins/ layout primitives (~53 violations)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — all files in `apps/reception/src/components/checkins/` (excl. keycardButton/ inline-style files already handled in TASK-01) migrated to DS layout primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/checkins/` (all .tsx files with flex/grid violations, **excluding** `keycardButton/KeycardDepositMenu.tsx` — handled by TASK-01)
- **Depends on:** TASK-02
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 87% — largest screen group; 53 violations; mechanical substitution but high volume
  - Approach: 90% — same 1:1 DS primitive substitution as TASK-02
  - Impact: 85% — checkins is the primary reception screen; visual regression risk requires browser spot-check
- **Acceptance:**
  - All files in `checkins/` have zero raw `className="flex ..."` layout patterns (grep confirms)
  - DS primitives used correctly with explicit `align` where `items-center` was present
  - `pnpm --filter reception typecheck` passes
  - `pnpm --filter reception lint` passes
  - Browser: check-in flow renders correctly; booking rows, keycard buttons, status buttons all display correctly
  - **Expected user-observable behavior:** Check-in screen layout identical to pre-migration; no gap, alignment, or spacing regressions in booking table, status buttons, or modal overlays
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to `checkins/`; auto-fix Critical/Major findings before marking complete
- **Engineering Coverage:**
  - UI / visual: Required — checkins is primary reception screen; browser spot-check required
  - UX / states: Required — booking row interactions (click, hover, status change) unaffected
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — RTL tests pass; snapshot updates documented as intentional
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — commit as standalone task
- **Validation contract (TC-03):**
  - TC-01: `grep -r "className=\"flex\|className={.*flex" apps/reception/src/components/checkins/` returns zero matches
  - TC-02: typecheck + lint pass
  - TC-03: RTL tests pass
- **Execution plan:**
  - Red: Enumerate all flex violations in checkins/ via grep
  - Green: Replace all raw flex/grid patterns with DS primitives; set `align` explicitly
  - Refactor: Read all edited files; confirm no remaining patterns; verify DS import paths
- **Planning validation:**
  - Checks run: grep in checkins/ — ~53 instances identified
  - Unexpected findings: TASK-01 already handles keycardButton/KeycardDepositMenu.tsx — exclude from this task
  - Consumer tracing: N/A — no new outputs introduced; no function signatures or return types modified; checkins/ components are layout-only consumers of their own state
- **Scouts:** None: folder structure confirmed; excludes keycardButton/
- **Edge Cases & Hardening:**
  - `BookingRow.tsx` uses nested `flex` patterns; ensure inner `<Inline>` components don't inherit conflicting layout from outer DS primitives
  - Exclude `keycardButton/KeycardDepositMenu.tsx` — already handled by TASK-01
- **What would make this >=90%:**
  - Verify DS primitives handle nested flex patterns correctly (e.g. `flex items-center` inside a `<TableCell>`)
- **Rollout / rollback:**
  - Rollout: commit after TASK-02 lands; can deploy with other Wave 2 tasks
  - Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:**
  - Highest violation count of any screen group (~53); includes tooltip, notes modal, booking rows, status buttons

---

### TASK-04: Migrate inbox/ layout primitives (~46 violations)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — all files in `apps/reception/src/components/inbox/` migrated to DS layout primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/inbox/` (all .tsx files with flex/grid violations)
- **Depends on:** TASK-02
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 87% — 46 violations; inbox has active development (merge conflict risk noted in analysis)
  - Approach: 90% — same 1:1 DS primitive substitution
  - Impact: 85% — inbox is actively developed; coordinate timing with any in-flight inbox PRs
- **Acceptance:**
  - All files in `inbox/` have zero raw `className="flex ..."` layout patterns (grep confirms)
  - DS primitives used correctly with explicit `align`
  - Existing arbitrary bracket values (`max-h-[calc(100vh-12rem)]`, `max-h-[50vh]`) remain formally suppressed — not touched
  - `pnpm --filter reception typecheck` passes
  - `pnpm --filter reception lint` passes
  - Browser: inbox thread list, detail pane, filter bar, template picker all render correctly
  - **Expected user-observable behavior:** Inbox layout identical to pre-migration; thread list, detail pane, and filter bar show no gap or alignment regressions
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to `inbox/`; auto-fix Critical/Major findings before marking complete
- **Engineering Coverage:**
  - UI / visual: Required — inbox is a complex screen with multiple panels; browser spot-check required
  - UX / states: Required — thread selection, draft/reply states unaffected by layout migration
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — RTL tests pass; snapshot updates documented as intentional
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — commit as standalone task; check for merge conflicts with any concurrent inbox work
- **Validation contract (TC-04):**
  - TC-01: `grep -r "className=\"flex\|className={.*flex" apps/reception/src/components/inbox/` returns zero matches
  - TC-02: `eslint-disable-next-line` suppression comments at `ThreadList.tsx` line 197 (`max-h-[calc(100vh-12rem)]`) and `ThreadDetailPane.tsx` line 260 (`max-h-[50vh]`) remain present and untouched after migration → verified via code read
  - TC-03: typecheck + lint pass
- **Execution plan:**
  - Red: Enumerate all flex violations in inbox/ via grep; note that arbitrary bracket values are already suppressed — do not touch them
  - Green: Replace raw flex/grid patterns with DS primitives
  - Refactor: Read edited files; confirm DS imports; verify suppressed arbitrary values are untouched
- **Planning validation:**
  - Checks run: grep in inbox/ — ~46 instances; 2 arbitrary bracket suppressions confirmed intact
  - Unexpected findings: active development risk — coordinate with in-flight inbox PRs before merging
  - Consumer tracing: N/A — no new outputs introduced; no function signatures or return types modified; inbox components are layout-only consumers
- **Scouts:** None: inbox folder verified; arbitrary bracket values pre-existing and already suppressed
- **Edge Cases & Hardening:**
  - Do NOT touch `max-h-[calc(100vh-12rem)]` or `max-h-[50vh]` — these are already formally suppressed
  - If merge conflict occurs: resolve by keeping DS primitive substitutions and rebasing against current inbox work
- **What would make this >=90%:**
  - Verify no in-flight inbox PRs will conflict; if none, confidence rises to 90%
- **Rollout / rollback:**
  - Rollout: commit after TASK-02; merge only after checking for inbox PR conflicts
  - Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:**
  - Analysis risk: "merge conflict in inbox — active development" (Low likelihood, Medium impact); serialise after any in-flight inbox PRs merge

---

### TASK-05: Migrate till/ layout primitives (~40 violations)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — all files in `apps/reception/src/components/till/` migrated to DS layout primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/till/` (all .tsx files with flex/grid violations)
- **Depends on:** TASK-02
- **Blocks:** TASK-12
- **Confidence:** 85%
  - Implementation: 87% — 40 violations; mechanical substitution
  - Approach: 90% — same DS primitive substitution pattern
  - Impact: 85% — till includes payment and transaction forms; visual regression in financial UI is high-consequence but low-risk (layout only)
- **Acceptance:**
  - All files in `till/` have zero raw `className="flex ..."` layout patterns (grep confirms)
  - DS primitives used correctly
  - `pnpm --filter reception typecheck` passes
  - `pnpm --filter reception lint` passes
  - Browser: till screen, payment buttons, float/tender modals render correctly
  - **Expected user-observable behavior:** Till screen layout identical to pre-migration; payment buttons, float/tender modals show no gap or alignment regressions
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to `till/`; auto-fix Critical/Major findings before marking complete
- **Engineering Coverage:**
  - UI / visual: Required — till is a financial transaction screen; browser spot-check of payment buttons and modals required
  - UX / states: Required — tender/float modal forms unaffected by layout migration
  - Security / privacy: N/A — layout change only; no financial logic touched
  - Logging / observability / audit: N/A
  - Testing / validation: Required — RTL tests pass
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — standalone commit
- **Validation contract (TC-05):**
  - TC-01: `grep -r "className=\"flex\|className={.*flex" apps/reception/src/components/till/` returns zero matches
  - TC-02: typecheck + lint pass
- **Execution plan:**
  - Red: Enumerate flex violations in till/
  - Green: Replace with DS primitives
  - Refactor: Read edited files; confirm no regressions
- **Planning validation:**
  - Checks run: grep in till/ — ~40 instances
  - Unexpected findings: None
  - Consumer tracing: N/A — no new outputs introduced; no function signatures or return types modified; till components are layout-only consumers
- **Scouts:** None
- **Edge Cases & Hardening:**
  - Till modals may have complex nested flex structures; check that DS primitives don't collapse modal content
- **What would make this >=90%:** Read specific modal files to verify no multi-level flex nesting edge cases
- **Rollout / rollback:**
  - Rollout: commit after TASK-02
  - Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:** None

---

### TASK-06: Migrate bar/ layout primitives (~24 violations)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — all files in `apps/reception/src/components/bar/` migrated to DS layout primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/bar/` (all .tsx files with flex/grid violations)
- **Depends on:** TASK-02
- **Blocks:** TASK-12
- **Confidence:** 87%
  - Implementation: 90% — 24 violations; smaller than M tasks; mechanical substitution
  - Approach: 90% — same pattern
  - Impact: 87% — bar/POS screen; shade token system has its own complexity (pink shades) but layout change doesn't touch color tokens
- **Acceptance:**
  - Zero raw flex patterns in `bar/` (grep confirms)
  - DS primitives with explicit `align` where needed
  - typecheck + lint pass
  - Browser: bar/POS sales screen and ticket management render correctly
  - **Expected user-observable behavior:** Bar/POS layout identical to pre-migration; no visual regressions in sales items, ticket management, or shade-colored elements
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to `bar/`; auto-fix Critical/Major findings before marking complete
- **Engineering Coverage:**
  - UI / visual: Required — bar/POS has custom shade tokens; verify layout doesn't disrupt color rendering
  - UX / states: Required — POS item selection and ticket management unaffected
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — RTL tests pass
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required
- **Validation contract (TC-06):**
  - TC-01: `grep -r "className=\"flex\|className={.*flex" apps/reception/src/components/bar/` returns zero matches
  - TC-02: typecheck + lint pass
- **Execution plan:**
  - Red: Enumerate flex violations in bar/
  - Green: Replace with DS primitives
  - Refactor: Confirm no remaining patterns
- **Planning validation:** N/A (S effort)
- **Scouts:** None
- **Edge Cases & Hardening:** Shade token colors (pink shades) are applied via separate background classes — layout migration won't affect them
- **What would make this >=90%:** None required at this confidence level
- **Rollout / rollback:** Rollout: commit after TASK-02. Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:** Note: bar/ uses custom shade token colors (`pinkShades-*`) — layout migration must not touch color classes

---

### TASK-07: Migrate prepayments/ + inventory/ layout primitives (~25 violations)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — all files in `apps/reception/src/components/prepayments/` and `apps/reception/src/components/inventory/` migrated to DS layout primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/prepayments/`
  - `apps/reception/src/components/inventory/`
- **Depends on:** TASK-02
- **Blocks:** TASK-12
- **Confidence:** 87%
  - Implementation: 90% — 25 combined violations; small scope
  - Approach: 90% — standard substitution
  - Impact: 87% — moderate importance screens
- **Acceptance:**
  - Zero raw flex patterns in prepayments/ and inventory/ (grep confirms)
  - typecheck + lint pass
  - Browser: prepayments screen and inventory list render correctly
  - **Expected user-observable behavior:** Prepayments and inventory screens layout identical to pre-migration; no gap or alignment regressions
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to `prepayments/` and `inventory/`; auto-fix Critical/Major findings before marking complete
- **Engineering Coverage:**
  - UI / visual: Required — spot-check both screens
  - UX / states: Required — prepayment forms and inventory tables unaffected
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required
- **Validation contract (TC-07):**
  - TC-01: grep returns zero matches in both folders
  - TC-02: typecheck + lint pass
- **Execution plan:**
  - Red: Enumerate violations in both folders
  - Green: Replace with DS primitives
  - Refactor: Confirm no remaining patterns
- **Planning validation:** N/A (S effort)
- **Scouts:** None
- **Edge Cases & Hardening:** None expected for these screens
- **What would make this >=90%:** None required
- **Rollout / rollback:** Rollout: commit after TASK-02. Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:** prepayments: 15 violations; inventory: 10 violations

---

### TASK-08: Migrate loans/ + safe/ layout primitives (~18 violations)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — all files in `apps/reception/src/components/loans/` and `apps/reception/src/components/safe/` migrated to DS layout primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/loans/`
  - `apps/reception/src/components/safe/`
- **Depends on:** TASK-02
- **Blocks:** TASK-12
- **Confidence:** 87%
  - Implementation: 90% — 18 combined violations; small scope
  - Approach: 90% — standard substitution
  - Impact: 87%
- **Acceptance:**
  - Zero raw flex patterns in loans/ and safe/ (grep confirms)
  - typecheck + lint pass
  - Browser: loans and safe screens render correctly
  - **Expected user-observable behavior:** Loans and safe screens layout identical to pre-migration; no gap or alignment regressions in forms or tables
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to `loans/` and `safe/`; auto-fix Critical/Major findings before marking complete
- **Engineering Coverage:**
  - UI / visual: Required — spot-check both screens
  - UX / states: Required
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required
- **Validation contract (TC-08):**
  - TC-01: grep returns zero matches in both folders
  - TC-02: typecheck + lint pass
- **Execution plan:**
  - Red: Enumerate violations
  - Green: Replace with DS primitives
  - Refactor: Confirm clean
- **Planning validation:** N/A (S effort)
- **Scouts:** None
- **Edge Cases & Hardening:** None expected
- **What would make this >=90%:** None required
- **Rollout / rollback:** Rollout: commit after TASK-02. Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:** loans: 9 violations; safe: 9 violations

---

### TASK-09: Migrate man/ + userManagement/ layout primitives (~13 violations)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — all files in `apps/reception/src/components/man/` and `apps/reception/src/components/userManagement/` migrated to DS layout primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/man/`
  - `apps/reception/src/components/userManagement/`
- **Depends on:** TASK-02
- **Blocks:** TASK-12
- **Confidence:** 87%
  - Implementation: 90% — 13 combined violations
  - Approach: 90% — standard substitution
  - Impact: 87%
- **Acceptance:**
  - Zero raw flex patterns in man/ and userManagement/ (grep confirms)
  - typecheck + lint pass
  - Browser: documents/man screen and user management screen render correctly
  - **Expected user-observable behavior:** Man/documents and user management screens layout identical to pre-migration; no gap or alignment regressions
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to `man/` and `userManagement/`; auto-fix Critical/Major findings before marking complete
- **Engineering Coverage:**
  - UI / visual: Required — spot-check both screens
  - UX / states: Required
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required
- **Validation contract (TC-09):**
  - TC-01: grep returns zero matches in both folders
  - TC-02: typecheck + lint pass
- **Execution plan:**
  - Red: Enumerate violations
  - Green: Replace with DS primitives
  - Refactor: Confirm clean
- **Planning validation:** N/A (S effort)
- **Scouts:** None
- **Edge Cases & Hardening:** None expected
- **What would make this >=90%:** None required
- **Rollout / rollback:** Rollout: commit after TASK-02. Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:** man: 7 violations; userManagement: 6 violations

---

### TASK-10: Migrate appNav/ + eodChecklist/ + cash/ layout primitives (~10 violations)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — all files in `apps/reception/src/components/appNav/`, `apps/reception/src/components/eodChecklist/`, and `apps/reception/src/components/cash/` migrated to DS layout primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/appNav/`
  - `apps/reception/src/components/eodChecklist/`
  - `apps/reception/src/components/cash/`
- **Depends on:** TASK-02
- **Blocks:** TASK-12
- **Confidence:** 90%
  - Implementation: 92% — only 10 combined violations; smallest batch
  - Approach: 92% — standard substitution
  - Impact: 90% — appNav is shared navigation but low violation count
- **Acceptance:**
  - Zero raw flex patterns in all three folders (grep confirms)
  - typecheck + lint pass
  - Browser: navigation, EOD checklist, and cash screen render correctly
  - **Expected user-observable behavior:** AppNav appears correctly on all screens; EOD checklist and cash screen layout identical to pre-migration; no gap or alignment regressions
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to `appNav/`, `eodChecklist/`, and `cash/`; auto-fix Critical/Major findings before marking complete
- **Engineering Coverage:**
  - UI / visual: Required — appNav is visible on every screen; spot-check navigation rendering
  - UX / states: Required
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required
- **Validation contract (TC-10):**
  - TC-01: grep returns zero matches in all three folders
  - TC-02: typecheck + lint pass
- **Execution plan:**
  - Red: Enumerate violations in all three folders
  - Green: Replace with DS primitives
  - Refactor: Confirm clean
- **Planning validation:** N/A (S effort)
- **Scouts:** None
- **Edge Cases & Hardening:** appNav affects every screen — visual spot-check is higher priority here even with few violations
- **What would make this >=90%:** Already at 90%
- **Rollout / rollback:** Rollout: commit after TASK-02. Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:** appNav: 5 violations; eodChecklist: 4; cash: 1

---

### TASK-11: Migrate roomgrid/ layout primitives (~6 violations, excl. _BookingTooltip)
- **Type:** IMPLEMENT
- **Deliverable:** code-change — all files in `apps/reception/src/components/roomgrid/` except `_BookingTooltip.tsx` migrated to DS layout primitives
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/reception/src/components/roomgrid/` (all .tsx files with flex/grid violations, excluding `_BookingTooltip.tsx`)
- **Depends on:** TASK-02
- **Blocks:** TASK-12
- **Confidence:** 90%
  - Implementation: 92% — only 6 violations; TASK-01 already handles the inline-style file in this folder
  - Approach: 92% — standard substitution
  - Impact: 90% — room grid is high-visibility (main rooms view)
- **Acceptance:**
  - Zero raw flex patterns in `roomgrid/` except in `_BookingTooltip.tsx` which was handled by TASK-01 (grep excluding that file confirms)
  - typecheck + lint pass
  - Browser: room grid layout renders correctly
  - **Expected user-observable behavior:** Room grid layout identical to pre-migration; room hover, booking status indicators, and cell spacing show no regressions
  - **Post-build QA:** Run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` scoped to `roomgrid/` (excluding `_BookingTooltip.tsx`); auto-fix Critical/Major findings before marking complete
- **Engineering Coverage:**
  - UI / visual: Required — room grid is central to reception app; verify grid/flex layout renders correctly
  - UX / states: Required — room hover, booking status display unaffected
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required
- **Validation contract (TC-11):**
  - TC-01: grep excluding `_BookingTooltip.tsx` returns zero matches in `roomgrid/`
  - TC-02: typecheck + lint pass
- **Execution plan:**
  - Red: Enumerate violations excluding _BookingTooltip.tsx
  - Green: Replace with DS primitives
  - Refactor: Confirm clean; do NOT touch _BookingTooltip.tsx (handled by TASK-01)
- **Planning validation:** N/A (S effort)
- **Scouts:** None
- **Edge Cases & Hardening:** Explicitly exclude `_BookingTooltip.tsx` — TASK-01 owns that file
- **What would make this >=90%:** Already at 90%
- **Rollout / rollback:** Rollout: commit after TASK-02. Rollback: `git revert <commit>`
- **Documentation impact:** None
- **Notes / references:** 6 violations in roomgrid/ (excluding _BookingTooltip.tsx)

---

### TASK-12: Enable ds/enforce-layout-primitives as ESLint error gate
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `"ds/enforce-layout-primitives"` changed from `"off"` to `"error"` in `.eslintrc.cjs`; `pnpm --filter reception lint` passes with zero errors
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `.eslintrc.cjs` (root monorepo ESLint config)
  - `[readonly] apps/reception/src/` (all production components — verify no violations remain)
- **Depends on:** TASK-01, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% — single line change in `.eslintrc.cjs`; all migrations must be complete first
  - Approach: 92% — confirmed rule exists in config at `"off"`; change to `"error"` is unambiguous
  - Impact: 90% — permanently prevents regression; any future raw flex patterns fail CI
- **Acceptance:**
  - `.eslintrc.cjs` line for `ds/enforce-layout-primitives` reads `"error"` (not `"off"`)
  - `pnpm --filter reception lint` exits zero (no errors)
  - If lint reveals any remaining violations (missed in prior tasks): fix them before marking complete
- **Engineering Coverage:**
  - UI / visual: N/A — ESLint config change only; no UI change
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — `pnpm --filter reception lint` must pass with zero errors; this is the primary acceptance criterion
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — if any violations are found after rule activation, either fix them in this task or revert to `"warn"` temporarily and raise a new task
- **Validation contract (TC-12):**
  - TC-01: `.eslintrc.cjs` contains `"ds/enforce-layout-primitives": "error"`
  - TC-02: `pnpm --filter reception lint` exits 0 with no errors
  - TC-03: If any violations surface, fix them before marking complete
- **Execution plan:**
  - Red: Read current `.eslintrc.cjs` value for `ds/enforce-layout-primitives` — confirm `"off"`
  - Green: Change `"off"` to `"error"`; run `pnpm --filter reception lint`; if zero errors, done
  - Refactor: If lint finds remaining violations, fix them (they represent missed instances from prior tasks); re-run lint until clean
- **Planning validation:** N/A (S effort)
- **Scouts:** None: `.eslintrc.cjs` line 57 confirmed `"ds/enforce-layout-primitives": "off"` via grep
- **Edge Cases & Hardening:**
  - If lint finds violations after TASK-01 through TASK-11 are complete, fix them inline in this task — do not raise a new task for trivial missed instances
  - If violation count is large (>10 missed instances), pause and investigate whether a prior task was incomplete before continuing
- **What would make this >=90%:** Already at 90% — rule location confirmed; approach is unambiguous
- **Rollout / rollback:**
  - Rollout: commit after all migration tasks complete; this is the final task
  - Rollback: change `"error"` back to `"off"` if critical regression — but only as emergency measure; follow up with targeted fix
- **Documentation impact:** None
- **Notes / references:**
  - `.eslintrc.cjs` line 57: `"ds/enforce-layout-primitives": "off"` → change to `"error"`
  - If `"error"` is too aggressive initially, consider `"warn"` as an intermediate step — but the goal is `"error"` for CI gate

---

## Risks & Mitigations
- DS `<Inline>` align default differs from `items-center`: Low risk — analysis mandates explicit `align="center"` on every replacement; do not rely on defaults
- common/ changes break multiple screens: Medium likelihood — mitigated by TASK-02 being a prerequisite wave; spot-check required before Wave 2 starts
- Merge conflict in inbox: Low likelihood — coordinate TASK-04 timing with any in-flight inbox PRs; serialise after those merge
- Visual regression in complex flex layouts: Low likelihood — mitigated by browser spot-check per task and existing RTL test suite as structural guard
- `<Inline className="flex-col">` antipattern: Medium likelihood — use `<Stack>` for column layouts; never use `<Inline>` with flex-col className override

## Observability
- Logging: None: layout-only change; no new logging
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] Zero inline `style={{` overrides in production files (except JS-computed `top`/`left` in 2 tooltip/menu files)
- [ ] Zero raw `className="flex ..."` layout patterns across all 15 component folders (grep confirms)
- [ ] `ds/enforce-layout-primitives` set to `"error"` in `.eslintrc.cjs`
- [ ] `pnpm --filter reception lint` passes with zero errors
- [ ] `pnpm --filter reception typecheck` passes
- [ ] All existing RTL tests pass (snapshot updates documented as intentional where they occur)
- [ ] Browser spot-check: all 12 task-affected screen areas render correctly in light and dark mode

## Decision Log
- 2026-03-13: ESLint rule `ds/enforce-layout-primitives` confirmed `"off"` in root `.eslintrc.cjs` (not "warn" as analysis assumed possible) — no migration blocker; final task simply changes `"off"` to `"error"`. No impact on task sequencing.
- 2026-03-13: Analysis settled Option A (genuine migration) over Option B (suppress). Planning does not reopen this choice.
- 2026-03-13 (pre-build): DS `<Inline>` prop verified as `alignY` (not `align`), default `alignY="center"`, default `gap={2}`, default `wrap={true}`. `<Cluster>` has `justify` prop for justify-between patterns. Gap values are numbers. Plan constraints and TASK-02 execution plan corrected before Wave 1 dispatch.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix inline styles (_BookingTooltip, KeycardDepositMenu) | Yes — both files read; current inline style structure confirmed; parent `relative` confirmed | None | No |
| TASK-02: common/ migration | Yes — common/ folder confirmed to exist with ~20 files; DS primitive imports available at `@acme/design-system/primitives` | None | No |
| TASK-03: checkins/ migration | Yes — TASK-02 prerequisite; checkins/ folder confirmed; excludes keycardButton/KeycardDepositMenu.tsx | None | No |
| TASK-04: inbox/ migration | Yes — TASK-02 prerequisite; arbitrary bracket values pre-existing and pre-suppressed; merge conflict risk noted but non-blocking | Minor: inbox merge conflict risk | No — documented in Risks; timing guidance in task notes |
| TASK-05: till/ migration | Yes — TASK-02 prerequisite; till/ folder confirmed | None | No |
| TASK-06: bar/ migration | Yes — TASK-02 prerequisite; shade tokens are separate from layout classes | None | No |
| TASK-07: prepayments/ + inventory/ | Yes — TASK-02 prerequisite; both folders confirmed | None | No |
| TASK-08: loans/ + safe/ | Yes — TASK-02 prerequisite; both folders confirmed | None | No |
| TASK-09: man/ + userManagement/ | Yes — TASK-02 prerequisite; both folders confirmed | None | No |
| TASK-10: appNav/ + eodChecklist/ + cash/ | Yes — TASK-02 prerequisite; all three folders confirmed | None | No |
| TASK-11: roomgrid/ (excl. _BookingTooltip) | Yes — TASK-02 prerequisite; TASK-01 handles _BookingTooltip.tsx; 6 remaining violations in other files | None | No |
| TASK-12: ESLint error-gate | Yes — all TASK-01 through TASK-11 must be complete; `.eslintrc.cjs` line confirmed; rule confirmed `"off"` | None | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- Tasks: TASK-01(90%,S), TASK-02(85%,M), TASK-03(85%,M), TASK-04(85%,M), TASK-05(85%,M), TASK-06(87%,S), TASK-07(87%,S), TASK-08(87%,S), TASK-09(87%,S), TASK-10(90%,S), TASK-11(90%,S), TASK-12(90%,S)
- Sum(confidence * effort): 90×1 + 85×2 + 85×2 + 85×2 + 85×2 + 87×1 + 87×1 + 87×1 + 87×1 + 90×1 + 90×1 + 90×1 = 90 + 170 + 170 + 170 + 170 + 87 + 87 + 87 + 87 + 90 + 90 + 90 = 1388
- Sum(effort): 1+2+2+2+2+1+1+1+1+1+1+1 = 16
- Overall-confidence = 1388 / 16 = **87%**
