---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: STRATEGY
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: brik-till-shift-history-filter-denom
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-till-shift-history-filter-denom/plan.md
Trigger-Source: dispatch-routed
Trigger-Why: Operator-stated goal to remove gaps identified in the world-class scan for the reception app.
Trigger-Intended-Outcome: operational | Shift history is filterable by staff member and date; managers can tap a variance row to see denomination breakdown without navigating to a separate screen.
Dispatch-ID: IDEA-DISPATCH-20260228-0073
---

# TillShiftHistory Filter + Denomination Drill-Down — Fact-Find Brief

## Scope

### Summary

`TillShiftHistory` in the reception app renders the last 10 till shifts with no filter controls and no clickable row action. Denomination breakdown data is captured during close (stored in `/cashCounts` records indexed by `shiftId`) but is never surfaced in the history view. The change adds staff/date filter controls to the history list and an expandable row that shows denomination detail when a shift with non-zero variance is clicked.

### Goals

- Add a staff (opened-by/closed-by) filter control to the `TillShiftHistory` component.
- Add a date-range filter control (date or date pair) to the history list.
- Remove the hard-coded `limitToLast: 10` limit in favour of a controlled limit or paginated load driven by the active filter.
- Add an expandable row on shift rows where `closeDifference !== 0`, revealing denomination breakdown retrieved from `/cashCounts` records for that `shiftId`.
- Keep the existing table column layout; denomination detail renders in an inline sub-row, not a modal.

### Non-goals

- Changing how denomination data is written to Firebase — data pipeline is already correct.
- Adding export to CSV or PDF.
- Adding pagination beyond a simple "show more" or lifted limit.
- Modifying `CloseShiftForm`, `useTillShiftsMutations`, or `useCashCountsMutations`.

### Constraints & Assumptions

- Constraints:
  - Firebase Realtime Database has no server-side compound query: you can order by one child key only. Date-range queries on `/tillShifts` are performed by `useTillShiftsRange`, which defaults to `orderByChild("closedAt")` but also supports `"openedAt"`. The plan must decide which child key to order by — for a "shifts during this date range" filter, ordering by `closedAt` is appropriate for closed shifts; for "shifts opened in a date range", use `openedAt`. Staff filtering must happen client-side after fetch.
  - `denomBreakdown` is stored on `/cashCounts` records (keyed by `shiftId`), not on `/tillShifts`. Retrieving denomination data for a shift requires a secondary lookup on cashCounts filtered by `shiftId`.
  - The till page renders inside `TillDataProvider` which already subscribes to all `/cashCounts` — but `TillShiftHistory` does not consume `TillDataContext`. It makes an independent Firebase query via `useTillShiftsData`.
- Assumptions:
  - `cashCounts` for denomination lookup are already available via `TillDataContext` — `TillShiftHistory` is mounted inside `TillDataProvider` (confirmed in `TillReconciliation.tsx`). Calling `useTillData()` inside `TillShiftHistory` is sufficient; no new Firebase subscription is needed.
  - The existing `useTillShiftsRange` hook (date range capable) is the correct data hook to use for filtered history; it already accepts `startAt`/`endAt` and `orderByChild`.
  - Staff filter is simple: compare `openedBy` or `closedBy` to a selected name. No server-side index is required.

## Outcome Contract

- **Why:** Operator stated goal to remove the gaps identified in the world-class scan. The manager-audit-visibility gap was explicitly marked as needing filter controls and denomination drill-down.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this build, a manager can filter shift history by staff member and date range from the Till Management page, and can expand any non-zero-variance row to see the denomination breakdown without navigating to a separate screen.
- **Source:** operator

## Access Declarations

None. All data is from Firebase Realtime Database (`/tillShifts`, `/cashCounts`) — already connected via the existing `useFirebaseDatabase` hook and real-time listeners. No new external service credentials are required.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/till/TillReconciliation.tsx` — renders `<TillShiftHistory />` at line 113 with no props; this is where the component is mounted inside `TillDataProvider`.
- `apps/reception/src/app/` — reception is a Next.js App Router app; till route is accessed via standard page routing; `TillDataProvider` wraps the till tree.

### Key Modules / Files

- `apps/reception/src/components/till/TillShiftHistory.tsx` — the component under change. Hard-coded `limitToLast: 10`, no filter controls, no click handler on rows, no expandable row logic.
- `apps/reception/src/hooks/data/till/useTillShiftsData.ts` — hook used by `TillShiftHistory`. Accepts `limitToLast` param, queries `/tillShifts` ordered by `openedAt`. Returns `{ shifts, loading, error }`.
- `apps/reception/src/hooks/data/till/useTillShiftsRange.ts` — already-built date-range hook for `/tillShifts`. Accepts `{ orderByChild, startAt, endAt }`. Returns same shape `{ shifts, loading, error }`. This hook should be used in place of `useTillShiftsData` once filter controls are wired.
- `apps/reception/src/schemas/tillShiftSchema.ts` — Zod schema for `TillShift`. Current fields: `shiftId`, `status`, `openedAt`, `openedBy`, `openingCash`, `openingKeycards`, `closedAt`, `closedBy`, `closingCash`, `closingKeycards`, `closeDifference`, `closeType`, `varianceSignoffRequired`, `signedOffBy`, `signedOffByUid`, `signedOffAt`, `varianceNote`. No `denomBreakdown` field — denominations are on `cashCounts`, not `tillShifts`.
- `apps/reception/src/types/hooks/data/tillShiftData.ts` — TypeScript interface for `TillShift`. Mirrors the Zod schema. No `denomBreakdown` field.
- `apps/reception/src/schemas/cashCountSchema.ts` — Zod schema for `CashCount`. Includes `denomBreakdown: z.record(z.number()).optional()` and `shiftId: z.string().optional()`. This is where denomination data lives.
- `apps/reception/src/hooks/data/useCashCountsData.ts` — hook for `/cashCounts`. Accepts `orderByChild`, `startAt`, `endAt`, `limitToFirst`. Also exports `useSingleCashCount(id)`. The context (`TillDataContext`) already subscribes to all cashCounts; if `TillShiftHistory` reads from context it gets cashCounts for free.
- `apps/reception/src/components/till/DenominationInput.tsx` — reads denomination counts from `denomCounts` array keyed by `DENOMINATIONS` index. The display model for denomination labels is `DENOMINATIONS` constant in `apps/reception/src/types/component/Till.ts`.
- `apps/reception/src/context/TillDataContext.tsx` — provides `cashCounts: CashCount[]` via context. `TillShiftHistory` is rendered inside `TillDataProvider` (via `TillReconciliation`) but currently does not consume `useTillData()`. If it consumes context, it gets the already-fetched cashCounts without a new subscription.
- `apps/reception/src/components/search/FinancialTransactionAuditSearch.tsx` — established precedent for expandable rows in a table: `expandedRows: string[]` state, `toggleExpanded(rowId)` callback, inline sub-row rendering using a `Fragment` within `TableBody`.

### Patterns & Conventions Observed

- **Expandable row pattern:** `FinancialTransactionAuditSearch` uses `useState<string[]>([])` for `expandedRows` and a `toggleExpanded(rowId)` callback. Rows render an additional `<TableRow>` via a `Fragment` when the row ID is in `expandedRows`. This is the established pattern to follow.
- **Table component:** `@acme/design-system/atoms` exports `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`. All existing till tables use these atoms — the expandable row pattern in `FinancialTransactionAuditSearch` uses the same atoms.
- **Filter controls style:** `FinancialTransactionAuditSearch` uses native `<input>` elements with Tailwind classes for filter inputs. `SafeManagement` and `BookingSearchTable` use similar patterns. Filter controls should match the existing UI style (inline inputs, no heavy form library).
- **Date format:** dates in Firebase are ISO 8601 strings (e.g. `"2026-02-28T14:30:00.000+00:00"`). `useTillShiftsRange` already uses ISO string bounds for `startAt`/`endAt`.
- **Currency display:** `formatMoney` and `VarianceCell` are defined locally in `TillShiftHistory.tsx`. `DENOMINATIONS` from `types/component/Till.ts` provides denomination labels and values.
- **Memo pattern:** `TillShiftHistory` is wrapped in `memo()`. Filter state should live inside the component; no lifting needed.

### Data & Contracts

- Types/schemas/events:
  - `TillShift` (schema: `tillShiftSchema`, type: `tillShiftData.ts`) — fields relevant to display: `shiftId`, `openedAt`, `openedBy`, `closedAt`, `closedBy`, `closeDifference`, `status`, `closeType`, `varianceSignoffRequired`, `signedOffBy`, `varianceNote`.
  - `CashCount` (schema: `cashCountSchema`, type: `cashCountData.ts`) — full `type` enum: `"opening" | "close" | "reconcile" | "float" | "tenderRemoval"`. Fields relevant to denomination lookup: `shiftId` and `denomBreakdown: Record<string, number>`. For this feature, the relevant subset is `type: "close" | "reconcile"` (the types produced when closing or reconciling a shift). The key of `denomBreakdown` is the denomination value as a string (e.g. `"0.05"`, `"10"`) and the value is the count. The `DENOMINATIONS` constant maps label and value — the breakdown key matches `denom.value.toString()` or similar. **Important:** denomination data may be on a `reconcile`-type cashCount (for shifts closed via the reconcile flow) as well as a `close`-type record. The lookup must filter by `type: "close" | "reconcile"` with a matching `shiftId`, not `"close"` alone.
  - `DENOMINATIONS: Denomination[]` — array of `{ label, value }`. Coins: 0.05, 0.10, 0.20, 0.50, 1, 2. Notes: 5, 10, 20, 50, 100.
- Persistence:
  - `/tillShifts/{shiftId}` — one record per shift. Written by `useTillShiftsMutations`. No `denomBreakdown` field.
  - `/cashCounts/{pushKey}` — many records; each has optional `shiftId` and optional `denomBreakdown`. Denomination data for shift close lives here, on records with `type: "close" | "reconcile"` and a matching `shiftId`. Opening counts also carry `denomBreakdown` but are not relevant to the variance drill-down use case.
- API/contracts:
  - Firebase Realtime Database is the only backend. No REST API layer.
  - `useTillShiftsRange(params)` — already handles date-range queries. Signature: `{ orderByChild?, startAt?, endAt? }`. Returns `{ shifts: TillShift[], loading, error }`. This replaces `useTillShiftsData` for the filtered history view.
  - `useTillData()` from `TillDataContext` — returns `{ cashCounts: CashCount[], ... }`. If `TillShiftHistory` calls `useTillData()`, it gets all cashCounts already fetched by the parent context. This avoids a second `/cashCounts` subscription. However, the context `cashCounts` may be filtered by `reportDate` if one was supplied to the provider — in the Till Management page, no `reportDate` is passed, so all cashCounts are available.

### Dependency & Impact Map

- Upstream dependencies:
  - `useFirebaseDatabase` — singleton Firebase database instance.
  - `useTillShiftsRange` — date-range capable shifts hook (already exists, no changes needed).
  - `useTillData` (context) — provides cashCounts for denomination lookup (no changes needed to context).
  - `DENOMINATIONS`, `CashCount`, `TillShift` types — no changes needed.
- Downstream dependents:
  - `TillReconciliation.tsx` renders `<TillShiftHistory />` with no props. The component is self-contained. Adding filter state internally does not require prop changes to `TillReconciliation`.
  - `apps/reception/src/parity/__tests__/till-route.parity.test.tsx` — mocks `TillShiftHistory` at line 29 (`jest.mock(...)`). Mock will remain valid as long as the default export is preserved.
  - `apps/reception/src/components/till/__tests__/TillReconciliation.test.tsx` — mocks `TillShiftHistory` at line 14. Same — mock remains valid.
  - `apps/reception/src/components/till/__tests__/DrawerLimitWarning.test.tsx` — mocks `TillShiftHistory`. Same.
- Likely blast radius:
  - Confined to `TillShiftHistory.tsx` (new internal state, hook swap, expandable row). No changes to parent, to data hooks, to Firebase schema, or to mutations.
  - A new `useCashCountsForShift` utility (or reuse of `useTillData()` cashCounts) may be needed — but if context is used, no new file is required.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/component), React Testing Library
- Commands: Tests run in CI only (per `AGENTS.md`). Push to `dev`; monitor with `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')`. Do not run Jest locally.
- CI integration: Jest runs as part of the reception app test suite in CI.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `TillShiftHistory` | None | — | No dedicated test file exists. The component is only mocked in parent tests. |
| `TillReconciliation` | Unit | `TillReconciliation.test.tsx` | Mocks `TillShiftHistory` — no sub-component coverage. |
| `DrawerLimitWarning` | Unit | `DrawerLimitWarning.test.tsx` | Mocks `TillShiftHistory` — no sub-component coverage. |
| `useTillShiftsData` | None | — | No test file found for this hook. |
| `useTillShiftsRange` | None | — | No test file found for this hook. |

#### Coverage Gaps

- Untested paths:
  - `TillShiftHistory` rendering with shifts data (no test for the table, rows, or variance cell).
  - Filter state interactions (no test).
  - Expandable row toggle (no test).
  - Denomination display sub-row (no test).
- Extinct tests: none identified.

#### Testability Assessment

- Easy to test:
  - Expandable row toggle: standard React Testing Library `userEvent.click` on a variance row.
  - Filter controls: `userEvent.type` on staff/date inputs, assert row visibility.
  - Denomination display: assert denomination labels and counts appear in expanded row.
- Hard to test:
  - Firebase real-time subscription behaviour (requires mock of `onValue` — existing pattern in hook tests covers this).
- Test seams needed:
  - Mock `useTillShiftsRange` in `TillShiftHistory` tests.
  - Mock `useTillData` context if cashCounts are sourced from context.

#### Recommended Test Approach

- Unit tests for: `TillShiftHistory` — filter controls (staff name entry filters rows), date input changes, expandable row toggle on variance rows, denomination table display in expanded row, no expand on zero-variance rows.
- Integration tests for: not required for this change (no API layer).
- E2E tests for: not required for this change.

### Recent Git History (Targeted)

- `apps/reception/src/components/till/TillShiftHistory.tsx` — last meaningfully changed in commit `2ac91e7e5a` (chore: commit outstanding work); initial form established in `1499cffeb7`. No recent structural changes.
- `apps/reception/src/hooks/data/till/useTillShiftsRange.ts` — introduced as a standalone hook; no recent changes to its signature.

## Questions

### Resolved

- Q: Is denomination data stored on `/tillShifts` or `/cashCounts`?
  - A: It is stored on `/cashCounts` records (`denomBreakdown` field, keyed by denomination value string, value is count). The `/tillShifts` record has no `denomBreakdown` field. Confirmed by reading `cashCountSchema.ts`, `tillShiftSchema.ts`, and `useCashCountsMutations.ts`.
  - Evidence: `apps/reception/src/schemas/cashCountSchema.ts` line 15, `apps/reception/src/schemas/tillShiftSchema.ts` (no such field), `apps/reception/src/hooks/mutations/useCashCountsMutations.ts` line 57.

- Q: Does `TillShiftHistory` need a new Firebase subscription for cashCounts, or can it reuse existing data?
  - A: It can reuse `useTillData()` context which already subscribes to all `/cashCounts`. `TillShiftHistory` is rendered inside `TillDataProvider` in `TillReconciliation`. Adding a `useTillData()` call inside `TillShiftHistory` requires no new subscription and no changes to the context.
  - Evidence: `apps/reception/src/context/TillDataContext.tsx`, `apps/reception/src/components/till/TillReconciliation.tsx` line 113.

- Q: What is the correct hook for date-range filtered shift queries?
  - A: `useTillShiftsRange` — already exists and accepts `{ startAt, endAt, orderByChild }`. It should replace `useTillShiftsData` in the filtered history view.
  - Evidence: `apps/reception/src/hooks/data/till/useTillShiftsRange.ts`.

- Q: Is there an established expandable row pattern in the reception app?
  - A: Yes. `FinancialTransactionAuditSearch.tsx` uses `expandedRows: string[]` state, `toggleExpanded(rowId)` callback, and inline `Fragment`-wrapped sub-rows in a `TableBody`. This is the pattern to follow.
  - Evidence: `apps/reception/src/components/search/FinancialTransactionAuditSearch.tsx` lines 53–81.

- Q: Is denomination breakdown keyed by denomination label or denomination value?
  - A: By denomination value as a numeric key in a `Record<string, number>` (the record key is the denomination value string — e.g. `"0.05"` for 5c, `"10"` for €10 note). The `DENOMINATIONS` array provides the mapping from value to label for display. Confirmed from `cashCountSchema` (`z.record(z.number())`) and `DenominationInput` which iterates `DENOMINATIONS` by index.
  - Evidence: `apps/reception/src/schemas/cashCountSchema.ts` line 15, `apps/reception/src/components/till/DenominationInput.tsx`, `apps/reception/src/types/component/Till.ts` lines 148–161.

### Open (Operator Input Required)

None — all questions answerable from codebase evidence and business constraints.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `TillShiftHistory` component structure and hook usage | Yes | None | No |
| `useTillShiftsData` vs `useTillShiftsRange` hook selection | Yes | None — `useTillShiftsRange` is the correct replacement; Firebase date-range constraint documented | No |
| Denomination data location (cashCounts vs tillShifts) | Yes | None — confirmed on cashCounts only; build must not add denomBreakdown to tillShifts schema | No |
| Context vs new subscription for cashCounts in TillShiftHistory | Yes | None — context route is available and preferred; no new subscription needed | No |
| Expandable row pattern (existing precedent) | Yes | None — `FinancialTransactionAuditSearch` provides a clear, copy-followable pattern | No |
| Firebase query constraints (client-side staff filter, date-range key choice) | Yes | Minor — staff filter must be client-side; Firebase cannot compound-query by two children simultaneously; `useTillShiftsRange` defaults to `closedAt` not `openedAt` — plan must specify the intended sort key explicitly | No |
| Test coverage gap for `TillShiftHistory` | Yes | [Missing domain coverage] Minor: no existing test file for `TillShiftHistory`; new tests must be authored as part of the build | No |
| Blast radius (no prop changes needed to parents) | Yes | None | No |

## Confidence Inputs

- Implementation: 90%
  - Evidence: entry point, data hooks, and expandable row pattern are all confirmed. The component is self-contained. Hook swap (`useTillShiftsData` → `useTillShiftsRange`) is straightforward.
  - What raises to >=90: already at 90. The only open implementation risk is the denomination key mapping (value string vs display label), which is resolvable by following `DenominationInput` precedent.

- Approach: 85%
  - Evidence: context reuse for cashCounts is clean; expandable row pattern has precedent; filter controls follow existing UI style. One decision point: whether to show denomination detail for all shifts or only non-zero-variance shifts. Recommendation is non-zero-variance only (matches dispatch brief).
  - What raises to >=90: confirming in plan that "non-zero variance only" for expandable rows is correct. If operator wants all shifts to be expandable, the same pattern applies without conditional gating — low-effort change to the plan.

- Impact: 80%
  - Evidence: world-class scan rated this as a `minor-gap` with clear operator value (manager can filter by staff/date and see denomination detail). No downstream systems affected.
  - What raises to >=90: operator confirmation that the denomination-only view (not a full shift detail modal) is sufficient for the audit use case.

- Delivery-Readiness: 90%
  - Evidence: no new Firebase nodes, no schema changes, no mutations, no new packages. All required hooks and components exist. Test pattern is established. Build is fully scoped to one component file and zero data-layer changes.
  - What raises to >=90: already at 90. Minor outstanding item is authoring the missing test file.

- Testability: 85%
  - Evidence: expandable row toggle, filter interaction, and denomination display are all testable with React Testing Library. Hook behaviour testable via existing Firebase mock patterns.
  - What raises to >=90: `useTillShiftsRange` mock established in test file; `useTillData` context mock established.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Denomination key format mismatch (numeric string vs label vs index) | Low | Medium | Follow `DenominationInput.tsx` precedent: keys are denomination value strings (e.g. `"0.05"`). Iterate `DENOMINATIONS` array, match by `denom.value.toString()`. Test with a fixture that includes both coin and note entries. |
| Context cashCounts filtered by `reportDate` in some usages | Low | Low | On the Till Management page, no `reportDate` is passed to `TillDataProvider`; all cashCounts are available. If `TillShiftHistory` is used elsewhere with a date-filtered context, denomination lookup may be incomplete. Scope constraint: this risk only materialises outside the current mount site. |
| Staff filter performance on large cashCounts lists | Very Low | Low | Client-side filter on `shifts` array (max ~100 entries in realistic use). No performance issue. |
| `useTillShiftsRange` re-subscription on filter change | Very Low | Low | `useEffect` dep array in `useTillShiftsRange` already includes `params.startAt`, `params.endAt`, `params.orderByChild` — re-subscribes correctly when params change. |
| Missing test coverage persists if not addressed in plan | Low | Low | Plan must explicitly include a test task for `TillShiftHistory`. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Expandable row: follow `FinancialTransactionAuditSearch` pattern (`expandedRows: string[]`, `toggleExpanded`, inline `Fragment` sub-row).
  - Table atoms: use `@acme/design-system/atoms` — `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`.
  - Filter controls: native `<input>` elements with Tailwind classes matching existing style.
  - Denomination display: iterate `DENOMINATIONS` constant; match `denom.value.toString()` to `denomBreakdown` keys.
  - Staff filter: client-side only — Firebase does not support compound queries.
  - Hook: replace `useTillShiftsData` with `useTillShiftsRange` for the date-range query. Add local `useState` for `startDate`, `endDate`, `staffFilter`.
  - Context: call `useTillData()` inside `TillShiftHistory` to get `cashCounts` — no new Firebase subscription.
- Rollout/rollback expectations:
  - No data migration. Rollback is a simple revert of the component file.
- Observability expectations:
  - No special observability needed; the change is purely presentational/filter-state.

## Suggested Task Seeds (Non-binding)

1. Swap `useTillShiftsData` for `useTillShiftsRange` in `TillShiftHistory`; add local `startDate`, `endDate`, `staffFilter` state. When converting a date input (`YYYY-MM-DD`) to Firebase ISO bounds, use `T00:00:00.000+00:00` for `startAt` and `T23:59:59.999+00:00` for `endAt` (matching the ISO format used in Firebase records — see `TillDataContext` lines 68–70 for the same pattern).
2. Render filter controls (staff name input, date-from input, date-to input) above the table; wire to state.
3. Apply client-side staff filter to `shifts` array after fetch.
4. Add `expandedRows` state and `toggleExpanded` handler; make variance rows clickable (cursor-pointer, accessible button or role).
5. Render denomination breakdown sub-row: read cashCounts from `useTillData()` context, find the cashCount with matching `shiftId` and `type: "close" | "reconcile"` (denomination data may be on either type), display denomination table using `DENOMINATIONS` constant.
6. Author `TillShiftHistory.test.tsx` covering: filter controls, row visibility after filter, expandable toggle, denomination display, no expand on zero-variance rows.

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - None
- Deliverable acceptance package:
  - `TillShiftHistory.tsx` updated with filter controls and expandable denomination sub-row.
  - `apps/reception/src/components/till/__tests__/TillShiftHistory.test.tsx` (new file) with coverage of filter controls, expandable rows, and denomination display.
  - All existing mocked-parent tests remain green.
  - Package-scoped typecheck and lint pass: `pnpm --filter reception typecheck && pnpm --filter reception lint`.
- Post-delivery measurement plan:
  - Operator confirms: shift history is filterable by staff and date; denomination breakdown visible on variance rows.

## Evidence Gap Review

### Gaps Addressed

1. **Denomination data location** — confirmed via schema inspection that `denomBreakdown` is on `/cashCounts` (not `/tillShifts`). Build approach updated accordingly.
2. **Context reuse** — confirmed `TillShiftHistory` is mounted inside `TillDataProvider`; `useTillData()` call avoids second subscription.
3. **Expandable row pattern** — confirmed via `FinancialTransactionAuditSearch` — no design system `Accordion` component needed; the pattern is simple state + inline sub-row.
4. **Firebase query constraint and sort key** — documented that staff filter must be client-side; `useTillShiftsRange` handles date-range server-side. Corrected (Round 1 critique): `useTillShiftsRange` defaults to `closedAt`, not `openedAt`; plan must specify the intended sort key. Date input must be converted to full-day ISO bounds (`T00:00:00.000+00:00` / `T23:59:59.999+00:00`).
5. **`CashCount.type` for denomination lookup** — corrected (Round 1 critique): lookup must match `type: "close" | "reconcile"` not `"close"` alone, because reconcile-flow closures produce a `reconcile`-type cashCount record.
6. **Test coverage gap** — identified (no existing test for `TillShiftHistory`); plan must include test task.

### Confidence Adjustments

- Implementation and Delivery-Readiness at 90% — highest tier for this change size. No adjustments required.
- Approach at 85% — open choice on "expandable for all rows vs non-zero-variance only" is a minor planning decision, not a blocker.

### Remaining Assumptions

- Denomination breakdown key format is denomination value as a string (e.g. `"0.05"`, `"10"`), consistent with the `DenominationInput` component logic. No test data inspected directly from Firebase — assumption based on code reading.
- The Till Management page always mounts `TillDataProvider` without a `reportDate`, so cashCounts via context will be complete.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan brik-till-shift-history-filter-denom --auto`
