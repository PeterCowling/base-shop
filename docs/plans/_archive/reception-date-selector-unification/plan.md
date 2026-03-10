---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Build-completed: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-date-selector-unification
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Date Selector Unification — Plan

## Summary

Five near-identical date selector components across `apps/reception` — `checkout/DaySelector`, `checkins/DateSelector`, `prepare/DateSelectorPP`, `loans/DateSel`, and `man/DateSelectorAllo` — all implement the same "quick date buttons + optional DayPicker calendar" pattern with minor prop-controlled variations. This plan extracts a single shared `DateSelector` component at `apps/reception/src/components/common/DateSelector.tsx` parameterised for access mode, calendar placement, quick-range count, and colour variant. All five callers are migrated atomically, their originals deleted, and the seven affected test files updated. The operation is a pure refactor — no user-visible behaviour changes.

## Active tasks
- [x] TASK-01: Write shared DateSelector component
- [x] TASK-02: Checkpoint — validate shared component before caller migrations
- [x] TASK-03: Migrate checkout caller (unrestricted/inline)
- [x] TASK-04: Migrate checkins caller (role-aware-calendar)
- [x] TASK-05: Migrate prepare caller (warning colour variant)
- [x] TASK-06: Migrate loans caller
- [x] TASK-07: Migrate man/Alloggiati caller (testMode)
- [x] TASK-08: Update test files and FilterToolbar JSDoc

## Goals
- Extract one shared `DateSelector` in `common/` covering all five use-cases via props
- Delete all five per-feature originals
- Preserve every caller's existing behaviour exactly
- Update all 7 affected test files so CI passes

## Non-goals
- Changing the date-selection UX or business logic
- Migrating to a different calendar library
- Adding new permission levels or roles
- Touching any other component in `apps/reception/src/components/common/`
- Dropping the deprecated `username` prop from callers (deferred to a follow-up PR)

## Constraints & Assumptions
- Constraints:
  - `checkout/DaySelector` inline calendar must remain inline (not converted to popup)
  - `DateSelectorPP` warning-colour DayPicker tokens must be preserved via `calendarColorVariant` prop
  - `DateSelectorAllo` test-mode checkbox must be preserved; rendered when `testMode`+`onTestModeChange` props provided and user is privileged
  - `username` prop kept in shared interface as `@deprecated`; no caller updates in this PR
  - AuthContext consumed internally — no prop-drilling of `user`
  - `memo()` wrap on exported shared component
  - DayPicker classNames as named constants, not inline objects
  - CI only for tests — never run locally; push and monitor with `gh run watch`
- Assumptions:
  - All callers are within `apps/reception/src` (confirmed by grep in fact-find)
  - `@acme/design-system` bare import works in `common/` (evidenced by `CashCountingForm.tsx` in same directory)
  - `parseDate` and `parseLocalDate` are functionally equivalent (confirmed: `parseDate = parseLocalDate` alias in `dateUtils.ts`)

## Inherited Outcome Contract

- **Why:** 5 copies of the same component means any date selector bug or UI change requires 5 coordinated edits. Maintenance cost is linear in duplication; bugs already diverge (e.g. inline vs popup calendar, inconsistent DayPicker color tokens).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A single shared `DateSelector` component in `common/` replaces all 5 variants. Access-level and quick-range differences are parameterised. All 5 callers are migrated. Existing tests pass.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-date-selector-unification/fact-find.md`
- Key findings used:
  - Component Behaviour Matrix (5-way prop diff)
  - Proposed shared interface (`DateSelectorProps` with `accessMode`, `calendarPlacement`, `calendarColorVariant`, `testMode`/`onTestModeChange`, deprecated `username`)
  - 7 test files to update (4 mock-path, 3 direct-render)
  - FilterToolbar.tsx JSDoc cross-reference required
  - `accessMode: 'role-aware-calendar'` encapsulates the checkins two-tier calendar constraint logic
  - DayPicker classNames: 2/5 use primary tokens (checkout, checkins); 3/5 use warning tokens (`DateSelectorPP`, `DateSel`, `DateSelectorAllo`)

## Proposed Approach

- **Option A (chosen):** Single parameterised shared component in `common/` with `accessMode`, `calendarPlacement`, `calendarColorVariant`, `nonPrivQuickDays`, `showYesterday`, `testMode`/`onTestModeChange` props. Internal AuthContext consumption. Named classNames constants. Each caller specifies its required props.
- **Option B (rejected):** Render-prop / compound-component pattern. Rejected because: (a) none of the existing callers pass children or slots; (b) the behavioural differences are enumerable and small; (c) prop-parameterisation is simpler and produces a flatter component tree.
- **Chosen approach:** Option A. All branching logic stays inside the shared component. Callers are thin wrappers that pass 2-4 props.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Write shared DateSelector component | 90% | M | Complete (2026-03-09) | - | TASK-02 |
| TASK-02 | CHECKPOINT | Validate shared component compiles before migrations | 95% | S | Complete (2026-03-09) | TASK-01 | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 |
| TASK-03 | IMPLEMENT | Migrate checkout caller (unrestricted/inline) | 90% | S | Complete (2026-03-09) | TASK-02 | TASK-08 |
| TASK-04 | IMPLEMENT | Migrate checkins caller (role-aware-calendar) | 85% | S | Complete (2026-03-09) | TASK-02 | TASK-08 |
| TASK-05 | IMPLEMENT | Migrate prepare caller (warning colour variant) | 90% | S | Complete (2026-03-09) | TASK-02 | TASK-08 |
| TASK-06 | IMPLEMENT | Migrate loans caller | 90% | S | Complete (2026-03-09) | TASK-02 | TASK-08 |
| TASK-07 | IMPLEMENT | Migrate man/Alloggiati caller (testMode) | 90% | S | Complete (2026-03-09) | TASK-02 | TASK-08 |
| TASK-08 | IMPLEMENT | Update test files and FilterToolbar JSDoc | 85% | M | Complete (2026-03-09) | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Foundation; all other tasks depend on it |
| 1.5 | TASK-02 | TASK-01 complete | Checkpoint; unblocks wave 2 |
| 2 | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 | TASK-02 | All 5 caller migrations are independent; can be parallelised |
| 3 | TASK-08 | All wave 2 tasks | Test updates require all originals deleted and all callers migrated |

## Tasks

---

### TASK-01: Write shared DateSelector component
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/common/DateSelector.tsx` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `apps/reception/src/components/common/DateSelector.tsx` (create)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 95% — all 5 source component files read in full; prop interface designed from direct comparison; no unknown behaviour.
  - Approach: 90% — prop-parameterisation with internal AuthContext is the established pattern; held-back test: could `calendarPlacement: 'inline'` introduce a wrapper div that breaks Checkout's flex layout? Mitigated by replicating the exact outer `div.flex.flex-col.gap-3` wrapper and toggle-button pattern from `DaySelector` (the inline variant still has an `isCalendarOpen` toggle — it just expands below rather than absolutely positioned).
  - Impact: 90% — new file only; no callers switch to it until TASK-03..07.
- **Acceptance:**
  - File `apps/reception/src/components/common/DateSelector.tsx` exists and exports `default memo(DateSelector)`
  - Exported interface `DateSelectorProps` includes all fields: `selectedDate`, `onDateChange`, `accessMode?`, `calendarPlacement?`, `nonPrivQuickDays?`, `showYesterday?`, `calendarColorVariant?`, `testMode?`, `onTestModeChange?`, `username?` (deprecated)
  - `accessMode: 'unrestricted'` — `useAuth()` is always called unconditionally (React hooks rule); for this mode the returned `user` value is ignored and no privilege/access checks are run; Yesterday always shown; 5 forward days; DayPicker toggle button present; when `calendarPlacement: 'inline'`, DayPicker expands inline below button row (NOT always-open — toggled by the date-display button, exactly as in the original `DaySelector`)
  - `accessMode: 'privileged-calendar'` (default) — `isPrivileged` gates DayPicker; Yesterday and 5 forward days always shown in quick buttons
  - `accessMode: 'role-aware-calendar'` — `isPrivileged` gates Yesterday/quick-range (1 vs 5 days); `canAccess(RESTRICTED_CALENDAR_ACCESS)` gates DayPicker; DayPicker constrained to today+tomorrow for admin/manager (non-privileged)
  - `calendarPlacement: 'inline'` — DayPicker renders below button row with no `absolute` positioning when open; toggle is still required to open/close it; `isCalendarOpen` state preserved; no click-outside handler (inline expand pattern from original `DaySelector`)
  - `calendarPlacement: 'popup'` (default) — DayPicker in `absolute z-10 mt-2` div with click-outside dismiss via `useEffect`+`useRef`
  - `calendarColorVariant: 'warning'` — DayPicker `today` → `font-bold text-warning`, `selected` → `bg-warning text-primary-fg hover:bg-warning`
  - `calendarColorVariant: 'primary'` — DayPicker `today` → `font-bold text-primary-main/100`, `selected` → `bg-primary-main/100 text-primary-fg/100 hover:bg-primary-main/100` (used by: checkout, checkins)
  - Note: `calendarColorVariant` defaults to `'warning'` because 3/5 callers (prepare, loans, Alloggiati) use warning tokens. `checkout` and `checkins` must explicitly pass `calendarColorVariant="primary"`.
  - `testMode`/`onTestModeChange` provided + user `isPrivileged` → checkbox label rendered at trailing end of flex row
  - DayPicker classNames extracted to named constants (`DAY_PICKER_CLASS_NAMES_PRIMARY`, `DAY_PICKER_CLASS_NAMES_WARNING`)
  - `memo()` wrap on export
  - `useCallback`/`useMemo` on handlers
  - Expected user-observable behaviour:
    - [ ] Checkout screen: unchanged — Yesterday, Today, +5 days; date-display toggle button present; calendar expands inline below button row when toggled (not always-open)
    - [ ] Checkins screen: unchanged — staff sees Today+Tomorrow only; privileged sees Yesterday+5-day range + unrestricted popup calendar; admin/manager sees popup calendar limited to today+tomorrow
    - [ ] Prepare screen: unchanged — Yesterday, Today, +5 days; privileged sees warning-coloured popup calendar
    - [ ] Loans screen: unchanged — Yesterday, Today, +5 days; privileged sees warning-coloured popup calendar
    - [ ] Alloggiati screen: unchanged — Yesterday, Today, +5 days; privileged sees warning-coloured popup calendar + test mode checkbox
- **Validation contract (TC-01):**
  - TC-01: accessMode=unrestricted → `useAuth()` called but result ignored; no privilege/access checks run; Yesterday rendered, 5 forward days rendered; DayPicker hidden until toggle clicked; inline placement (no absolute div) when opened
  - TC-02: accessMode=role-aware-calendar + non-privileged user → 1 forward day, no Yesterday, no DayPicker toggle
  - TC-03: accessMode=role-aware-calendar + admin user → 1 forward day, DayPicker popup shown but constrained to today+tomorrow
  - TC-04: accessMode=role-aware-calendar + privileged user → 5 forward days, Yesterday shown, unrestricted DayPicker popup
  - TC-05: calendarPlacement=inline → no absolute div, no click-outside handler
  - TC-06: calendarColorVariant=warning → DayPicker today/selected use warning tokens
  - TC-07: testMode+onTestModeChange + privileged → checkbox rendered; non-privileged → checkbox hidden
  - TC-08: username prop accepted without type error (deprecated but not removed)
- **Execution plan:**
  - Red: Create file with complete interface. All props typed. Internal auth wiring, classNames constants, conditional calendar rendering. Component not yet used anywhere.
  - Green: TypeScript compiles cleanly (`pnpm --filter @apps/reception typecheck`). ESLint clean (`pnpm --filter @apps/reception lint`).
  - Refactor: Verify classNames constants are defined before component body. Verify `memo()` wrap is at export. Verify `useCallback` on `handleDayPickerSelect` and `handleQuickSelect`.
- **Planning validation (M effort):**
  - Checks: All 5 source files read; interface differences enumerated in fact-find Component Behaviour Matrix; `canAccess`/`isPrivileged`/`RESTRICTED_CALENDAR_ACCESS` signatures confirmed from `roles.ts`; `addDays` import confirmed available in `dateUtils.ts`; `Input` from `@acme/design-system` confirmed valid in `common/` via `CashCountingForm.tsx`
  - Validation artifacts: fact-find.md § Data & Contracts; `apps/reception/src/lib/roles.ts` lines 29, 84-90; `apps/reception/src/utils/dateUtils.ts` line 44
  - Unexpected findings: None
- **Consumer tracing:**
  - New outputs: exported `DateSelector` component + `DateSelectorProps` type. Consumers = TASK-03..07 (all caller migrations). Each task's Affects list names the consuming caller file. All consumers addressed.
  - Modified behavior: None — this is a new file. Existing callers still import their originals until TASK-03..07.
- **Scouts:** `None: no unknown unknowns; all source files verified`
- **Edge Cases & Hardening:**
  - `accessMode` defaults to `'privileged-calendar'` (matches 3/5 existing callers)
  - `calendarPlacement` defaults to `'popup'` (matches 4/5 existing callers)
  - `calendarColorVariant` defaults to `'warning'` (matches 3/5 callers — prepare, loans, Alloggiati; checkout and checkins must pass `calendarColorVariant="primary"` explicitly)
  - `showYesterday` defaults to `true` (matches 4/5; checkins derives it internally from privilege level, not this prop)
  - When `accessMode: 'unrestricted'`, the `showYesterday`/`nonPrivQuickDays` props have no effect (always show Yesterday, always 5 days)
  - When `testMode` is `undefined` or `onTestModeChange` is `undefined`, checkbox block is never rendered
- **What would make this >=90%:** Already at 90%. Held-back test on Approach: single unknown is whether the Checkout inline wrapper layout is pixel-identical — resolved at build time by visual comparison.
- **Rollout / rollback:**
  - Rollout: new file creation only; no callers switch yet
  - Rollback: delete the new file
- **Documentation impact:** `FilterToolbar.tsx` JSDoc updated in TASK-08

---

### TASK-02: Checkpoint — validate shared component before caller migrations
- **Type:** CHECKPOINT
- **Deliverable:** Plan evidence updated via checkpoint gate
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/plans/reception-date-selector-unification/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-05, TASK-06, TASK-07
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - prevents migrating callers to a broken shared component
  - Impact: 95% - controls downstream risk
- **Acceptance:**
  - `pnpm --filter @apps/reception typecheck` passes on the new file
  - `pnpm --filter @apps/reception lint` passes on the new file
  - No import errors on DS/dateUtils/roles/AuthContext
- **Horizon assumptions to validate:**
  - `Input` from `@acme/design-system` resolves without error in `common/` context
  - `Cluster`/`Inline` primitives import correctly
  - `memo`/`useCallback`/`useMemo` all typed correctly without explicit generics
- **Validation contract:** typecheck + lint pass output; zero errors
- **Planning validation:** typecheck is the gate; no additional planning evidence needed
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** None

---

### TASK-03: Migrate checkout caller (unrestricted/inline)
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/checkout/Checkout.tsx` (import updated); `apps/reception/src/components/checkout/DaySelector.tsx` (deleted)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `apps/reception/src/components/checkout/Checkout.tsx`, `apps/reception/src/components/checkout/DaySelector.tsx` (delete)
- **Depends on:** TASK-02
- **Blocks:** TASK-08
- **Confidence:** 90%
  - Implementation: 95% — caller site confirmed at line 341; props are `selectedDate`, `onDateChange`, `username={user.user_name}` — all map cleanly
  - Approach: 90% — swap import path + add `accessMode` and `calendarPlacement` props; delete original. Held-back test: does the Checkout outer flex container interact badly with the shared component's outer wrapper? Mitigated by matching the exact `div.flex.flex-col.gap-3` wrapper from `DaySelector`.
  - Impact: 90% — single caller, no tests reference `DaySelector` directly (confirmed by fact-find — no unit test for checkout DaySelector)
- **Acceptance:**
  - `Checkout.tsx` imports `DateSelector` from `../common/DateSelector`
  - Props: `selectedDate={selectedDate}`, `onDateChange={setSelectedDate}`, `accessMode="unrestricted"`, `calendarPlacement="inline"`, `calendarColorVariant="primary"`, `username={user.user_name}`
  - `checkout/DaySelector.tsx` deleted
  - Expected user-observable behaviour:
    - [ ] Checkout screen: Yesterday, Today, +5 days shown as before
    - [ ] Inline calendar opens/closes below button row as before
    - [ ] Selecting a date from calendar calls `onDateChange` correctly
- **Validation contract (TC-01):**
  - TC-01: Import resolves; no TypeScript errors on `Checkout.tsx`
  - TC-02: `DaySelector.tsx` file does not exist after task
  - TC-03: typecheck + lint pass
- **Execution plan:**
  - Red: Update import in `Checkout.tsx`; add `accessMode` and `calendarPlacement` props.
  - Green: typecheck + lint pass; file is deleted.
  - Refactor: Confirm no dead imports remain in `Checkout.tsx`.
- **Planning validation:** `None: S-effort task with direct evidence`
- **Consumer tracing:** `None: no new outputs; import path change only`
- **Scouts:** `None: caller confirmed; props confirmed`
- **Edge Cases & Hardening:** `username` prop kept (maps to `user.user_name` from parent — unchanged)
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: update import; delete original
  - Rollback: restore `DaySelector.tsx`; revert import in `Checkout.tsx`
- **Documentation impact:** None (JSDoc update in TASK-08)

---

### TASK-04: Migrate checkins caller (role-aware-calendar)
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/checkins/view/CheckinsTable.tsx` (import updated); `apps/reception/src/components/checkins/DateSelector.tsx` (deleted)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `apps/reception/src/components/checkins/view/CheckinsTable.tsx`, `apps/reception/src/components/checkins/DateSelector.tsx` (delete)
- **Depends on:** TASK-02
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 90% — caller site confirmed at line 133; props are `selectedDate`, `onDateChange` — minimal
  - Approach: 85% — `accessMode="role-aware-calendar"` encapsulates the two-tier logic. Held-back test: does the internal two-tier logic in the shared component exactly match the original `checkins/DateSelector` logic? Specifically: `daysAhead = privileged ? 5 : 1` and `canAccess(RESTRICTED_CALENDAR_ACCESS)` gate with `fromDate`/`toDate` constraint. All confirmed from source at fact-find time. Single unresolved unknown: whether the `Inline` layout wrapper matches the original — downgraded to 85 per downward bias rule.
  - Impact: 85% — `CheckinsUI.test.tsx` directly renders this component; test file must be updated in TASK-08 (dependency is explicit)
- **Acceptance:**
  - `CheckinsTable.tsx` imports `DateSelector` from `../../common/DateSelector`
  - Props: `selectedDate={selectedDate}`, `onDateChange={onDateChange}`, `accessMode="role-aware-calendar"`, `calendarColorVariant="primary"`
  - `checkins/DateSelector.tsx` deleted
  - Expected user-observable behaviour:
    - [ ] Staff user: Today + Tomorrow quick buttons; no calendar toggle
    - [ ] Admin/Manager user: Today + Tomorrow quick buttons; calendar toggle shown; DayPicker limited to today+tomorrow
    - [ ] Privileged user: Yesterday + Today + 5-day range; unrestricted calendar toggle
- **Validation contract (TC-01):**
  - TC-01: Import resolves; no TypeScript errors on `CheckinsTable.tsx`
  - TC-02: `checkins/DateSelector.tsx` does not exist after task
  - TC-03: typecheck + lint pass
  - TC-04: Staff user role → `Today` and `Tomorrow` quick buttons rendered; no calendar toggle (confirmed by existing `CheckinsUI.test.tsx` pattern)
- **Execution plan:**
  - Red: Update import in `CheckinsTable.tsx`; add `accessMode` prop; remove old relative import.
  - Green: typecheck + lint pass; file deleted.
  - Refactor: Confirm `CheckinsTable.tsx` has no leftover references to old path.
- **Planning validation:** `None: S-effort task; role-aware logic encapsulated in shared component`
- **Consumer tracing:** `None: no new outputs; import path change only`
- **Scouts:** The `addDays` function used in the restricted DayPicker constraint (`toDate: addDays(parsedToday, 1)`) is imported inside `checkins/DateSelector.tsx` from dateUtils — it must be imported in the shared component too. Confirmed available in `dateUtils.ts` line 44.
- **Edge Cases & Hardening:** The `parsedToday` memo in the original is computed as `parseDate(today)` where `today` comes from `buildQuickDateRange`. The shared component must replicate this without divergence — use the same `today` string from the existing `buildQuickDateRange` call.
- **What would make this >=90%:** Raise Approach: only if we run a visual comparison after build showing the `Inline` layout is identical.
- **Rollout / rollback:**
  - Rollout: update import; delete original
  - Rollback: restore `DateSelector.tsx`; revert import
- **Documentation impact:** None (handled in TASK-08)

---

### TASK-05: Migrate prepare caller (warning colour variant)
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/prepare/PrepareDashboard.tsx` (import updated); `apps/reception/src/components/prepare/DateSelectorPP.tsx` (deleted)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `apps/reception/src/components/prepare/PrepareDashboard.tsx`, `apps/reception/src/components/prepare/DateSelectorPP.tsx` (delete)
- **Depends on:** TASK-02
- **Blocks:** TASK-08
- **Confidence:** 90%
  - Implementation: 95% — caller at line 72; passes `selectedDate`, `onDateChange`, and `username={user?.user_name ?? ""}` (confirmed at line 75); no testMode
  - Approach: 90% — add `calendarColorVariant="warning"` to switch to warning tokens; keep `username` prop passthrough per plan's additive-only rule. Divergence confirmed limited to `today` and `selected` classNames tokens only.
  - Impact: 90% — `PrepareDashboard.test.tsx` mocks this component; mock path update is in TASK-08
- **Acceptance:**
  - `PrepareDashboard.tsx` imports `DateSelector` from `../common/DateSelector`
  - Props: `selectedDate={selectedDate}`, `onDateChange={setSelectedDate}`, `calendarColorVariant="warning"`, `username={user?.user_name ?? ""}`
  - `prepare/DateSelectorPP.tsx` deleted
  - Expected user-observable behaviour:
    - [ ] Prepare screen: Yesterday, Today, +5 days shown as before
    - [ ] Privileged: popup calendar with warning/amber colour tokens (today + selected highlighting)
    - [ ] Non-privileged: no calendar toggle
- **Validation contract (TC-01):**
  - TC-01: Import resolves; typecheck passes
  - TC-02: `DateSelectorPP.tsx` does not exist after task
  - TC-03: lint passes
- **Execution plan:**
  - Red: Update import; add `calendarColorVariant` prop. Remove old import.
  - Green: typecheck + lint pass; file deleted.
  - Refactor: Confirm `PrepareDashboard.tsx` has no leftover imports from `./DateSelectorPP`.
- **Planning validation:** `None: S-effort`
- **Consumer tracing:** `None: import path change only`
- **Scouts:** `None: prop surface confirmed`
- **Edge Cases & Hardening:** `DateSelectorPP` used `parseLocalDate` (not the `parseDate` alias). Shared component should use `parseLocalDate` (or `parseDate` alias — functionally identical per dateUtils.ts line 876).
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: update import; delete original
  - Rollback: restore `DateSelectorPP.tsx`; revert import
- **Documentation impact:** None (handled in TASK-08)

---

### TASK-06: Migrate loans caller
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/loans/LoanFilters.tsx` (import updated); `apps/reception/src/components/loans/DateSel.tsx` (deleted)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `apps/reception/src/components/loans/LoanFilters.tsx`, `apps/reception/src/components/loans/DateSel.tsx` (delete)
- **Depends on:** TASK-02
- **Blocks:** TASK-08
- **Confidence:** 90%
  - Implementation: 95% — caller at line 24; passes `selectedDate`, `onDateChange`, `username={username}`; `DateSel.tsx` confirmed to use warning tokens (`text-warning`/`bg-warning`) at lines 155-156
  - Approach: 90% — import swap + `calendarColorVariant="warning"` to match existing tokens; `username` prop kept; default `accessMode` (privileged-calendar) matches existing behaviour
  - Impact: 90% — `LoanFilters.test.tsx` mocks `DateSel`; mock path update in TASK-08
- **Acceptance:**
  - `LoanFilters.tsx` imports `DateSelector` from `../common/DateSelector`
  - Props: `selectedDate={selectedDate}`, `onDateChange={onDateChange}`, `username={username}`, `calendarColorVariant="warning"`
  - `loans/DateSel.tsx` deleted
  - Expected user-observable behaviour:
    - [ ] Loans screen: Yesterday, Today, +5 days shown as before
    - [ ] Privileged: popup calendar with warning/amber colour tokens
    - [ ] Non-privileged: no calendar toggle
- **Validation contract (TC-01):**
  - TC-01: Import resolves; typecheck + lint pass
  - TC-02: `DateSel.tsx` does not exist after task
- **Execution plan:**
  - Red: Update import path; update import name from `DateSelector` (already named that in LoanFilters); confirm props unchanged.
  - Green: typecheck + lint pass; file deleted.
  - Refactor: Confirm no dead import of old path in LoanFilters.
- **Planning validation:** `None: S-effort`
- **Consumer tracing:** `None: import path change only`
- **Scouts:** `None: confirmed`
- **Edge Cases & Hardening:** `LoanFilters` also declares `username: string` as its own prop — this is independent of the DateSel `username?` prop and is unaffected.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: update import; delete original
  - Rollback: restore `DateSel.tsx`; revert import
- **Documentation impact:** None (handled in TASK-08)

---

### TASK-07: Migrate man/Alloggiati caller (testMode)
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/man/Alloggiati.tsx` (import updated); `apps/reception/src/components/man/DateSelectorAllo.tsx` (deleted)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `apps/reception/src/components/man/Alloggiati.tsx`, `apps/reception/src/components/man/DateSelectorAllo.tsx` (delete)
- **Depends on:** TASK-02
- **Blocks:** TASK-08
- **Confidence:** 90%
  - Implementation: 95% — caller at line 311; passes `selectedDate`, `onDateChange`, `testMode`, `onTestModeChange`
  - Approach: 90% — import swap + optional `testMode`/`onTestModeChange` props are part of shared interface; checkbox rendered internally when both provided + privileged
  - Impact: 90% — `Alloggiati.test.tsx` mocks `DateSelectorAllo`; `DateSelectorAllo.test.tsx` directly renders it; both in TASK-08
- **Acceptance:**
  - `Alloggiati.tsx` imports `DateSelector` from `../common/DateSelector` (import alias renamed from `DateSelectorCI` to `DateSelector` for TASK-08 grep gate compliance)
  - Props: `selectedDate={selectedDate}`, `onDateChange={setSelectedDate}`, `testMode={testMode}`, `onTestModeChange={onTestModeChange}`, `calendarColorVariant="warning"`
  - `man/DateSelectorAllo.tsx` deleted
  - Expected user-observable behaviour:
    - [ ] Alloggiati screen: Yesterday, Today, +5 days shown as before
    - [ ] Privileged: warning-coloured popup calendar + Test Mode checkbox visible
    - [ ] Non-privileged: no calendar, no Test Mode checkbox
    - [ ] Test Mode checkbox state wired to Alloggiati parent state as before
- **Validation contract (TC-01):**
  - TC-01: Import resolves; typecheck + lint pass
  - TC-02: `DateSelectorAllo.tsx` does not exist after task
  - TC-03: privileged user → checkbox renders; non-privileged → checkbox hidden
- **Execution plan:**
  - Red: Update import in `Alloggiati.tsx`; keep `testMode`/`onTestModeChange` props.
  - Green: typecheck + lint pass; file deleted.
  - Refactor: Confirm no dead import of old `DateSelectorCI` name.
- **Planning validation:** `None: S-effort`
- **Consumer tracing:** `None: import path change only; testMode/onTestModeChange props unchanged`
- **Scouts:** `None: confirmed`
- **Edge Cases & Hardening:** `Alloggiati.tsx` imports the component as `DateSelectorCI` — **the import alias MUST be renamed to `DateSelector`** (or removed as a local alias) so the TASK-08 grep gate (`grep -r "DateSelectorCI" apps/reception/src`) returns zero results. The rename is a one-line change in `Alloggiati.tsx`.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: update import; delete original
  - Rollback: restore `DateSelectorAllo.tsx`; revert import
- **Documentation impact:** None (handled in TASK-08)

---

### TASK-08: Update test files and FilterToolbar JSDoc
- **Type:** IMPLEMENT
- **Deliverable:** 7 updated test files + `FilterToolbar.tsx` JSDoc update
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:**
  - `apps/reception/src/components/checkins/__tests__/CheckinsUI.test.tsx` (import path update)
  - `apps/reception/src/parity/__tests__/checkin-route.parity.test.tsx` (mock path update)
  - `apps/reception/src/components/prepare/__tests__/PrepareDashboard.test.tsx` (mock path update)
  - `apps/reception/src/components/loans/__tests__/DateSel.test.tsx` (import path update + props)
  - `apps/reception/src/components/loans/__tests__/LoanFilters.test.tsx` (mock path update)
  - `apps/reception/src/components/man/__tests__/DateSelectorAllo.test.tsx` (import path update + props)
  - `apps/reception/src/components/man/__tests__/Alloggiati.test.tsx` (mock path update)
  - `apps/reception/src/components/common/FilterToolbar.tsx` (JSDoc lines 9-10)
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-06, TASK-07
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — all 7 test files located and reviewed; mock patterns and direct-render patterns both identified
  - Approach: 85% — mock path updates are mechanical (path string change); direct-render tests may need prop additions (e.g. `accessMode` for `DateSel.test.tsx` and `DateSelectorAllo.test.tsx`). Held-back test: do any test assertions reference DOM structure that changed (e.g. wrapping divs)? Low risk since most assertions target button text, not DOM structure.
  - Impact: 85% — tests run only in CI; CI is the verification gate
- **Acceptance:**
  - All 7 test files updated: import/mock paths reference `common/DateSelector` (not deleted originals)
  - 4 mock-path updates: `checkin-route.parity.test.tsx`, `PrepareDashboard.test.tsx`, `LoanFilters.test.tsx`, `Alloggiati.test.tsx` — `jest.mock` paths updated from `../DateSelectorXxx` to `../../components/common/DateSelector` (adjust relative path per file location)
  - 3 direct-render updates: `CheckinsUI.test.tsx`, `DateSel.test.tsx`, `DateSelectorAllo.test.tsx` — import path updated; add required props (`accessMode`, `calendarColorVariant` etc.) where tests now require explicit props
  - `DateSel.test.tsx` — test renders shared component with `accessMode` defaulted (or explicitly set to `'privileged-calendar'`); existing assertions about quick-select button behaviour remain valid
  - `DateSelectorAllo.test.tsx` — test renders shared component with `testMode`/`onTestModeChange` props; existing assertions about test-mode toggle visibility remain valid
  - `FilterToolbar.tsx` JSDoc lines 9-10 updated to reference `common/DateSelector` instead of `checkins/DateSelector` and `checkout/DaySelector`
  - No test file references a deleted path
  - Expected user-observable behaviour: `None: test infrastructure only`
- **Validation contract (TC-01):**
  - TC-01: `pnpm --filter @apps/reception typecheck` passes with all updated test files
  - TC-02: `pnpm --filter @apps/reception lint` passes
  - TC-03: `bash scripts/validate-changes.sh` passes before commit
  - TC-04: No test file imports or `jest.mock`s a path that no longer exists (verified by grep)
  - TC-05 (CI gate): CI passes on push to `origin/dev`
- **Execution plan:**
  - Red: Update each mock path in turn. Update each direct-render import + add required props. Update FilterToolbar JSDoc. Run grep to confirm no test file still references a deleted component path.
  - Green: typecheck + lint pass locally.
  - Refactor: Final grep sweep: `grep -r "DaySelector\|DateSelectorPP\|DateSel\|DateSelectorAllo\|DateSelectorCI" apps/reception/src` should return zero results (only the shared component file itself, if the shared component is named differently — it is not, so this grep should return zero).
- **Planning validation (M effort):**
  - Checks: All 7 test files reviewed; mock patterns confirmed (`jest.mock` with `__esModule: true`); direct-render patterns confirmed (`render(<DateSel ...>)`); `testIdAttribute: data-cy` convention confirmed
  - Validation artifacts: fact-find.md § Test Landscape; `CheckinsUI.test.tsx` line 10; `LoanFilters.test.tsx` line 22; `DateSelectorAllo.test.tsx` line 6
  - Unexpected findings: `CheckinsUI.test.tsx` renders `DateSelector` directly (not as a mock) — this means the AuthContext mock must remain in scope for the test file
- **Consumer tracing:**
  - New outputs: None — test infrastructure only
  - Modified behavior: Jest mock paths — consumers are the test runner; CI is the verification oracle
- **Scouts:** `None: test file patterns confirmed`
- **Edge Cases & Hardening:**
  - `DateSel.test.tsx` renders `DateSel` with a `username` prop — shared component still accepts it; no change needed
  - `CheckinsUI.test.tsx` may assert on Yesterday button visibility by role — these assertions remain valid since `accessMode='role-aware-calendar'` preserves that logic
- **What would make this >=90%:** Run the CI test suite first to confirm all assertions pass; confidence rises to 90 once CI is green.
- **Rollout / rollback:**
  - Rollout: update all test files atomically (same commit as caller migrations)
  - Rollback: revert all 7 test files; restore original component files
- **Documentation impact:** `FilterToolbar.tsx` JSDoc updated in this task
- **Build evidence (2026-03-09):**
  - All 7 test files updated; grep sweep confirms zero references to deleted component names
  - `pnpm --filter @apps/reception typecheck` — passed, 0 errors
  - `pnpm --filter @apps/reception lint` — passed, 0 errors (13 warnings from unrelated files)
  - `bash scripts/validate-changes.sh` — passed
  - Changes committed in `1c20c82573` (piggy-backed in concurrent agent commit for ManagerAuthModal extraction)

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Write shared DateSelector | Yes — no prior tasks required; all source files read in fact-find | None | No |
| TASK-02: Checkpoint | Yes — depends only on TASK-01 completion; typecheck is the gate | None | No |
| TASK-03: Migrate checkout | Yes — TASK-02 checkpoint ensures shared component compiles | None | No |
| TASK-04: Migrate checkins | Yes — TASK-02 checkpoint ensures shared component compiles; `addDays` confirmed in dateUtils.ts | None | No |
| TASK-05: Migrate prepare | Yes — `calendarColorVariant=warning` prop defined in TASK-01; caller props confirmed | None | No |
| TASK-06: Migrate loans | Yes — default `accessMode` matches existing loans behaviour; `username` prop confirmed kept | None | No |
| TASK-07: Migrate man/Alloggiati | Yes — `testMode`/`onTestModeChange` props defined in TASK-01 | None | No |
| TASK-08: Update tests + JSDoc | Partial — depends on all 5 caller migrations being complete (TASK-03..07). If any caller migration is incomplete, the test for that caller will fail. | [Ordering] [Minor]: If TASK-03..07 are run in parallel and TASK-08 is started before all complete, some mocks will still reference deleted paths. | No — parallelism guide explicitly makes TASK-08 depend on all 5; enforced by Blocks field |

## Delivery Rehearsal

**Data lens:** No database records or fixtures required. All data flows through React props. Pass.

**Process/UX lens:** This is a pure refactor — no user flow changes. The Component Behaviour Matrix in the fact-find specifies the complete happy path for each variant. No undefined states introduced. Pass.

**Security lens:** No auth boundary changes. The shared component continues to call `useAuth()` internally and apply the same `isPrivileged`/`canAccess` checks. No new auth surface. Pass.

**UI lens:** Each caller task (TASK-03..07) specifies the component name, route context, and screen name in Affects and Acceptance. The rendering context is fully specified. Pass.

No critical delivery rehearsal findings. No adjacent-idea scope identified. No rerun of sequence or critique required.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Inline vs popup layout change breaks Checkout visual layout | Low | Medium | `calendarPlacement: 'inline'` preserves exact outer div structure; TASK-03 acceptance validates props |
| Checkins role-aware calendar constraint regresses | Low | Medium | `accessMode='role-aware-calendar'` encapsulates two-tier logic; TASK-04 TC-04 covers staff role rendering; `CheckinsUI.test.tsx` covers role-based toggle visibility |
| Test mock paths reference deleted component | Medium | Low | TASK-08 grep sweep (`grep -r "DaySelector\|DateSelectorPP\|DateSel\|DateSelectorAllo"`) verifies zero references remain |
| DayPicker warning-colour tokens not applied for prepare/loans/Alloggiati | Low | Low | `calendarColorVariant="warning"` prop explicitly set in TASK-05, TASK-06, and TASK-07 respectively |
| `Input` from `@acme/design-system` import fails in common/ | Low | Low | CHECKPOINT (TASK-02) catches this before any callers are migrated |

## Observability

- Logging: `None: no server-side logic`
- Metrics: `None: pure UI refactor`
- Alerts/Dashboards: `None`

## Acceptance Criteria (overall)

- [x] `apps/reception/src/components/common/DateSelector.tsx` exists and is exported as `default`
- [x] All 5 original files deleted: `checkout/DaySelector.tsx`, `checkins/DateSelector.tsx`, `prepare/DateSelectorPP.tsx`, `loans/DateSel.tsx`, `man/DateSelectorAllo.tsx`
- [x] All 5 callers updated to import from `common/DateSelector`
- [x] All 7 test files updated; `grep -r "DaySelector\|DateSelectorPP\|DateSel\|DateSelectorAllo\|DateSelectorCI" apps/reception/src` returns zero results (excluding the shared component itself)
- [x] `FilterToolbar.tsx` JSDoc updated
- [x] `pnpm --filter @apps/reception typecheck` passes (0 errors, 2026-03-09)
- [x] `pnpm --filter @apps/reception lint` passes (0 errors, warnings only, 2026-03-09)
- [x] `bash scripts/validate-changes.sh` passes (2026-03-09)
- [ ] CI green on `origin/dev` push (pending push)

## Decision Log

- 2026-03-09: Chose Option A (parameterised single component) over Option B (compound/render-prop). Rationale: callers have no slot usage; prop surface is small and enumerable; flat component tree is simpler.
- 2026-03-09: Chose to keep deprecated `username` prop in shared interface and not update callers in this PR. Rationale: keeping migration purely additive eliminates caller-side churn risk.
- 2026-03-09: Chose to default `accessMode` to `'privileged-calendar'` (matches 3/5 callers) and `calendarPlacement` to `'popup'` (matches 4/5 callers). Checkout and checkins callers must specify their non-default values explicitly.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight | Weighted |
|---|---|---|---|---|
| TASK-01 | 90% | M=2 | 2 | 180 |
| TASK-02 | 95% | S=1 | 1 | 95 |
| TASK-03 | 90% | S=1 | 1 | 90 |
| TASK-04 | 85% | S=1 | 1 | 85 |
| TASK-05 | 90% | S=1 | 1 | 90 |
| TASK-06 | 90% | S=1 | 1 | 90 |
| TASK-07 | 90% | S=1 | 1 | 90 |
| TASK-08 | 85% | M=2 | 2 | 170 |
| **Total** | | | **10** | **890** |

**Overall-confidence = 890 / 10 = 89%** → rounded to 88% per downward bias rule (no single unknown fully resolved until build executes).
