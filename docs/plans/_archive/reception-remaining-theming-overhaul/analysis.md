---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: "2026-03-12"
Last-updated: "2026-03-12"
Feature-Slug: reception-remaining-theming-overhaul
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system, lp-design-qa
Related-Fact-Find: docs/plans/reception-remaining-theming-overhaul/fact-find.md
Related-Plan: docs/plans/reception-remaining-theming-overhaul/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Remaining Theming Overhaul — Analysis

## Decision Frame

### Summary

Choose the execution approach for fixing ~36 verified theming issues across ~36 component files in the reception app's check-in, prepayment, reporting, search, checkout, EOD checklist, till, auth, inventory, preparation, email automation, and common areas. All fixes are className string replacements using existing semantic tokens. Two prior overhauls (bar/POS: 14 fixes, till/safe: 9 fixes) provide proven precedent.

### Goals

- Fix all wrong-foreground-on-coloured-background issues (High severity)
- Fix all double focus prefix issues (`focus-visible:focus:` → `focus-visible:`)
- Remove all redundant `/100` opacity modifiers
- Fix wrong token base in BookingPaymentsLists (`bg-danger-fg/10` → `bg-error-main/10`)
- Fix confusing hover state flip in CheckoutTable

### Non-goals

- Redesigning component layouts or structures
- Adding new tokens to the design system
- Changing business logic in any component
- Fixing issues in bar/POS (already done), till/safe (already done), or inbox (clean)

### Constraints & Assumptions

- Constraints:
  - All changes must use existing semantic tokens from `apps/reception/tailwind.config.mjs`
  - Purely className adjustments — no component API changes
  - `error-fg` does NOT exist in reception config — must use `danger-fg`
- Assumptions:
  - Token values are correct and stable
  - No downstream consumers override default className props in affected components

## Inherited Outcome Contract

- **Why:** Staff-facing screens (bookings, management, auth, modals) use wrong foreground tokens on coloured backgrounds, redundant opacity syntax, and broken focus ring selectors. This makes buttons and badges harder to read and keyboard focus invisible on daily-use interfaces.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All remaining reception components use correct semantic foreground tokens on status-coloured backgrounds, with valid focus ring syntax and no redundant opacity modifiers.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-remaining-theming-overhaul/fact-find.md`
- Key findings used:
  - 36 verified issues across 24 files with exact line numbers and current/target className strings
  - All target tokens confirmed in `apps/reception/tailwind.config.mjs` (danger-fg L45, success-fg L46, warning-fg L47)
  - 10+ existing test files found for affected components — may need className assertion updates
  - Identical pattern to two prior successful overhauls (commits `b955bf38c4` and `aea95ee6b0`)

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Execution speed | Staff use these screens daily; faster fix = faster improvement | High |
| Atomic rollback | Single revert should undo entire change | High |
| Review burden | More commits = more review overhead for predictable fixes | Medium |
| Risk containment | All fixes are independent className replacements — risk is uniform | Low |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Single-pass batch | Apply all 36 fixes in one task, one commit | Fastest delivery, atomic rollback, minimal review overhead, proven by two prior overhauls | Larger diff in one commit | Low — all fixes are independent className replacements | Yes |
| B: Area-grouped batches | Split into 3-4 tasks by component area (checkins, search, auth/common, etc.) | Smaller per-commit diffs | Slower delivery, more review cycles, more commits to manage, no safety benefit since fixes are independent | Very low — adds overhead without reducing risk | Yes but inferior |

## Engineering Coverage Comparison

| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | All 36 className fixes in one pass | Same fixes split across 3-4 commits | Option A: single verification pass |
| UX / states | Focus ring and hover fixes included in single pass | Same fixes split | Option A: all interaction fixes land together |
| Security / privacy | N/A: no auth, data, or input changes | N/A | N/A |
| Logging / observability / audit | N/A: no logic changes | N/A | N/A |
| Testing / validation | Check 10+ test files for className assertions once | Same checks split across tasks | Option A: one test verification pass |
| Data / contracts | N/A: className strings only | N/A | N/A |
| Performance / reliability | N/A: zero runtime cost | N/A | N/A |
| Rollout / rollback | Single commit, revert = `git revert <sha>` | Multiple commits, revert = multiple reverts | Option A: simpler rollback |

## Chosen Approach

- **Recommendation:** Option A — single-pass batch. Apply all 36 fixes in one task and one commit.
- **Why this wins:** All fixes are independent className string replacements with verified target tokens. This is the same approach that succeeded for both prior overhauls (bar/POS: 14 fixes, till/safe: 9 fixes). A single commit provides atomic rollback and minimizes review overhead. Splitting into multiple tasks adds coordination cost without reducing risk, since every fix is a self-contained className replacement.
- **What it depends on:** All target tokens verified in reception tailwind.config.mjs (confirmed). No test files assert old className values that would break (to be verified during build — 10+ test files identified).

### Rejected Approaches

- Option B (area-grouped batches) — rejected because splitting independent className replacements into multiple tasks and commits adds overhead without safety benefit. Each fix is self-contained; grouping them doesn't reduce blast radius. Prior precedent confirms single-pass works at this scale.

### Open Questions (Operator Input Required)

None — all questions resolved from codebase evidence.

## Planning Handoff

- Planning focus:
  - Single IMPLEMENT task covering all 36 className fixes
  - Fix mapping table with exact file paths, line numbers, old → new className strings
  - VarianceHeatMap requires adding foreground tokens to `getVarianceClass()` return values (not just replacement — addition)
  - CleaningPriorityTable requires conditional fg token based on color prop (red → `text-danger-fg`, green → `text-success-fg`)
  - OfflineIndicator has 3 instances of the same `bg-warning text-primary-fg` pattern
- Validation implications:
  - Typecheck + lint must pass
  - 10+ existing test files must be checked for className assertions that may need updating
  - No new tests required — changes are className-only
- Sequencing constraints:
  - No dependencies — single task, single wave
- Risks to carry into planning:
  - Existing test files may assert old className values (Low likelihood, Low impact — update assertions if found)
  - VarianceHeatMap `getVarianceClass()` returns are used in a template literal — ensure fg token is appended correctly

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Test files assert old className values | Low | Low | Cannot be fully verified without reading each test file | Build task must read all 10+ test files and update assertions if needed |
| VarianceHeatMap fg token addition changes return type | Very Low | Low | Return type is `string` — adding a class doesn't change the type | Build task should verify template literal usage |
| CheckoutTable hover change affects user muscle memory | Very Low | Low | Current behavior (success→error) is confusing; new behavior is more intuitive | No mitigation needed |

## Planning Readiness

- Status: Go
- Rationale: All 36 issues verified with exact file paths and line numbers. All target tokens confirmed. Approach proven by two prior overhauls. No open questions. No operator input needed.
