---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Build-completed: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-stock-count-attribution
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Stock Count Attribution Plan

## Summary

The manager-facing Stock Variance table in `ManagerAuditContent` already receives `InventoryLedgerEntry` objects that each carry a `user` field (the submitting staff member's `user_name`), but that field is not rendered. This plan adds a "Counted by" column to the Stock Variance table and adds a test case to the existing test suite that asserts the column renders correctly. No schema, type, hook, or Firebase write changes are required — this is a pure display addition against data that is already present.

## Active tasks

- [ ] TASK-01: Add "Counted by" column to ManagerAuditContent Stock Variance table
- [ ] TASK-02: Add test case covering "Counted by" column to ManagerAuditContent test suite

## Goals

- Surface `entry.user` as a "Counted by" column in the Stock Variance table so managers can see who submitted each count line.
- Add a test assertion that the column header and value render correctly.

## Non-goals

- Adding a new `submittedBy` schema field (the existing `user` field carries this data).
- Adding filters or CSV export to `ManagerAuditContent` (separate dispatch IDEA-DISPATCH-20260301-0082).
- Modifying the batch count progress localStorage or any write path.

## Constraints & Assumptions

- Constraints:
  - No changes to `InventoryLedgerEntry` type, Zod schema, or Firebase write path.
  - Column must render `entry.user || "—"` to handle gracefully any entries with blank user.
  - Table column pattern must follow existing `@acme/design-system` `TableHead`/`TableCell` primitives.
- Assumptions:
  - All count entries written by current codebase carry a non-empty `user` field.
  - `user.user_name` is a human-readable display value (confirmed by existing `StockManagement` usage at line 1014).

## Inherited Outcome Contract

- **Why:** Staff accountability gap identified in world-class scan (2026-02-28): post-count investigation cannot identify which staff member counted which items. Operator-stated priority.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Manager can see who submitted each stock count line in the Stock Variance audit table, enabling staff accountability during post-count review.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-stock-count-attribution/fact-find.md`
- Key findings used:
  - `ManagerAuditContent` Stock Variance table renders `item`, `delta`, `date` — NOT `entry.user` (confirmed lines 139–169).
  - `entry.user` is already present on every `InventoryLedgerEntry` object in the `entries` array (required field in Zod schema and TypeScript type).
  - `StockManagement` Count Variance Report already renders `entry.user` directly at line 1014 — exact precedent pattern.
  - `ManagerAuditContent.test.tsx` has 7 existing tests covering sections render, access control, shifts, checkins, loading, delta formatting, zero-checkin — none assert `entry.user` rendering.

## Proposed Approach

- Option A: Add a 4th `TableHead`/`TableCell` column for "Counted by" rendering `entry.user || "—"` in the `stockVarianceRows.map()` section of `ManagerAuditContent`.
- Option B: Add `submittedBy` as a new field on `InventoryLedgerEntry` and use it instead of `user`.
- Chosen approach: **Option A.** The `user` field already carries the attribution data and `StockManagement` already renders it this way. Option B would add a redundant field, require schema migration, and duplicate data without benefit.

## Plan Gates

- Foundation Gate: Pass — `Deliverable-Type: code-change`, `Execution-Track: code`, `Primary-Execution-Skill: lp-do-build`, `Startup-Deliverable-Alias: none`, Delivery-readiness 97%, test landscape documented, testability assessed.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | Add "Counted by" column to ManagerAuditContent Stock Variance table | 80% | S | Complete (2026-03-01) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add test case covering "Counted by" column | 90% | S | Complete (2026-03-01) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Single file change; no prerequisites |
| 2 | TASK-02 | TASK-01 complete | Test asserts the column added in TASK-01; logically sequential |

---

## Tasks

### TASK-01: Add "Counted by" column to ManagerAuditContent Stock Variance table

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — Stock Variance table gains a 4th "Counted by" column.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx`
- **Depends on:** -
- **Blocks:** TASK-02
- **Build evidence:** Added `<TableHead>Counted by</TableHead>` to Stock Variance header row and `<TableCell>{entry.user || "—"}</TableCell>` to data row in `stockVarianceRows.map()`. Column order: Item | Delta | Date | Counted by. TypeScript compiles cleanly (`tsc --noEmit` exit 0). ESLint passes. Committed in c6544be0b4.
- **Confidence:** 80%
  - Implementation: 95% — Single-file change: add one `TableHead` element and one `TableCell` element inside the existing `stockVarianceRows.map()`. Data is already available as `entry.user`. The precedent is identical in `StockManagement` at line 1014.
  - Approach: 95% — Exact precedent exists (`StockManagement` Count Variance Report). Table primitives are the same `@acme/design-system` components already used in `ManagerAuditContent`.
  - Impact: 80% — Display-only addition. Manager immediately sees staff attribution for each count row. Risk: very early Firebase entries with blank `user` would render `"—"` via fallback. Held-back test: "What single unresolved unknown would push Impact below 80?" — no unknown would; fallback handles blank user, blast radius is zero (no downstream consumers), and the data path is confirmed. Held-back test passes.
- **Acceptance:**
  - [ ] Stock Variance table has a "Counted by" column header.
  - [ ] Each count row shows the submitting staff name (`entry.user`).
  - [ ] Entries with blank/empty `user` show `"—"` in the column.
  - [ ] Existing columns (Item, Delta, Date) are unaffected.
  - [ ] TypeScript compiles cleanly (no type errors introduced).
  - [ ] Lint passes.
- **Validation contract:**
  - TC-01: Entry with `user: "alice"`, `type: "count"`, within last 7 days → "Counted by" column cell shows "alice".
  - TC-02: Entry with `user: ""`, `type: "count"` → "Counted by" column cell shows "—".
  - TC-03: Entry with `type: "receive"` (not count) → not included in `stockVarianceRows`, does not appear in table.
  - TC-04: No count entries in last 7 days → "No variance in the last 7 days" message shown (existing behaviour unchanged).
  - TC-05: Column header "Counted by" is present in `TableHeader`.
- **Execution plan:** Red → Green → Refactor
  - **Red:** Before the change: `ManagerAuditContent` Stock Variance table has 3 columns (Item, Delta, Date). `entry.user` is not rendered anywhere in this component.
  - **Green:** Add `<TableHead className="p-2 text-start border-b border-border-2">Counted by</TableHead>` to the header row, and `<TableCell className="p-2 border-b border-border-2">{entry.user || "—"}</TableCell>` to the data row inside `stockVarianceRows.map()`. Column order: Item | Delta | Date | Counted by.
  - **Refactor:** Inspect className consistency — ensure new column uses the same border/padding class pattern as the three existing columns (all use `p-2 border-b border-border-2`). No further refactor needed.
- **Planning validation:** Not required for S effort.
- **Consumer tracing:** New output is `entry.user` rendered in JSX. The only consumer is the test assertion in TASK-02. No other component reads from `ManagerAuditContent`'s rendered DOM.
- **Scouts:** None — the data path is fully confirmed from fact-find investigation.
- **Edge Cases & Hardening:**
  - Blank/null `user`: render `entry.user || "—"` (consistent with `shift.closedBy ?? "—"` pattern already in this component).
  - Mobile column overflow: the Stock Variance table already has `overflow-x-auto` wrapper (`ManagerAuditContent.tsx` line 138), so a 4th column will scroll horizontally on narrow viewports without layout breakage.
- **What would make this >=90%:** Nothing additional — confidence is capped at 80 by the Impact dimension floor (see held-back test reasoning above). Implementation and Approach are both 95.
- **Rollout / rollback:**
  - Rollout: Merge PR; deployed on next staging/production push. No feature flag needed.
  - Rollback: Revert the single file change. No data or schema change to undo.
- **Documentation impact:** None — internal audit UI change; no user-facing docs or API docs to update.
- **Notes / references:**
  - Precedent: `apps/reception/src/components/inventory/StockManagement.tsx` line 1014 renders `entry.user` directly in Count Variance Report.
  - Pattern: `shift.closedBy ?? "—"` at `ManagerAuditContent.tsx` line 219 for the existing nullable-field fallback pattern.

---

### TASK-02: Add test case covering "Counted by" column to ManagerAuditContent test suite

- **Type:** IMPLEMENT
- **Deliverable:** New test case added to `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx`, `[readonly] apps/reception/src/components/managerAudit/ManagerAuditContent.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Build evidence:** Added `within` to import (`{ render, screen, within }`). Added 2 new test cases: (1) "renders 'Counted by' column with staff name from entry.user" — asserts `screen.getByText("Counted by")` and `screen.getByText("alice")`; (2) "renders '—' in 'Counted by' column when entry.user is empty" — uses `within(stockVarianceSection).getAllByText("—")` for disambiguation. Total suite: 9 tests (7 existing + 2 new). TypeScript compiles cleanly. ESLint passes. Committed in c6544be0b4.
- **Confidence:** 90%
  - Implementation: 95% — Test file exists with 7 cases and all required mocks (useInventoryLedger, useInventoryItems, useTillShiftsData, useCheckins, canAccess). The new test case follows the identical pattern as the existing delta-formatting test (line 150–168 of test file).
  - Approach: 95% — Add one `it(...)` block inside the existing `describe("ManagerAuditContent")` suite. Provide a mock `entries` array with one count entry that includes `user: "alice"`, assert both `"Counted by"` header and `"alice"` cell value appear.
  - Impact: 90% — Closes the coverage gap identified in the fact-find. Once this test passes, the regression baseline is complete.
- **Acceptance:**
  - [ ] New test case exists in `ManagerAuditContent.test.tsx`.
  - [ ] Test asserts column header "Counted by" is present in the rendered output.
  - [ ] Test asserts `entry.user` value (e.g. "alice") appears in the table row.
  - [ ] Test asserts fallback "—" renders when `entry.user` is empty string.
  - [ ] All 8 tests in the suite pass (7 existing + 1 new).
- **Validation contract:**
  - TC-01: Mock entry `{ type: "count", user: "alice", quantity: 3, timestamp: Date.now() - 1000 }` → screen contains text "Counted by" and text "alice".
  - TC-02: Mock entry `{ type: "count", user: "", quantity: 3, timestamp: Date.now() - 1000 }` → screen contains "—" in the Counted by cell.
  - TC-03: All existing 7 tests in the suite continue to pass without modification.
- **Execution plan:** Red → Green → Refactor
  - **Red:** Before TASK-01, there is no "Counted by" column to assert. After TASK-01 merges, the column exists in the component but no test covers it.
  - **Green:** Add `within` to the import line (currently `{ render, screen }` — extend to `{ render, screen, within }`). Add test case `"renders 'Counted by' column with staff name from entry.user"`. Use existing mock infrastructure: `useInventoryLedgerMock.mockReturnValue({ entries: [{ id: "e-user", itemId: "item-1", type: "count", quantity: 2, timestamp: Date.now() - 1000, user: "alice" }], loading: false, error: null })`. Assert `screen.getByText("Counted by")` and `screen.getByText("alice")`. For blank-user fallback: use `getAllByText("—")` or `within()` to scope to the Stock Variance section to disambiguate from other "—" values in the component.
  - **Refactor:** No refactor needed; single it-block addition.
- **Planning validation:** Not required for S effort.
- **Consumer tracing:** This task's output (new `it(...)` block) is consumed only by the CI test runner. No other code reads from test files.
- **Scouts:** None — all mock infrastructure confirmed to exist in the test file.
- **Edge Cases & Hardening:**
  - The "—" fallback assertion requires care: `ManagerAuditContent` already renders multiple "—" values (for shift fields). Use `within()` scoped to the Stock Variance table or the specific row to avoid ambiguity when asserting the blank-user fallback.
- **What would make this >=90%:** Already at 90%. Would reach 95% after CI confirms all 8 tests green (7 existing + 1 new).
- **Rollout / rollback:**
  - Rollout: Part of the same PR as TASK-01.
  - Rollback: Revert the test file change alongside the component revert.
- **Documentation impact:** None.
- **Notes / references:**
  - Existing test precedent at `ManagerAuditContent.test.tsx` lines 150–168 (delta formatting test).
  - `within()` is NOT currently imported in the test file (imports are `{ render, screen }` only). The execution plan must add `within` to the import line: `import { render, screen, within } from "@testing-library/react"`.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add "Counted by" column | Yes — `entry.user` confirmed on `InventoryLedgerEntry`, `ManagerAuditContent` already calls `useInventoryLedger`, table primitives confirmed | None | No |
| TASK-02: Add test case for column | Yes — TASK-01 adds the column, test file and all mocks already exist | [Minor] Blank-user fallback assertion may be ambiguous due to multiple "—" values in component; use `within()` scoping | No |

No Critical findings. Plan proceeds.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Very early Firebase count entries have blank `user` | Low | Low — shows "—" via fallback | `entry.user \|\| "—"` fallback in TASK-01 |
| Test "—" ambiguity in blank-user fallback assertion | Low-Medium | Low — test would fail to distinguish columns | Use `within()` scoping in TASK-02 (noted in edge cases) |
| Mobile column width squeeze | Low-Medium | Low — cosmetic only | `overflow-x-auto` wrapper already present; no layout breakage |

## Observability

- Logging: None — display-only change.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [x] `ManagerAuditContent` Stock Variance table renders a "Counted by" column showing `entry.user || "—"` for each count row.
- [x] All existing `ManagerAuditContent` tests continue to pass.
- [x] New test case asserts column header and cell value render correctly.
- [x] TypeScript typecheck passes.
- [x] Lint passes.

## Decision Log

- 2026-03-01: Chosen approach: render `entry.user` as "Counted by" column. Rejected adding a new `submittedBy` field — `user` already carries this data; adding a duplicate field would require schema changes with no benefit.

## Overall-confidence Calculation

- TASK-01: confidence 80%, effort S (weight 1)
- TASK-02: confidence 90%, effort S (weight 1)
- Overall-confidence = (80×1 + 90×1) / (1+1) = 85%
