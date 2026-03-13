---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-ds-rules-deferred
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/prime-ds-rules-deferred/fact-find.md
Related-Plan: docs/plans/prime-ds-rules-deferred/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Prime DS Rules Deferred — Analysis

## Decision Frame

### Summary

24 unique files in the Prime guest app carry BRIK-3-labelled DS lint suppressions (22 with file-level `/* eslint-disable */` blocks and 2 with inline-only BRIK-3 disables; `digital-assistant/page.tsx` carries both a file-level and an inline instance). Three DS lint rules are suppressed: `ds/container-widths-only-at`, `ds/enforce-layout-primitives`, and `ds/min-tap-size`. These were deferred during the initial Prime build sprint under label "BRIK-3" and were never resolved. The decision to make now: **fix all violations in one pass, fix a subset, or formally defer with a TTL**. This analysis resolves that choice and produces planning-grade guidance for the chosen path.

### Goals

- Select between full remediation, partial fix, or formal deferral.
- Confirm the per-rule fix patterns are correct and safe.
- Establish scope, sequencing, and validation contract for planning.

### Non-goals

- BRIK-2 (meal-orders), PLAT-ENG-0001, or any non-BRIK-3 disables.
- Backend, data model, or API changes.
- Broader DS primitive adoption beyond what's needed to clear the violations.

### Constraints & Assumptions

- Constraints:
  - `@acme/design-system/primitives` exports Stack, Inline, Grid, Cluster, Cover, Sidebar, Button, Card — but NOT Page, Section, Container, or Overlay.
  - Prime has a local `Container` component at `apps/prime/src/components/layout/Container.tsx` (exports `Container` function wrapping `<div className="mx-auto w-full max-w-6xl">`). This component name is on the `container-widths-only-at` rule's allowlist.
  - `ds/min-tap-size` requires BOTH `min-h-X` AND `min-w-X` numeric scale (or `size-X`) ≥ 10 (40px). `w-full`, padding, and text width do not count.
  - `ds/enforce-layout-primitives` only fires on leaf JSX elements (no JSXElement children).
  - Tests run in CI only (testing policy).
- Assumptions:
  - No operator-preference constraint prevents fixing all 24 files in one PR; the operator question in the fact-find defaults to "fix all".
  - Adding `min-h-10 min-w-10` to buttons adds ~4px minimum height — a small but non-zero visual change. Not zero-risk, but low-risk and verifiable with spot checks.
  - Prime's local `Container` component (`apps/prime/src/components/layout/Container.tsx`) injects `w-full max-w-6xl` plus any override. This is NOT identical DOM to a bare `<div className="mx-auto max-w-md">` — the `Container` adds `w-full` and uses `max-w-6xl` as base, with the override in `className`. For pages needing `max-w-md`, `<Container className="!max-w-md">` or simply passing `className="mx-auto max-w-md"` (which wins over the base due to Tailwind order) is the fix. This is a small structural refactor, not a drop-in swap; planning must treat this as a visual verification item.

## Inherited Outcome Contract

- **Why:** Three pages in the prime app have design system rules disabled. These rules enforce minimum button and tap target sizes and consistent layout widths. Without them, these pages may have elements that are hard to tap on mobile, inconsistently laid out, or visually misaligned compared to the rest of the app. The disables are marked as deferred — they were never resolved.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 24 unique BRIK-3 files (22 file-level suppressions + 2 inline-only files) pass DS lint rules with no suppressions. `pnpm --filter prime lint -- --full` returns zero DS rule violations across the entire Prime codebase.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/prime-ds-rules-deferred/fact-find.md`
- Key findings used:
  - 22 files have file-level BRIK-3 disables; 2 additional files (RoutePlanner, RouteDetail) have inline-only BRIK-3 disables; 1 file (digital-assistant) has both. Total: 24 unique files, 25 disable instances.
  - Fix pattern per rule is established: `min-h-10 min-w-10` for tap-size; `<Container>` wrapper for width; DS layout primitives for leaf flex.
  - DS layout primitives available from `@acme/design-system/primitives`; local `Container` is the container-width seam.
  - Per-file fix cost is low: 1–5 class/wrapper additions per file. No data model or API changes.
  - `enforce-layout-primitives` only fires on leaf elements — materially narrower scope than it appears.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Lint gate cleanliness | Suppressions hide real violations from CI; removing them restores enforcement | High |
| Mobile UX correctness | Buttons under 40px are hard to tap on phones used by hostel guests | High |
| Visual regression risk | Adding height constraints or wrapping divs could cause reflow | Medium |
| Per-file effort | Determines PR size and review burden | Medium |
| Test auditability | Changes should be verifiable in CI | Medium |
| Future debt | Formal deferral without TTL leaves violations silently accumulating | High |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Fix all 24 files in one PR | Remove all BRIK-3 disables, fix every revealed violation using established patterns | Lint gate fully restored; no accumulated debt; single clean PR | Larger diff (~24 files, ~80–120 line changes); more review surface | Visual regression on any individual button/container change | Yes |
| B — Fix dispatch-original 3 files only | Fix only ActivitiesClient, GuestDirectory (already clean), StaffLookupClient | Smallest diff; matches dispatch scope literally | Leaves 21 files still suppressed; does not meaningfully restore lint enforcement | BRIK-3 label persists across the app; future developers confused about which files are intended vs. accidental suppressions | Yes (but inferior) |
| C — Formal deferral with TTL | Keep disables, update comments to add TTL (e.g. `[ttl=2026-12-31]`) and a link to this plan | Preserves status quo; zero regression risk | Does not fix the underlying violations; tap-size problems remain on mobile; TTL requires follow-up discipline | TTL expires unnoticed; violations accumulate further | No — adds process overhead without fixing the problem |

## Engineering Coverage Comparison

| Coverage Area | Option A (fix all 24) | Option B (fix 3 files) | Option C (formal deferral) | Chosen (A) implication |
|---|---|---|---|---|
| UI / visual | ~80–120 line changes across 24 files; visual parity preserved via class equivalence | ~10–15 line changes on 2 files | No change | Must verify no visual regressions on key screens after button height and container changes |
| UX / states | Buttons gain correct 40px minimum tap target on all affected pages | Buttons fixed on 2 pages only; 21 pages remain broken | No UX improvement | Add `min-h-10 min-w-10` (or `size-10`) to every violating interactive element; `w-full` alone does not satisfy the rule |
| Security / privacy | N/A | N/A | N/A | N/A |
| Logging / observability / audit | N/A | N/A | N/A | N/A |
| Testing / validation | 24 files with lint violations fixed; CI lint gate restored; targeted test assertions for tap-size on key buttons | 2 files only; CI lint still suppressed on 21 files | No testing improvement | Add class assertions for `min-h-10 min-w-10` on fixed interactive elements in existing test files |
| Data / contracts | N/A — purely UI changes | N/A | N/A | N/A |
| Performance / reliability | N/A | N/A | N/A | N/A |
| Rollout / rollback | Single PR to dev; no feature flag; rollback = revert PR | Same | No PR needed | Confirm CI lint passes cleanly before merge; no migration ordering constraints |

## Chosen Approach

- **Recommendation:** Option A — Fix all 24 files in one PR.
- **Why this wins:** The per-file cost is low (1–5 class additions or a wrapper component swap), the fix patterns are established, and fixing all 24 in one pass restores the lint gate completely. Fixing a subset (Option B) leaves the majority of suppressions in place and provides no material improvement to CI enforcement. Option C defers without fixing and introduces TTL tracking overhead with no UX benefit.
- **What it depends on:**
  - `apps/prime/src/components/layout/Container.tsx` available and correctly named (confirmed).
  - DS layout primitives (Inline, Stack) exportable from `@acme/design-system/primitives` (confirmed).
  - `min-tap-size` fix requires BOTH `min-h-10` AND `min-w-10` (or `size-10`) — NOT `min-h-10` alone.
  - For wide/full-width buttons (`w-full`), `size-10` may conflict with `w-full`; use `min-h-10 min-w-10` to preserve full-width behavior.

### Rejected Approaches

- **Option B (fix 3 files)** — Leaves 21 files suppressed with no enforcement improvement. The dispatch identified 3 files as the symptom, but the root cause spans 24. Given the low per-file cost, partial fixing is not justified.
- **Option C (formal deferral with TTL)** — Adds process overhead without closing any violations. Mobile tap-size problems remain on all affected pages. Rejected because it delays rather than resolves the problem.

### Open Questions (Operator Input Required)

None. The operator scope question from the fact-find is resolved by the default recommendation (fix all 24). No operator-only knowledge is required to proceed to planning.

## End-State Operating Model

None: no material process topology change. The chosen approach removes lint suppression comments and fixes class/wrapper patterns in 24 source files. CI lint gates operate identically before and after; the only difference is that violations are no longer hidden. No workflows, runbooks, lifecycle states, or deploy lanes are altered.

## Planning Handoff

- Planning focus:
  - **Lint dry-run first**: one task removes all BRIK-3 disables and runs `pnpm --filter prime lint -- --full` to enumerate exact violations. This gives the build the actual per-file, per-rule hit list before any code changes.
  - **Fix by file cluster, not by rule track**: Several files carry two or three BRIK-3 rules simultaneously (`ActivitiesClient.tsx`, `find-my-stay/page.tsx`, `digital-assistant/page.tsx`, `TaskCard.tsx`, `checkin/CheckInClient.tsx`). Pure rule-track parallelism would require multiple agents editing the same file. Plan instead by grouping files into clusters (e.g. pages-only, components-only) or by assigning all rules in a given file to a single agent/task. Three fix patterns to apply within each file:
    1. `ds/min-tap-size`: add `min-h-10 min-w-10` to every violating `button`, `a`, or interactive `input`. For narrow icon buttons, `size-10` is cleaner. Do NOT use `size-10` on `w-full` buttons — it overrides the width.
    2. `ds/container-widths-only-at`: replace bare `<div className="mx-auto max-w-*">` wrappers. The correct seam is Prime's local `Container` component. Note: `Container` base styles include `w-full max-w-6xl`; a custom narrower width in `className` prop overrides via Tailwind cascade order, but the planner should visual-check each target page to confirm no unintended layout change.
    3. `ds/enforce-layout-primitives`: replace leaf flex/grid `<div>` elements with `<Inline>` or `<Stack>` from `@acme/design-system/primitives`. Only leaf elements (no JSXElement children) trigger the rule — post dry-run count may be smaller than expected.
  - **Inline BRIK-3 disables**: clean up 3 per-line disables (`digital-assistant/page.tsx:215`, `RoutePlanner.tsx:271`, `RouteDetail.tsx:222`) as part of the file cluster they belong to.
  - **Test additions**: add class assertions for `min-h-10 min-w-10` presence on interactive elements in 2–3 key test files (e.g. ActivitiesClient, StaffLookupClient).
  - **Full lint validation**: final task runs `pnpm --filter prime lint -- --full` to confirm zero DS violations across the entire Prime app.
- Validation implications:
  - `pnpm --filter prime lint -- --full` must return zero DS violations across the full Prime codebase (not just changed files). Default `pnpm lint` only lints changed files per `lint-wrapper.sh` — this is insufficient for acceptance.
  - Visual spot-check on key pages (Activities, StaffLookup, BookingDetails, DigitalAssistant) after button height changes and Container swap. The Container swap is a small structural refactor (adds `w-full` base class), not a guaranteed visual no-op.
- Sequencing constraints:
  - Lint dry-run task first (enumerate violations) → then 3 parallel fix tracks → then test additions → then final lint validation.
  - No dependency on external services or data models.
- Risks to carry into planning:
  - Exact violation count per file is not known until the dry-run; plan must budget a lint-fix pass rather than specifying exact line counts.
  - `enforce-layout-primitives` leaf-only check means some apparent flex elements may not actually be flagged; the dry-run will confirm.
  - `w-full` + `size-10` conflict: for buttons that must remain full-width, use `min-h-10 min-w-10` rather than `size-10`.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Exact violation count unknown until lint dry-run | Medium | Low | Suppressions must be removed to see violations | Budget a lint enumeration task before fix tasks |
| `w-full` + `size-10` conflict on wide buttons | Low | Low | Fix pattern established (`min-h-10 min-w-10`) but not applied per-button yet | Apply `min-h-10 min-w-10` to all `w-full` buttons; reserve `size-10` for icon/constrained buttons |
| `enforce-layout-primitives` leaf-check may flag fewer elements than expected | Low | Low | Rule semantics confirmed but exact hit count unknown | Dry-run will enumerate; fewer violations = less work, not more |
| Minor visual reflow from `min-h-10` addition to buttons | Low | Low | Adds ~4px min-height to buttons currently at ~36px natural height | Visual spot-check on key pages sufficient |

## Planning Readiness

- Status: Go
- Rationale: All three analysis gates pass. Approach is decisive (Option A). Per-rule fix patterns established and verified against rule source code. Fix seams (Container component, DS primitives, class additions) confirmed present. No operator input needed. No unresolved blockers.
