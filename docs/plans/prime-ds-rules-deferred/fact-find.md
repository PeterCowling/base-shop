---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-ds-rules-deferred
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/prime-ds-rules-deferred/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-009
Trigger-Why:
Trigger-Intended-Outcome:
---

# Prime DS Rules Deferred Fact-Find Brief

## Scope

### Summary

Three DS lint rules — `ds/container-widths-only-at`, `ds/enforce-layout-primitives`, and `ds/min-tap-size` — are suppressed with blanket file-level `/* eslint-disable */` comments across 24 files in the Prime guest app. These were explicitly deferred under reference label "BRIK-3" during the initial Prime build. The disables prevent CI lint from flagging layout, tap-target, and container-width violations. The concrete risks are: interactive elements on mobile that are too small to tap reliably, inconsistent max-width container discipline, and ad-hoc flex/grid layout that bypasses DS layout primitives (Stack/Inline/Grid).

### Goals

- Enumerate every file affected by BRIK-3-tagged DS disable comments and the exact rules silenced in each.
- Understand what compliance requires per-rule so the plan can be right-sized.
- Determine per-rule effort: targeted add-class tweak vs. structural layout refactor.
- Establish whether any files are exempt on legitimate grounds (not just deferred).
- Produce planning evidence to either fix or formally document the deferral with a TTL.

### Non-goals

- Fixing the violations (fact-find only).
- Covering non-BRIK-3 disables such as BRIK-2 meal-orders or PLAT-ENG-0001 (separate scope and different owner).
- Any Prime backend or data-model changes.

### Constraints & Assumptions

- Constraints:
  - DS primitives (Stack, Inline, Grid, Sidebar, Cluster, Cover) are available via `@acme/design-system/primitives` and imported by some Prime files already — `GuestDirectory.tsx` and `TaskCard.tsx` already use `Button` and `Card` respectively.
  - `enforce-layout-primitives` only applies to **leaf** JSX elements (elements with no JSXElement children). Non-leaf elements with flex/grid are not flagged.
  - `container-widths-only-at` only fires when `confident` class parsing succeeds; template-literal classNames are not flagged.
  - `min-tap-size` only fires for `button`, `a`, and interactive `input` elements where class parsing is confident and the detected px size falls below 40px.
  - All 24 affected files already have semantic DS theme tokens (color migration completed in TASK-12 / `prime-ui-theme-centralization`).
- Assumptions:
  - BRIK-3 is a label coined internally during the prime build sprint, not a Jira/Linear ticket; no external tracker link exists.
  - The DS primitives are mature enough to use: Stack, Inline, Grid, Cluster, Cover, Sidebar are all exported from `@acme/design-system/primitives/index.ts` and have passing tests.
  - No `allowedPaths` or `allowedComponents` override is configured for Prime in the eslint config.

## Outcome Contract

- **Why:** Three pages in the prime app have design system rules disabled. These rules enforce minimum button and tap target sizes and consistent layout widths. Without them, these pages may have elements that are hard to tap on mobile, inconsistently laid out, or visually misaligned compared to the rest of the app. The disables are marked as deferred — they were never resolved.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 24 files with file-level BRIK-3 eslint-disable comments and all inline BRIK-3 disable comments pass DS lint rules with no suppressions. `pnpm --filter prime lint` returns zero DS rule violations.
- **Source:** operator

## Current Process Map

None: local code path only. The BRIK-3 suppressions are static eslint-disable comments in source files. No multi-step process, lifecycle state, CI lane, or operator runbook is affected beyond the lint gate. Removing the comments will cause CI lint to surface real violations which must be fixed before the branch can merge; that is the intent.

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** (none)
- **Expected Artifacts:** (none)
- **Expected Signals:** (none)

### Prescription Candidates

Not applicable — direct-dispatch code remediation, no discovery contract.

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx:1` — file-level disable for all 3 rules; BRIK-3
- `apps/prime/src/app/(guarded)/chat/GuestDirectory.tsx` — no top-level disable found on re-read; dispatch evidence refs incorrectly identified this file; verified: no BRIK-3 file-level comment in current state
- `apps/prime/src/app/staff-lookup/StaffLookupClient.tsx:1` — file-level disable for `container-widths-only-at` and `min-tap-size`; BRIK-3

### Key Modules / Files

The 24 unique files with BRIK-3 disables (22 file-level + 2 inline-only); confirmed via exhaustive grep:

**Rule: `ds/container-widths-only-at` disabled (file-level)**
- `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx` — also disables other 2 rules
- `apps/prime/src/app/(guarded)/booking-details/page.tsx` — also disables `min-tap-size`
- `apps/prime/src/app/(guarded)/cash-prep/page.tsx`
- `apps/prime/src/app/(guarded)/eta/page.tsx`
- `apps/prime/src/app/(guarded)/routes/page.tsx`
- `apps/prime/src/app/checkin/CheckInClient.tsx` — also disables `min-tap-size` and `no-hardcoded-copy`
- `apps/prime/src/app/error/page.tsx`
- `apps/prime/src/app/find-my-stay/page.tsx` — also disables `min-tap-size` and `enforce-layout-primitives`
- `apps/prime/src/app/g/page.tsx` — also disables `min-tap-size`
- `apps/prime/src/app/offline/page.tsx`
- `apps/prime/src/app/owner/setup/page.tsx`
- `apps/prime/src/app/page.tsx`
- `apps/prime/src/app/portal/page.tsx`
- `apps/prime/src/app/staff-lookup/StaffLookupClient.tsx` — also disables `min-tap-size`
- `apps/prime/src/components/homepage/cards/ServiceCard.tsx`
- `apps/prime/src/components/homepage/cards/TaskCard.tsx` — also disables `enforce-layout-primitives`
- `apps/prime/src/components/positano-guide/PositanoGuide.tsx` — also disables `min-tap-size`
- `apps/prime/src/components/security/StaffOwnerDisabledNotice.tsx`

**Rule: `ds/enforce-layout-primitives` disabled (file-level)**
- `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx`
- `apps/prime/src/app/(guarded)/digital-assistant/page.tsx` — also disables `min-tap-size`
- `apps/prime/src/app/find-my-stay/page.tsx`
- `apps/prime/src/components/homepage/cards/TaskCard.tsx`
- `apps/prime/src/components/pre-arrival/NextActionCard.tsx`

**Rule: `ds/min-tap-size` disabled (file-level)**
- `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx`
- `apps/prime/src/app/(guarded)/booking-details/page.tsx`
- `apps/prime/src/app/checkin/CheckInClient.tsx`
- `apps/prime/src/app/find-my-stay/page.tsx`
- `apps/prime/src/app/g/page.tsx`
- `apps/prime/src/app/staff-lookup/StaffLookupClient.tsx`
- `apps/prime/src/components/check-in/CheckInQR.tsx`
- `apps/prime/src/components/positano-guide/PositanoGuide.tsx`
- `apps/prime/src/components/settings/ChatOptInControls.tsx`
- `apps/prime/src/app/(guarded)/digital-assistant/page.tsx`

**Additional per-line disables (BRIK-3 labelled, inline):**
- `apps/prime/src/app/(guarded)/digital-assistant/page.tsx:215` — single-line `container-widths-only-at` BRIK-3
- `apps/prime/src/components/routes/RoutePlanner.tsx:271` — single-line `min-tap-size` BRIK-3
- `apps/prime/src/components/routes/RouteDetail.tsx:222` — single-line `min-tap-size` BRIK-3

Note: `apps/prime/src/components/homepage/HomePage.tsx:151` uses label `BRIK-002` (not BRIK-3) — not in scope for this work.

Total: **22 files** with file-level BRIK-3 disables (line-1 `/* eslint-disable */` blocks) + **2 files** with inline-only BRIK-3 disables (RouteDetail.tsx, RoutePlanner.tsx) + **1 additional inline** in digital-assistant/page.tsx (which also has a file-level disable) = **24 unique BRIK-3 files**, **25 total disable instances** (22 file-level + 3 inline).

GuestDirectory.tsx was listed in the dispatch but does NOT have a BRIK-3 file-level disable. It uses `Button` from `@acme/design-system/primitives`, which intrinsically satisfies `min-tap-size`.

**Key existing seam for container-width fix:**
- `apps/prime/src/components/layout/Container.tsx` — Prime-local `Container` component; exports a `<div>` wrapper with `mx-auto w-full max-w-6xl className`. Component name `Container` is on the rule's allowlist. This is the correct seam for `container-widths-only-at` remediation.

### Patterns & Conventions Observed

- All BRIK-3 disables use identical comment format: `/* eslint-disable <rules> -- BRIK-3 prime DS rules deferred */`
- Files already import from `@acme/design-system/primitives` selectively (`Button`, `Card`) but do not use layout primitives (Stack, Inline, Grid, etc.)
- Pages use `max-w-md` / `max-w-sm` directly on `<div>` and `<main>` elements — these violate `container-widths-only-at` which expects `max-w-*` only on `Page/Section/Container/Overlay` component names
- Interactive buttons use `px-4 py-2` or `px-4 py-2.5` without explicit height, which fails `min-tap-size` (40px minimum) — `py-2` = 8px padding top+bottom, typical button font ~20px = ~36px total, under threshold
- Flex/grid on leaf elements: `flex flex-col` on leaf `<div>` inside `Card` violates `enforce-layout-primitives`; narrow `inline-flex` without gap/wrap is allowed by the rule

### Data & Contracts

- Types/schemas/events:
  - No type changes required. BRIK-3 remediation is purely Tailwind class and JSX structural changes.
- Persistence:
  - None.
- API/contracts:
  - None. All affected files are client-only UI components.

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/design-system/primitives` (Stack, Inline, Grid, Cluster, Cover) — must be available in Prime. Verified: package already depended on by Prime (`TaskCard.tsx` and `GuestDirectory.tsx` import from it).
  - Tailwind v4 tokens in `apps/prime/src/styles/global.css` — already migrated.
- Downstream dependents:
  - None outside the 27 affected files. These are leaf UI components with no downstream consumers at risk.
- Likely blast radius:
  - Constrained to the 27 files. No shared utility functions, data hooks, or API routes are touched. Visual regressions are the primary risk surface.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + Testing Library (unit/integration)
- Commands: `pnpm --filter prime test` (CI only per testing policy)
- CI integration: Tests run on CI; not run locally

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| DS token correctness (semantic colors) | Jest render + class assertion | `routes-light-ds-migration.test.tsx`, `routes-heavy-ds-migration.test.tsx` | Checks no raw palette classes; does NOT check structural/layout compliance |
| Component rendering | Jest render | `remaining-components-ds-migration.test.tsx` | Render-only smoke tests; no tap-size or layout-primitive assertions |
| GuestDirectory | Jest render | `chat/__tests__/guest-directory.test.tsx` | Functional test for opt-in/directory logic |

#### Coverage Gaps

- No tests assert `min-h-10` / `size-10` presence on buttons.
- No tests check absence of raw `max-w-*` on non-container elements.
- No tests validate layout-primitive usage (presence of Stack/Inline/Grid wrappers).
- Gap: after BRIK-3 comments are removed, lint will flag the real violations; no runtime tests currently catch them.

#### Testability Assessment

- Easy to test: Button tap-size compliance can be tested by checking rendered button classes include both `min-h-10` and `min-w-10`, or `size-10`. Note: asserting only `min-h-10` is insufficient; the rule requires both height AND width numeric scale classes.
- Hard to test: `enforce-layout-primitives` is a static analysis rule (AST-level); runtime render tests cannot easily verify absence of leaf flex.
- Test seams needed: None that don't already exist. Adding targeted class assertions to existing migration tests is straightforward.

#### Recommended Test Approach

- Unit tests for: button tap-size compliance — assert both `min-h-10 min-w-10` (or `size-10`) classes present on fixed interactive elements post-fix
- Integration tests for: N/A (all client-only, no API boundary)
- E2E tests for: Not required for lint compliance work
- Contract tests for: Not applicable

### Recent Git History (Targeted)

- `b39d257213` — "fix(ci): targeted eslint-disable DS rules for all changed prime files" — this is where many of the BRIK-3 comments were introduced as a CI unblock
- `adc012b60e` — "fix(ci): payments env tests + prime min-tap-size lint gate" — further min-tap-size suppressions
- `4c1071845a` — "feat(prime-ui-theme-centralization): migrate 26 route pages to DS tokens (TASK-12)" — colour tokens complete; layout/tap compliance deferred
- `7286a4f63a` — "feat(prime): replace hardcoded 2h duration with per-instance durationMinutes (TASK-02)" — most recent prime change; confirms BRIK-3 comments are still in place, not accidentally removed

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | 24 files use raw `max-w-*` and ad-hoc flex on leaves; visual appearance unchanged at runtime (rule is lint-only) | Layout structural regressions if layout primitives change reflow | Yes — verify no visible reflow after refactor |
| UX / states | Required | Button states (disabled, hover) defined inline; tap targets may be physically small on mobile | Buttons under 40px: rule requires BOTH min-h-10 AND min-w-10 (not just height); w-full alone does not satisfy the check | Yes — add both min-h-10 min-w-10 (or size-10) to all violating interactive elements |
| Security / privacy | N/A | No auth, data-exposure, or privacy implications from lint compliance work | None | No |
| Logging / observability / audit | N/A | No logging changes | None | No |
| Testing / validation | Required | DS migration tests exist but test colour only, not structural compliance | No test asserts tap-size classes after fix | Yes — add targeted assertions for min-h-10 on buttons where easily testable |
| Data / contracts | N/A | Purely UI class changes; no schemas, API shapes, or types touched | None | No |
| Performance / reliability | N/A | No hot paths or data fetching affected | None | No |
| Rollout / rollback | Required | Single branch, standard CI gate; no feature flag needed | Rollback = revert the PR | Yes — confirm CI lint passes cleanly before merge |

## Questions

### Resolved

- Q: What is BRIK-3? Is there a ticket or decision doc?
  - A: BRIK-3 is an internal sprint label coined during the Prime initial build to batch-defer DS compliance rules. No external tracker (Jira/Linear) link exists. The commit `b39d257213` ("fix(ci): targeted eslint-disable DS rules for all changed prime files") is the primary origin. There is no standalone plan or decision doc for BRIK-3 beyond the inline comments.
  - Evidence: `git log --oneline` trace; no docs/plans/prime-* directory for BRIK-3 prior to this fact-find.

- Q: Does GuestDirectory.tsx actually have a BRIK-3 disable?
  - A: No. The dispatch evidence ref was incorrect. After reading the file, GuestDirectory has no file-level eslint-disable for the three BRIK-3 rules. It imports `Button` from DS primitives, which intrinsically handles tap size.
  - Evidence: `apps/prime/src/app/(guarded)/chat/GuestDirectory.tsx` — file read confirms no top-level disable block.

- Q: Are DS layout primitives (Stack, Inline, Grid, etc.) available and stable for use in Prime?
  - A: Yes. `@acme/design-system/primitives/index.ts` exports Stack, Inline, Grid, Cluster, Cover, Sidebar. These have passing unit tests. `TaskCard.tsx` already imports `Card` from `@acme/design-system/primitives`.
  - Evidence: `packages/design-system/src/primitives/index.ts`

- Q: Is `enforce-layout-primitives` a major layout refactor or a targeted fix?
  - A: The rule only fires on **leaf JSX elements** (no child JSXElement nodes). Most violations are small badge or icon+label divs with `flex` inside a larger flex container. Converting these to `<Inline>` or removing the redundant flex (since parent already handles layout) is a targeted fix per element, not a page-level architecture rewrite.
  - Evidence: `packages/eslint-plugin-ds/src/rules/enforce-layout-primitives.ts` — `isLeafJSX()` check on line 91 confirms leaf-only rule.

- Q: How much work is `container-widths-only-at` to fix?
  - A: The rule flags any `max-w-*` class on a JSX element whose component name is NOT in `allowedComponents` (default: `["Page", "Section", "Container", "Overlay"]`). **`@acme/design-system/primitives` does not export any of these names** (Page, Section, Container, Overlay are absent from `packages/design-system/src/primitives/index.ts`). However, Prime already has a local `apps/prime/src/components/layout/Container.tsx` which exports a `Container` function component wrapping a `<div>` with `mx-auto w-full max-w-6xl`. This component name matches the rule's allowlist exactly. The correct fix: replace `<div className="mx-auto max-w-md ...">` wrappers with `<Container>` (using Prime's local component) and let the class propagate via `className` prop. If a page needs a narrower max-width than `max-w-6xl`, the `className` override on `Container` can supply it (e.g. `<Container className="max-w-md">`). This is a 1–2 line change per file (import + rename). Alternatively, for pages that already have the correct component structure, using `Section` or `Page` naming in the local component hierarchy would also satisfy the rule, but the local `Container` is the most direct existing seam.
  - Evidence: `apps/prime/src/components/layout/Container.tsx` — exported as `Container`; `packages/design-system/src/primitives/index.ts` — no Page/Section/Container/Overlay exports; `packages/eslint-plugin-ds/src/rules/container-widths-only-at.ts` — allowedComponents default list confirmed.

- Q: How much work is `min-tap-size` to fix?
  - A: The rule checks `button`, `a`, and interactive `input` elements. It passes **only** when: (a) `size-10` (or higher) is present, OR (b) BOTH a `h-X`/`min-h-X` AND a `w-X`/`min-w-X` numeric scale class are present and both resolve to ≥ 40px. The rule parses only numeric scale suffixes via `parseScaleNum()`; `w-full`, padding (`py-*`), and text width do NOT contribute to the check. This means: (1) `w-full` buttons — which appear in `ActivitiesClient.tsx:171`, `StaffLookupClient.tsx:137`, and `digital-assistant/page.tsx` — need both `min-h-10` AND `min-w-10` (or `size-10`) even though they are visually wide; (2) constrained-width icon buttons need `size-10` as a single class. Simply adding `min-h-10` to full-width buttons will NOT satisfy the rule alone. Correct fix: add `min-h-10 min-w-10` to all violating `button`/`a` elements, or use `size-10` where dimensions allow. Estimated cost: 2 class tokens per button element across ~20 interactive elements in scope.
  - Evidence: `packages/eslint-plugin-ds/src/rules/min-tap-size.ts` — `parseScaleNum()` extracts numeric scale only; `w-full` does not match the `w-`/`min-w-` prefix pattern since it has no numeric suffix.

### Open (Operator Input Required)

- Q: Should the full set of 24 files be fixed, or only the three originally identified in the dispatch?
  - Why operator input is required: The dispatch named three files. The full audit found 24 files. Fixing all 24 in one plan is more thorough but a larger scope; fixing just the three named files is faster but leaves 21 files in a degraded state.
  - Decision impacted: Plan scope and task count.
  - Decision owner: Operator (Peter)
  - Default assumption: Fix all 24 unique BRIK-3 files (22 file-level + 2 inline-only) in a single plan, since they share the same root cause and the per-file fix cost is low (1–5 class additions per file). The 3 inline BRIK-3 disables in `digital-assistant/page.tsx:215`, `RoutePlanner.tsx:271`, and `RouteDetail.tsx:222` are included. Note: `HomePage.tsx:151` uses label `BRIK-002` and is NOT in scope for this work.

## Confidence Inputs

- Implementation: 90%
  - Evidence: Rule source code read; class-level fix pattern is clear; DS primitives available.
  - Raise to 90%: Already there. Full list of violations would be obtained by running the linter with disables removed.
- Approach: 88%
  - Evidence: Three distinct fix patterns identified (min-h-10 for tap-size, max-w-container-component for widths, Inline/Stack for leaf flex).
  - Raise to 90%: Confirm no layout primitives in Prime require additional configuration (e.g. `allowedPaths`).
- Impact: 80%
  - Evidence: All fixes are lint compliance only; runtime behaviour is preserved.
  - Raise to 90%: Verify visually on key pages that no reflow is introduced by adding height constraints to buttons.
- Delivery-Readiness: 90%
  - Evidence: No data model, API, or test infrastructure changes needed. DS layout primitives (Stack, Inline, Grid) already in-scope. Prime-local `Container` component confirmed as the container-width fix seam. Rule semantics verified. Violation fix patterns established.
  - Raise to 95%: Run lint with disables removed to confirm exact violation list before planning.
- Testability: 82%
  - Evidence: Most fixes can have targeted class assertions added to existing test files.
  - Raise to 90%: Add `min-h-10` button assertion to 2–3 key component tests.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Visual reflow from adding `min-h-10` to buttons | Low | Low | `min-h-10` (40px) only constrains minimum height; existing `py-2.5` buttons are ~36px and will gain ~4px. Verify visually on key screens. |
| `enforce-layout-primitives` fix introduces DS layout primitive not yet used in Prime | Low | Low | Stack/Inline are already transitively imported; TaskCard uses Card. Adding Inline for leaf flex is low-friction. |
| Not all violations are covered by file-level disable removal — some violations may have been hidden by the file-level disable that are not yet identified | Medium | Low | Removing the disables and running CI lint will surface the exact violations. The plan should budget a "lint-fix pass" task. |
| Per-line disables in HomePage, RoutePlanner, RouteDetail missed if plan only targets 24 file-level locations | Medium | Low | Include per-line BRIK-3 disables in same plan scope. 3 additional locations, trivial. |
| Operator scope decision (all 24 vs. 3 files) left open | Low | Medium | Default recommendation is all 24. If operator narrows scope, update plan accordingly. |

## Planning Constraints & Notes

- Must-follow patterns:
  - DS layout primitives (Stack, Inline, Grid, Cluster, Cover) accessed via `@acme/design-system/primitives`.
  - Tap-size fix must use `size-10` OR both `min-h-10 min-w-10` on every violating interactive element. `w-full` alone does NOT satisfy the rule — both height and width numeric scale classes are required.
  - Max-width containers: wrap `<div className="mx-auto max-w-md ...">` with Prime's local `Container` component from `apps/prime/src/components/layout/Container.tsx`. The component name `Container` matches the eslint rule's allowlist. Do NOT attempt to import Page/Section/Container/Overlay from `@acme/design-system/primitives` — these are not exported.
  - Per testing policy: tests run in CI only. Push and monitor via `gh run watch`.
- Rollout/rollback expectations:
  - Single PR to `dev`. No feature flag needed. Rollback = revert the PR.
- Observability expectations:
  - None. Lint-only change.

## Suggested Task Seeds (Non-binding)

- TASK-01: Remove BRIK-3 disables and run lint to enumerate exact violations (dry-run / evidence task — CI will confirm full violation list)
- TASK-02: Fix `ds/min-tap-size` violations — add `min-h-10 min-w-10` (or `size-10`) to every violating `button`/`a` element; `w-full` alone does not satisfy the rule
- TASK-03: Fix `ds/container-widths-only-at` violations — wrap `<div className="mx-auto max-w-md ...">` patterns with Prime's local `Container` component from `apps/prime/src/components/layout/Container.tsx`; do not rely on DS primitives exports (Page/Section/Container/Overlay not exported from `@acme/design-system/primitives`)
- TASK-04: Fix `ds/enforce-layout-primitives` violations — replace leaf flex divs with `<Inline>` or `<Stack>` from `@acme/design-system/primitives`
- TASK-05: Clean up per-line BRIK-3 disables in `digital-assistant/page.tsx:215`, `RoutePlanner.tsx:271`, `RouteDetail.tsx:222`
- TASK-06: Add targeted test assertions for tap-size compliance on key interactive elements

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - All 24+ BRIK-3 file-level eslint-disable comments removed
  - All 3 per-line BRIK-3 disables removed
  - `pnpm --filter prime lint` passes with zero DS rule violations
  - CI green on dev branch
- Post-delivery measurement plan:
  - CI lint gate acts as ongoing enforcement. No additional measurement needed.

## Evidence Gap Review

### Gaps Addressed

- Full file enumeration completed via exhaustive grep — 24 files with file-level BRIK-3 disables confirmed.
- Rule semantics verified by reading rule source code directly.
- GuestDirectory.tsx dispatch discrepancy resolved (no BRIK-3 disable present in current state).
- BRIK-3 origin traced to commit `b39d257213` and confirmed as internal sprint label with no external tracker entry.

### Confidence Adjustments

- Implementation confidence raised from initial ~70% (dispatch estimate) to 90% after rule source analysis.
- Approach confidence raised to 88% after confirming DS primitives are available and the per-file change pattern is established.

### Remaining Assumptions

- Exact violation count per file will only be known after removing the disables and running the linter. This is expected and safe to discover during build.
- Operator scope preference (all 24 vs. dispatch 3) is open; default to all 24 is recommended.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Full file enumeration (all BRIK-3 files) | Yes | None | No |
| Rule semantics (what each rule checks) | Yes | None | No |
| DS primitives availability in Prime | Yes | None | No |
| Fix pattern per rule | Yes | None | No |
| GuestDirectory dispatch discrepancy | Yes | [Correctness Minor]: dispatch refs incorrect for GuestDirectory | No — resolved in Resolved Questions |
| Test landscape coverage | Yes | [Coverage Minor]: existing tests do not assert structural compliance | No — noted as gap |
| Git history traceability | Yes | None | No |

## Scope Signal

Signal: right-sized
Rationale: 24 files with well-understood, per-file fix patterns (1–5 class additions + possible wrapper extraction). No data model, API, or test infrastructure changes. DS primitives are available and already partially used. Fix patterns are established and can be applied in parallel across files.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis prime-ds-rules-deferred`
