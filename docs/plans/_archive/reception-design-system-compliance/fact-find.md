---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-design-system-compliance
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-design-system-compliance/analysis.md
Dispatch-ID: none
Trigger-Why: Design system compliance audit identified that the reception app has inline styles and raw layout classes that bypass the token + DS primitive layer, making future theme changes and dark-mode maintenance fragile.
Trigger-Intended-Outcome: type: operational | statement: All reception app components use DS layout primitives and no inline style overrides; inline-style violations eliminated; arbitrary Tailwind bracket values documented or resolved; DS primitive adoption at 100% for layout. | source: operator
---

# Reception Design System Compliance Fact-Find

## Scope

### Summary

The reception app's design system compliance audit revealed three classes of non-compliance. Color token usage is already clean (zero hardcoded colors, zero raw Tailwind palette classes). The remaining violations are: (1) inline `style={{` props that bypass the token cascade, (2) arbitrary Tailwind bracket values that hard-code spacing/sizing without tokens, and (3) raw `className="flex ..."` layout patterns that should use DS layout primitives (`<Inline>`, `<Stack>`, `<Cluster>`, `<Grid>`).

### Goals

- Eliminate all inline `style={{` props in production components
- Resolve or formally justify all arbitrary Tailwind bracket values
- Migrate raw flex/grid layout class patterns to DS layout primitives across all screens

### Non-goals

- Color token audit (already clean — zero violations)
- Dark mode token additions or new token definitions
- Design changes (component appearance, sizing, spacing values — only structural compliance)
- Test files

### Constraints & Assumptions

- Constraints:
  - DS layout primitives (`Inline`, `Stack`, `Cluster`, `Grid`) are available at `@acme/design-system/primitives`
  - Inline `<Inline>` etc. emit `display: flex` / `display: grid` with configurable gap/alignment props; they are not layout superpowers — behavior must be verified equivalent before swap
  - ESLint rules `ds/enforce-layout-primitives` and `ds/no-arbitrary-tailwind` are present but currently warning-level or not enforced as errors for all violations
  - Drag-and-drop use cases (roomgrid RowCell) already use Tailwind opacity classes correctly — no inline style needed there
- Assumptions:
  - No runtime behavior depends on inline position styles being applied as JS (CSS class equivalents exist)
  - The two `max-h-[...]` values in inbox are functionally necessary viewport-relative heights; DS does not yet have a token equivalent — these may need a new token or a defined justified suppression
  - `ml-[100px]` in Tooltip is a design decision (100px left offset for room label alignment) that needs a DS spacing token or justified suppression

## Outcome Contract

- **Why:** Inline styles and arbitrary layout classes make future theme changes, dark-mode maintenance, and design-system upgrades fragile. Centralising all layout through DS primitives and eliminating inline styles ensures that token changes propagate correctly throughout the app.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception app production components are free of inline `style={{` overrides; arbitrary Tailwind bracket values are either replaced with tokens or formally suppressed with justification; raw flex/grid layout class patterns are migrated to DS layout primitives.
- **Source:** operator

## Current Process Map

None: local code path only

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/` — all production component files (excluding `__tests__/`)
- `apps/reception/src/app/` — page and layout files

### Key Modules / Files

**Inline style violations (2 files):**
- `apps/reception/src/components/checkins/keycardButton/KeycardDepositMenu.tsx:61` — `style={{ position: "absolute", top: menuPosition.top, left: menuPosition.left }}` — positioned dropdown menu
- `apps/reception/src/components/roomgrid/_BookingTooltip.tsx:31` — `style={{ position: "fixed", top: position.y + 10, left: position.x + 10, zIndex: 10000 }}` — JS-positioned tooltip overlay. **OPEN (analysis):** `zIndex: 10000` has no DS token — migrating `zIndex` to a class would produce `z-[10000]`, a new arbitrary-value violation. Migration approach for zIndex must be resolved in analysis (DS zIndex token, justified suppression, or CSS variable).

**Arbitrary Tailwind bracket values (3 instances, all in 3 files):**
- `apps/reception/src/components/inbox/ThreadList.tsx:200` — `max-h-[calc(100vh-12rem)]` — already suppressed with `ds/no-arbitrary-tailwind` + dispatch ID comment
- `apps/reception/src/components/inbox/ThreadDetailPane.tsx:261` — `max-h-[50vh]` — already suppressed with `ds/no-arbitrary-tailwind` + dispatch ID comment
- `apps/reception/src/components/checkins/tooltip/Tooltip.tsx:100` — `ml-[100px]` — suppressed with `ds/no-raw-spacing, ds/no-arbitrary-tailwind` + [DS-06] tag

**Raw flex/grid layout class scope (215 instances across ~40 files):**
- All screens have violations; worst concentration in checkins, inbox, till, roomgrid

### Patterns & Conventions Observed

- DS Button (`@acme/design-system/atoms`) is already fully adopted — zero raw `<button>` elements in production code (only in test mocks)
- DS layout primitives (`Inline`, `Stack`, `Cluster`, `Grid`) from `@acme/design-system/primitives` are used in ~10 files but not consistently
- Files currently importing primitives: `ThreadList.tsx`, `FilterBar.tsx`, `TemplatePicker.tsx`, `DraftReviewPanel.tsx`, `StaffAccountsForm.tsx`, `CashHub.tsx`, `StepProgress.tsx`, `DenominationInput.tsx`, `LoanedItemsList.tsx`, `SafeManagement.tsx`
- The ESLint rule `ds/enforce-layout-primitives` is present (0 explicit suppressions found) — suggests it is either warn-only or not yet catching all patterns

### Data & Contracts

- Types/schemas/events: None — this is a pure structural/layout compliance change, no data contract impact
- Persistence: None
- API/contracts: None

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/design-system/primitives` exports `Inline`, `Stack`, `Cluster`, `Grid`
  - `@acme/design-system/atoms` exports `Button`
- Downstream dependents:
  - All reception screens depend on the components being fixed; visual behavior must be identical post-migration
- Likely blast radius:
  - Visual-only; no data, API, or state logic changes
  - Risk of layout breakage if `<Inline>` default props don't match existing flex defaults
  - Risk of z-index/positioning breakage when replacing inline `position:fixed` with CSS class (JS-computed coordinates must be preserved for _BookingTooltip)

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library
- Commands: `pnpm --filter scripts startup-loop:governed-tests -- jest --config=apps/reception/jest.config.cjs`
- CI integration: Yes — tests run in CI, not locally per policy

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Till | Unit/RTL | `till/__tests__/*.test.tsx` | 9 test files covering forms and modals |
| Safe | Unit/RTL | `safe/__tests__/*.test.tsx` | 5 test files |
| Inbox | Unit/RTL | `inbox/__tests__/` (if exists) | Partial coverage |
| Checkins | Minimal | Snapshot tests where present | Structural changes need visual regression guard |

#### Coverage Gaps
- Untested paths: Visual layout assertions (no snapshot or visual regression tests for layout primitives swap)
- Extinct tests: None identified

#### Testability Assessment
- Easy to test: Structural correctness via snapshots / RTL `getByRole`
- Hard to test: Visual equivalence (pixel-level) after layout primitive swap
- Test seams needed: Existing tests must continue to pass; no new test scaffolding required for a structural swap

### Recent Git History (Targeted)
- `apps/reception/src/components/inbox/*` — recent work (ThreadList, TemplatePicker, DraftReviewPanel recently added/updated)

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | 215 raw flex/grid instances; 2 inline style overrides; 3 arbitrary bracket values | Layout breakage risk if DS primitive defaults differ from current flex defaults; must verify equivalence per component | Yes — approach must address visual equivalence verification |
| UX / states | Required | _BookingTooltip uses JS-computed coordinates (mouse position); KeycardDepositMenu uses JS-computed absolute position | If position coordinates are removed from inline style, dropdown/tooltip will misplace — must keep computed coordinates via alternative mechanism | Yes — positions using JS state cannot be replaced with pure CSS classes |
| Security / privacy | N/A | Layout/structural change only — no auth, input, or data exposure involved | None | No |
| Logging / observability / audit | N/A | No logs, metrics, or audit trail affected by layout class changes | None | No |
| Testing / validation | Required | Existing RTL tests check component render; layout swap should not break tests but visual equivalence is unverifiable via RTL | CI test pass is necessary but not sufficient for visual correctness | Yes — must define post-build visual validation strategy |
| Data / contracts | N/A | No schema, API, or type changes | None | No |
| Performance / reliability | N/A | CSS class swaps have negligible runtime perf impact; no hot paths affected | None | No |
| Rollout / rollback | Required | Single deploy; rollback is a git revert | No migration ordering; rollback straightforward | Yes — deploy as one release or per-screen groups for safety |

## External Research (If Needed)

- DS `<Inline>` props: accepts `gap`, `align`, `justify`, `wrap` — maps directly to flex shorthand; default gap is DS spacing token, not `gap-2`
- `<Stack>` is vertical flex; `<Cluster>` is wrapping flex; `<Grid>` is CSS grid

## Questions

### Resolved

- Q: Are raw `<button>` elements a violation to fix?
  - A: No. Zero raw `<button>` elements in production components — DS Button already fully adopted across all screens.
  - Evidence: `grep -r "<button " apps/reception/src/components --include="*.tsx"` returns only test mocks

- Q: Does RowCell use inline opacity style?
  - A: No. RowCell uses `opacity-50` / `opacity-100` Tailwind classes (not inline style).
  - Evidence: `apps/reception/src/components/roomgrid/components/Row/RowCell.tsx:141-142`

- Q: Can the 2 arbitrary `max-h-[...]` values in inbox be replaced with tokens?
  - A: Not immediately — DS has no viewport-relative max-height token. Both are already suppressed with justification comments and dispatch IDs for future token work. Accept as justified suppressions for now.
  - Evidence: `ThreadList.tsx:199-200`, `ThreadDetailPane.tsx:260-261`

- Q: Can `ml-[100px]` in Tooltip be replaced with a token?
  - A: The 100px left margin is a design-specific alignment value for room label positioning; no DS spacing token maps to this. Accept as justified suppression with [DS-06] tag already in place.
  - Evidence: `checkins/tooltip/Tooltip.tsx:99-100`

- Q: Can JS-computed position coordinates in `_BookingTooltip.tsx` be replaced with CSS?
  - A: No — the tooltip renders at mouse cursor position. Inline style with JS-computed `top`/`left` is the only approach for a floating tooltip anchored to cursor. The `position: fixed` and `zIndex` could potentially use CSS classes but `top`/`left` must remain inline.
  - Evidence: `roomgrid/_BookingTooltip.tsx:31-36`

### Open (Operator Input Required)

None. All questions self-resolved from evidence and standard DS constraints.

## Confidence Inputs

- Implementation: 92% — both inline-style patterns are clear (2 files); layout primitive swap is mechanical (215 instances across ~40 files with clear 1:1 mapping); partial inline styles must remain for JS-computed positions. Raises to 95% once zIndex migration approach for `_BookingTooltip` is resolved in analysis.
- Approach: 85% — the JS-computed position constraint on `_BookingTooltip` requires a hybrid approach (keep `top`/`left` inline); zIndex migration approach unresolved (see evidence note). Raises to 92% once DS zIndex token or suppression approach is confirmed.
- Impact: 90% — visual behavior equivalence is the main risk; existing test suite provides structural guard; no data/API risk. Raises to 95% after parent-relative ancestor verified for `KeycardDepositMenu`.
- Delivery-Readiness: 85% — work is mechanical but high in volume (215 layout class instances); safe to break into parallel screen-group tasks. Raises to 90% after per-screen grep confirms counts.
- Testability: 80% — CI tests will catch structural regressions; visual equivalence requires manual spot-check post-deploy. Raises to 88% if a snapshot update strategy is defined per screen group.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Layout gap default mismatch — DS `<Inline gap="2">` vs current `gap-2` | Medium | Medium | Verify DS Inline gap prop maps to same spacing token before swapping; spot-check per component |
| _BookingTooltip position breaks if `top`/`left` inline style is removed | High | High | Keep computed coordinates inline; only migrate `position: fixed` and `zIndex` to classes |
| `_BookingTooltip` zIndex: 10000 — `z-[10000]` would be a new arbitrary-value violation | High | Medium | **Not yet resolved** — analysis must determine correct approach (DS zIndex token, CSS custom property, or justified suppression with `ds/no-arbitrary-tailwind` comment) |
| KeycardDepositMenu absolute position loses coordinates | High | High | Keep computed `top`/`left` inline; add `position: absolute` as Tailwind class |
| KeycardDepositMenu parent not `relative` — `absolute` class with no `relative` ancestor breaks layout | Medium | High | **Not yet verified** — must confirm parent component has `relative` class; if not, add it as part of this task |
| DS primitive import adds bundle weight | Low | Low | DS primitives are already imported in ~10 files; tree-shaking handles unused exports |
| CI test failures from snapshot drift after layout swap | Low | Medium | Update snapshots intentionally as part of each task; verify test output |
| Merge conflicts with in-progress inbox development | Medium | Medium | Prioritise inline-style fix first; coordinate layout migration ordering with any active inbox PRs |

## Planning Constraints & Notes

- Must-follow patterns:
  - For JS-computed position coordinates, keep `top`/`left` in inline `style={}` but add `position: absolute/fixed` and `zIndex` as Tailwind CSS classes
  - When migrating `className="flex items-center gap-2"` → `<Inline gap="2" align="center">`, verify DS Inline prop values produce identical computed styles
  - Group migration by screen (screen-group tasks are non-overlapping file sets) to allow safe parallel execution
- Rollout/rollback expectations:
  - Deploy as a single release or screen-group batches; no multi-step migration required
  - Rollback: `git revert` on the commit(s)
- Observability expectations:
  - None — no observability changes required for a structural layout compliance fix

## Suggested Task Seeds (Non-binding)

1. Fix inline styles: `KeycardDepositMenu` + `_BookingTooltip` (2 files, highest priority — blocks theme system; resolve zIndex approach in analysis first)
2. Migrate layout primitives — Checkins/Rooms screen group (~46 instances, ~12 files)
3. Migrate layout primitives — Inbox screen group (~40 instances, ~8 files)
4. Migrate layout primitives — Till screen group (~22 instances, ~6 files)
5. Migrate layout primitives — Safe, Bar/POS, User Management, Login screen groups (remaining ~107 instances, ~14 files)

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: All `style={{` props removed from production components (except justified `top`/`left` on JS-anchored tooltips); all flex/grid layout patterns use DS primitives; ESLint `ds/enforce-layout-primitives` produces 0 warnings; existing tests pass
- Post-delivery measurement plan: CI lint pass (ds rules); manual spot-check of tooltip positioning and dropdown alignment in browser

## Evidence Gap Review

### Gaps Addressed

- File paths in pre-gathered audit were incorrect; all actual file paths verified via direct grep
- Raw button element claim (97 instances) was incorrect; verified zero raw buttons in production
- RowCell inline opacity style claim was incorrect; verified it uses Tailwind classes

### Confidence Adjustments

- Implementation confidence raised from estimate to 92% after path verification
- Class 2 (raw buttons) eliminated — scope is narrower than originally thought; this accelerates delivery
- Class 1 (inline styles) corrected to 2 files (not 6); `Tooltip.tsx` `ml-[100px]` is an arbitrary class, not inline style — already suppressed

### Remaining Assumptions

- DS `<Inline>` / `<Stack>` / `<Cluster>` prop-to-CSS mapping has not been verified per-component; assumes equivalent defaults for `gap` and `align` values
- No visual regression test suite exists; manual spot-check is the only visual verification path

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Inline style violations (2 files) | Yes | None — clear pattern, 2 files only | No |
| Arbitrary bracket values (3 instances) | Yes | All 3 already suppressed with justification; no action needed | No |
| Raw layout classes (~215 instances) | Yes | High volume but mechanical; per-screen grouping enables safe parallel execution | No |
| JS-computed position retention | Yes | [UX/States Moderate]: _BookingTooltip and KeycardDepositMenu must retain `top`/`left` in inline style; `position` and `zIndex` can migrate to classes | No — pattern documented in constraints |
| DS primitive equivalence | Partial | [UI/visual Advisory]: gap/alignment defaults not verified per-component | No — resolved in execution by spot-checking |
| Test coverage | Yes | Existing tests provide structural guard; no new test authoring needed for layout swap | No |

## Analysis Readiness

- Status: Ready-for-analysis
- Critique score: 4.0 / 5.0 (Round 1, 2026-03-13) — verdict: credible
- Blocking items: None
- Recommended next step: `/lp-do-analysis reception-design-system-compliance`

## Scope Signal

- Signal: right-sized
- Rationale: Scope is bounded to 2 inline-style files and 215 layout class migrations across known screen groups. DS Button already adopted (zero raw buttons). All arbitrary bracket values already formally suppressed. Work is mechanical and parallel-safe by screen group.
