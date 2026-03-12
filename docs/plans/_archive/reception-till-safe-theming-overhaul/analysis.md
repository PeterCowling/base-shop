---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-till-safe-theming-overhaul
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system, lp-design-qa
Related-Fact-Find: docs/plans/reception-till-safe-theming-overhaul/fact-find.md
Related-Plan: docs/plans/reception-till-safe-theming-overhaul/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Till, Safe & Cash Management Theming Overhaul Analysis

## Decision Frame

### Summary

9 theming issues across 7 till/safe/common component files need correction. The decision is the implementation strategy: batch all fixes in a single pass vs. split by component area. Both approaches use the same target tokens — only execution ordering differs. This is structurally identical to the bar/POS theming overhaul which was successfully completed using Option A (single-pass batch).

### Goals

- Fix 7 High-severity wrong-foreground issues (CountInputModal, FloatEntryModal, CloseShiftForm x2, DrawerLimitWarning, DifferenceBadge x2)
- Fix 2 Low-severity no-op hover states (CopyBookingRefPill, CopyOccupantIdPill)

### Non-goals

- Redesigning till/safe layout or component structure
- Adding new tokens to the design system
- Changing till/safe business logic

### Constraints & Assumptions

- Constraints:
  - All changes must use existing semantic tokens — no new token definitions
  - Purely className adjustments — no component API changes
  - Preserve intentional opacity on frosted elements (ShiftSummary `bg-surface/80`)
  - Use `danger-fg` (not `error-fg`) — reception config has no `error-fg` token
- Assumptions:
  - Single commit is acceptable for className-only changes

## Inherited Outcome Contract

- **Why:** The till and safe screens are used by staff every day for cash management. Wrong text colours on warning and error buttons make them harder to read, and broken focus ring syntax means keyboard users can't see focus indicators on close buttons. Fixing this means every button and badge is legible and accessible.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All till, safe, and cash management components use correct semantic foreground tokens on status-coloured backgrounds, with valid focus ring syntax and distinct interaction states.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-till-safe-theming-overhaul/fact-find.md`
- Key findings used:
  - Token resolution verified: `danger-fg` (L45), `success-fg` (L46), `warning-fg` (L47) in reception tailwind.config.mjs
  - `error-fg` does NOT exist in reception — must use `danger-fg` for error/danger foregrounds
  - CloseShiftForm has `STEP_STYLES` constant (L46-56) that can be extended with `closeBtnFg`
  - DifferenceBadge defaults affect all consumers (no overrides found)
  - ShiftSummary `bg-surface/80` is intentional (documented in component comments)

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Risk of visual regression | Till/safe are used daily by staff — broken styles disrupt cash operations | High |
| Review effort | className-only changes are easy to review | Medium |
| Completion speed | Staff benefit from fixes sooner | Medium |
| Rollback simplicity | Must be easy to revert if unexpected | Low |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Single-pass batch | Fix all 9 issues in one commit across all 7 files | Fastest delivery; single atomic commit; one review cycle; proven pattern from bar/POS | Larger diff (7 files) | If one fix is wrong, whole commit needs revert or patch | Yes |
| B: Component-area split | Three commits: till modals, CloseShiftForm+DrawerLimitWarning, DifferenceBadge+CopyPills | Smaller per-commit diffs | Three review cycles; more git overhead | Intermediate states have mixed old/new theming | Yes |
| C: File-by-file | One commit per affected file | Maximum granularity for revert | 7 separate commits; excessive overhead | Over-engineering for the scope | No — eliminated |

## Engineering Coverage Comparison

| Coverage Area | Option A (single-pass) | Option B (component-area split) | Chosen implication |
|---|---|---|---|
| UI / visual | All 9 fixes in one pass — complete visual consistency after one commit | Three incremental passes | Option A: immediate full consistency |
| UX / states | Focus ring and hover fixes land atomically | Focus ring fixes in commit 1, hover in commit 3 | Option A: all interaction fixes land together |
| Security / privacy | N/A | N/A | — |
| Logging / observability / audit | N/A | N/A | — |
| Testing / validation | One contrast sweep verifies all fixes | Three sweeps needed | Option A: one verification pass |
| Data / contracts | N/A | N/A | — |
| Performance / reliability | N/A | N/A | — |
| Rollout / rollback | Single commit revert | Granular revert per area | Option B slightly better, but low-risk className changes make this moot |

## Chosen Approach

- **Recommendation:** Option A — single-pass batch
- **Why this wins:** All 9 issues are className string replacements with known target values (one requires adding a property to an existing constant). The risk of any individual fix being wrong is very low (tokens are verified). A single atomic commit delivers full visual consistency immediately and requires only one verification pass. This is the same approach that succeeded for the bar/POS overhaul.
- **What it depends on:** Each fix must be verified against the token resolution chain. Intentional opacity on frosted elements must be preserved. DifferenceBadge test may need updating if it asserts on default className values.

### Rejected Approaches

- **Option B (component-area split):** Unnecessary overhead. Three commits and three verification passes for changes that are all low-risk className replacements. The only benefit (granular revert) is not meaningful when every fix has a verified target token.
- **Option C (file-by-file):** Over-engineering. 7 commits for className changes is excessive.

### Open Questions (Operator Input Required)

None — all design decisions are resolved by the existing token system.

## Planning Handoff

- Planning focus:
  - Single IMPLEMENT task covering all 9 fixes across 7 files
  - Each fix has a specific old → new className mapping from the fact-find
  - CloseShiftForm requires adding `closeBtnFg` property to existing `STEP_STYLES` constant
- Validation implications:
  - Visual contrast sweep after commit (both light and dark mode)
  - Typecheck and lint must pass
  - DifferenceBadge unit test should be checked for default className assertions
- Sequencing constraints:
  - None — all fixes are independent; no ordering dependency between files
- Risks to carry into planning:
  - DifferenceBadge test may assert old default classNames — check during build

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| DifferenceBadge test asserts old default classNames | Low | Low | Requires reading test file during build | Verify test before committing |
| CloseShiftForm STEP_STYLES extension introduces typo | Very Low | Low | Typecheck will catch | Object is small and contained |

## Planning Readiness

- Status: Go
- Rationale: All 9 issues have verified target tokens, no open questions, single-pass approach is proven (bar/POS precedent), risk is low (className replacements + one constant extension).
