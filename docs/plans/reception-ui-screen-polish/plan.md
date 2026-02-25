---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-ui-screen-polish
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: frontend-design
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average (S=1,M=2,L=3)
Auto-Build-Intent: plan+auto
---

# Reception App — Screen-by-Screen UI Polish Plan

## Summary

Extends the visual design language established on the login and bar screens (gradient backdrops, elevated card surfaces, semantic token discipline, `rounded-2xl/xl/lg` radius cascade) to all remaining reception app screens across three phases. Phase 1 targets the highest visual debt: RoomsGrid (disconnected from the token system), TillReconciliation (invisible mode banners), and SafeManagement (key financial data buried in plain text). Phase 2 unifies the heading system and polishes the dashboard/management screens. Phase 3 applies minor remaining polish. Two shared components — `ReceptionSkeleton` and `StatPanel` — are created within their first-use tasks and then reused across later screens.

## Active tasks
- [ ] TASK-00: PageShell — add gradient backdrop as default
- [ ] TASK-01: INVESTIGATE — RoomsGrid CSS module full scope
- [ ] TASK-02: RoomsGrid — token migration and card container
- [ ] TASK-03: INVESTIGATE — TillReconciliation children (ActionButtons, FormsContainer)
- [ ] TASK-04: TillReconciliation — mode banners and shift state polish
- [ ] TASK-05: SafeManagement — balance panel, button grouping, denomination polish
- [ ] TASK-06: CHECKPOINT — Phase 1 verification and downstream replan
- [ ] TASK-07: PrepareDashboard — heading fix and PageShell migration
- [ ] TASK-08: RealTimeDashboard — heading fix and chart card polish
- [ ] TASK-09: CheckinsTable — gradient backdrop, toolbar container, skeleton
- [ ] TASK-10: CHECKPOINT — Phase 2 verification and downstream replan
- [ ] TASK-11: Checkout — sticky header blur and loading skeleton
- [ ] TASK-12: EndOfDayPacket — gradient backdrop and surface polish

## Goals
- Extend gradient backdrop + card elevation pattern to all Phase 1–3 screens
- Eliminate the two incompatible heading conventions (`text-5xl text-center` vs `text-2xl` accent-bar)
- Connect RoomsGrid's hardcoded CSS hex color system to the design token system
- Improve visual prominence of key operational data (safe balance, shift mode state)
- Establish `ReceptionSkeleton` and `StatPanel` as reusable shared components
- Ensure all touched screens have zero raw color values and consistent `rounded-lg` on controls

## Non-goals
- AppNav changes (already polished)
- Phase 4 screens (16 unread screens — deferred; operator priority input required after Phase 3)
- Backend / data changes
- New features or new screens
- DS component migrations beyond what is directly needed for visual quality

## Constraints & Assumptions
- Constraints:
  - Dark-mode-only — no light mode CSS
  - All colors via semantic token classes — zero raw hex/rgb/`gray-300` values
  - Snapshot tests will break for every touched screen — `jest --updateSnapshot` expected after each screen task
  - RoomsGrid changes must stay within the CSS module system or be a deliberate, scoped migration
  - Touch targets: `py-3` minimum on interactive buttons (44px for tablet POS use)
- Assumptions:
  - PageShell gradient (defaulted on) is appropriate for all dark POS screens using PageShell; an escape hatch prop `withoutGradient` covers edge cases
  - Per-screen work is UI-independent; component trees don't share visual state across routes
  - The `frontend-design` skill is the execution mechanism for each screen-polish task
  - `packages/themes/reception/tokens.css` provides `surface`, `surface-2`, `surface-3` token definitions (confirmed by login/bar usage)

## Inherited Outcome Contract

- **Why:** Daily-use operational tool; staff interact with the reception app for every hostel operation. Visual clarity and consistency reduce cognitive load and operational error rates. Login and bar improvements proved the pattern.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All Phase 1 screens (RoomsGrid, TillReconciliation, SafeManagement) polished to match the login/bar visual standard; shared heading system unified; loading skeleton and stat-display patterns established. Phase 2 and Phase 3 screens executed in subsequent build cycles.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-ui-screen-polish/fact-find.md`
- Key findings used:
  - Design pattern reference (Login.tsx, Bar.tsx): gradient backdrop, `shadow-lg/xl`, `ring-1 ring-border-1/50`, `rounded-2xl/xl/lg` cascade, 3-tier button hierarchy
  - RoomsGrid uses `--color-confirmed: #006490` and other hardcoded hex values in CSS module — entirely outside the Tailwind token system
  - PrepareDashboard and RealTimeDashboard use `text-5xl font-heading text-primary-main text-center` — incompatible with the PageShell `text-2xl` accent-bar convention
  - PageShell is only 15 lines; adding gradient default is minimal blast radius
  - SafeManagement is a 9-form monolith; visual changes must be scoped to avoid handler entanglement
  - TillReconciliation child components (`ActionButtons`, `FormsContainer`) not yet read — scope uncertainty handled via TASK-03

## Proposed Approach

- Option A: Per-screen polish in a fixed sequence (single-threaded)
- Option B: Shared infrastructure first, then parallel per-screen tasks where dependencies allow
- **Chosen approach:** Option B. PageShell gradient is the shared prerequisite for Till, Safe, and Checkout (Wave 1). RoomsGrid and Till investigate tasks are also in Wave 1 so that Wave 2 implementation tasks can run in parallel. Two CHECKPOINTs gate the phases and allow replanning from evidence gathered during execution.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (TASK-00 at 90%, TASK-01 and TASK-03 at 90%)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-00 | IMPLEMENT | PageShell — gradient backdrop as default | 90% | S | Complete (2026-02-26) | - | TASK-04, TASK-05 |
| TASK-01 | INVESTIGATE | RoomsGrid CSS module full scope | 90% | S | Complete (2026-02-26) | - | TASK-02 |
| TASK-02 | IMPLEMENT | RoomsGrid — token migration and card container | 85% | S | Pending | TASK-01 | TASK-06 |
| TASK-03 | INVESTIGATE | TillReconciliation children scope | 90% | S | Complete (2026-02-26) | - | TASK-04 |
| TASK-04 | IMPLEMENT | TillReconciliation — mode banners and state polish | 85% | S | Pending | TASK-00, TASK-03 | TASK-06 |
| TASK-05 | IMPLEMENT | SafeManagement — balance panel, button grouping | 75% | M | Pending | TASK-00 | TASK-06 |
| TASK-06 | CHECKPOINT | Phase 1 verification and downstream replan | 95% | S | Pending | TASK-02, TASK-04, TASK-05 | TASK-07, TASK-08, TASK-09 |
| TASK-07 | IMPLEMENT | PrepareDashboard — heading fix and PageShell migration | 75% | M | Pending | TASK-06 | TASK-10 |
| TASK-08 | IMPLEMENT | RealTimeDashboard — heading fix and chart card polish | 75% | S | Pending | TASK-06 | TASK-10 |
| TASK-09 | IMPLEMENT | CheckinsTable — gradient backdrop, toolbar, skeleton | 75% | M | Pending | TASK-06 | TASK-10 |
| TASK-10 | CHECKPOINT | Phase 2 verification and downstream replan | 95% | S | Pending | TASK-07, TASK-08, TASK-09 | TASK-11, TASK-12 |
| TASK-11 | IMPLEMENT | Checkout — sticky header blur and loading skeleton | 80% | S | Pending | TASK-10 | - |
| TASK-12 | IMPLEMENT | EndOfDayPacket — gradient backdrop and surface polish | 70% | S | Pending | TASK-10 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-00, TASK-01, TASK-03 | None | All independent; run in parallel |
| 2a | TASK-05 | TASK-00 | Can start as soon as TASK-00 completes (no dependency on TASK-01 or TASK-03) |
| 2b | TASK-02 | TASK-01 | Starts after TASK-01 completes |
| 2c | TASK-04 | TASK-00, TASK-03 | Starts after both TASK-00 and TASK-03 complete |
| 3 | TASK-06 | TASK-02, TASK-04, TASK-05 | CHECKPOINT — blocks Phase 2; runs lp-do-replan on TASK-07/08/09 |
| 4 | TASK-07, TASK-08, TASK-09 | TASK-06 | All parallel; independent screens |
| 5 | TASK-10 | TASK-07, TASK-08, TASK-09 | CHECKPOINT — blocks Phase 3; runs lp-do-replan on TASK-11/12 |
| 6 | TASK-11, TASK-12 | TASK-10 | Both parallel; independent screens |

## Tasks

---

### TASK-00: PageShell — Add gradient backdrop as default
- **Type:** IMPLEMENT
- **Deliverable:** Modified `PageShell.tsx` with gradient backdrop defaulted on; `withoutGradient?: boolean` escape hatch prop
- **Execution-Skill:** lp-do-build / frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - `surface-3` token confirmed in `packages/themes/reception/tokens.css`
  - `withoutGradient?: boolean` prop added; `bgClass` conditional applied to outer `div`
  - TC-00-01: snapshot `till-route.parity.test.tsx.snap` line 6 confirms `class="bg-gradient-to-b from-surface-2 to-surface-3 min-h-80vh p-4 font-sans text-foreground"`
  - TC-00-02: code-review confirmed (conditional `bgClass = withoutGradient ? "bg-surface" : ...`); TypeScript validates — not exercised in existing snapshot (flagged: degraded mode limitation)
  - TC-00-03: `pnpm typecheck --filter @apps/reception` — 55 tasks successful ✓
  - TC-00-04: `pnpm lint --filter @apps/reception` — 19 tasks successful ✓
  - Post-build validation: Mode 1 Degraded (no dev server) — snapshot confirms gradient outer wrapper; `withoutGradient` path confirmed by code review. Degraded mode limitation noted.
  - Snapshot files updated: checkin-route, checkout-route, safe-route, till-route (4 files; login-route already had gradient from prior polish work)
- **Affects:** `apps/reception/src/components/common/PageShell.tsx`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05 (screens using PageShell that need gradient; TASK-02 is independent)
- **Confidence:** 90%
  - Implementation: 90% — PageShell is 15 lines; gradient class is established from login/bar; prop addition is trivial
  - Approach: 90% — `bg-gradient-to-b from-surface-2 to-surface-3` on outer wrapper is proven; escape hatch covers edge cases
  - Impact: 90% — immediately applies gradient to all 3 screens currently using PageShell (TillReconciliation, SafeManagement, Checkout) without requiring any change in their call sites
- **Acceptance:**
  - PageShell outer `div` has `bg-gradient-to-b from-surface-2 to-surface-3` by default
  - Passing `withoutGradient` removes the gradient (flat `bg-surface` fallback)
  - Snapshot test for a PageShell-using screen is regenerated and passes
  - TypeScript compiles clean; no lint errors
- **Validation contract (TC-00):**
  - TC-00-01: Render PageShell without props → outer wrapper has gradient classes visible in snapshot
  - TC-00-02: Render PageShell with `withoutGradient` → outer wrapper has no gradient, uses flat background
  - TC-00-03: `pnpm typecheck --filter reception` passes
  - TC-00-04: `pnpm lint --filter reception` passes
- **Execution plan:** Red → Green → Refactor
  - **Red:** Add `withoutGradient?: boolean` to PageShell props type; update snapshot test to expect gradient — observe snapshot failure
  - **Green:** Apply `bg-gradient-to-b from-surface-2 to-surface-3` to outer div (conditional on `!withoutGradient`); run `jest --updateSnapshot` for affected tests
  - **Refactor:** Confirm gradient class string matches the established bar pattern exactly; confirm prop name is clear
- **Planning validation:** `None: S-effort; PageShell is 15 lines; no M/L validation required`
- **Consumer tracing:**
  - New prop `withoutGradient?: boolean` added — optional, so all existing consumers are backward-compatible with no changes
  - Gradient applied by default — existing consumers (TillReconciliation, SafeManagement, Checkout) get gradient immediately without code changes in their call sites. This is the intended effect.
  - If any P4 screen using PageShell needs no gradient, it passes `withoutGradient` explicitly
- **Scouts:** Verify `surface-3` is defined in `packages/themes/reception/tokens.css` before adding the class (run `grep "surface-3" packages/themes/reception/tokens.css`)
- **Edge Cases & Hardening:**
  - If `surface-3` token is undefined, fall back to `from-surface-2 to-surface-2` (no visible gradient but no broken styling)
  - Gradient should not affect content layout — confirm `min-h-80vh p-4` outer structure is unchanged
- **What would make this >=90%:** Already at 90%; no remaining unknowns
- **Rollout / rollback:**
  - Rollout: Immediate — internal staff tool, no staged release needed
  - Rollback: Revert PageShell.tsx to remove gradient default; 1-line change
- **Documentation impact:** None — no public API or docs affected

---

### TASK-01: INVESTIGATE — RoomsGrid CSS module full scope
- **Type:** INVESTIGATE
- **Deliverable:** Written scope summary in `docs/plans/reception-ui-screen-polish/task-01-roomsgrid-css-scope.md` — full list of hardcoded values, token mapping candidates, and effort estimate for TASK-02
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - Artifact created: `docs/plans/reception-ui-screen-polish/task-01-roomsgrid-css-scope.md`
  - Key finding: 0 hardcoded hex/rgb values in active production code — all 7 hex values from fact-find are in a commented-out dead code block in `RoomsGrid.tsx` (lines 20–56)
  - `statusColors.ts` already maps every status to CSS custom property references; `rvg.css` uses `--rvg-*` semantic tokens throughout
  - `_reservationGrid.css` is orphaned (not imported anywhere) — can be deleted
  - Token mapping table complete: all 7 dead-code values mapped to existing tokens
  - TASK-02 scope revised: effort S (not M) — delete dead code + add card container; no token migration work needed
  - Downstream confidence uplift: TASK-02 raised from 75% to 85% (E2 evidence)
- **Affects:** `[readonly] apps/reception/src/components/roomgrid/` (all files)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — reading files; no unknowns
  - Approach: 90% — list all CSS custom property definitions, map to theme tokens or flag as unmappable
  - Impact: 90% — directly de-risks TASK-02 scope estimate
- **Questions to answer:**
  - What is the full name of the CSS module file (`RoomsGrid.module.css`? `_reservationGrid.css`? inline styles?)?
  - How many distinct hardcoded hex/rgb values exist across all files in `components/roomgrid/`?
  - Which values map to existing theme tokens (e.g., `#006490` → is there a `--color-info-main` or similar?)?
  - Are hardcoded values in CSS custom properties only, or also in inline `style` props in TSX?
  - What is the complete list of CSS custom properties used by the grid (for color, border, background)?
- **Acceptance:**
  - Task-01 artifact created with: full file list read, all hardcoded values enumerated, token mapping table (value → candidate token), inline-style vs CSS-module split identified, effort estimate for TASK-02 (S/M/L)
- **Validation contract:** Artifact exists at output path; token mapping table is complete (no "TBD" entries)
- **Planning validation:** `None: INVESTIGATE task; reads only`
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Creates `task-01-roomsgrid-css-scope.md` in plan directory

---

### TASK-02: RoomsGrid — Token migration and card container
- **Type:** IMPLEMENT
- **Deliverable:** RoomsGrid component and CSS module updated to use theme tokens; card container with shadow added around the grid
- **Execution-Skill:** lp-do-build / frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/roomgrid/RoomsGrid.tsx`, `apps/reception/src/components/roomgrid/*.module.css` (or equivalent CSS file)
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 85% _(raised from 75% by TASK-01 affirming findings — E2 evidence)_
  - Implementation: 90% — TASK-01 confirmed 0 hardcoded values in active production code; work is delete dead code block + add card container wrapper. All token mapping already complete.
  - Approach: 85% — card container pattern (`bg-surface rounded-xl shadow-lg`) proven from login/bar; main remaining uncertainty is confirming `_reservationGrid.css` can be deleted safely (orphaned per TASK-01)
  - Impact: 85% — RoomsGrid is the most visually discordant screen; connecting it to the token system is high-value (confirmed by TASK-01 findings)
- **Acceptance:**
  - All hardcoded hex/rgb values in RoomsGrid files replaced with theme token references (run `grep -riE "#[0-9a-f]{3,6}|rgb\(" apps/reception/src/components/roomgrid/` — should return empty)
  - Grid wrapped in a card container: `bg-surface rounded-xl shadow-lg` outer panel with gradient page background
  - Visual colors of room status states (confirmed, awaiting, etc.) are unchanged or demonstrably improved
  - TypeScript compiles; RoomsGrid capabilities test suite passes (`pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=roomgrid`)
- **Validation contract (TC-02):**
  - TC-02-01: `grep -riE "#[0-9a-f]{3,6}|rgb\(" apps/reception/src/components/roomgrid/` returns empty
  - TC-02-02: RoomsGrid capabilities test suite passes (data contract unchanged)
  - TC-02-03: Grid renders with visible card container and shadow in dev (manual visual check)
  - TC-02-04: `pnpm typecheck --filter reception` clean
- **Planning validation:**
  - Checks run: read TASK-01 scope artifact before starting
  - Unexpected findings: scope may be larger if inline styles found (risk documented in fact-find)
- **Scouts:** Read TASK-01 artifact first; if TASK-01 identifies >20 hardcoded values or inline-style TSX changes, escalate effort estimate from M to L before starting
- **Edge Cases & Hardening:**
  - Some grid colors (room status: confirmed, awaiting, occupied) may not have exact token equivalents — use the closest semantic token (e.g., `--color-info-main`, `--color-success-main`, `--color-warning-main`) and document any intentional deviations
  - CSS module `@import` paths do NOT resolve through Turbopack resolveAlias — use relative paths for any CSS imports
- **What would make this >=90%:** TASK-01 finds only CSS custom property definitions (no inline TSX styles) and all values map cleanly to existing tokens
- **Rollout / rollback:**
  - Rollout: Self-contained; only RoomsGrid files affected
  - Rollback: Revert RoomsGrid.tsx and CSS module file(s)
- **Documentation impact:** None

---

### TASK-03: INVESTIGATE — TillReconciliation children scope
- **Type:** INVESTIGATE
- **Deliverable:** Written scope summary in `docs/plans/reception-ui-screen-polish/task-03-till-children-scope.md` — ActionButtons layout, FormsContainer structure, mode banner location, and effort estimate for TASK-04
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - Artifact created: `docs/plans/reception-ui-screen-polish/task-03-till-children-scope.md`
  - Mode banners confirmed in `TillReconciliation.tsx:62–71` (2 isolated inline `<div>` blocks — not inside any child)
  - ActionButtons uses Radix DropdownMenu pattern: 3 trigger buttons, 9 menu items, 1 direct Update button = 13 total (below 15 escalation threshold)
  - FormsContainer: pure routing layer, renders one form at a time via boolean props, no layout of its own
  - All components well-decomposed; no monoliths
  - Effort for TASK-04 confirmed S (not M) — banners are 2 adjacent JSX blocks in one file
  - Downstream confidence uplift: TASK-04 raised from 75% to 85% (E2 evidence)
- **Affects:** `[readonly] apps/reception/src/components/till/ActionButtons.tsx`, `[readonly] apps/reception/src/components/till/FormsContainer.tsx`, `[readonly] apps/reception/src/components/till/TillShiftHistory.tsx`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — reading 3 files; no unknowns
  - Approach: 90% — document current visual structure of each child component
  - Impact: 90% — directly de-risks TASK-04 scope and approach
- **Questions to answer:**
  - Where exactly are the edit/delete mode banners rendered — in `TillReconciliation.tsx` or inside a child?
  - What does `ActionButtons.tsx` render — a flat row of `Button` components? Grouped? What Tailwind classes?
  - Does `FormsContainer.tsx` show one form at a time or all simultaneously? How is the active form selected?
  - Are any child components themselves monoliths, or are they well-decomposed?
  - Is there any visual state indication for the active shift phase (open / operating / close) beyond the mode banners?
- **Acceptance:**
  - Artifact at output path with: file listing for all 3 components, visual structure described, mode banner location confirmed, button count and grouping described, effort estimate for TASK-04 (S/M/L)
- **Validation contract:** Artifact exists; questions answered with evidence (file path:line citations)
- **Planning validation:** `None: INVESTIGATE task; reads only`
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Creates `task-03-till-children-scope.md` in plan directory

---

### TASK-04: TillReconciliation — Mode banners and shift state polish
- **Type:** IMPLEMENT
- **Deliverable:** TillReconciliation screen with visible mode banners (visual containers, icons), polished ActionButtons layout, and clear shift phase state indication
- **Execution-Skill:** lp-do-build / frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/till/TillReconciliation.tsx` (ActionButtons.tsx not needed — banners are in parent)
- **Depends on:** TASK-00, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85% _(raised from 75% by TASK-03 affirming findings — E2 evidence)_
  - Implementation: 90% — TASK-03 confirmed banners are 2 isolated inline JSX blocks in `TillReconciliation.tsx:62–71`; no child component changes needed
  - Approach: 85% — banner styling (`bg-info-light/20 rounded-lg p-3 flex items-center gap-2` + Lucide icon) fully determined; ActionButtons uses dropdowns (no grouping restructure needed, which simplifies the task)
  - Impact: 85% — till management is the most complex daily-use screen; invisible mode banners are a known daily friction point
- **Acceptance:**
  - Edit mode and delete mode banners have a visible background container (`bg-info-light/20` or `bg-warning-light/20`) with a Lucide icon and `rounded-lg` border
  - ActionButtons layout groups related operations visually (primary shift ops / secondary / destructive)
  - PageShell gradient visible on page background (from TASK-00)
  - Snapshot tests regenerated and passing
  - TypeScript compiles; lint clean
- **Validation contract (TC-04):**
  - TC-04-01: Edit mode active → banner has visible background color (not just text); icon present
  - TC-04-02: Delete mode active → banner has visible background color distinct from edit mode
  - TC-04-03: Till shift can be opened, operated, and closed without visual regression (manual workflow check)
  - TC-04-04: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=till` passes after snapshot update
- **Planning validation:**
  - Read TASK-03 scope artifact before starting; adjust Affects list if additional files identified
- **Scouts:** Read TASK-03 artifact; if ActionButtons has >15 buttons in a flat layout, also add button grouping separators or section labels as part of this task. If >30 buttons, escalate effort to L.
- **Edge Cases & Hardening:**
  - Mode banners must remain accessible at all viewport widths (the till is used on tablet)
  - Shift phase state (open / close) visual distinction must not conflict with the mode (edit/delete) banners — they should be visually layered: page-level state vs interaction-mode overlay
- **What would make this >=90%:** TASK-03 reveals mode banners are in a single well-isolated component; ActionButtons is a simple flat list with semantic button types already grouped
- **Rollout / rollback:**
  - Rollout: Per-screen, internal tool
  - Rollback: Revert till component files
- **Documentation impact:** None

---

### TASK-05: SafeManagement — Balance panel, button grouping, denomination polish
- **Type:** IMPLEMENT
- **Deliverable:** SafeManagement screen with prominent balance/keycard display (`StatPanel` shared component created here), grouped action buttons, and structured denomination breakdown
- **Execution-Skill:** lp-do-build / frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/safe/SafeManagement.tsx`, `apps/reception/src/components/common/StatPanel.tsx` (new)
- **Depends on:** TASK-00
- **Blocks:** TASK-06
- **Confidence:** 75%
  - Implementation: 75% — monolith risk: 9 inline forms; visual wrapper addition may interact with handler logic. Pre-execution probe (in Scouts) is mandatory.
  - Approach: 75% — StatPanel component design is clear; button grouping via `flex-col gap-2` dividers is clear; denomination display restructure from `Cluster` of spans to a proper grid is clear. Uncertainty is whether JSX nesting allows adding a `StatPanel` wrapper without touching handler logic.
  - Impact: 85% — balance data is the primary operational readout on SafeManagement; zero visual prominence today
- **Acceptance:**
  - `StatPanel` component created at `apps/reception/src/components/common/StatPanel.tsx` with: `bg-surface-2 rounded-lg p-4 flex items-center gap-4` layout, label + value display, optional icon slot
  - Safe Balance and Keycards displayed using `StatPanel` with high visual prominence (large value text, semantic color)
  - Action buttons grouped into: primary operations (Deposit, Withdrawal, Exchange) / till operations (Bank Deposit, Petty Cash) / management (Reconcile, Reset, Open) — with visual dividers between groups
  - Denomination breakdown displayed as a structured grid (not a flat `Cluster` of spans)
  - `rounded` replaced with `rounded-lg` throughout SafeManagement
  - PageShell gradient visible on page background (from TASK-00)
  - Snapshot tests regenerated; TypeScript clean; lint clean
- **Validation contract (TC-05):**
  - TC-05-01: Safe Balance and Keycards values visible in `StatPanel` containers with distinct visual weight
  - TC-05-02: Action buttons have visual grouping with separators — primary / till / management clusters distinguishable
  - TC-05-03: `StatPanel` component renders correctly in isolation (unit test or snapshot)
  - TC-05-04: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=safe` passes after snapshot update
  - TC-05-05: `rounded-lg` used on all buttons and inputs (no plain `rounded` remaining): `grep "className=.*rounded[^-]" apps/reception/src/components/safe/SafeManagement.tsx` returns empty
- **Planning validation:**
  - Probe required: read all inline JSX blocks in SafeManagement.tsx (the 9 form conditionals) before writing any code; confirm balance display and button grouping can be added without extracting handlers
- **Consumer tracing (new output — StatPanel):**
  - `StatPanel` is created in this task; first consumer is SafeManagement
  - Downstream consumers: TASK-09 (CheckinsTable — for Rooms Ready state display), TASK-11 (Checkout — if applicable)
  - `StatPanel` is a pure presentational component with no state; safe for any consumer
- **Scouts:** Before starting — read the top 100 lines of SafeManagement.tsx and identify where the balance `<p>` tags are relative to the form conditionals. If they are inside a conditional block (not at the top level), restructuring is more complex; raise to L effort and note in plan.
- **Edge Cases & Hardening:**
  - `StatPanel` must not render with empty values — add fallback: `value ?? '—'`
  - Button grouping visual dividers must be `bg-border` or `border-border` — no raw color values
  - If handler entanglement is found during probe: scope TASK-05 to balance panel + `rounded-lg` fix only; raise a separate INVESTIGATE for button restructuring
- **What would make this >=90%:** Probe confirms balance display is at JSX top level (not inside a conditional); handler logic is fully self-contained in event handlers with no JSX entanglement
- **Rollout / rollback:**
  - Rollout: Per-screen, internal tool
  - Rollback: Revert SafeManagement.tsx; delete StatPanel.tsx
- **Documentation impact:** None

---

### TASK-06: CHECKPOINT — Phase 1 verification and downstream replan
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via `/lp-do-replan` with recalibrated confidence for TASK-07–09 based on Phase 1 evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/reception-ui-screen-polish/plan.md`
- **Depends on:** TASK-02, TASK-04, TASK-05
- **Blocks:** TASK-07, TASK-08, TASK-09
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep execution into Phase 2 with stale assumptions
  - Impact: 95% — controls downstream risk; Phase 2 screen complexity is not fully characterized
- **Horizon assumptions to validate:**
  - Was RoomsGrid CSS module scope as expected, or did TASK-01/02 reveal additional complexity?
  - Did SafeManagement handler entanglement materialize (did TASK-05 scope expand)?
  - Did TillReconciliation children reveal unexpected complexity (did TASK-04 scope expand)?
  - Are the Phase 2 screens (PrepareDashboard, RealTimeDashboard, CheckinsTable) as straightforward as the fact-find suggests?
  - Did TASK-00 PageShell gradient reveal any visual regressions on existing PageShell consumers?
- **Acceptance:**
  - `/lp-do-replan` invoked on TASK-07, TASK-08, TASK-09 with Phase 1 execution artifacts as evidence
  - Confidence scores for downstream tasks updated from Phase 1 learnings
  - Any scope changes from Phase 1 execution reflected in TASK-07–09 planning validation sections
- **Validation contract:** `/lp-do-replan` run and plan.md updated with revised confidence for Phase 2 tasks
- **Planning validation:** None: checkpoint task
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** `docs/plans/reception-ui-screen-polish/plan.md` updated by `/lp-do-replan`

---

### TASK-07: PrepareDashboard — Heading fix and PageShell migration
- **Type:** IMPLEMENT
- **Deliverable:** PrepareDashboard migrated to PageShell with accent-bar heading convention; gradient backdrop; DS component adoption where straightforward
- **Execution-Skill:** lp-do-build / frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/prepare/PrepareDashboard.tsx`
- **Depends on:** TASK-06
- **Blocks:** TASK-10
- **Confidence:** 75%
  - Implementation: 75% — PrepareDashboard has 4 separate render paths (loading, error, no-data, success) each with full layout repeated; migrating all 4 to PageShell could be non-trivial if paths diverge significantly
  - Approach: 75% — heading replacement (`text-5xl text-center text-primary-main` → PageShell accent-bar `text-2xl`) is mechanical; the repeated layout pattern is the main risk
  - Impact: 80% — PrepareDashboard is used daily for housekeeping prep; heading size mismatch with other screens is jarring
- **Acceptance:**
  - `text-5xl text-primary-main text-center` heading replaced with PageShell accent-bar pattern (`text-2xl font-heading font-semibold text-foreground` with `h-7 w-1 rounded-full bg-primary-main` pill) across all render paths
  - All 4 render paths (loading, error, no-data, success) use consistent layout via PageShell or equivalent unified wrapper
  - Gradient backdrop visible via PageShell (from TASK-00)
  - No DS component regressions; existing CleaningPriorityTable and DateSelector still render correctly
  - TypeScript clean; lint clean; snapshot regenerated
- **Validation contract (TC-07):**
  - TC-07-01: `grep "text-5xl" apps/reception/src/components/prepare/PrepareDashboard.tsx` returns empty
  - TC-07-02: All 4 render paths (loading/error/no-data/success) show the same heading style (manual visual check or snapshot comparison)
  - TC-07-03: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=prepare` passes after snapshot update
- **Planning validation:**
  - Read PrepareDashboard.tsx fully before starting; count render paths and confirm heading appears in each
- **Scouts:** If PrepareDashboard has >150 lines with all 4 render paths fully inlined (not extracted), extract a shared `PreparePage` layout component first (still S sub-task) before migrating heading
- **Edge Cases & Hardening:**
  - The 4 render paths must all show the same gradient background — confirm `PageShell` wraps all paths, not just the success path
  - `min-h-screen flex flex-col` outer layout should be preserved if `CleaningPriorityTable` uses `flex-grow` to fill remaining height
- **What would make this >=90%:** Phase 1 confirms PrepareDashboard render paths are easy to consolidate; full read before starting shows a clean single-level JSX structure
- **Rollout / rollback:**
  - Rollout: Per-screen
  - Rollback: Revert PrepareDashboard.tsx
- **Documentation impact:** None

---

### TASK-08: RealTimeDashboard — Heading fix and chart card polish
- **Type:** IMPLEMENT
- **Deliverable:** RealTimeDashboard with corrected heading convention, upgraded chart card shadows, and gradient page backdrop
- **Execution-Skill:** lp-do-build / frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/reports/RealTimeDashboard.tsx`
- **Depends on:** TASK-06
- **Blocks:** TASK-10
- **Confidence:** 75%
  - Implementation: 85% — file is fully read; changes are localized (heading, chart card shadows, page bg)
  - Approach: 85% — class changes are mechanical and well-understood
  - Impact: 75% — admin-only read-only dashboard; visual improvement is real (heading mismatch elimination, cohesion with other screens) but lower operational urgency than P1 interactive screens
- **Acceptance:**
  - `text-5xl text-primary-main text-center` heading replaced with accent-bar `text-2xl` pattern (inline or via PageShell migration)
  - Chart card `shadow` upgraded to `shadow-lg` on all three chart panels
  - Page outer wrapper has gradient backdrop (`bg-gradient-to-b from-surface-2 to-surface-3`)
  - No chart data or behavior changes; Chart.js renders correctly
  - TypeScript clean; lint clean
- **Validation contract (TC-08):**
  - TC-08-01: `grep "text-5xl" apps/reception/src/components/reports/RealTimeDashboard.tsx` returns empty
  - TC-08-02: `grep "rounded shadow p-4" apps/reception/src/components/reports/RealTimeDashboard.tsx` returns empty (upgraded to `shadow-lg`)
  - TC-08-03: `pnpm typecheck --filter reception` clean
- **Planning validation:** `None: S-effort; file fully read; no M/L validation required`
- **Scouts:** None — file is fully read from fact-find investigation
- **Edge Cases & Hardening:**
  - Chart.js color tokens (`hsl(var(--chart-1))` etc.) must remain unchanged — CSS variable usage is correct; no changes needed there
  - The 60-second auto-refresh must still function — confirm no changes to the `setInterval` or data logic
- **What would make this >=90%:** Raise impact score to 80%+ — only possible if management team confirms they use this screen multiple times daily for operational decisions
- **Rollout / rollback:**
  - Rollout: Per-screen
  - Rollback: Revert RealTimeDashboard.tsx
- **Documentation impact:** None

---

### TASK-09: CheckinsTable — Gradient backdrop, toolbar container, loading skeleton
- **Type:** IMPLEMENT
- **Deliverable:** CheckinsTable with gradient page backdrop, styled toolbar container, consistent `rounded-lg`, and `ReceptionSkeleton` shared component (created here)
- **Execution-Skill:** lp-do-build / frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/checkins/CheckinsTable.tsx`, `apps/reception/src/components/checkins/view/CheckinsTable.tsx`, `apps/reception/src/components/checkins/header/CheckinsHeader.tsx` (likely), `apps/reception/src/components/common/ReceptionSkeleton.tsx` (new)
- **Depends on:** TASK-06
- **Blocks:** TASK-10
- **Confidence:** 75%
  - Implementation: 75% — CheckinsHeader (toolbar) component not fully read from fact-find; its internal structure affects how we can add the toolbar container wrapper
  - Approach: 75% — gradient backdrop and `rounded-lg` sweep are clear; toolbar container requires reading CheckinsHeader first; ReceptionSkeleton design is clear (DS-based or simple Tailwind divs)
  - Impact: 85% — check-in is a daily high-use screen; the unstyled toolbar is the most visible gap after login/bar work
- **Acceptance:**
  - Page outer wrapper has gradient backdrop (`bg-gradient-to-b from-surface-2 to-surface-3`)
  - Toolbar area (CheckinsHeader or its container) has a visual container: `bg-surface/80 rounded-xl px-4 py-3 mb-4` or similar — clearly separated from the table card
  - `ReceptionSkeleton` created at `apps/reception/src/components/common/ReceptionSkeleton.tsx` — renders animated skeleton rows as loading state
  - "Loading..." italic text replaced with `ReceptionSkeleton` in CheckinsTable
  - `rounded` on Rooms Ready button replaced with `rounded-lg`
  - Snapshot tests regenerated; TypeScript clean; lint clean
- **Validation contract (TC-09):**
  - TC-09-01: `grep "rounded[^-]" apps/reception/src/components/checkins/` returns empty (all replaced with `rounded-lg` or `rounded-xl`)
  - TC-09-02: Loading state renders `ReceptionSkeleton` (snapshot confirms skeleton rows visible in loading state)
  - TC-09-03: Toolbar area has a visible container background in snapshot
  - TC-09-04: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=checkin` passes after snapshot update
- **Planning validation:**
  - Read CheckinsHeader.tsx before starting; confirm toolbar can be wrapped without breaking existing layout
- **Consumer tracing (new output — ReceptionSkeleton):**
  - `ReceptionSkeleton` created here; downstream consumer is TASK-11 (Checkout) and any Phase 4 screens that adopt it
  - `ReceptionSkeleton` is a pure presentational component with no state or data dependencies; safe for any consumer
- **Scouts:** Read `apps/reception/src/components/checkins/header/CheckinsHeader.tsx` before starting; identify what the toolbar renders and how it is positioned relative to the table card
- **Edge Cases & Hardening:**
  - `ReceptionSkeleton` must handle variable row counts; accept a `rows?: number` prop (default 5)
  - The toolbar container must not break the existing `flex items-center justify-between` layout inside CheckinsHeader
  - Mode indicator (edit/delete/add-guest mode) — if it exists as a visual element in CheckinsTable, ensure it gets the same visual container treatment as TillReconciliation mode banners
- **What would make this >=90%:** Read of CheckinsHeader confirms it is a simple, easily-wrappable component; ReceptionSkeleton can use DS `Skeleton` atoms if they exist
- **Rollout / rollback:**
  - Rollout: Per-screen
  - Rollback: Revert checkins components; delete ReceptionSkeleton.tsx
- **Documentation impact:** None

---

### TASK-10: CHECKPOINT — Phase 2 verification and downstream replan
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via `/lp-do-replan` with recalibrated confidence for TASK-11–12
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/reception-ui-screen-polish/plan.md`
- **Depends on:** TASK-07, TASK-08, TASK-09
- **Blocks:** TASK-11, TASK-12
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — short Phase 2; checkpoint confirms pattern consistency
  - Impact: 95% — ensures Phase 3 tasks are calibrated from Phase 2 learnings
- **Horizon assumptions to validate:**
  - Did PrepareDashboard 4-render-path migration require a new layout component?
  - Did CheckinsHeader wrap cleanly, or did it need restructuring?
  - Is `ReceptionSkeleton` reusable as-is for Checkout, or does it need a variant?
  - Does EndOfDayPacket benefit from the same treatment, or is it already adequate for a print-focused report?
- **Acceptance:**
  - `/lp-do-replan` run on TASK-11 and TASK-12
  - Confidence for TASK-11 and TASK-12 updated from Phase 2 execution evidence
  - TASK-12 scope confirmed or revised based on Phase 2 learning (gradient appropriate for print report?)
- **Validation contract:** `/lp-do-replan` run; plan.md updated
- **Planning validation:** None: checkpoint task
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** `docs/plans/reception-ui-screen-polish/plan.md` updated

---

### TASK-11: Checkout — Sticky header blur and loading skeleton
- **Type:** IMPLEMENT
- **Deliverable:** Checkout screen with backdrop-blur on sticky header, `ReceptionSkeleton` loading state, and complete-button hover semantics review
- **Execution-Skill:** lp-do-build / frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/checkout/Checkout.tsx`, `apps/reception/src/components/checkout/CheckoutTable.tsx`
- **Depends on:** TASK-10
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — Checkout is the most thoroughly read screen; changes are targeted and small
  - Approach: 85% — `backdrop-blur-sm bg-surface-2/80` on sticky header; `ReceptionSkeleton` replacement for loading text; complete-button review is advisory
  - Impact: 80% — Checkout is already the strongest screen; improvements are minor; 80% reflects real but limited uplift. Held-back test: "What would drop impact below 80?" — if complete-button hover change (green→red) causes user confusion. Risk: the hover change is a UX question, not a visual quality fix. Impact holds at 80% because the sticky header blur is the primary improvement.
- **Acceptance:**
  - Sticky table header has `backdrop-blur-sm bg-surface-2/80` (or similar) to visually separate from scrolled content
  - Loading state replaced with `ReceptionSkeleton` (imported from common/ReceptionSkeleton)
  - Complete-button hover pattern reviewed: if operator confirms the green→red hover is intentional (reversible action affordance), leave as-is and document decision; otherwise adjust to a safer pattern
  - Snapshot tests regenerated; TypeScript clean
- **Validation contract (TC-11):**
  - TC-11-01: Sticky header has `backdrop-blur` class visible in snapshot
  - TC-11-02: Loading state renders `ReceptionSkeleton` rows (not italic text)
  - TC-11-03: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=checkout` passes after snapshot update
- **Planning validation:** `None: S-effort; file fully read`
- **Scouts:** None — Checkout is the most fully characterized screen in the fact-find
- **Edge Cases & Hardening:**
  - `backdrop-blur-sm` requires browser support — confirmed supported in all modern browsers; hostel POS tablets are Chrome/Safari. No fallback needed.
  - `ReceptionSkeleton` must match the column count of the checkout table (variable width columns); use `ReceptionSkeleton rows={5}` or similar
- **What would make this >=90%:** TASK-10 checkpoint confirms `ReceptionSkeleton` has been validated in CheckinsTable and works correctly; no additional unknowns
- **Rollout / rollback:**
  - Rollout: Per-screen
  - Rollback: Revert checkout components
- **Documentation impact:** None

---

### TASK-12: EndOfDayPacket — Gradient backdrop and surface polish
- **Type:** IMPLEMENT
- **Deliverable:** EndOfDayPacket with gradient page backdrop and consistent surface elevation
- **Execution-Skill:** lp-do-build / frontend-design
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/reports/EndOfDayPacket.tsx`
- **Depends on:** TASK-10
- **Blocks:** -
- **Confidence:** 70%
  - Implementation: 80% — file is read; changes are small; gradient backdrop addition is simple
  - Approach: 75% — gradient is appropriate for screen view; however, print-only context means gradient must be suppressed in `@media print` — this is a non-trivial CSS concern
  - Impact: 70% — print-focused report; visual improvement is real but low operational impact; primary use is printing, where gradient doesn't help. Impact caps at 70%.
- **Note:** TASK-12 confidence of 70% is below the 80% IMPLEMENT build-eligible threshold. This task will not auto-execute. If TASK-10 CHECKPOINT determines gradient is inappropriate for print reports, scope TASK-12 to shadow upgrade only and mark as Needs-Input pending CHECKPOINT output. Otherwise, explicitly select this task for execution after CHECKPOINT confirmation.
- **Acceptance:**
  - Gradient backdrop added to screen container
  - `@media print { background: white; }` added to suppress gradient in print output
  - `shadow` upgraded to `shadow-lg` on the inner report surface card
  - TypeScript clean; lint clean
- **Validation contract (TC-12):**
  - TC-12-01: Screen renders with gradient backdrop (visual check or snapshot)
  - TC-12-02: Print preview shows white background (no gradient in print)
  - TC-12-03: `pnpm typecheck --filter reception` clean
- **Planning validation:** `None: S-effort; file read`
- **Scouts:** Before starting — confirm whether TASK-10 checkpoint determines gradient-on-print-report is appropriate. If CHECKPOINT recommends skipping gradient for print reports, convert TASK-12 to surface-card shadow upgrade only.
- **Edge Cases & Hardening:**
  - Print suppression: `@media print { background-color: white !important; background-image: none !important; }`
  - The report has `window.print()` action — gradient must not affect print quality
- **What would make this >=90%:** TASK-10 confirms gradient is appropriate; print suppression CSS is simple and fully covers the risk
- **Rollout / rollback:**
  - Rollout: Per-screen
  - Rollback: Revert EndOfDayPacket.tsx
- **Documentation impact:** None

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RoomsGrid CSS module scope larger than visible (inline TSX styles found) | Medium | Medium | TASK-01 INVESTIGATE reveals scope before TASK-02 starts; TASK-02 effort escalated to L if >20 hardcoded values found |
| SafeManagement handler entanglement blocks visual changes | Medium | Medium | Mandatory probe in TASK-05 Scouts; scope limited to visual layer only; separate INVESTIGATE raised if entanglement found |
| StatPanel created in TASK-05 has no confirmed downstream consumers in Phase 2–3 | Medium | Low | At TASK-10 CHECKPOINT, assess whether TASK-09 and TASK-11 actually adopted StatPanel; if unused, delete before Phase 4 to avoid dead shared component |
| TillReconciliation children reveal unexpected complexity (>30 buttons, complex FormsContainer) | Medium | Low | TASK-03 INVESTIGATE reveals scope; TASK-04 effort escalated to L if ActionButtons is very large |
| PageShell gradient default reveals regressions on existing consumers (Till, Safe, Checkout) | Low | Medium | Manual visual check after TASK-00; all 3 consumers are investigated screens with known layout — risk is low |
| Phase 4 scope (16 unread screens) could equal or exceed Phase 1–3 effort | Medium | Medium | Before starting Phase 4, run a quick read of all 16 screen root components to establish complexity brackets; defer "complex" screens to a separate planning cycle |
| Snapshot cascade — every screen touch requires regeneration, increasing commit size | High (certain) | Low | Expected; `jest --updateSnapshot` is standard step after each screen task |
| `@media print` gradient suppression missing from EndOfDayPacket (TASK-12) | Low | Medium | TASK-12 explicitly includes print suppression CSS in acceptance criteria |
| `rounded` vs `rounded-lg` sweep creates merge conflicts in multi-task execution | Low | Low | Each screen task handles its own `rounded` → `rounded-lg` sweep; no cross-screen file sharing |

## Observability
- Logging: None — UI polish only, no runtime logging changes
- Metrics: None — internal staff tool, no analytics tracking of UI quality
- Alerts/Dashboards: Manual visual QA per screen (gradient visible, card elevated, mode states have containers, balance data prominent, `rounded-lg` consistent)

## Acceptance Criteria (overall)
- [ ] All Phase 1 screens (RoomsGrid, TillReconciliation, SafeManagement) visually match login/bar standard: gradient backdrop, elevated card, prominent operational data
- [ ] All Phase 2 screens (PrepareDashboard, RealTimeDashboard, CheckinsTable) use consistent `text-2xl` accent-bar heading convention; no `text-5xl` headings remain
- [ ] `ReceptionSkeleton` created and used in CheckinsTable and Checkout (replacing italic loading text)
- [ ] `StatPanel` created and used in SafeManagement
- [ ] Zero raw color values in any touched file (`grep -riE "#[0-9a-f]{3,}|rgb\(" apps/reception/src/` — scoped to changed files)
- [ ] All touched screens have `rounded-lg` on interactive controls (no plain `rounded`)
- [ ] All snapshot tests pass after regeneration
- [ ] TypeScript compiles clean; lint passes

## Decision Log
- 2026-02-25: Chosen approach = Option B (shared infrastructure first, then parallel per-screen). Rationale: PageShell gradient in Wave 1 immediately lifts 3 screens; investigate tasks in Wave 1 de-risk the most uncertain Phase 1 screens.
- 2026-02-25: PageShell gradient defaulted ON (not opt-in). Rationale: all dark POS screens benefit from gradient; escape hatch prop covers edge cases. Simpler than requiring explicit activation per-screen.
- 2026-02-25: TASK-12 EndOfDayPacket deliberately set to 70% confidence (below 80% build threshold). Rationale: print-only context makes gradient impact uncertain; TASK-10 CHECKPOINT will confirm scope before execution.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weights: TASK-00(1)+TASK-01(1)+TASK-02(2)+TASK-03(1)+TASK-04(2)+TASK-05(2)+TASK-06(1)+TASK-07(2)+TASK-08(1)+TASK-09(2)+TASK-10(1)+TASK-11(1)+TASK-12(1) = 18
- Weighted sum: (90×1)+(90×1)+(75×2)+(90×1)+(75×2)+(75×2)+(95×1)+(75×2)+(75×1)+(75×2)+(95×1)+(80×1)+(70×1) = 90+90+150+90+150+150+95+150+75+150+95+80+70 = 1435
- Overall-confidence: 1435/18 = 79.7% → **80%**
