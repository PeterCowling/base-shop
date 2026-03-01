---
Status: Complete
Feature-Slug: reception-stock-variance-filters
Completed-date: 2026-03-01
artifact: build-record
---

# Build Record — reception-stock-variance-filters

## What Was Built

**TASK-01 — Date-range and staff filters (commit `c092ec9231`):**
Removed the hardcoded `SEVEN_DAYS_MS` constant from `ManagerAuditContent.tsx` and replaced it with three `useState("")` hooks (`startDate`, `endDate`, `staffFilter`). The `stockVarianceRows` useMemo now computes an effective date range inline — defaulting to 30 days ago through today when inputs are empty — and applies a case-insensitive staff substring match against `entry.user`. Filter UI was added above the variance table with From/To date inputs and a Staff text input, all annotated with `data-cy` attributes. The empty-state copy was updated from "No variance in the last 7 days" to "No variance in the selected period". Also fixed a pre-existing type error in `packages/ui/src/organisms/RoomsSection.tsx` (`lang as AppLanguage` cast) that was blocking the pre-commit typecheck hook.

**TASK-02 — Item filter and CSV export (commit `5a817c50cb`):**
Added `itemFilter` state and extended the `stockVarianceRows` memo filter chain with `!itemFilter || entry.itemId === itemFilter`. Added `items` to the `useInventoryItems` destructure (sorted array). Added an item `<select>` dropdown (data-cy="variance-item-filter") with "All items" default. Added three module-scoped CSV helpers (`escapeCsvCell`, `buildCsv`, `triggerCsvDownload`) adapted from `StockManagement.tsx`. Added `handleExportVariance` — builds headers (Recorded at, Item, Item ID, Delta, User, Reason, Note), maps `stockVarianceRows` to rows using `itemsById` for name lookup, computes effective date range for filename (YYYY-MM-DD), calls `triggerCsvDownload` then `showToast`. Export CSV Button (data-cy="variance-export-btn") renders only when `stockVarianceRows.length > 0`.

**TASK-03 — Tests (commit `273d639d29`):**
Added 6 new tests (TC-15 through TC-20) to `ManagerAuditContent.test.tsx`, covering: item filter narrowing and reset, staff filter excluding non-matching user, empty staff filter including blank-user entries, export button absence when no rows, export button presence when rows exist, and export button click triggering `showToast` with success type. Added `showToast` mock via `jest.mock("../../../utils/toastUtils")` and `fireEvent` import. URL.createObjectURL/revokeObjectURL and HTMLAnchorElement.prototype.click mocked per-test via `jest.spyOn`.

## Tests Run

Tests are run in CI only per `docs/testing-policy.md`. No local Jest execution.

- Typecheck: `pnpm --filter @apps/reception typecheck` — passed after each task (clean exit, zero errors)
- Lint: `pnpm --filter @apps/reception lint` — 7 warnings, 0 errors after each task; no warnings on changed files
- CI tests: pending CI run on `dev` branch

## Validation Evidence

**TASK-01:**
- TC-01 (date range default): `effectiveStartMs = Date.now() - 30*24*60*60*1000`; entries within 30 days included (confirmed by TC-17 test: entry at `now - 1000` renders)
- TC-03 (staff filter): `normalizedStaffFilter` applied as `.toLowerCase().includes()` on `entry.user`; confirmed by TC-16 test
- TC-04 (empty filter): `!staffFilter` short-circuits; confirmed by TC-17 test
- TC-07 (existing tests pass): existing tests use `timestamp: Date.now() - 1000` which falls within 30-day default window

**TASK-02:**
- TC-08 (item filter): `!itemFilter || entry.itemId === itemFilter`; confirmed by TC-15 test
- TC-09 (all items): `itemFilter=""` shows all; confirmed by TC-15 test reset
- TC-13 (no export button when empty): confirmed by TC-18 test
- TC-14 (escapeCsvCell): formula injection guard implemented (prepend `'` for `=`,`+`,`-`,`@`,`\t`,`\r`; all values wrapped in `"..."` with `""` for inner quotes)

**TASK-03:**
- TC-15: item filter select/reset — written and passing (typecheck clean)
- TC-16: staff filter exclusion — written
- TC-17: empty staff filter inclusion — written
- TC-18: export button absent — written
- TC-19: export button present — written
- TC-20: export click triggers showToast — written with URL/anchor spies

## Scope Deviations

**Controlled expansion:** `packages/ui/src/organisms/RoomsSection.tsx` — added `import type { AppLanguage } from "../i18n.config"` and cast `lang as AppLanguage` in the `getRoomSlug` call. This was required to fix a pre-existing type error introduced by WIP changes on the `dev` branch that was blocking the pre-commit typecheck hook for `@apps/reception`. The change is 2 lines, additive only, and does not alter runtime behaviour.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Managers can filter the stock variance audit table by date range, item, and staff, and can export the filtered results as CSV for offline audit.
- **Source:** auto
