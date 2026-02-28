---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: STRATEGY
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: brik-stock-count-variance-reason-codes
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-stock-count-variance-reason-codes/plan.md
Trigger-Source: direct-inject
Trigger-Why: Operators cannot distinguish spoilage, staff comp, breakage, or theft from each other in the variance ledger. This blocks meaningful stock-loss investigation and undermines audit confidence.
Trigger-Intended-Outcome: type: operational | statement: Count variance entries always carry a reason code for negative deltas, enabling operators to categorise each variance event and produce a reason-coded breakdown in the variance report | source: operator
Dispatch-ID: IDEA-DISPATCH-20260228-0076
---

# BRIK Stock Count Variance Reason Codes — Fact-Find Brief

## Scope

### Summary

When an operator completes a batch stock count in `BatchStockCount`, the component writes a ledger entry of type `count` with a hardcoded `reason: "conteggio batch"` for every item. No distinction is captured between a negative variance caused by spoilage, a staff comp, breakage, or theft. The `InventoryLedgerEntry` schema already has an optional `reason` field, and waste entries already use it meaningfully. The change adds a reason-code prompt to the negative-variance confirmation step in `BatchStockCount` and surfaces those reasons in the `StockManagement` variance report.

### Goals

- Prompt the operator for a reason code when a batch count produces a negative delta (delta < 0) for any item in a category.
- Persist the selected reason on each affected ledger entry.
- Surface reason codes in the Count Variance Report table and in the Variance Breakdown section of `StockManagement`.
- Reuse the existing `InventoryLedgerEntry.reason` field — no schema migration required.

### Non-goals

- Requiring reason codes for positive deltas (stock surplus — low operational value, would create friction).
- Mandatory reason codes for single-item count entries made from the `StockManagement` per-item row (different UX; already has a free-text Reason field).
- Changing the ledger data model or Firebase path structure.
- Adding reason codes to waste, adjust, or transfer entry types (already covered or not in scope).

### Constraints & Assumptions

- Constraints:
  - Must not block submission of categories with zero or positive deltas only — prompt only appears when at least one item in the category has a negative delta.
  - Reauth gate (`PasswordReauthModal`) fires for large variances before submission. The reason-code prompt must be inserted into the confirmation flow before or alongside reauth — not after, since `executeCategorySubmit` writes entries immediately.
  - The existing `BATCH_REASON` constant (`"conteggio batch"`) is currently written for all entries regardless of sign. Post-change: reason-coded entries override this; non-negative entries retain `"conteggio batch"` or a neutral constant.
  - Firebase is the write target; no server layer to change. `addLedgerEntry` in `useInventoryLedgerMutations` is the single mutation point.
  - Zod schema (`inventoryLedgerEntrySchema`) has `reason: z.string().optional()` — no schema change needed.
- Assumptions:
  - A dropdown of predefined reason codes (spoilage, staff comp, breakage, theft, other) is preferred over a pure free-text field — reduces inconsistency in the ledger.
  - "Other" option should allow an optional free-text note to be appended or stored alongside.
  - The reason-code prompt is per-category, not per-item. A single reason explains the net negative result for that category session. (See open questions for alternative.)
  - The existing `PasswordReauthModal` is not extended — reason collection happens in a new lightweight inline confirmation step or modal before `executeCategorySubmit` is called.

## Outcome Contract

- **Why:** Operators cannot distinguish spoilage, staff comp, breakage, or theft from each other in the variance ledger. This blocks meaningful stock-loss investigation and undermines audit confidence.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Count variance entries always carry a reason code for negative deltas, enabling operators to categorise each variance event and produce a reason-coded breakdown in the variance report.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/inventory/BatchStockCount.tsx` — the primary component; handles quantity entry, category completion, reauth gating, and calls `addLedgerEntry` via `executeCategorySubmit`.
- `apps/reception/src/components/inventory/StockManagement.tsx` — parent that hosts `BatchStockCount` and contains the Count Variance Report table and `VarianceBreakdownSection`.

### Key Modules / Files

1. `apps/reception/src/components/inventory/BatchStockCount.tsx` — **submission logic**: `executeCategorySubmit` iterates category items, computes delta, calls `addLedgerEntry` with `reason: BATCH_REASON`. This is where the reason-code capture must occur.
2. `apps/reception/src/components/inventory/StockManagement.tsx` — **variance display**: `Count Variance Report` section (lines 929–985) renders `countEntries` with a `Reason` column that already reads `entry.reason ?? "-"`. `VarianceBreakdownSection` aggregates explained/unexplained but does not show reason codes.
3. `apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts` — `addLedgerEntry` is the single write path. Accepts `Omit<InventoryLedgerEntry, "user" | typeof TIMESTAMP_KEY>`. The `reason` field is already wired through — no mutation hook changes needed.
4. `apps/reception/src/schemas/inventoryLedgerSchema.ts` — Zod schema has `reason: z.string().optional()`. No schema change needed.
5. `apps/reception/src/types/hooks/data/inventoryLedgerData.ts` — `InventoryLedgerEntry` interface has `reason?: string`. No type change needed.
6. `apps/reception/src/hooks/utilities/useBatchCountProgress.ts` — manages localStorage progress state (`categoriesComplete`, `enteredQuantities`). Does not persist reason codes — reason collection happens after quantity entry, at submit time only, so progress state does not need to change.
7. `apps/reception/src/components/common/PasswordReauthModal.tsx` — modal for reauth on large variances. Props: `title`, `instructions`, `onSuccess`, `onCancel`, `hideCancel`. The reason-code UI is a new sibling flow, not an extension of this modal.

### Patterns & Conventions Observed

- **Italian UI strings in newer components**: `BATCH_REASON = "conteggio batch"` follows the pattern; reason code labels should be in Italian to match.
- **`data-cy` attributes for test selection**: e.g. `data-cy="variance-window-select"` in `VarianceBreakdownSection`. New UI elements must carry `data-cy` attributes.
- **State managed locally in component**: `pendingBatch` state pattern in `BatchStockCount` is used to defer submission pending reauth. The same pattern can hold reason-code collection state.
- **Controlled-flow before `executeCategorySubmit`**: `handleCompleteCategory` checks reauth need, then either sets `pendingBatch` (deferred) or calls `executeCategorySubmit` directly. The reason-code gate slots in here.
- **Tailwind design tokens**: `text-error-main` for negative deltas, `text-success-main` for positive — established pattern.

### Data & Contracts

- Types/schemas/events:
  - `InventoryLedgerEntry.reason?: string` — already present in both the TypeScript interface and Zod schema. No change needed.
  - `BatchStockCountProps { onComplete: () => void }` — no change to external props.
  - `PendingBatchSubmission { category: string; categoryItems: InventoryItem[] }` — if reason-code state is collected alongside this, a new field or a new state shape is needed.
  - `CategoryVarianceRow { itemId, name, expected, counted, delta }` — read-only for display; no change.
- Persistence:
  - Firebase Realtime Database path: `inventory/ledger`. Written via `push` in `useInventoryLedgerMutations.addLedgerEntry`. No path change.
  - Zod validation runs before every write — `reason` field must be a string (or absent). Reason codes as string enum values are safe.
  - `useBatchCountProgress` stores `{ categoriesComplete, enteredQuantities }` in localStorage. Reason codes are transient (collected at submit time) — no localStorage schema change.
- API/contracts:
  - No server-side API. Firebase Realtime Database is the backend. Write is client-side only.

### Dependency & Impact Map

- Upstream dependencies:
  - `useInventoryLedger` hook provides `entries` to both components.
  - `useInventoryItems` provides `items` and `itemsById`.
  - Firebase Realtime Database (write target, via `addLedgerEntry`).
- Downstream dependents:
  - `StockManagement` Count Variance Report reads `entry.reason` — already renders the field in the table. Once reason codes are written, this column will automatically populate for new count entries.
  - `buildUnexplainedVarianceByItem` and `buildExplainedShrinkageByItem` functions aggregate by entry type, not by reason — they are unaffected by adding reason codes.
  - `handleExportVariance` CSV export includes `entry.reason ?? ""` — already present in export headers. New reason codes will appear in CSV exports automatically.
  - `VarianceBreakdownSection` does not currently display reason codes — extending it to show a reason-coded breakdown requires additional compute and a new column or sub-table.
- Likely blast radius:
  - `BatchStockCount.tsx` — primary change site (new state, new UI gate, updated `addLedgerEntry` call).
  - `StockManagement.tsx` — `VarianceBreakdownSection` to be extended with reason-code column or summary.
  - Test files for both components must be updated.
  - No changes to: hooks, schemas, types, Firebase config, other components.

### Delivery & Channel Landscape

- Audience/recipient: Reception staff and managers using the BRIK hostel reception app.
- Channel constraints: Deployed to Cloudflare Worker (production) or static export (staging). Client-side only change — no deploy pipeline complexity.
- Existing templates/assets: `PasswordReauthModal` pattern established; new reason-code prompt can follow similar modal or inline card pattern.
- Approvals/owners: Operator (Pete).
- Compliance constraints: None — this is an internal operational tool.
- Measurement hooks: Variance reason codes appear immediately in the Count Variance Report and in the exported variance CSV after the change ships.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library + `@testing-library/user-event`.
- Commands: CI only (per `AGENTS.md:94` — do not run Jest locally). `apps/reception/jest.config.cjs` is the Jest config for this app.
- CI integration: Reception test suite runs in CI via GitHub Actions. `apps/reception` has its own Jest config and test suite.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `BatchStockCount` component | Unit (RTL) | `__tests__/BatchStockCount.test.tsx` | 14 tests covering: loading/error states, auth gate, category sections, quantity entry, positive/negative submit, no-quantity skip, reauth gate, reauth cancel, variance summary table, progress indicator, progress restore, direct submit without reauth |
| `useBatchCountProgress` hook | Unit (RTL + hooks) | `__tests__/BatchStockCount.test.tsx` | 4 hook tests: save, restore, stale-clear, clearProgress |
| `StockManagement` component | Unit (RTL) | `__tests__/StockManagement.test.tsx` | 12+ tests: on-hand rendering, item creation, receive/count/waste entries, reauth, low stock alerts, shrinkage alerts, ledger/variance CSV export, variance breakdown (TC-01 through TC-07) |
| `groupItemsByCategory` | Unit (pure) | `__tests__/BatchStockCount.test.tsx` | 3 tests covering normal, uncategorized, mixed cases |
| `requiresReauth` | Unit (pure) | `__tests__/BatchStockCount.test.tsx` | 4 tests |

#### Coverage Gaps (post-change)

- No test for reason-code prompt appearing when at least one category item has a negative delta.
- No test for reason-code prompt being skipped when all deltas are zero or positive.
- No test verifying that the selected reason code is passed through to `addLedgerEntry` on submit.
- No test for the "Other" free-text path (if implemented).
- No test for the reauth + reason-code combined flow (large negative variance requiring both).
- `StockManagement` variance breakdown: no test asserting reason codes appear in the Count Variance Report table once set.

#### Testability Assessment

- Easy to test: reason-code prompt visibility (delta condition), reason-code value passed to `addLedgerEntry` mock, absence of prompt for non-negative deltas.
- Hard to test: reauth + reason combined modal sequencing (requires multiple modal renders in test).
- Test seams needed: existing `addLedgerEntry` mock is already in place — reason field can be asserted on the mock call.

#### Recommended Test Approach

- Unit tests for: reason-code prompt conditional on delta sign, reason value written to `addLedgerEntry`, no prompt for positive-only category.
- Integration tests for: combined reauth + reason flow.
- E2E tests for: none required for this change.

### Recent Git History (Targeted)

- `cc0f44c07a` `fix(reception): shrinkage alert fires on unexplained variance only` — separated explained (waste/transfer) from count discrepancy in `buildUnexplainedVarianceByItem`; directly related to this feature's domain.
- `0bd085d33f` `test(reception): TASK-02 — variance breakdown unit tests (TC-01 through TC-07)` — established variance breakdown test suite; new tests must not break TC-01 through TC-07.
- `3654b9319e` `test(reception): TASK-06 — BatchStockCount test suite (25 tests)` — established the batch count test suite; new tests extend this file.
- `24f7422b06` `feat(reception): Wave 3 — TASK-04 reauth gate + TASK-05 batch count toggle` — introduced `pendingBatch` state pattern and `PasswordReauthModal` integration in `BatchStockCount`; this is the direct precedent for where the reason-code gate inserts.
- `58f6c21426` `feat(reception): TASK-03 — BatchStockCount core component` — original component creation.

## Questions

### Resolved

- Q: Is the `reason` field already on the ledger entry type and schema?
  - A: Yes. `InventoryLedgerEntry.reason?: string` exists in both `inventoryLedgerData.ts` and `inventoryLedgerSchema.ts`. No schema or type changes needed.
  - Evidence: `apps/reception/src/types/hooks/data/inventoryLedgerData.ts` line 23; `apps/reception/src/schemas/inventoryLedgerSchema.ts` line 19.

- Q: Does the Count Variance Report already render the `reason` field?
  - A: Yes. `StockManagement.tsx` line 956: `entry.reason ?? "-"` is already rendered in the Count Variance Report table. New reason codes from batch count will appear automatically.
  - Evidence: `StockManagement.tsx` lines 940–961.

- Q: Does the variance CSV export already include reason?
  - A: Yes. `handleExportVariance` in `StockManagement.tsx` includes `entry.reason ?? ""` in the row (line 597). No change needed.
  - Evidence: `StockManagement.tsx` lines 581–609.

- Q: Does `addLedgerEntry` accept and persist the `reason` field?
  - A: Yes. `addLedgerEntry` accepts the full `InventoryLedgerEntry` minus `user`/`timestamp`. The `reason` field passes through Zod validation and is written to Firebase. `BatchStockCount` already passes `reason: BATCH_REASON` for all entries. The change replaces this with the operator-selected reason for negative-delta entries.
  - Evidence: `useInventoryLedgerMutations.ts` lines 21–43; `BatchStockCount.tsx` line 208.

- Q: Where does the reason-code UI gate insert in the current flow?
  - A: In `handleCompleteCategory`. Currently: compute deltas → check reauth threshold → if reauth needed, set `pendingBatch`; else call `executeCategorySubmit` directly. The reason-code gate inserts between "compute deltas" and "call executeCategorySubmit / set pendingBatch". If any delta < 0, collect reason first (via new state + UI), then proceed to reauth check / execute.
  - Evidence: `BatchStockCount.tsx` lines 253–287.

- Q: Should reason codes be per-category or per-item?
  - A: Per-category is the recommended approach. A single reason captures the dominant cause for the category's net negative result. This avoids per-item prompt friction for multi-item categories while still providing meaningful audit data. Individual items requiring a distinct reason code can be handled via the single-item count action in `StockManagement`. The per-item approach remains available as a future enhancement.
  - Evidence: Design principle — batch count is a fast bulk-entry flow; per-item prompts would add N interruptions per category; evidence from existing UX (single `PasswordReauthModal` covers the whole category, not each item).

- Q: What language should reason-code labels be in?
  - A: Italian, consistent with newer UI strings in the reception app. Established pattern: `BATCH_REASON = "conteggio batch"`, Italian labels throughout `BatchStockCount`. Proposed predefined codes: "Scarto" (spoilage), "Consumo staff" (staff comp), "Rottura" (breakage), "Furto" (theft), "Altro" (other). English equivalent stored internally in the reason string for auditability is not required — the Italian label is the stored value, matching current app convention.
  - Evidence: `BatchStockCount.tsx` line 20 (`BATCH_REASON = "conteggio batch"`); worldclass scan confirming Italian-language convention for newer screens.

- Q: Does the `VarianceBreakdownSection` need to display reason codes?
  - A: Both surfaces are in-scope. The Count Variance Report table (lines 929–985 in `StockManagement.tsx`) already renders `entry.reason ?? "-"` per row — once reason codes are written by `BatchStockCount`, they appear here automatically with no additional code. The `VarianceBreakdownSection` currently aggregates by item (explained/unexplained/discrepancy) but does not show a reason breakdown — this requires a new compute pass over `countEntries` grouped by reason and a new column or sub-table. Both are required deliverables. The plan should scope them as separate tasks because they have different implementation complexity and different test surfaces.
  - Evidence: `StockManagement.tsx` lines 929–985 (Count Variance Report with reason column), lines 112–173 (`VarianceBreakdownSection`).

### Open (Operator Input Required)

- Q: Should the reason-code prompt block submission or be skippable?
  - Why operator input is required: This is a business-policy choice. Making the reason mandatory (block submission if no reason selected) provides maximum audit value but adds friction. Making it skippable preserves speed but risks empty reason codes. An intermediate option: default to "Altro" (other) with a warning rather than a hard block.
  - Decision impacted: Whether to use a hard-required select (no empty option) or a dismissible prompt.
  - Decision owner: Pete (operator).
  - Default assumption (if any) + risk: Default to required select (no blank/skip option) — highest audit value, minimal friction since the dropdown is a single tap. Risk: operators find it intrusive for small variances. Mitigation: threshold (e.g. only prompt when |delta| >= 1 unit).

- Q: Should "Altro" (other) allow an additional free-text note field?
  - Why operator input is required: Adds implementation surface area. Operator best knows whether the current `note` field on the ledger entry is sufficient or whether a dedicated "other" description is needed.
  - Decision impacted: Whether to include an `<input type="text">` in the reason-code UI for "Altro" selections.
  - Decision owner: Pete (operator).
  - Default assumption (if any) + risk: Default to including a free-text note field when "Altro" is selected, stored in `entry.note`. Risk: adds complexity; if operators use "Altro" frequently, the notes accumulate without structure.

## Confidence Inputs

- **Implementation: 92%**
  - Evidence: Entry point (`handleCompleteCategory`) and insertion point are confirmed. Mutation hook, schema, and type all already support the `reason` field. The `pendingBatch` state precedent gives a clear pattern for staging the reason-code collection before execution. No backend, no migration.
  - To raise to >=80: already at 92%. Blocker would be if the reauth + reason-code modal ordering introduces a hard-to-resolve React state race — risk is low given the sequential state machine already established.
  - To raise to >=90: already at 92%.

- **Approach: 88%**
  - Evidence: Per-category dropdown approach follows existing category-level UX patterns (one reauth modal per category, not per item). Italian label convention is established. The Count Variance Report already renders the `reason` column.
  - What would raise to >=80: already above. What would raise to >=90: operator confirmation on per-category vs per-item and on the mandatory/skippable question.

- **Impact: 80%**
  - Evidence: Operator explicitly stated this as a worldclass audit gap. Count Variance Report and CSV export already plumb through the `reason` field — the data will appear there immediately. `VarianceBreakdownSection` extension is the enhancement beyond the existing display.
  - What would raise to >=80: already at 80%. What would raise to >=90: operator validation that the predefined reason-code list covers the real operational cases at BRIK.

- **Delivery-Readiness: 90%**
  - Evidence: No schema migration, no server changes, no new dependencies. Pure React/TypeScript client-side change with an established test suite and test patterns. Two open questions are policy choices that do not block implementation start — sensible defaults exist.
  - What would raise to >=90: already at 90%. Operator answers to the two open questions would raise to 95%.

- **Testability: 88%**
  - Evidence: Existing test suite is comprehensive with clear mock patterns (`addLedgerEntry` mock, `PasswordReauthModal` mock, `useInventoryLedgerMutations` mock). The reason-code prompt can be tested against mock `addLedgerEntry` call args. The combined reauth + reason flow requires more careful test setup but is not untestable.
  - What would raise to >=80: already above. What would raise to >=90: confirm that the reason-code UI will use a `<select>` (easily targetable with `userEvent.selectOptions`) rather than a custom dropdown.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `handleCompleteCategory` flow — insertion point for reason-code gate | Yes | None | No |
| `executeCategorySubmit` — `reason` field wiring to `addLedgerEntry` | Yes | None | No |
| `InventoryLedgerEntry` schema — `reason` field already present | Yes | None | No |
| `PendingBatchSubmission` state shape — extension for reason-code staging | Yes | [Type contract gap, Minor]: `PendingBatchSubmission` currently lacks a `reason` field; the plan must add it or use a separate state variable. Both approaches are unambiguous but must be explicit in tasks. | No |
| Count Variance Report render — `entry.reason` already displayed | Yes | None | No |
| `VarianceBreakdownSection` — reason-coded sub-table (new compute needed) | Yes | [Scope gap, Minor]: `buildUnexplainedVarianceByItem` aggregates by type, not by reason. A new compute function or inline reduce over `countEntries` grouped by reason is needed for the variance breakdown extension. Not a blocker — additive only. | No |
| Reauth + reason-code sequencing — modal ordering | Yes | [Type contract gap, Minor]: If reason-code prompt appears after reauth confirmation, `executeCategorySubmit` must receive the reason; if before, it must be stored before `setPendingBatch`. Sequencing must be made explicit in tasks to avoid state loss. | No |
| Test coverage — new paths for reason-code gate | Yes | [Missing domain coverage, Minor]: Existing test suite has no tests for reason-code behaviour. New tests required but test seams are already established. | No |
| LocalStorage progress state — reason codes not persisted | Yes | None — reason codes are collected at submit time, not during quantity entry. No localStorage change needed. | No |
| CSV export — reason field already present | Yes | None | No |
| Security boundary — no server-side auth or validation on reason codes | Yes | None — the `reason` field is set to one of a predefined dropdown enum strings; optional free-text for "Altro" routes to `entry.note` (a separate schema field, already present), not to `reason`. Both fields are written by authenticated users only. No server-side execution surface; no injection risk beyond the existing free-text Note field already on per-item StockManagement actions. | No |

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Reauth modal + reason-code prompt sequential state interaction causes reason to be lost | Low | Medium | Design state machine explicitly: reason collected first, stored in component state, then reauth triggered if needed; `executeCategorySubmit` receives reason as argument. |
| Operators select "Altro" routinely, making reason codes uninformative | Medium | Low | Include free-text note field for "Altro"; review reason distribution after first week of use. |
| Per-category reason does not capture cases where items in the same category have different variance causes | Medium | Low | Document this limitation; per-item reason coding is a future enhancement. |
| Italian reason code labels are mistranslated or inappropriate for BRIK's actual operations | Low | Low | Operator review of predefined list before shipping. |
| Existing `BatchStockCount` tests fail on the new reason-code prompt (unexpected UI element) | Medium | Low | Update test suite in the same PR as the component change. |
| `VarianceBreakdownSection` reason-coded sub-table adds complexity to an already non-trivial component | Low | Low | Scope as a dedicated task (TASK-04). The Count Variance Report (already shows reason) satisfies "surface in StockManagement" at the per-entry level; the VarianceBreakdownSection addition satisfies the aggregated-view requirement. Both are required — the task split keeps each unit of work testable independently. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `data-cy` attributes on all new interactive elements (per established test convention).
  - Italian UI strings for reason code labels.
  - Follow `pendingBatch` state machine pattern for staging collections before `executeCategorySubmit`.
  - Reason code for non-negative deltas: retain `BATCH_REASON = "conteggio batch"` or a new neutral constant.
  - Zod validation must pass — reason is `string?`, any string value from the predefined set is valid.
- Rollout/rollback expectations:
  - No data migration. Existing count entries without reason codes are unaffected — the report column already shows `"-"` for empty reasons, which is the correct fallback.
  - Feature is entirely client-side. Rollback = revert the PR.
- Observability expectations:
  - Reason codes are visible in Count Variance Report immediately after the first batch count post-ship.
  - Variance CSV export will show populated reason column for new entries.

## Suggested Task Seeds (Non-binding)

1. **TASK-01**: Add predefined reason-code constants and types (`VarianceReasonCode` enum or const array in Italian).
2. **TASK-02**: Add reason-code prompt UI to `BatchStockCount` — appears inline or as a lightweight modal after category completion is requested, when at least one item has a negative delta. Stores selected reason in component state.
3. **TASK-03**: Wire selected reason code into `executeCategorySubmit` — pass as argument; apply to negative-delta entries; retain `BATCH_REASON` for non-negative entries.
4. **TASK-04**: Extend `VarianceBreakdownSection` with a reason-coded summary table — new compute over `countEntries` grouped by reason for the selected window.
5. **TASK-05**: Update `BatchStockCount` test suite — add tests for reason-code prompt gating, reason value in `addLedgerEntry` calls, positive-only category skips prompt.
6. **TASK-06**: Update `StockManagement` test suite — add tests for reason codes appearing in Count Variance Report, and for reason breakdown in `VarianceBreakdownSection`.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `BatchStockCount` shows reason-code prompt when at least one category item has a negative delta.
  - Prompt is absent when all deltas are zero or positive.
  - Selected reason persists on the ledger entry (`entry.reason`) for negative-delta items.
  - Count Variance Report in `StockManagement` shows the reason for new count entries.
  - `VarianceBreakdownSection` shows a reason-coded breakdown (required, scoped as TASK-04 — a dedicated task separate from the per-entry reason wiring).
  - All new paths covered by unit tests; existing tests pass.
- Post-delivery measurement plan:
  - Manual verification: run a batch count with at least one negative delta; confirm reason code appears in Count Variance Report and in variance CSV export.
  - Test suite: no regressions in `BatchStockCount.test.tsx` or `StockManagement.test.tsx`.

## Evidence Gap Review

### Gaps Addressed

- **Schema/type gap**: Verified that `InventoryLedgerEntry.reason` exists in both TypeScript interface and Zod schema. No migration needed — confirmed by reading both files directly.
- **Mutation hook gap**: Verified that `addLedgerEntry` already wires `reason` through to Firebase. `BatchStockCount` already passes `reason: BATCH_REASON` — confirmed the exact call site and constant.
- **Existing display coverage**: Verified that Count Variance Report table already has a `Reason` column that reads `entry.reason ?? "-"`. New reason codes will appear immediately post-ship.
- **CSV export gap**: Verified `handleExportVariance` already includes `entry.reason` in the export rows.
- **Test infrastructure**: Verified the full test suite for both components — all mock patterns, helper functions, and `addLedgerEntry` mock usage. Clear seams for new test cases exist.
- **UI precedent**: Verified `PasswordReauthModal` props and `pendingBatch` state pattern. New reason-code gate follows the same deferred-state approach.
- **git history**: Traced the evolution of `BatchStockCount` through 5 relevant commits confirming the reauth gate is the direct predecessor to the reason-code gate.

### Confidence Adjustments

- Implementation confidence raised from initial ~80% to **92%** after confirming no schema/type/mutation changes needed.
- Delivery-Readiness set to **90%** — no blockers to starting build; two open questions are policy choices with sensible defaults.

### Remaining Assumptions

- Per-category reason code is the correct granularity (not per-item). Operator confirmation would raise Approach confidence to 95%.
- Predefined Italian reason code list covers real operational cases. Operator review of the label list before shipping is recommended.
- Reason-code prompt is mandatory (no skip option). Default assumption; operator can override to make it optional.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan brik-stock-count-variance-reason-codes --auto`
