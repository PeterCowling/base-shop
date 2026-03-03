---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-01
Last-updated: 2026-03-01
Feature-Slug: reception-stock-count-attribution
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-stock-count-attribution/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260301-0081
---

# Reception Stock Count Attribution Fact-Find Brief

## Scope

### Summary

Firebase ledger entries written by the batch stock count flow already carry a `user` field (the submitting staff member's `user_name`), but `ManagerAuditContent` — the manager-facing Stock Variance table — does not render that field. The result is that the audit view shows item/delta/date but omits who counted. Post-count investigation cannot quickly identify which staff member submitted which count line.

The change is small and contained: surface `entry.user` as a "Counted by" column in the Stock Variance table in `ManagerAuditContent`. No new field needs to be added to the schema — the data is already written.

### Goals

- Make the manager-facing Stock Variance table show who submitted each count line (the existing `user` field on every `InventoryLedgerEntry`).
- Confirm that all count entry submission paths (batch count + single-item count) already write `user` correctly.
- Ensure the audit table in `ManagerAuditContent` reflects this without regressions.

### Non-goals

- Adding a new `submittedBy` field to the Firebase schema: the existing `user` field already carries this data.
- Adding filters or CSV export to `ManagerAuditContent` (separate dispatch IDEA-DISPATCH-20260301-0082).
- Modifying the batch count progress storage (localStorage) to include user attribution.
- Changing how `user` is set on non-count entry types.

### Constraints & Assumptions

- Constraints:
  - The Zod schema and TypeScript interface for `InventoryLedgerEntry` must stay backwards-compatible — no new required fields.
  - The `user` field is already required in `inventoryLedgerEntrySchema` and `InventoryLedgerEntry` — all entries written by the current codebase carry it; the risk section notes that very early entries (written before the schema enforcement was in place) may not.
- Assumptions:
  - All count entries written via `useInventoryLedgerMutations.addLedgerEntry` correctly receive `user: user.user_name` from `useAuth()` at write time.
  - The `user.user_name` value in `AuthContext` is a human-readable staff name (not a UID) and is appropriate to display in the audit view.

## Outcome Contract

- **Why:** Staff accountability gap identified in world-class scan (2026-02-28): post-count investigation cannot identify which staff member counted which items. Operator-stated priority.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Manager can see who submitted each stock count line in the Stock Variance audit table, enabling staff accountability during post-count review.
- **Source:** auto

---

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/inventory/BatchStockCount.tsx` — Primary entry point for batch count submissions. `executeCategorySubmit` loops per item and calls `addLedgerEntry({itemId, type: "count", quantity, reason, note, unit})`. Does NOT pass `user` — correctly omitted because the mutations hook auto-injects it from `useAuth()`.
- `apps/reception/src/components/inventory/StockManagement.tsx:512` — Single-item count path via `finalizeLedgerEntry`. Calls `addLedgerEntry({itemId, type, quantity, reason, reference, note, unit})`. Same pattern — `user` auto-injected by mutation hook.
- `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — Manager-facing audit view. Renders Stock Variance table (line 139–169) showing `item`, `delta`, `date`. Does NOT render `entry.user`.

### Key Modules / Files

1. `apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts` — `addLedgerEntry` callback at line 21. Sets `user: user.user_name` (line 32) before calling Firebase `set()`. This is the single authoritative injection point for `user` on all ledger writes. `user_name` comes from `useAuth()`.
2. `apps/reception/src/schemas/inventoryLedgerSchema.ts` — Zod schema with `user: z.string()` (line 16, required). Validates all entries before Firebase write.
3. `apps/reception/src/types/hooks/data/inventoryLedgerData.ts` — `InventoryLedgerEntry` interface: `user: string` (line 19, required). Also defines `InventoryLedgerEntryType` union.
4. `apps/reception/src/context/AuthContext.tsx` — `useAuth()` provides `user.user_name` (also `user.uid`, `user.displayName`, `user.email`). `user_name` is the login-time identifier already used in all ledger writes.
5. `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — Filters `entries` to `type === "count"` within last 7 days (line 88–97), sorts by timestamp, renders table. `entry.user` is available on every entry object but not rendered.
6. `apps/reception/src/components/inventory/StockManagement.tsx` — Count Variance Report section (lines 990–1043) already renders `entry.user` in its own table (line 1014). Confirms the field is present and usable in JSX without any data transform.
7. `apps/reception/src/hooks/data/inventory/useInventoryLedger.ts` — (Not read, but usage confirmed via imports): provides `entries` as `InventoryLedgerEntry[]` to both `StockManagement` and `ManagerAuditContent`.
8. `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx` — Existing test suite for `BatchStockCount`. Mocks `useAuth` with `user: { uid: "user-1", user_name: "pete", ... }`. Tests assert on `addLedgerEntry` call shape; do not currently assert that `user` is populated (the mock does not exercise the real mutations hook path).

### Patterns & Conventions Observed

- `addLedgerEntry` accepts `Omit<InventoryLedgerEntry, "user" | TIMESTAMP_KEY>` — callers never pass `user`; the hook injects it from `useAuth()`. This pattern is consistent across all call sites (BatchStockCount, StockManagement).
- Auth context exposes `user_name` (login-time display name), not raw UID, for human-readable attribution. The `StockManagement` Count Variance Report already uses `entry.user` directly as a display string (line 1014).
- Table rendering pattern in `ManagerAuditContent` follows the same `@acme/design-system` Table primitives used in `StockManagement`.

### Data & Contracts

- Types/schemas/events:
  - `InventoryLedgerEntry.user: string` — required field, set by `useInventoryLedgerMutations.addLedgerEntry` from `user.user_name`.
  - `inventoryLedgerEntrySchema` — Zod: `user: z.string()`. No schema change needed.
  - No Firebase index or security rule changes required — reading an existing field.
- Persistence:
  - Firebase Realtime Database path: `inventory/ledger/<push-id>`. All entries written by the current codebase carry `user`; very early entries (pre-schema) may not, but graceful fallback handles this.
  - No migration required: field is already required by schema and written to all current entries.
- API/contracts:
  - No server-side API involved. All data flows via Firebase Realtime Database → `useInventoryLedger` → component.

### Dependency & Impact Map

- Upstream dependencies:
  - `useInventoryLedger` hook — already called in `ManagerAuditContent` (line 72–75); no new data loading needed.
  - `InventoryLedgerEntry.user` field — already present in every entry fetched by the hook.
- Downstream dependents:
  - Only `ManagerAuditContent` is being modified. No downstream consumers of this component.
- Likely blast radius:
  - Minimal. Adding a table column to `ManagerAuditContent`. No shared types or schemas change. The only file modified is the view component.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (in `apps/reception`).
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern> --no-coverage` (per MEMORY.md). Tests run in CI only — do not run locally.
- CI integration: Tests gate CI.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `BatchStockCount` component | Unit (RTL) | `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx` | 31 test cases (verified by `grep -c "it(" ...`). Tests `addLedgerEntry` call shape (itemId, type, quantity, reason, note). No test currently asserts that `user` is rendered in any audit view. |
| `ManagerAuditContent` | Unit (RTL) | `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` | 7 test cases exist (verified by counting top-level `it(` calls in the describe block: renders-sections, access-control, shifts/null-safe, checkins-count, loading-indicators, delta-formatting, zero-checkins). No test currently asserts that `entry.user` appears as a "Counted by" column — that coverage gap is the one to fill. |
| `inventoryLedger` utils | Unit | `apps/reception/src/utils/__tests__/inventoryLedger.test.ts` | Tests `buildInventorySnapshot` and `calculateOnHandQuantity`. `user` field present in fixture data but not tested as a concern. |
| `useInventoryLedgerMutations` | None (direct) | — | No unit tests for the mutations hook itself. Covered indirectly via `BatchStockCount` integration tests. |

#### Coverage Gaps

- Untested paths:
  - `ManagerAuditContent` has a test file (`__tests__/ManagerAuditContent.test.tsx`, 7 tests) but none of the tests assert that `entry.user` is rendered in the Stock Variance table. The new "Counted by" column needs a test case added to the existing file.
  - No test in any file asserts `entry.user` appears in the rendered audit table. Adding the column without adding an assertion leaves the regression baseline incomplete.
- Extinct tests: None identified.

#### Testability Assessment

- Easy to test:
  - `ManagerAuditContent` renders count entries from a mocked `useInventoryLedger`. Adding a test for the new column requires providing mock entries with `user` field and asserting the column text appears — standard RTL pattern.
- Hard to test: Nothing hard to test in this change.
- Test seams needed:
  - `ManagerAuditContent` already has a test file (`__tests__/ManagerAuditContent.test.tsx`, 7 tests). A new test case is added to that file rather than creating a new file. Mock patterns (hooks + `canAccess`) are already established in the existing test.

#### Recommended Test Approach

- Unit tests for:
  - New test case in existing `ManagerAuditContent.test.tsx`: render with mock entries that include `user: "alice"` on a count entry, assert "alice" appears in the table row. Also assert the column header "Counted by" is present.
- Integration tests for: None needed for this change.
- E2E tests for: None needed.
- Contract tests for: None — no API surface change.

### Recent Git History (Targeted)

- `apps/reception/src/components/inventory/BatchStockCount.tsx`:
  - `140ef16f59` — `feat(brik-stock-count-variance-reason-codes): TASK-03 — wire reason/note into executeCategorySubmit` — Wired `reason` and `note` fields into `addLedgerEntry` call. The `user` field was never part of this call (correctly injected by the mutations hook).
  - `b527bd13b6` — `feat(brik-stock-count-variance-reason-codes): TASK-02+04 — add variance reason prompt UI and breakdown table` — Added variance reason prompt. No `user` field changes.
  - `24f7422b06` — `feat(reception): Wave 3 — TASK-04 reauth gate + TASK-05 batch count toggle` — Added reauth gate to batch count.
  - `3b2aad17c0` — `fix(reception): standardise inventory UI labels to English` — UI label cleanup.
- `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx`:
  - No separate recent history surfaced. Most recent changes have been to `BatchStockCount` and `StockManagement`, not `ManagerAuditContent` directly.

---

## Questions

### Resolved

- Q: Does the `user` field already exist on all Firebase ledger entries, or must it be added as a new schema field?
  - A: The `user` field is already required in both the Zod schema (`inventoryLedgerEntrySchema`, line 16: `user: z.string()`) and the TypeScript type (`InventoryLedgerEntry`, line 19). It is auto-injected by `useInventoryLedgerMutations.addLedgerEntry` on every write (`user: user.user_name`, line 32). No schema change is needed.
  - Evidence: `apps/reception/src/schemas/inventoryLedgerSchema.ts`, `apps/reception/src/types/hooks/data/inventoryLedgerData.ts`, `apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts`

- Q: Does `ManagerAuditContent` already receive count entries with `user` populated, or does the data hook need to be modified?
  - A: `ManagerAuditContent` calls `useInventoryLedger()` and receives `entries: InventoryLedgerEntry[]`. The `user` field is required on this type, so every entry in the array has it. `entry.user` is already accessible in the component's `stockVarianceRows.map()` loop — it just isn't rendered.
  - Evidence: `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` lines 72–96, `apps/reception/src/types/hooks/data/inventoryLedgerData.ts` line 19

- Q: Is `user.user_name` an appropriate display value for a manager audit column, or should `displayName` or `email` be used?
  - A: `user.user_name` is the right value. `StockManagement`'s Count Variance Report already uses `entry.user` directly as the display string in its table (line 1014), and `entry.user` IS `user.user_name` (set at write time). Using `displayName` would require a lookup join — unnecessary since `user_name` is already a human-readable identifier.
  - Evidence: `apps/reception/src/components/inventory/StockManagement.tsx` line 1014, `apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts` line 32

- Q: Does the dispatch's reference to "submittedBy" imply adding a new field name different from the existing `user` field?
  - A: No. The existing `user` field on `InventoryLedgerEntry` serves as the submittedBy attribution. The dispatch description is describing the conceptual gap (no staff attribution visible in the audit view), not prescribing a new field name. The correct implementation is to surface `entry.user` as the attribution column rather than adding a second field carrying the same data.
  - Evidence: `apps/reception/src/schemas/inventoryLedgerSchema.ts`, `apps/reception/src/types/hooks/data/inventoryLedgerData.ts`

### Open (Operator Input Required)

None. All questions are resolvable from the codebase and business context above.

---

## Confidence Inputs

- **Implementation: 98%** — The change is a single table-column addition in `ManagerAuditContent`. The data is already present in the entries array. No new hook, schema, or type changes are needed. Evidence is complete.
  - To reach ≥80%: Already there.
  - To reach ≥90%: Already there; this is a read/display-only change against existing data.

- **Approach: 95%** — Surfacing `entry.user` as "Counted by" is the correct approach. `StockManagement`'s Count Variance Report already does exactly this, providing a precedent pattern. No alternative approach has merit.
  - To reach ≥80%: Already there.
  - To reach ≥90%: Already there.

- **Impact: 80%** — The manager gains immediate staff attribution in the audit table. The limitation is that older entries (pre-schema) may not have `user` populated, but since `user` has been required in the Zod schema for all recent commits, the practical impact is limited to very early data.
  - To reach ≥80%: Already there.
  - To reach ≥90%: Confirm in Firebase that no production count entries have a missing/empty `user` field. (Low risk — the field has been required since the schema was first written.)

- **Delivery-Readiness: 97%** — All code locations are known, the pattern is proven in `StockManagement`, and the test approach is clear. No blockers.
  - To reach ≥80%: Already there.
  - To reach ≥90%: Already there.

- **Testability: 95%** — `ManagerAuditContent` already has an established test file (`__tests__/ManagerAuditContent.test.tsx`, 7 tests) with all mock dependencies set up. Adding a new test case for the "Counted by" column follows the identical pattern as the existing delta formatting test.
  - To reach ≥80%: Already there.
  - To reach ≥90%: Already there.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Some very early Firebase count entries may have an empty or missing `user` field (written before the Zod schema enforced it) | Low | Low — display would show an empty cell or fallback string | Render `entry.user \|\| "—"` for graceful fallback |
| No test in the existing `ManagerAuditContent.test.tsx` suite asserts `entry.user` rendering — adding the column without a new assertion leaves a coverage gap | Certain (until addressed) | Low-Medium — mitigated by adding a test case in the same PR | Adding the test case is explicitly scoped in TASK-02 |
| Column width in mobile view — adding a 4th column to a narrow table may squeeze item/delta/date columns | Low-Medium | Low — cosmetic only | Use same column class patterns as existing narrow columns; test at mobile breakpoint |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Table column pattern: follow `ManagerAuditContent`'s existing `TableHead` / `TableCell` structure from `@acme/design-system`.
  - Fallback: render `entry.user || "—"` to handle any empty attribution gracefully (consistent with other nullable display fields in this component, e.g. `shift.closedBy ?? "—"`).
  - Test assertions must use `data-cy` attributes (per workspace-root `jest.setup.ts` which sets `configure({ testIdAttribute: "data-cy" })` — applied globally to all packages via the shared Jest preset in `packages/config/jest.preset.cjs`). The `apps/reception/jest.config.cjs` does not include a local setup file, but the workspace-root setup is active.
- Rollout/rollback expectations:
  - No Firebase write changes. Pure read/display addition. Rollback is a revert of the component change.
- Observability expectations:
  - No analytics or monitoring changes needed. This is a UI-only display addition.

---

## Suggested Task Seeds (Non-binding)

- TASK-01: Add "Counted by" column to `ManagerAuditContent` Stock Variance table — render `entry.user || "—"` in a new `TableHead`/`TableCell` column.
- TASK-02: Add a test case to the existing `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` — verify that `entry.user` is rendered as the "Counted by" column value in the Stock Variance table.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `ManagerAuditContent` Stock Variance table renders a "Counted by" column showing `entry.user` for each count row.
  - Graceful fallback `"—"` for entries with empty/missing user.
  - New test case in existing `ManagerAuditContent.test.tsx` covering the "Counted by" column.
  - Typecheck and lint pass.
- Post-delivery measurement plan:
  - Manual: log into Reception app as a manager, navigate to Manager Audit — confirm each stock count row in the last 7 days shows the submitting staff name.

---

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry points for count submissions (`BatchStockCount`, `StockManagement`) | Yes | None | No |
| `user` field injection path (`useInventoryLedgerMutations.addLedgerEntry`) | Yes | None | No |
| `InventoryLedgerEntry` type and Zod schema | Yes | None | No |
| `ManagerAuditContent` data loading and table rendering | Yes | None | No |
| Existing test coverage for `BatchStockCount` and `ManagerAuditContent` | Yes | [Missing domain coverage] [Minor]: `ManagerAuditContent` has 7 tests but none assert `entry.user` rendering. `BatchStockCount` has 31 tests but none assert `user` in audit view. Test gap is noted and scoped. | No |
| Auth context — `user_name` availability and display suitability | Yes | None | No |
| Blast radius — downstream consumers of `ManagerAuditContent` | Yes | None | No |
| System boundaries (Firebase, auth, Zod validation) | Yes | None | No |

No Critical findings. Change is contained to a single view component plus a new test case added to the existing test file.

---

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity** — All claims have direct file/line evidence. `user` field injection confirmed at `useInventoryLedgerMutations.ts:32`. Absence from `ManagerAuditContent` table confirmed by inspection of lines 139–169. `StockManagement` precedent for rendering `entry.user` confirmed at line 1014.
2. **Boundary coverage** — Firebase schema, TypeScript type, Zod validation, and auth context all inspected. No integration boundary change required. No auth change required.
3. **Testing coverage** — Existing tests verified (not just listed). `BatchStockCount.test.tsx`: 31 test cases verified by `grep -c "it("`. `ManagerAuditContent.test.tsx`: 7 test cases confirmed by counting top-level `it(` blocks within the describe. Neither suite currently asserts `entry.user` rendering. Coverage gap is scoped and addressed in TASK-02 (add test case to existing file).
4. **Confidence calibration** — Scores reflect the read/display nature of the change (high confidence, low risk). Testability score raised to 95% reflecting that the existing test file and mock infrastructure are already in place.

### Confidence Adjustments

- Implementation confidence: 98% — no adjustment needed. This is a display-only change with full evidence.
- Testability: 95% — `ManagerAuditContent` has an established test file with existing mock infrastructure. Adding the new test case is a low-effort, low-risk addition to an already-working test suite.

### Remaining Assumptions

- Firebase production data: count entries written after Zod schema enforcement carry a non-empty `user` field. Very early entries (written before schema enforcement was in place) may have a blank or missing `user`. This is an unverifiable assumption from code alone; the fallback `entry.user || "—"` handles it gracefully regardless.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-stock-count-attribution`
