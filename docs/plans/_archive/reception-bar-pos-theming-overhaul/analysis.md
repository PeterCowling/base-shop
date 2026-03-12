---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-bar-pos-theming-overhaul
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system, lp-design-qa
Related-Fact-Find: docs/plans/reception-bar-pos-theming-overhaul/fact-find.md
Related-Plan: docs/plans/reception-bar-pos-theming-overhaul/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Bar/POS Theming Overhaul Analysis

## Decision Frame

### Summary

14 theming issues across 8 bar/POS files need correction. The decision is the implementation strategy: batch all fixes in a single pass vs. split by severity tier. Both approaches use the same target tokens — only execution ordering differs.

### Goals

- Fix 2 High-severity contrast issues (CompScreen status foregrounds)
- Clean 5 Medium-severity token/opacity issues (PaymentSection, SalesScreen, HeaderControls)
- Clean 7 Low-severity redundant opacity and interaction issues (OrderList, PayModal, Ticket, TicketItems)

### Non-goals

- Redesigning bar layout or component structure
- Changing product category shade colours
- Adding new tokens to the design system

### Constraints & Assumptions

- Constraints:
  - All changes must use existing semantic tokens — no new token definitions
  - Purely className adjustments — no component API changes
  - Preserve intentional opacity on backdrop-blur elements (bg-primary-main/95)
- Assumptions:
  - Single commit per approach is acceptable (no feature flag needed for className changes)

## Inherited Outcome Contract

- **Why:** The bar is the screen staff use most every day. Some button colours use redundant opacity syntax that obscures intent, and status indicators use the wrong text colour, making them hard to read. Fixing this means every button, status badge, and price tag looks correct and is easy to read.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All bar/POS components use valid semantic design tokens with correct foreground/background pairing and no redundant opacity values.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-bar-pos-theming-overhaul/fact-find.md`
- Key findings used:
  - Token resolution chain fully verified — all semantic colours are valid in the reception app
  - `danger` is a valid Tailwind utility (base config line 28); `/100` is valid but redundant
  - CompScreen L58/L112: `text-primary-fg` on success/error backgrounds — should use `text-success-fg` / `text-danger-fg`
  - PaymentSection L61: `bg-surface/60` should be `bg-input`; double `focus:` prefix
  - HeaderControls L33: `focus-visible:ring-white/70` — hardcoded white
  - SalesScreen L123: `bg-surface-3/50` — arbitrary opacity where `bg-surface-3` suffices
  - 5 instances of redundant `/100` across OrderList and PayModal

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Risk of visual regression | Bar is used daily by staff — broken styles disrupt operations | High |
| Review effort | className-only changes are easy to review but many files = larger diff | Medium |
| Completion speed | Staff benefit from fixes sooner | Medium |
| Rollback simplicity | Must be easy to revert if unexpected | Low |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Single-pass batch | Fix all 14 issues in one commit across all 8 files | Fastest delivery; single atomic commit; one review cycle | Larger diff (8 files touched simultaneously) | If one fix is wrong, the whole commit needs revert or patch | Yes |
| B: Severity-tiered | Three commits: High first (CompScreen), then Medium, then Low | Incremental delivery; High fixes land first; smaller per-commit diffs | Three review cycles; slightly more git overhead | Intermediate states have mixed old/new theming | Yes |
| C: File-by-file | One commit per affected file | Maximum granularity for revert | 8 separate commits; excessive overhead for className changes | Over-engineering for the scope | No — eliminated |

## Engineering Coverage Comparison

| Coverage Area | Option A (single-pass) | Option B (severity-tiered) | Chosen implication |
|---|---|---|---|
| UI / visual | All 14 fixes in one pass — complete visual consistency after one commit | High fixes first, then incremental improvement | Option A: immediate full consistency |
| UX / states | Hover/active and focus ring fixed atomically | Focus ring fixed in Medium tier, hover/active in Low tier | Option A: all interaction fixes land together |
| Security / privacy | N/A | N/A | — |
| Logging / observability / audit | N/A | N/A | — |
| Testing / validation | One contrast sweep verifies all fixes | Three sweeps needed (one per tier) | Option A: one verification pass |
| Data / contracts | N/A | N/A | — |
| Performance / reliability | N/A | N/A | — |
| Rollout / rollback | Single commit revert | Granular revert per tier | Option B slightly better, but low-risk className changes make this moot |

## Chosen Approach

- **Recommendation:** Option A — single-pass batch
- **Why this wins:** All 14 issues are className string replacements with known target values. The risk of any individual fix being wrong is very low (tokens are verified). A single atomic commit delivers full visual consistency immediately and requires only one verification pass. The overhead of tiered commits is not justified for this scope.
- **What it depends on:** Each fix must be verified against the token resolution chain documented in the fact-find. Intentional opacity on backdrop-blur elements must be preserved.

### Rejected Approaches

- **Option B (severity-tiered):** Unnecessary overhead. Three commits and three verification passes for changes that are all low-risk className replacements. The only benefit (granular revert) is not meaningful when every fix has a verified target token.
- **Option C (file-by-file):** Over-engineering. 8 commits for className changes is excessive.

### Open Questions (Operator Input Required)

None — all design decisions are resolved by the existing token system.

## Planning Handoff

- Planning focus:
  - Single IMPLEMENT task covering all 14 fixes across 8 files
  - Each fix has a specific old → new className mapping from the fact-find
- Validation implications:
  - Visual contrast sweep after commit (both light and dark mode)
  - Typecheck and lint must pass (className changes don't affect these, but verify)
- Sequencing constraints:
  - None — all fixes are independent; no ordering dependency between files
- Risks to carry into planning:
  - HeaderControls `bg-surface/10` replacement needs visual confirmation on primary-main background

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| HeaderControls bg-surface/10 replacement may not provide enough contrast on primary-main header | Low | Low | Requires visual rendering to confirm | Verify after build; include fallback in build notes |
| SalesScreen gradient (surface → surface-1) simplification may change subtle visual appearance | Very Low | Low | surface and surface-1 alias to the same value in reception theme | Note in build: simplify gradient or remove via- stop |

## Planning Readiness

- Status: Go
- Rationale: All 14 issues have verified target tokens, no open questions, single-pass approach is decisive, risk is low (className replacements only).
