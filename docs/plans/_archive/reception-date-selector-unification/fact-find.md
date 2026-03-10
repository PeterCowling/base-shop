---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-date-selector-unification
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-date-selector-unification/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309113000-0001
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Date Selector Unification — Fact-Find Brief

## Scope

### Summary

Five near-identical date selector components exist across the `apps/reception` application, all implementing the same "quick date buttons + optional DayPicker calendar" pattern. They differ only in: (1) whether the DayPicker is always shown or gated on a privilege check, (2) how many quick-select days appear, (3) whether the calendar renders inline vs as an absolute-positioned popup, (4) DayPicker calendar constraint logic for restricted users, and (5) one component (`DateSelectorAllo`) includes an additional "Test Mode" checkbox. The goal is to extract a single shared `DateSelector` component under `apps/reception/src/components/common/` parameterised for these dimensions, and migrate all five callers.

### Goals
- Extract one shared base component that handles all five use-cases via props
- Eliminate all five per-feature copies; callers import from `common/`
- Preserve all existing per-feature behaviour exactly (no regressions)
- Update existing tests to point at the shared component or mock it consistently

### Non-goals
- Changing the underlying date-selection UX or business logic
- Migrating to a different calendar library
- Adding new permission levels or role types
- Touching any other components in `apps/reception/src/components/common/`

### Constraints & Assumptions
- Constraints:
  - Must not change public behaviour observable by callers (quick-select dates, calendar availability, DayPicker constraints)
  - DayPicker `classNames` block is heavily duplicated but identical in 4/5 components; one variant (`DateSelectorPP`) differs on `today` and `selected` tokens — this difference must be preserved or resolved by prop
  - `DateSelectorAllo` has a unique extra prop (`testMode`, `onTestModeChange`) that renders a privileged-only checkbox — this must remain supported via optional props or a slot
  - Callers pass `username?: string` that is currently ignored — prop should remain accepted (unused) to avoid caller-side changes, or callers can be updated to drop it
  - `checkout/DaySelector` does NOT use AuthContext at all — it renders an always-open inline calendar without any privilege gating. This is a genuine semantic difference.
- Assumptions:
  - No callers outside `apps/reception/src` import these components (monorepo boundary; confirmed by absence of cross-package imports)
  - `apps/reception` has no explicit barrel/index re-exports for these components; callers use direct relative paths
  - The `parseDate` alias (`export const parseDate = parseLocalDate`) in `dateUtils.ts` is the reason two components import `parseDate` while one imports `parseLocalDate` — they are functionally equivalent

## Outcome Contract

- **Why:** 5 copies of the same component means any date selector bug or UI change requires 5 coordinated edits. Maintenance cost is linear in duplication; bugs already diverge (e.g. inline vs popup calendar, inconsistent DayPicker color tokens).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A single shared `DateSelector` component in `common/` replaces all 5 variants. Access-level and quick-range differences are parameterised. All 5 callers are migrated. Existing tests pass.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

All five components are imported and rendered directly in their respective parent screens/toolbars:

- `apps/reception/src/components/checkout/Checkout.tsx` — imports `DaySelector` from `./DaySelector`, renders at line 341
- `apps/reception/src/components/checkins/view/CheckinsTable.tsx` — imports `DateSelector` from `../DateSelector`, renders at line 133
- `apps/reception/src/components/prepare/PrepareDashboard.tsx` — imports `DateSelector` from `./DateSelectorPP`, renders at line 72
- `apps/reception/src/components/loans/LoanFilters.tsx` — imports `DateSelector` from `./DateSel`, renders at line 24; passes `username` prop
- `apps/reception/src/components/man/Alloggiati.tsx` — imports `DateSelectorCI` from `./DateSelectorAllo`, renders at line 311; passes `testMode`/`onTestModeChange`

### Key Modules / Files

| File | Role |
|------|------|
| `apps/reception/src/components/checkout/DaySelector.tsx` | No AuthContext, always-available inline calendar, `Cluster` layout, 5 forward days |
| `apps/reception/src/components/checkins/DateSelector.tsx` | Full role-aware: `isPrivileged` for quick-range, `canAccess(RESTRICTED_CALENDAR_ACCESS)` for DayPicker gating; DayPicker constrained to today+tomorrow for admin/manager; popup calendar; `Inline` layout |
| `apps/reception/src/components/prepare/DateSelectorPP.tsx` | `isPrivileged` for DayPicker only; `today` and `selected` DayPicker classNames differ (`text-warning`/`bg-warning` vs `text-primary-main`/`bg-primary-main`); popup calendar; `Cluster`+`Inline` layout; accepts (but ignores) `username?` |
| `apps/reception/src/components/loans/DateSel.tsx` | `isPrivileged` for DayPicker only; identical DayPicker classNames to `man/DateSelectorAllo`; popup calendar; `Cluster`+`Inline` layout; accepts (but ignores) `username?` |
| `apps/reception/src/components/man/DateSelectorAllo.tsx` | `isPrivileged` for DayPicker only; adds `testMode`/`onTestModeChange` privileged-only checkbox; identical DayPicker classNames to `DateSel`; popup calendar; `Inline` layout |
| `apps/reception/src/utils/dateUtils.ts` | Shared date utilities used by all 5 components; `buildQuickDateRange`, `formatDateForInput`, `getWeekdayShortLabel`, `parseLocalDate`; `parseDate` is an alias for `parseLocalDate` (line 876) |
| `apps/reception/src/lib/roles.ts` | `isPrivileged`, `canAccess`, `Permissions.RESTRICTED_CALENDAR_ACCESS` |
| `apps/reception/src/context/AuthContext.tsx` | `useAuth()` hook consumed by 4/5 components (all except `DaySelector`) |
| `apps/reception/src/components/common/FilterToolbar.tsx` | Mentions both `checkins/DateSelector` and `checkout/DaySelector` in its JSDoc — post-migration docs should reference the shared component |

### Patterns & Conventions Observed

- **Shared layout primitives**: all components import `Button` from `@acme/design-system/atoms`; layout uses `Cluster` and/or `Inline` from `@acme/design-system/primitives`
- **Click-outside dismiss**: 4/5 components implement `useEffect` + `useRef` for click-outside calendar dismissal; `DaySelector` (checkout) uses inline expansion instead and has no click-outside logic
- **AuthContext consumption**: `useAuth()` called inside the component body in 4/5 cases — the shared component should continue to call it internally (no prop-drilling of user)
- **`username` prop pattern**: 3 components accept `username?: string` but immediately reassign to `_username` (ignored). Three runtime callers pass it: `Checkout.tsx` (passes `user.user_name`), `PrepareDashboard.tsx` (passes `user?.user_name ?? ""`), and `LoanFilters.tsx` (passes `username` from its own prop). In all cases the value is ignored by the component. The prop exists for legacy compatibility and will be kept in the shared interface with a `@deprecated` comment; no callers are updated in this PR.
- **DayPicker classNames divergence**: `DateSelectorPP` uses `text-warning`/`bg-warning` tokens for `today` and `selected` states; all other components use `text-primary-main`/`bg-primary-main`. This is the only meaningful visual difference beyond layout.
- **`memo()` wrapping**: 2/5 components (`DaySelector`, `DateSel`) are wrapped with `memo`; the shared component should be `memo`-wrapped.
- **Calendar placement**: `DaySelector` (checkout) places the DayPicker inline below the button row. All others use `absolute z-10 mt-2` popup positioning.

### Component Behaviour Matrix

| Variant | Quick days (non-priv) | Quick days (priv) | Yesterday shown | DayPicker access | DayPicker constraint | Calendar style | Extra props |
|---|---|---|---|---|---|---|---|
| `checkout/DaySelector` | Today + 5 ahead | same (no auth) | Yes (always) | Always | None | Inline | `username?` (ignored) |
| `checkins/DateSelector` | Today + 1 ahead | Today + 5 ahead | Priv only | `RESTRICTED_CALENDAR_ACCESS` (admin+) | today+tomorrow for admin/manager | Popup | none |
| `prepare/DateSelectorPP` | Today + 5 ahead | same | Yes (always) | Priv only | None | Popup | `username?` (ignored) |
| `loans/DateSel` | Today + 5 ahead | same | Yes (always) | Priv only | None | Popup | `username?` (ignored) |
| `man/DateSelectorAllo` | Today + 5 ahead | same | Yes (always) | Priv only | None | Popup | `testMode`, `onTestModeChange` |

### Data & Contracts

- **Props (current):**
  - Common: `selectedDate: string` (YYYY-MM-DD), `onDateChange: (date: string) => void`
  - Optional legacy: `username?: string` (ignored in all 5)
  - `DateSelectorAllo` only: `testMode: boolean`, `onTestModeChange: (val: boolean) => void`
- **Auth contract:** `useAuth()` returns `{ user: User | null }` where `User` has `roles: UserRole[]`
- **Date contract:** all date strings are "YYYY-MM-DD" local; `buildQuickDateRange(n)` returns `{ today, yesterday, nextDays: string[] }`
- **Proposed shared interface:**
  ```ts
  interface DateSelectorProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    // Access mode: 'unrestricted' skips auth check entirely (checkout use case)
    accessMode?: 'unrestricted' | 'privileged-calendar' | 'role-aware-calendar';
    // Calendar placement: 'inline' (checkout) vs 'popup' (all others)
    calendarPlacement?: 'inline' | 'popup';
    // Number of ahead days shown when non-privileged (1 = tomorrow only, 5 = full week ahead)
    nonPrivQuickDays?: number;
    // Whether to show yesterday button for non-privileged users
    showYesterday?: boolean;
    // DayPicker selected/today colour variant
    calendarColorVariant?: 'primary' | 'warning';
    // Alloggiati-specific test mode slot
    testMode?: boolean;
    onTestModeChange?: (val: boolean) => void;
    // Deprecated — accepted but unused
    username?: string;
  }
  ```

### Dependency & Impact Map

- **Upstream dependencies:**
  - `@acme/design-system/atoms` (Button)
  - `@acme/design-system/primitives` (Cluster, Inline)
  - `react-day-picker` (DayPicker)
  - `../../context/AuthContext` (useAuth)
  - `../../lib/roles` (isPrivileged, canAccess, Permissions)
  - `../../utils/dateUtils` (buildQuickDateRange, formatDateForInput, getWeekdayShortLabel, parseDate/parseLocalDate, addDays)
- **Downstream callers (5 total):**
  - `checkout/Checkout.tsx` → `checkout/DaySelector.tsx`
  - `checkins/view/CheckinsTable.tsx` → `checkins/DateSelector.tsx`
  - `prepare/PrepareDashboard.tsx` → `prepare/DateSelectorPP.tsx`
  - `loans/LoanFilters.tsx` → `loans/DateSel.tsx`
  - `man/Alloggiati.tsx` → `man/DateSelectorAllo.tsx`
- **Likely blast radius:** Contained entirely within `apps/reception/src`. No cross-app, cross-package, or API impacts. The DayPicker `classNames` object is purely presentational. Auth checks are internal to the shared component. Type contract change (new props) is backward-compatible.
- **Test blast radius:** 7 test files reference these components directly or mock them:
  - `checkins/__tests__/CheckinsUI.test.tsx` — imports and renders `checkins/DateSelector` directly
  - `parity/__tests__/checkin-route.parity.test.tsx` — mocks `checkins/DateSelector`; also passes `username="Pete"` as a caller-level prop
  - `prepare/__tests__/PrepareDashboard.test.tsx` — mocks `prepare/DateSelectorPP`
  - `loans/__tests__/DateSel.test.tsx` — imports and renders `loans/DateSel` directly
  - `loans/__tests__/LoanFilters.test.tsx` — mocks `loans/DateSel`
  - `man/__tests__/DateSelectorAllo.test.tsx` — imports and renders `man/DateSelectorAllo` directly
  - `man/__tests__/Alloggiati.test.tsx` — mocks `man/DateSelectorAllo`
- **JSDoc follow-up:** `apps/reception/src/components/common/FilterToolbar.tsx` JSDoc lines 9-10 explicitly name `checkins/DateSelector` and `checkout/DaySelector` as example children — this comment must be updated to reference `common/DateSelector` after migration.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library (`@testing-library/react`, `@testing-library/user-event`)
- testIdAttribute: `data-cy` (per `jest.setup.ts`)
- CI integration: tests run in CI only via governed runner (`pnpm -w run test:governed`)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `checkins/DateSelector` | Unit | `checkins/__tests__/CheckinsUI.test.tsx` | Quick button click, calendar toggle visible/hidden by role |
| `loans/DateSel` | Unit | `loans/__tests__/DateSel.test.tsx` | Quick-select callback; no DayPicker-open test |
| `loans/LoanFilters` | Integration | `loans/__tests__/LoanFilters.test.tsx` | Mocks DateSel, tests prop pass-through |
| `man/DateSelectorAllo` | Unit | `man/__tests__/DateSelectorAllo.test.tsx` | Quick button, test mode toggle visibility |
| `man/Alloggiati` | Integration | `man/__tests__/Alloggiati.test.tsx` | Mocks DateSelectorAllo |
| `checkin-route parity` | Parity | `parity/__tests__/checkin-route.parity.test.tsx` | Mocks DateSelector |
| `checkout/DaySelector` | None found | — | No direct unit test for `DaySelector` |
| `prepare/DateSelectorPP` | Mocked only | `prepare/__tests__/PrepareDashboard.test.tsx` | No direct unit test for `DateSelectorPP` |

#### Coverage Gaps
- `checkout/DaySelector` has no direct unit test — the inline calendar path is untested
- `prepare/DateSelectorPP` has no direct unit test for its warning-coloured calendar variant
- No test covers the `checkins/DateSelector` restricted calendar constraint (today+tomorrow limit for admin/manager users)
- After migration: mock paths in 5 test files will need updating to reference `common/DateSelector` instead of their per-feature path. The `loans/__tests__/DateSel.test.tsx` direct render test will need the largest update (or can become a smoke test of the shared component with the relevant props).

#### Testability Assessment
- Easy to test: quick-button rendering, onDateChange callback, testMode visibility toggle
- Hard to test: DayPicker calendar selection (react-day-picker internals); click-outside dismiss (jsdom limitation)
- Test seams needed: AuthContext mock already established in existing tests — pattern is consistent and reusable for the shared component

### Recent Git History (Targeted)

Key relevant commits touching these files:
- `77bf4e8b` `feat(reception): RBAC wave 2+3 — DateSelector role-based calendar access, remove username prop` — introduced `RESTRICTED_CALENDAR_ACCESS` permission and the two-tier calendar constraint in `checkins/DateSelector`. The `username` prop was marked for removal here but callers weren't all updated.
- `af1f086f` `feat(reception): Wave 4 — PrepareDashboard, RealTimeDashboard, CheckinsTable` — last touch to `prepare/DateSelectorPP` context.
- `3e549ddb` `chore: checkpoint pending workspace updates` — most recent across the board; no functional changes to these files.

No recent divergence in the component implementations — the 5-way split is stable and not actively evolving in different directions.

## Questions

### Resolved

- Q: Should `checkout/DaySelector`'s inline calendar be preserved or converted to popup?
  - A: Preserve as-is. The inline calendar is an intentional design choice (JSDoc says "avoid popup timing races"). The shared component's `calendarPlacement` prop controls this.
  - Evidence: `checkout/DaySelector.tsx` JSDoc line 22–23.

- Q: Is the `username` prop actually used anywhere?
  - A: Three runtime callers pass `username`: `Checkout.tsx` (line 344, passes `user.user_name`), `PrepareDashboard.tsx` (line 75, passes `user?.user_name ?? ""`), and `LoanFilters.tsx` (line 27, passes its own `username` prop). In all 3 cases the component ignores the value immediately (`username: _username`). `parity/__tests__/checkin-route.parity.test.tsx` passes `username` to `CheckinsTableView`, not to `DateSelector` — this is not evidence of selector-level usage. **Migration contract (single chosen path):** keep `username?: string` in the shared component interface (marked `@deprecated`, accepted but unused). Do NOT remove it from any of the 3 callers in this PR. Migration is purely additive; callers can drop the prop in a separate clean-up PR.
  - Evidence: `checkout/Checkout.tsx` line 344; `prepare/PrepareDashboard.tsx` line 75; `loans/LoanFilters.tsx` line 27; `loans/DateSel.tsx` line 43.

- Q: Where should the shared component live?
  - A: `apps/reception/src/components/common/DateSelector.tsx` — consistent with the existing `common/` directory which holds `FilterToolbar`, `PageShell`, `TableCard`, etc.
  - Evidence: `apps/reception/src/components/common/` glob scan.

- Q: Are all 5 callers within `apps/reception/src`?
  - A: Yes. No cross-package imports found. Blast radius is fully contained.
  - Evidence: Grep for all 5 component names across `apps/reception/src/**/*.tsx`.

- Q: Should the DayPicker `classNames` block be extracted to a shared constant?
  - A: Yes. The classNames block is 20+ lines and identical in 4/5 variants. It should be defined once (e.g. `DAY_PICKER_CLASS_NAMES` constant in the shared component file or a separate `dayPickerClassNames.ts` utility). The one divergent variant (`DateSelectorPP`, using warning tokens) can be handled via the `calendarColorVariant` prop.
  - Evidence: Comparison of `DateSel.tsx` lines 138–159 vs `DateSelectorPP.tsx` lines 119–142 — token differences on `today` and `selected` keys only.

- Q: How does the shared component preserve the `DateSelectorAllo` test-mode checkbox UI?
  - A: `DateSelectorAllo` renders `<Input type="checkbox" ...>` + a `<span>Test Mode?</span>` label inside a privileged-only `<label>` block using `Input` from `@acme/design-system` (bare import, not sub-path). This is UI that is unique to the Alloggiati screen. The shared component accepts optional `testMode?: boolean` and `onTestModeChange?: (val: boolean) => void` props. When both are provided AND the user `isPrivileged`, the component renders the checkbox block at the trailing end of its flex row — identical positioning to the original. The `Input` import from `@acme/design-system` is retained in the shared component file (it works in common components per other files in that directory). The checkbox rendering is a 4-line block, not a composition concern — no slot abstraction needed.
  - Evidence: `man/DateSelectorAllo.tsx` lines 167-178 (the checkbox block); `apps/reception/src/components/common/CashCountingForm.tsx` (uses `@acme/design-system` imports freely — same directory, confirming the import pattern is valid).

- Q: Can `checkins/DateSelector`'s two-tier calendar restriction (admin/manager limited to today+tomorrow) fit in the shared prop interface?
  - A: Yes. `accessMode: 'role-aware-calendar'` triggers both the quick-range adjustment (1 day for non-privileged) and the DayPicker constraint (today+tomorrow for `RESTRICTED_CALENDAR_ACCESS` but non-privileged users). The constraint logic stays internal.
  - Evidence: `checkins/DateSelector.tsx` lines 51–55 (quick range), lines 157–165 (DayPicker fromDate/toDate constraint).

### Open (Operator Input Required)

None. All design decisions are resolvable from the existing codebase evidence.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| All 5 component files read | Yes | None | No |
| Caller import sites identified | Yes | None | No |
| dateUtils / roles / AuthContext contracts | Yes | None | No |
| DayPicker classNames divergence | Yes | None — divergence is minor and parameterisable | No |
| Test file coverage mapped | Yes | None — gaps noted, not blockers | No |
| Cross-package / monorepo blast radius | Yes | None | No |
| `DateSelectorAllo` extra props (testMode) | Yes | None — handled via optional props | No |

## Scope Signal

Signal: right-sized

Rationale: The five components have been read in full, all callers identified, all 7 test files located, and one required JSDoc update in `FilterToolbar.tsx` noted. The behavioural differences are enumerable (6 parameters) and all are resolvable via props. No external API, database, or service is touched. Blast radius is confined to `apps/reception/src`. The existing test coverage gives adequate regression coverage post-migration.

## Confidence Inputs

- **Implementation:** 95%
  - Evidence: All 5 components fully read; prop surface analysed; caller sites identified. No unknowns.
  - What would raise it: Nothing meaningful — already at ceiling for pre-build stage.
- **Approach:** 90%
  - Evidence: Prop-parameterisation approach is the minimal-risk path; it preserves all existing behaviour and allows 1-for-1 migration. Shared classNames constant is a known pattern.
  - What would raise to >=90: Already there. A minor risk remains around the `DayPicker` inline vs popup layout (could introduce wrapper div differences); addressed by the `calendarPlacement` prop.
- **Impact:** 90%
  - Evidence: Zero cross-app impact; 5 files deleted, 5 callers updated, 1 new component created, 7 test files updated, 1 JSDoc updated.
  - What would raise to >=90: Already there.
- **Delivery-Readiness:** 92%
  - Evidence: No blockers; clear task decomposition possible; 7 test files and 1 JSDoc update identified; test seams established.
  - What would raise to >=90: Already there.
- **Testability:** 80%
  - Evidence: AuthContext mock pattern is established in 3 of 5 existing test files; `data-cy` test IDs required.
  - What would raise to >=80: Already there. What would raise to >=90: Add a direct unit test for the `DaySelector` (checkout) inline calendar path (currently untested).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Inline vs popup layout change breaks `checkout/Checkout` visual layout | Low | Medium | Preserve `calendarPlacement: 'inline'` exactly; test renders checkout with the shared component before deleting the original |
| `checkins/DateSelector` calendar constraint (today+tomorrow) regresses | Low | Medium | Existing `CheckinsUI.test.tsx` covers calendar toggle visibility by role; add assertion for restricted date range if not already present |
| Test mock paths break after migration | Medium | Low | 4 test files need mock path updates (`PrepareDashboard.test.tsx`, `LoanFilters.test.tsx`, `Alloggiati.test.tsx`, `checkin-route.parity.test.tsx`); 3 direct-render test files (`CheckinsUI.test.tsx`, `DateSel.test.tsx`, `DateSelectorAllo.test.tsx`) need import path updates and prop adaptation; CI catches regressions |
| DayPicker `classNames` subtle visual regression | Low | Low | The warning-colour variant (`DateSelectorPP`) is preserved via `calendarColorVariant` prop; no visual testing required beyond confirming prop flows correctly |
| `@acme/design-system` import `Input` in `DateSelectorAllo` (bare import, not sub-path) | Low | Low | Verify this import is acceptable in the shared component's context; if not, replace with `@acme/design-system/atoms` sub-path import |

## Planning Constraints & Notes

- Must-follow patterns:
  - New shared component in `apps/reception/src/components/common/DateSelector.tsx`
  - `memo()` wrap on the exported component
  - `useCallback` / `useMemo` for performance-sensitive handlers (match existing pattern)
  - `data-cy` test IDs for any new DOM nodes targeted by tests
  - DayPicker classNames in a named constant (not inline object)
  - Keep `AuthContext` consumption internal to the shared component — do not prop-drill `user`
- Rollout/rollback expectations:
  - Atomic migration: write shared component, migrate all 5 callers, delete originals, update tests — all in one PR
  - No feature flag needed (pure refactor, same behaviour)
- Observability expectations:
  - None required — no server-side logic, no analytics events

## Suggested Task Seeds (Non-binding)

1. Write `apps/reception/src/components/common/DateSelector.tsx` (shared component with full prop interface)
2. Migrate `checkout/Checkout.tsx` to import from `common/DateSelector` (accessMode: unrestricted, calendarPlacement: inline); delete `checkout/DaySelector.tsx`
3. Migrate `checkins/view/CheckinsTable.tsx` to `common/DateSelector` (accessMode: role-aware-calendar); delete `checkins/DateSelector.tsx`
4. Migrate `prepare/PrepareDashboard.tsx` to `common/DateSelector` (calendarColorVariant: warning); delete `prepare/DateSelectorPP.tsx`
5. Migrate `loans/LoanFilters.tsx` to `common/DateSelector`; delete `loans/DateSel.tsx`; keep `username` prop pass-through (deprecated, accepted but unused in shared component)
6. Migrate `man/Alloggiati.tsx` to `common/DateSelector` (testMode/onTestModeChange); delete `man/DateSelectorAllo.tsx`
7. Update all 7 affected test files to reference `common/DateSelector` in mocks; update `loans/__tests__/DateSel.test.tsx` to test shared component directly; update `FilterToolbar.tsx` JSDoc
8. Typecheck + lint gate (`pnpm --filter @apps/reception typecheck && pnpm --filter @apps/reception lint`)
9. Push to `origin/dev`; monitor CI (`gh run watch`)

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `apps/reception/src/components/common/DateSelector.tsx` exists
  - All 5 original files deleted
  - All 5 callers updated (imports verified)
  - All 7 affected test files updated; no test file still references a deleted component path
  - `FilterToolbar.tsx` JSDoc updated to reference `common/DateSelector`
  - `pnpm --filter @apps/reception typecheck && pnpm --filter @apps/reception lint` passes
  - CI green on `origin/dev`
- Post-delivery measurement plan:
  - CI green (regression check)
  - No visual regressions reported in next ops session

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity:** All 5 component files read in full; all caller import sites confirmed by grep; roles/auth/dateUtils contracts verified; `FilterToolbar.tsx` JSDoc cross-reference confirmed. No non-trivial claim is unsourced.
2. **Boundary coverage:** No external API, database, or service boundary. Auth is internal React context — no boundary crossing. Error paths: none specific to these components (they are pure UI selectors).
3. **Testing coverage:** All 7 test files located and reviewed. Existing test strategy (AuthContext mock, direct render) confirmed. Coverage gaps explicitly identified (checkout inline calendar untested, prepare warning-colour variant untested).
4. **Business validation:** N/A — pure code refactor. No business hypotheses required.
5. **Confidence calibration:** Scores reflect direct evidence from file reads. Implementation confidence is high because the scope is fully enumerable.

### Confidence Adjustments

- No downward adjustments required — all evidence is concrete and direct.
- Testability capped at 80% (not 90%) because the checkout inline calendar path currently has no test, representing a known gap.

### Remaining Assumptions

- The `@acme/design-system` bare import in `DateSelectorAllo` (line 13: `import { Input } from "@acme/design-system"`) works in the shared component context. Assumed yes — other common components use DS imports freely. Verify during build.
- `DayPicker` renders identically whether the `classNames` object is defined inline or as an external constant. This is a safe assumption (same object reference effect per React reconciler).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-date-selector-unification --auto`
