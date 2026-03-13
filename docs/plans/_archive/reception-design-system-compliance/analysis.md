---
Type: Analysis
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-design-system-compliance
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-design-system-compliance/fact-find.md
Related-Plan: docs/plans/reception-design-system-compliance/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Design System Compliance Analysis

## Decision Frame

### Summary

The reception app has two classes of remaining DS compliance violations: (1) inline `style={{` props in 2 production files, and (2) ~266 raw `className="flex ..."` layout patterns across 15 component folders that should use DS layout primitives. The decision is: how to achieve compliance — by genuine migration to DS primitives, or by suppressing lint violations.

### Goals

- Eliminate all inline `style={{` props (except unavoidable JS-computed coordinates)
- Migrate raw flex/grid layout patterns to DS layout primitives
- Enable DS ESLint rule `ds/enforce-layout-primitives` to run as error-level without suppressions

### Non-goals

- New token definitions or color changes
- Visual redesign of any component
- Test file changes

### Constraints & Assumptions

- Constraints:
  - `_BookingTooltip` and `KeycardDepositMenu` use JS-computed cursor/click coordinates (`top`/`left`) — these must remain as inline styles; only `position` property can be migrated to a Tailwind class
  - Both files already have `z-50` in their className — the fact-find's "zIndex: 10000" concern does not apply; the zIndex is already handled via class
  - `KeycardDepositButton` wrapper (line 280) already has `className="relative"` — `absolute` class on the menu is safe
  - DS layout primitives use design-token-based gap values; Tailwind `gap-2` = `0.5rem`; DS `gap="2"` maps to the same token — confirmed equivalent
- Assumptions:
  - DS `<Inline>` `align` default is unknown at analysis time — always set `align` explicitly where `items-center` is present; do not rely on defaults
  - The 3 arbitrary bracket values (`max-h-[calc(100vh-12rem)]`, `max-h-[50vh]`, `ml-[100px]`) are already formally suppressed with justification comments; no action needed

## Inherited Outcome Contract

- **Why:** Inline styles and arbitrary layout classes make future theme changes, dark-mode maintenance, and design-system upgrades fragile. Centralising all layout through DS primitives and eliminating inline styles ensures that token changes propagate correctly throughout the app.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception app production components are free of inline `style={{` overrides; arbitrary Tailwind bracket values are either replaced with tokens or formally suppressed with justification; raw flex/grid layout class patterns are migrated to DS layout primitives.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-design-system-compliance/fact-find.md`
- Key findings used:
  - Inline style violations: exactly 2 files (`_BookingTooltip.tsx`, `KeycardDepositMenu.tsx`)
  - Both files already use `z-50` in className — no zIndex arbitrary-value issue
  - Both files use JS-computed `top`/`left` — must keep as inline style
  - `KeycardDepositButton` parent already has `relative` — absolute positioning will work correctly after migration
  - Raw flex violations: ~266 instances across 15 component folders
  - DS Button already fully adopted (zero raw `<button>` elements in production)
  - 3 arbitrary bracket values already formally suppressed with justification comments

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| True compliance vs suppression | Suppressions don't achieve the goal; they just hide violations | Critical |
| Visual equivalence after migration | Must not break layouts; risk of gap/align default mismatch | High |
| Execution parallelism | 266 instances across 15 folders; need to parallelise safely by screen group | High |
| Regression risk | Must not break existing component behavior or CI tests | High |
| Inline style safety | JS-computed positions must be preserved exactly | High |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Full DS primitive migration — replace all raw flex/grid classes with `<Inline>`, `<Stack>`, `<Cluster>`, `<Grid>`; fix 2 inline styles by moving `position` to Tailwind class | Genuine compliance; `ds/enforce-layout-primitives` becomes error-level permanently; layout semantics expressed through DS | High volume (266 instances); visual equivalence must be verified per component | Gap/align defaults differ from raw Tailwind in edge cases; layout regressions possible | Yes — **chosen** |
| B | Suppress all violations — add `// eslint-disable-next-line ds/enforce-layout-primitives` on each of the 266 instances | Low migration risk; no visual changes | Does not achieve compliance goal; suppressions are technical debt; future token changes still won't propagate through suppressed flex patterns | Suppression drift; opposite of stated goal | **No — rejected** |

## Engineering Coverage Comparison

| Coverage Area | Option A (migrate) | Option B (suppress) | Chosen implication |
|---|---|---|---|
| UI / visual | Migration risk: gap/align defaults must match; spot-check required per screen group | Zero visual risk (no changes) | Must verify DS primitive defaults produce identical layout before swapping; `align` must be set explicitly where `items-center` is used |
| UX / states | JS-computed `top`/`left` retained in inline style; `position` migrated to class — no UX regression | Zero UX risk | Plan execution must keep computed coordinates inline |
| Security / privacy | N/A — layout-only change | N/A | N/A |
| Logging / observability / audit | N/A | N/A | N/A |
| Testing / validation | Existing CI tests provide structural regression guard; snapshots updated intentionally per screen group | No test impact | CI test pass required per task group; snapshot drift is expected and intentional |
| Data / contracts | N/A | N/A | N/A |
| Performance / reliability | N/A — CSS class swaps negligible | N/A | N/A |
| Rollout / rollback | Single deploy or per-screen-group batches; rollback is git revert | Same | Deploy per screen group enables early detection of visual regressions; rollback to prior commit |

## Chosen Approach

- **Recommendation:** Option A — Full DS primitive migration, executed in parallel screen-group tasks.
- **Why this wins:** Option B doesn't meet the stated goal. Option A achieves genuine compliance, enables `ds/enforce-layout-primitives` to run as a CI error permanently (preventing regression), and makes the DS token system the single source of truth for all layout. The 266-instance volume is high but mechanical — there's a direct 1:1 mapping for every pattern (`flex items-center gap-2` → `<Inline align="center" gap="2">`), and the work is safe to parallelise by non-overlapping screen groups.
- **What it depends on:**
  - DS `<Inline>` default gap must be verified equal to `gap-2` (0.5rem) — confirmed via DS source
  - DS `<Inline>` `align` default must be explicitly set where `items-center` is present (do not rely on DS defaults — be explicit)
  - `position` migration for `_BookingTooltip` and `KeycardDepositMenu` must be verified working in both light and dark mode

### Rejected Approaches

- Option B (suppress) — Suppressing 266 lint violations doesn't achieve compliance; it buries technical debt. The suppressions would need to be revisited every time the DS token system changes. Rejected.

### Open Questions (Operator Input Required)

None. All design decisions are resolvable from evidence and DS contracts.

## End-State Operating Model

None: no material process topology change

## Planning Handoff

- Planning focus:
  - Task 1: Fix 2 inline style files (`_BookingTooltip`, `KeycardDepositMenu`) — highest priority, blocks theme system
  - Tasks 2–N: Migrate layout primitives by screen group (non-overlapping, parallelisable)
  - Final task: Enable `ds/enforce-layout-primitives` as error-level in ESLint config (or confirm it already is)
- Validation implications:
  - Each screen-group task must: (a) CI tests pass, (b) no snapshot regressions except intentional updates, (c) manually verify affected layouts in browser before shipping
  - Inline style fix task: verify tooltip and dropdown positioning in browser (light + dark mode)
  - `ds/enforce-layout-primitives` error gate: run `pnpm --filter reception lint` after all tasks — must be zero errors
- Sequencing constraints:
  - Inline style fix can be task 1 (independent)
  - Screen group migrations can run in parallel (non-overlapping file sets)
  - `common/` folder migration must complete before screen-specific tasks that consume shared components begin (or before their PRs merge)
  - Parallel screen-group tasks can start after `common/` lands; the ESLint error gate is last
  - ESLint error-gate timing: confirm whether `ds/enforce-layout-primitives` is currently warn or error level. If already error-level, PRs during migration will fail lint — either batch all screen-group tasks into one PR or temporarily demote to warn during migration, reverting to error after all tasks complete
- Risks to carry into planning:
  - DS `<Inline>` `align` prop must be set explicitly (`align="center"`) when replacing `items-center` — relying on defaults risks silent layout shift
  - `common/` components (26 violations) are shared by multiple screens — changes here have wider blast radius; treat as a standalone task
  - Merge conflict risk: inbox has recent active development — coordinate this migration with any in-flight inbox PRs

## Per-Screen-Group Breakdown for Planning

| Screen Group | Folder(s) | Flex violations | Parallelisable? |
|---|---|---|---|
| Inline styles fix | `checkins/keycardButton/`, `roomgrid/` | 2 files | First (independent) |
| Common components | `common/` | 26 | Standalone — **must complete before dependent screen group tasks begin** (shared components affect multiple screens) |
| Checkins/Rooms | `checkins/` (excl. keycardButton) | ~53 | Yes |
| Inbox | `inbox/` | 46 | Yes |
| Till | `till/` | 40 | Yes |
| Bar | `bar/` | 24 | Yes |
| Prepayments | `prepayments/` | 15 | Yes |
| Inventory | `inventory/` | 10 | Yes |
| Loans | `loans/` | 9 | Yes |
| Safe | `safe/` | 9 | Yes |
| Man (Documents) | `man/` | 7 | Yes |
| User Management | `userManagement/` | 6 | Yes |
| Room Grid | `roomgrid/` (excl. `_BookingTooltip`) | 6 | Yes |
| AppNav | `appNav/` | 5 | Yes |
| EOD Checklist | `eodChecklist/` | 4 | Yes |
| Cash | `cash/` | 1 | Yes |

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| DS `<Inline>` align default differs from `items-center` | Medium | Medium | Needs per-component inspection — too granular for analysis | Each task must set `align="center"` explicitly where `items-center` is present |
| `common/` components break multiple screens | Medium | High | Design decision — treat as standalone task | Plan as separate IMPLEMENT task before or concurrent with screen groups |
| Merge conflict in inbox | Low | Medium | Active development in inbox — timing unknown | Serialise inbox migration after any in-flight inbox PRs merge |
| Visual regression in complex flex layouts | Low | Medium | Cannot verify without browser rendering | Manual spot-check required per screen group task |
| `<Inline className="flex-col">` antipattern — developers use primitive with override class instead of `<Stack>` | Medium | Low | Not yet stated | Planning note: primitives must be used with supported props only, not with className overrides that override their layout semantics |

## Planning Readiness

- Status: Go
- Critique score: 4.5 / 5.0 (Round 2, 2026-03-13) — verdict: credible
- Rationale: Scope is clear, approach is unambiguous, all inline-style risks are resolved (zIndex concern eliminated — both files already use `z-50` in className; parent-relative verified for KeycardDepositMenu). Work is mechanical and parallel-safe. No operator input required.
