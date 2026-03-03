---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-updated: 2026-03-01
Feature-Slug: reception-eod-variance-amounts
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-eod-variance-amounts/plan.md
Dispatch-ID: IDEA-DISPATCH-20260301-0083
Trigger-Source: dispatch-routed
Trigger-Why: ""
Trigger-Intended-Outcome: ""
---

# Reception EOD Variance Amounts Fact-Find Brief

## Scope

### Summary

The EOD closure record stored in Firebase RTDB (`eodClosures/<date>`) contains only `confirmedBy`, `timestamp`, `date`, and optional `uid`. It carries no variance amounts, cash totals, or stock delta. A manager reviewing the stored closure the following day cannot see what the cash over/short or stock delta was without navigating to separate screens. The work is to enrich the `eodClosureSchema` to capture these figures at the moment of confirmation, persist them alongside the existing fields, and surface them inline in the `EodChecklistContent` component — both on the confirmation screen (before closing) and in the "day closed" banner (after closing).

### Goals

- Enrich `eodClosureSchema` with optional `cashVariance?: number` and `stockItemsCounted?: number` fields, so a stored closure record carries the day's two most actionable figures: cash over/short and count of inventory items physically counted.
- Compute these figures at the moment the "Confirm day closed" button is pressed and persist them in the closure record.
- Surface the figures inline in `EodChecklistContent`: brief summary row above the confirm button (pre-close) and as an expanded row inside the "day closed" banner (post-close).

Note: `safeVariance` and `keycardVariance` are explicitly out of scope for this change (see Non-goals). The scope intentionally focuses on the two figures derivable from data already loaded in the component.

### Non-goals

- `safeVariance` and `keycardVariance` fields — these require `TillDataContext` and `SafeDataContext` which are not on the EOD checklist page; adding them is a separate refactor. Deferred to a follow-on.
- Full EOD report screen — the existing `ManagerAuditContent` / EOD report path handles that.
- Manager override / exception carry-over mechanism — tracked separately as IDEA-DISPATCH-20260301-0084.
- Blind mode / drawer-to-employee lock — separate gaps in the worldclass scan.
- Any changes to the safe reconciliation or till close flows themselves.

### Constraints & Assumptions

- Constraints:
  - `EodChecklistContent` does not currently use `TillDataContext` or `SafeDataContext`. Adding those providers as page-level wrappers is in scope only if the performance and context cost is acceptable; otherwise a lighter approach (passing computed figures via new hooks or directly reading from existing hook results) is preferred.
  - The closure record is written with `set()` (idempotent overwrite) — enriching the payload does not change the write strategy.
  - The `eodClosureSchema` uses Zod. New fields should be `z.number().optional()` and `z.number().int().optional()` respectively to maintain backward compat with records written before this change.
  - Firebase RTDB path is `eodClosures/<YYYY-MM-DD>`, keyed by Italy-timezone date. No change needed to the path.
- Assumptions:
  - Cash variance definition: sum of `closeDifference` across all shifts closed today. `closeDifference` is written per-shift by `CloseShiftForm`. The EOD page currently calls `useTillShiftsData({ limitToLast: 10 })`; to prevent silently undercounting on higher-shift days, the limit must be raised to 20 (or filtered by today's date). For BRIK's single-terminal hostel context, 20 is well above the realistic daily maximum. A task seed must address this limit change.
  - Stock delta definition: count of distinct `itemId` values that have at least one `count`-type ledger entry today. This is the number of inventory items physically counted, not a quantity delta. Already computable from `entries` loaded by `useInventoryLedger` (already in component).
  - Keycard variance and safe variance: explicitly out of scope (see Non-goals).

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A manager reviewing the stored EOD closure record can see the cash over/short and stock items-counted figures without navigating to separate screens.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/eod-checklist/page.tsx` — Next.js route page; wraps content in `<Providers>` (auth + loan + theme only — no till/safe context). Renders `<EodChecklistContent />`.
- `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — "use client" component; the only entry point for the EOD close flow. Contains all checklist state logic and the confirm button.

### Key Modules / Files

- `apps/reception/src/schemas/eodClosureSchema.ts` — Zod schema for the closure record. Currently: `date`, `timestamp`, `confirmedBy`, `uid?`. This is the schema to enrich.
- `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` — `confirmDayClosed()` mutation; builds the payload and calls `set(ref(database, 'eodClosures/<date>'), result.data)`. This is where enriched fields must be injected.
- `apps/reception/src/hooks/data/useEodClosureData.ts` — Subscribes to `eodClosures/<date>` and returns the record for today. Will automatically surface new fields once schema is enriched.
- `apps/reception/src/hooks/data/till/useTillShiftsData.ts` — Already called by `EodChecklistContent` with `limitToLast: 10`. The `TillShift` type (from `tillShiftSchema`) includes `closeDifference?: number` per shift — this is the per-shift cash over/short. Summing `closeDifference` across shifts closed today gives an approximation of cash variance without needing `TillDataContext`.
- `apps/reception/src/schemas/tillShiftSchema.ts` — `TillShift` has `closeDifference?: number`, `closedAt?: string`, `status?: "open" | "closed"`. This provides cash variance data from the existing hook call in `EodChecklistContent`.
- `apps/reception/src/hooks/data/inventory/useInventoryLedger.ts` — Already called by `EodChecklistContent`. Returns `entries: InventoryLedgerEntry[]`. A `count` type entry for today means that item was stock-counted. The count of unique `itemId` values with a today `count` entry is the "items counted" figure.
- `apps/reception/src/hooks/data/endOfDay/variance.ts` — Contains `calculateCashVariance`, `calculateKeycardVariance`, `calculateSafeVariance` pure functions. These are the authoritative variance formulas. However, their inputs require data from `TillDataContext` and `SafeDataContext` which are not on the EOD checklist page. For the initial scope, per-shift `closeDifference` summation is the pragmatic approach.
- `apps/reception/src/hooks/data/useEndOfDayReportData.ts` — Full EOD report hook. Would provide exact variance but requires `TillDataProvider` + `SafeDataProvider` wrappers. Not viable in the current page architecture without adding those providers.
- `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx` — 18 test cases covering the existing checklist. Will need new test cases for the variance display pre-close and in the banner post-close.
- `apps/reception/src/hooks/mutations/__tests__/useEodClosureMutations.test.ts` — 2 test cases. Must be updated to cover the enriched payload.

### Patterns & Conventions Observed

- Schema changes use Zod with `z.number().optional()` for nullable numeric fields — evidence: `safeCountSchema.ts`, `tillShiftSchema.ts`.
- Firebase write mutations validate with `schema.safeParse(payload)` before calling `set()` — evidence: `useEodClosureMutations.ts` line 42.
- New display elements follow the pattern `data-cy="<element-name>"` for test selectors — evidence: `EodChecklistContent.tsx` throughout.
- Loading state indicators follow `data-cy="<section>-loading"` / `data-cy="<section>-status"` pattern — evidence: `EodChecklistContent.tsx`.
- Context providers are per-page, not global — `SafeDataProvider` and `TillDataProvider` are only present on their respective dedicated pages, not in `Providers.tsx`.

### Data & Contracts

- Types/schemas/events:
  - `EodClosure` (from `eodClosureSchema`): `{ date: string; timestamp: string; confirmedBy: string; uid?: string }`. Needs extension.
  - `TillShift` (from `tillShiftSchema`): includes `closeDifference?: number` — cash variance per shift.
  - `InventoryLedgerEntry` (from `inventoryLedgerSchema`): includes `type: "count"` — today's stock count entries.
  - Proposed extension to `eodClosureSchema`: `cashVariance?: number` (sum of `closeDifference` across shifts closed today), `stockItemsCounted?: number` (count of unique itemIds with a today `count` ledger entry).
- Persistence:
  - Firebase RTDB path: `eodClosures/<YYYY-MM-DD>` written with `set()` — idempotent overwrite.
  - Backward compatibility: optional fields mean records written before this change remain valid.
- API/contracts:
  - `confirmDayClosed` signature: `() => Promise<void>`. Needs to accept or internally derive the variance figures. Two options: (a) `confirmDayClosed(snapshot: { cashVariance?: number; stockItemsCounted?: number })` — caller passes a typed object with named fields; (b) `confirmDayClosed()` remains as-is but the mutation hook reads additional data internally. Option (a) is preferred: `EodChecklistContent` already has access to `shifts` and `entries`, and using a typed object (not positional optionals) avoids argument-order bugs and is safe to extend with future fields.

### Dependency & Impact Map

- Upstream dependencies:
  - `useTillShiftsData` in `EodChecklistContent` already provides `shifts` — contains `closeDifference` per shift.
  - `useInventoryLedger` in `EodChecklistContent` already provides `entries` — contains today's `count` type entries.
  - Both hooks are already called and their data is already in scope when the confirm button fires.
- Downstream dependents:
  - `useEodClosureData` — reads the same path; will receive new optional fields transparently once schema is enriched.
  - `EodChecklistContent` "day closed" banner — currently renders `confirmedBy` + `timestamp` only. Must be updated to display enriched fields.
  - Any component reading `EodClosure` type — search confirms only `useEodClosureData` and `EodChecklistContent` currently consume this type.
- Likely blast radius:
  - **Narrow.** The `eodClosures` Firebase path is only read by `useEodClosureData` and written by `useEodClosureMutations`. Schema enrichment with optional fields is fully backward compatible. UI changes are contained to `EodChecklistContent` (pre-close summary row + post-close banner).

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (configured in `apps/reception/jest.config.cjs`)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern> --no-coverage` (tests run in CI only per AGENTS.md policy)
- CI integration: Tests run in CI on push via reusable-app.yml. No local test runs.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `EodChecklistContent` | Component (Jest/RTL) | `eodChecklist/__tests__/EodChecklistContent.test.tsx` | 18 tests covering loading, completion states, confirm button visibility, banner display, float modal. No variance display tests. |
| `useEodClosureMutations` | Hook unit | `hooks/mutations/__tests__/useEodClosureMutations.test.ts` | 2 tests: payload written with correct path/fields; no-op when user null. Tests assert exact payload shape — will need updating for new fields. |
| `eodClosureSchema` | Not directly tested | No `eodClosureSchema.test.ts` found | Schema is validated indirectly via mutation test (TC-01 asserts `set()` receives schema-validated payload). |
| `tillShiftSchema` | Not applicable to this change | Existing tests cover schema shape | `closeDifference` field present and optional — no change needed. |

#### Coverage Gaps

- Untested paths:
  - Variance figures displayed in pre-close summary row (new UI).
  - Variance figures displayed in post-close banner (new UI).
  - `confirmDayClosed` called with variance arguments — mutation test TC-01 will fail against new signature.
  - Schema round-trip test for new optional fields in `eodClosureSchema`.
- Extinct tests:
  - `useEodClosureMutations.test.ts` TC-01 asserts `set()` receives `{ date, timestamp, confirmedBy, uid }` exactly. Once `cashVariance` and `stockItemsCounted` are added to the payload, this assertion needs updating.

#### Testability Assessment

- Easy to test:
  - `eodClosureSchema` — pure Zod schema, add unit test for valid/invalid payloads with new fields.
  - `EodChecklistContent` pre-close summary — mock `shifts` data with `closeDifference` values and assert rendered text.
  - `EodChecklistContent` post-close banner — mock `closure` with new optional fields and assert rendered text.
- Hard to test:
  - Exact variance computation: if done inside the mutation hook, requires mocking `shifts` and `entries` there. Preferred approach: compute in `EodChecklistContent` and pass as a typed snapshot object to `confirmDayClosed` — easier to test both sides independently.
- Test seams needed:
  - `confirmDayClosed` signature changes to accept `(snapshot?: { cashVariance?: number; stockItemsCounted?: number })` — a typed object, not positional args. The mutation test mock must be updated to handle the new signature and the expanded payload written to Firebase.

#### Recommended Test Approach

- Unit tests for: `eodClosureSchema` schema extension (new optional fields accept/reject).
- Component tests for: pre-close variance summary row in `EodChecklistContent`; post-close banner showing variance fields.
- Unit tests for: updated `useEodClosureMutations` `confirmDayClosed` with new payload fields.

### Recent Git History (Targeted)

- `apps/reception/src/schemas/eodClosureSchema.ts` — Last touched: commit `6a9d5e3e4f` ("add eodClosures Firebase rules and schema") — initial schema creation.
- `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` — Last touched: commit `1272fde23d` ("add EOD closure read hook, write hook, and mutation tests") — initial implementation.
- `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — Last touched: commit `1e920aab23` ("build OpeningFloatModal, wire EOD checklist, add till nudge") — latest: added float section.
- Implication: EOD closure module is recently built (Feb 2026) and currently has minimal test coverage. No concurrent PRs in this area observed.

## Questions

### Resolved

- Q: Does `useEndOfDayReportData` provide the right variance data, and can it be used in `EodChecklistContent`?
  - A: It provides exact variance but depends on `TillDataContext` and `SafeDataContext` which are not provided at the EOD checklist page. The page wraps in `<Providers>` which does not include those contexts. Adding them is possible (pattern: see `safe-reconciliation/page.tsx`) but introduces data overhead for a page that currently only reads 4 lightweight hooks. The pragmatic approach: derive cash variance from `shifts` data already loaded (summing `closeDifference` for today's closed shifts) and stock items-counted from `entries` already loaded. This avoids a provider refactor.
  - Evidence: `apps/reception/src/app/eod-checklist/page.tsx`, `apps/reception/src/components/Providers.tsx`, `apps/reception/src/app/safe-reconciliation/page.tsx`, `useEndOfDayReportData.ts` (imports from `TillDataContext`, `SafeDataContext`).

- Q: Are there any other consumers of `EodClosure` type or `eodClosures` Firebase path that must be updated?
  - A: No. Search confirms only `useEodClosureData` (reader) and `useEodClosureMutations` (writer) reference the `eodClosures` path. Only `EodChecklistContent` imports and consumes the `EodClosure` type.
  - Evidence: grep on `eodClosures\|EodClosure\|eodClosureSchema` across `apps/reception/src` — 4 files found: `eodClosureSchema.ts`, `EodChecklistContent.tsx`, `useEodClosureMutations.ts`, `useEodClosureData.ts`.

- Q: Is `closeDifference` on `TillShift` the right field for cash variance, and is it already populated at EOD?
  - A: `closeDifference` is written when a shift is closed via `CloseShiftForm`. It represents `countedCash - expectedCashAtClose` for that shift. By the time the "Confirm day closed" button is enabled, all shifts must be closed (`tillDone = openShifts.length === 0`). So `closeDifference` will be populated for all today's shifts. Summing across today's shifts gives total cash over/short for the day.
  - Evidence: `apps/reception/src/schemas/tillShiftSchema.ts` (field definition), `apps/reception/src/components/till/CloseShiftForm.tsx` (populates `closeDifference` at close), `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` (tillDone gate).

- Q: What should "stock delta" mean in the closure record — delta quantity or items counted count?
  - A: The dispatch packet asks for "stock delta summary". The most operationally useful figure for a closure record is `stockItemsCounted`: the number of distinct inventory items for which a `count` entry was submitted today. This mirrors what the checklist already confirms (`stockDone = entries.some(e => e.type === 'count' && sameItalyDate(...))`). A raw quantity delta would require joining against expected quantities and is significantly more complex. `stockItemsCounted` is the right MVP figure; it answers "was stock fully counted?" with a number, not just a boolean.
  - Evidence: `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` (stockDone logic), `apps/reception/src/schemas/inventoryLedgerSchema.ts` (type "count" entry meaning).

### Open (Operator Input Required)

- Q: Should the pre-close variance summary show cash over/short as a signed number (e.g. "−€3.50 cash") or as absolute plus direction label (e.g. "€3.50 short")?
  - Why operator input is required: Display format is a UX preference. Both are unambiguous; operator may have a house style preference.
  - Decision impacted: Display string format in the pre-close summary and post-close banner.
  - Decision owner: Operator / product owner
  - Default assumption: Signed number with currency symbol — positive means cash over (more than expected), negative means cash short (less than expected). For example: "€+3.50" = over by €3.50; "€−2.00" = short by €2.00. This is consistent with how `closeDifference` is stored (signed: `countedCash − expectedCashAtClose`). Risk: operator may prefer labeled format. Low risk — easily changed in a follow-on.

## Confidence Inputs

- Implementation: 90%
  - Evidence: Entry points, schema, mutation hook, and consuming component are all fully read. Data flow is clear. The approach (enrich schema + mutation + component) is straightforward with no hidden complexity.
  - What raises to >=80: Already met — all files read, data flow confirmed.
  - What raises to >=90: Confirmed: no secondary consumers, backward-compatible schema extension, data for variance already loaded in the component.

- Approach: 85%
  - Evidence: Deriving cash variance from `shifts[].closeDifference` (already loaded) rather than `useEndOfDayReportData` (requires extra context providers) is the right tradeoff. Confirmed by reading both `EodChecklistContent` and `Providers.tsx`.
  - What raises to >=80: Already met.
  - What raises to >=90: Would require operator confirmation on the display format question (open question above), and implementation proof that `closeDifference` is reliably populated by the time EOD confirm is available.

- Impact: 80%
  - Evidence: Worldclass scan explicitly identifies this as a gap. The fix is small in scope but directly addresses the manager's inability to see variance figures from the stored closure record.
  - What raises to >=80: Already met — gap is clearly documented in the scan.
  - What raises to >=90: Requires confirming with operator that cash over/short (not full report) is the primary need.

- Delivery-Readiness: 88%
  - Evidence: All files located, schema and hook structure understood, test landscape mapped, blast radius narrow. No external service dependencies. No migration needed (Firebase RTDB is schema-less; optional fields are backwards compatible).
  - What raises to >=80: Already met.
  - What raises to >=90: Resolving the open display format question.

- Testability: 85%
  - Evidence: Component tests follow established mock patterns (18 existing tests as template). Mutation test update is mechanical. Schema unit tests are straightforward Zod assertions.
  - What raises to >=80: Already met.
  - What raises to >=90: Would benefit from a clear seam for computing variance (computed in `EodChecklistContent` and passed to `confirmDayClosed`) vs computing it inside the mutation hook.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `closeDifference` null for some shifts | Low | Moderate | `closeDifference` is optional in schema; EOD confirm gate requires `tillDone` (all shifts closed). Closed shifts written via `CloseShiftForm.finishConfirm()` always populate `closeDifference`. Treat `undefined`/`null` as 0 in summation. |
| `useTillShiftsData` limit too low to capture all same-day shifts | Low | Moderate | Current limit is 10; TASK-03 bumps to 20 to prevent silent undercount. For BRIK's single-terminal context, 20 safely covers any realistic day. |
| Backward compat: old closure records rendered in updated banner | None | None | New fields are `optional`; the banner component must handle absent fields gracefully (show "—" or omit the row). Schema `safeParse` will still pass for old records. |
| Type widening in mutation test TC-01 | Certain | Minor | Test asserts exact `set()` payload shape. Must update test to expect new optional fields. This is a known required change, not a risk. |
| Display format of variance (signed vs labeled) | Low | Minor | Open question; default to signed (positive = over, negative = short) — easy to change post-deploy if operator disagrees. |

## Planning Constraints & Notes

- Must-follow patterns:
  - New Zod fields must be `z.number().optional()` — consistent with every other optional numeric field in the codebase.
  - The mutation must still `safeParse` before writing — new fields flow through the same validation gate.
  - Display elements must use `data-cy` attributes for testability.
  - No local test runs — push and use CI (per AGENTS.md policy).
- Rollout/rollback expectations:
  - No migration needed. Old records remain valid (missing optional fields). New records carry new fields. Rollback is safe — old code ignores unknown fields; new fields are simply not populated.
- Observability expectations:
  - No new observability hooks needed. The existing toast error path in `useEodClosureMutations` covers write failures.

## Suggested Task Seeds (Non-binding)

- TASK-01: Extend `eodClosureSchema` — add `cashVariance?: z.number()` and `stockItemsCounted?: z.number().int()` fields. Update `EodClosure` type. Add schema unit test.
- TASK-02: Update `useEodClosureMutations.confirmDayClosed` signature to accept `(snapshot?: { cashVariance?: number; stockItemsCounted?: number })` and merge these into the validated payload.
- TASK-03: Update `EodChecklistContent`: (a) bump `useTillShiftsData` limit from 10 to 20 to prevent undercount on higher-shift days; (b) compute `cashVariance` (sum of `closeDifference` across today's closed shifts) and `stockItemsCounted` (count of distinct `itemId` values with a today `count` ledger entry); (c) pass as a typed snapshot object to `confirmDayClosed`; (d) render a pre-close variance summary row above the confirm button.
- TASK-04: Update the "day closed" banner in `EodChecklistContent` to show `cashVariance` and `stockItemsCounted` from the loaded `closure` record.
- TASK-05: Update `useEodClosureMutations.test.ts` TC-01 assertion for enriched payload. Add component tests for pre-close variance row and post-close banner variance display.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| EOD closure schema (`eodClosureSchema.ts`) | Yes | None | No |
| EOD closure mutation (`useEodClosureMutations.ts`) | Yes | None | No |
| EOD closure data hook (`useEodClosureData.ts`) | Yes | None | No |
| `EodChecklistContent` — data already loaded | Yes | None | No |
| Cash variance source — `shifts[].closeDifference` with limit bump to 20 | Yes | [Minor]: `useTillShiftsData({ limitToLast: 10 })` could undercount on high-shift days. Addressed in TASK-03: limit bumped to 20. | No |
| Stock delta source — `entries` with `type === 'count'` | Yes | None | No |
| Context provider architecture — `TillDataContext`/`SafeDataContext` absent from EOD page | Yes | [Scope gap / Minor]: `useEndOfDayReportData` (full precision variance) cannot be used without adding providers. Identified and mitigated: use per-shift `closeDifference` instead. | No |
| Downstream consumers of `EodClosure` type | Yes | None | No |
| Test landscape — mutation test TC-01 assertion | Yes | [Type contract gap / Minor]: TC-01 asserts exact payload shape and will fail after schema enrichment. Known required update, called out in task seeds. | No |
| Firebase RTDB backward compatibility | Yes | None | No |

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `eodClosureSchema` accepts `cashVariance?: number` and `stockItemsCounted?: number`.
  - `confirmDayClosed` writes these fields when provided.
  - Pre-close summary row renders in `EodChecklistContent` when `allDone` is true.
  - Post-close banner shows `cashVariance` and `stockItemsCounted` from stored closure.
  - All new paths have component and unit test coverage.
  - `pnpm typecheck && pnpm lint` passes.
- Post-delivery measurement plan:
  - Manual verification: close a day and confirm the stored closure record in Firebase RTDB contains `cashVariance` and `stockItemsCounted`.
  - Manager review: confirm the "day closed" banner shows variance figures without navigating to separate screens.

## Evidence Gap Review

### Gaps Addressed

- **Context provider gap**: Established that `useEndOfDayReportData` is not usable at the EOD checklist page without adding `TillDataProvider` + `SafeDataProvider`. Mitigated by using data already loaded in `EodChecklistContent`: `shifts[].closeDifference` for cash variance, `entries` filtered to today's `count` type for stock items counted.
- **Secondary consumer gap**: Confirmed via grep that no other component or hook consumes `EodClosure` type or the `eodClosures` RTDB path, so schema enrichment blast radius is exactly 4 files.
- **Backward compat**: Confirmed optional fields are fully backward compatible with existing records.
- **Test mutation assertion**: Identified TC-01 in `useEodClosureMutations.test.ts` as a known required update — exact payload assertion will fail. Called out in task seeds.

### Confidence Adjustments

- No downward adjustments from initial scores — all key claims were verified against file content. Approach confidence (85%) reflects the pragmatic decision to use `closeDifference` rather than the full EOD report hook; this is lower than 90% only because the open display format question remains.

### Remaining Assumptions

- `closeDifference` is always populated for shifts closed by `CloseShiftForm.finishConfirm()`. This was inferred from reading the form code; it was not tested against actual Firebase data. Risk: low.
- A single hostel day has fewer than 20 shifts. TASK-03 bumps `useTillShiftsData` limit from 10 to 20. Risk: very low for BRIK's single-terminal context.
- Operator accepts signed number format for variance display. Risk: low — easily overridable.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-eod-variance-amounts --auto`
