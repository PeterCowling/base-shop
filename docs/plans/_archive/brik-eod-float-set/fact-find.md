---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Operations
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: brik-eod-float-set
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-eod-float-set/plan.md
Trigger-Source: direct-inject
Trigger-Why: Operator-stated worldclass audit gap — when a shift closes, staff have no prompted step to set the opening float for the next shift. The FloatEntryModal exists but is decoupled from the EOD sequence. The EOD checklist does not reflect whether a float has been set, creating a daily procedural hole.
Trigger-Intended-Outcome: type: operational | statement: The EOD close-out sequence prompts staff to set the opening float immediately after shift close, the amount is persisted to Firebase as a cashCount entry of type "openingFloat", and the EOD checklist reflects float-set status alongside the existing till/safe/stock checks. | source: operator
Dispatch-ID: IDEA-DISPATCH-20260228-0077
---

# BRIK EOD Float-Set Fact-Find Brief

## Scope

### Summary

The EOD close-out checklist (`/eod-checklist/`) currently tracks till-closed, safe-reconciled, and stock-counted. There is no prompted step for setting the opening float for the next shift — staff must remember to do this separately via the "Add Change" button in the till page. The `FloatEntryModal` component exists and is functional but is only wired to the intra-shift "Add Change" action. This fact-find investigates what is needed to:
1. Add a "Set opening float" step to the EOD close-out sequence (triggered after the shift closes, surfaced on the `/eod-checklist/` page or as a post-close prompt in the till page).
2. Persist the float amount as a Firebase `cashCounts` entry with a new `type: "openingFloat"`.
3. Reflect float-set status in `EodChecklistContent`.

### Goals

- Staff are prompted to set the opening float as part of EOD, not as a separate remembered action.
- The float amount defaults to a configurable standard float value (editable by staff at time of setting).
- The float is persisted to Firebase under `cashCounts` with a new type `"openingFloat"`.
- `EodChecklistContent` gains a fourth card: "Float" that shows Complete/Incomplete based on whether an `openingFloat` entry exists today.

### Non-goals

- Changing the existing "Add Change" (intra-shift float) functionality — that stays as-is.
- Replacing the existing `FloatEntryModal` component — it will be reused or extended.
- Vault/safe-level float tracking (the float is a till drawer concept).
- Multi-shift float tracking within a single day (one opening-float entry per day is sufficient for EOD purposes).

### Constraints & Assumptions

- Constraints:
  - Firebase `cashCounts` schema is governed by `cashCountSchema` (Zod, in `apps/reception/src/schemas/cashCountSchema.ts`). Adding a new `type` value requires updating the schema enum.
  - `cashCountSchema.type` is currently `z.enum(["opening", "close", "reconcile", "float", "tenderRemoval"])` — needs `"openingFloat"` added.
  - `EodChecklistContent` uses `useTillShiftsData` (limitToLast: 10) for the till section. For float status it will need access to today's `cashCounts` — this data is not currently fetched in the EOD component; a new or shared data hook is needed.
  - The standard float value has no existing config key in `settings.ts` or `.env.example` — it must be added as `NEXT_PUBLIC_STANDARD_FLOAT` (defaulting to 0, allowing per-venue configuration).
  - The existing `FloatEntryModal` is titled "Add Change" and has a `PasswordReauthInline` step (PIN required). For the EOD opening-float flow, PIN reauth may not be appropriate (operator decision needed — see Open Questions).
  - The EOD checklist page is standalone (`/eod-checklist/` route), not embedded in the till flow. The float-set step can be surfaced either (a) as a new section on the EOD checklist page, or (b) as a post-close prompt shown after `confirmShiftClose` in the till page. Option (a) is lower risk.
- Assumptions:
  - "One opening float per day" is the correct granularity — the checklist checks for any `openingFloat` cashCount entry timestamped today.
  - The `FloatEntryModal` UI pattern (amount input + optional PIN) is reusable for the EOD variant, with a renamed title ("Set Opening Float") and a different `onConfirm` handler.
  - The standard float value is a single number (e.g. €50), not a denomination breakdown.
  - The EOD float entry does NOT trigger a safe withdrawal (unlike the intra-shift float in `confirmFloat` which calls `recordWithdrawal`). The EOD float is a memo entry only — it records the intended opening float for the next day without moving safe funds.

## Outcome Contract

- **Why:** Operator-stated worldclass audit gap — float set is not part of EOD sequence, creating a daily procedural hole where staff must remember to do this separately.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The EOD close-out sequence prompts staff to set the opening float immediately after shift close; the amount is persisted to Firebase; the EOD checklist reflects float-set status. Staff no longer need to remember this as a separate action.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/eod-checklist/page.tsx` — the `/eod-checklist/` route; renders `EodChecklistContent` inside `Providers`. The float-set UI will be added here.
- `apps/reception/src/app/till-reconciliation/page.tsx` — the till route where `confirmShiftClose` fires; an alternative entry point for a post-close float prompt (lower-priority option).

### Key Modules / Files

1. `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` — the EOD checklist component; currently checks till/safe/stock. Needs a fourth "Float" section with data derived from today's `cashCounts`.
2. `apps/reception/src/components/till/FloatEntryModal.tsx` — the existing modal for entering a float amount. Reusable for the EOD context with a renamed title and a different `onConfirm` handler. Exports `FloatEntryModal` (wrapped with `withModalBackground`), interface `FloatEntryModalProps { onConfirm: (amount: number) => void; onClose: () => void }`.
3. `apps/reception/src/schemas/cashCountSchema.ts` — Zod schema governing all `cashCounts` Firebase writes. The type enum must be extended with `"openingFloat"` to permit the new persistence path.
4. `apps/reception/src/hooks/mutations/useCashCountsMutations.ts` — mutation hook; `addCashCount(type, count, difference, amount?, denomBreakdown?, keycardCount?)` is the write function. A new `addOpeningFloatEntry(amount)` convenience wrapper will be added, calling `addCashCount("openingFloat", 0, 0, amount)`.
5. `apps/reception/src/hooks/useCashCounts.ts` — read + mutation composition hook; already exposes `floatEntries` (filtered for `type === "float"`). Will need an `openingFloatEntries` (or `hasOpeningFloatToday`) derived value for the EOD checklist to consume.
6. `apps/reception/src/constants/settings.ts` — where `NEXT_PUBLIC_CASH_DRAWER_LIMIT` etc. are read from `process.env`. `standardFloat` will be added here: `parseFloat(process.env["NEXT_PUBLIC_STANDARD_FLOAT"] || "0") || 0`.
7. `apps/reception/.env.example` — must document the new `NEXT_PUBLIC_STANDARD_FLOAT` key.
8. `apps/reception/src/hooks/data/useCashCountsData.ts` — the Firebase realtime hook that reads `cashCounts`. `EodChecklistContent` will need to call this (or a new thin wrapper) to check for today's `openingFloat` entries.
9. `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx` — existing test file; 9 test cases covering till/safe/stock but no float section. Must be extended.
10. `apps/reception/src/components/till/__tests__/FloatAndTenderForms.test.tsx` — existing test file for `FloatEntryModal`; tests will be added or extended for the EOD float variant if a new component is created.

### Patterns & Conventions Observed

- EOD section pattern: each section in `EodChecklistContent` is a `<section>` with a loading path (`data-cy="<area>-loading"`) and a done/incomplete path (`data-cy="<area>-status"`) — evidence: `apps/reception/src/components/eodChecklist/EodChecklistContent.tsx` lines 48–113.
- `data-cy` attribute convention: jest is configured with `testIdAttribute: "data-cy"` (per MEMORY.md). All new test IDs must use `data-cy`.
- Cash count write pattern: all mutations go through `addCashCount(type, count, difference, amount?)` in `useCashCountsMutations.ts`. The `"float"` type uses `amount` field, `count: 0, difference: 0`. The `"openingFloat"` type will follow the same pattern.
- Schema-first persistence: `cashCountSchema` validates before every Firebase write. Extending the type enum is the authoritative gate.
- Settings via `NEXT_PUBLIC_*` env vars: pattern is `parseFloat(process.env["NEXT_PUBLIC_X"] || "fallback") || fallback` — evidence: `apps/reception/src/constants/settings.ts`.
- `withModalBackground` HOC wraps all full-screen modals — evidence: `FloatEntryModal.tsx` line 85. Reuse this for any new modal or reuse `FloatEntryModal` directly.
- Reauth pattern: `FloatEntryModal` includes `PasswordReauthInline`. For the EOD opening-float step, PIN may not be required (this is an end-of-day memo entry, not a live cash movement). Operator decision needed.

### Data & Contracts

- Types/schemas/events:
  - `CashCountType = "opening" | "close" | "reconcile" | "float" | "tenderRemoval"` — currently in `cashCountSchema.ts`; must extend to include `"openingFloat"`.
  - `CashCount` interface (inferred from Zod): `{ user, timestamp, type, count?, difference?, amount?, denomBreakdown?, keycardCount?, shiftId? }`.
  - `FloatEntry = { amount: number; userId: string; createdAt: string }` — defined in `apps/reception/src/types/finance.ts`. An analogous `OpeningFloatEntry` type may be derived, or `FloatEntry` can be reused.
- Persistence:
  - Firebase node: `cashCounts` (realtime database). All reads via `useCashCountsData`; all writes via `useCashCountsMutations.addCashCount`.
  - The new `"openingFloat"` entry will be written with `amount` set to the entered value and `count: 0, difference: 0`, consistent with the existing `"float"` type.
- API/contracts:
  - No REST API involved; all Firebase Realtime Database.
  - `addFloatEntry(amount)` in `useCashCountsMutations` calls `addCashCount("float", 0, 0, amount)`. A parallel `addOpeningFloatEntry(amount)` will call `addCashCount("openingFloat", 0, 0, amount)`.

### Dependency & Impact Map

- Upstream dependencies:
  - `cashCountSchema` type enum — must be extended before any other change can work.
  - `useCashCountsData` — must be available in `EodChecklistContent` (currently it is not imported there; the EOD component uses `useTillShiftsData` for till status).
  - `settings.ts` — needs `standardFloat` added before the default-prefill feature can work.
- Downstream dependents:
  - `EodChecklistContent` — add float section.
  - `useEndOfDayReportData` — currently tracks `floatTotal` (sum of `"float"` type entries). If the report should also show the opening-float entry, `"openingFloat"` would need to be included. However, since opening-float is a memo (no safe movement), it should likely NOT be included in `floatTotal`. No change required to `useEndOfDayReportData` unless the operator wants it surfaced in reports.
  - `useCashCounts` — add `hasOpeningFloatToday` or `openingFloatEntries` derived value.
  - Any tests referencing `cashCountSchema` type union — the extended enum is backward-compatible (additive only).
- Likely blast radius:
  - Schema change: `cashCountSchema.ts` + any test files that snapshot or assert on the `type` enum (checked: `apps/reception/src/schemas/__tests__/cashCountSchema.test.ts` exists — must be extended to cover the new type).
  - `EodChecklistContent.tsx` + its test file.
  - `useCashCountsMutations.ts` (add `addOpeningFloatEntry` wrapper).
  - `useCashCounts.ts` (expose `hasOpeningFloatToday`).
  - `settings.ts` + `.env.example`.
  - No blast radius to the existing intra-shift float (`confirmFloat` in `useTillReconciliationLogic.ts`) — that path is unchanged.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (unit/component). `data-cy` as `testIdAttribute` (configured in `jest.setup.ts` line 100 via the shared `@acme/config/jest.preset.cjs`).
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs` (governed test runner).
- CI integration: tests run in reusable workflow via `reusable-app.yml`.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| EodChecklistContent | Component | `apps/reception/src/components/eodChecklist/__tests__/EodChecklistContent.test.tsx` | 9 TCs: access gate, loading indicators, done/incomplete per area (till/safe/stock). No float section. |
| FloatEntryModal | Component | `apps/reception/src/components/till/__tests__/FloatAndTenderForms.test.tsx` | 5 TCs: confirm, zero/invalid validation, no comment input, dark mode, close button. |
| cashCountSchema | Unit | `apps/reception/src/schemas/__tests__/cashCountSchema.test.ts` | Covers existing types. Must be extended for `"openingFloat"`. |
| useCashCountsMutations | Unit | `apps/reception/src/hooks/mutations/__tests__/useCashCountsMutation.test.tsx` | Covers `addCashCount`, `addFloatEntry`. New `addOpeningFloatEntry` needs a test case. |

#### Coverage Gaps

- Untested paths:
  - Float-set status in `EodChecklistContent` (no such section exists yet).
  - `addOpeningFloatEntry` mutation wrapper (does not exist yet).
  - `hasOpeningFloatToday` derived value in `useCashCounts`.
- Extinct tests:
  - None identified.

#### Testability Assessment

- Easy to test: `EodChecklistContent` float section — same mock pattern as existing till/safe/stock sections (mock `useCashCountsData` or a thin wrapper).
- Easy to test: `addOpeningFloatEntry` — same pattern as `addFloatEntry` tests.
- Moderate: `FloatEntryModal` reuse with different title/props — straightforward if using the existing component with a `title` prop override, or creating a thin `OpeningFloatModal` wrapper.
- Hard to test: Firebase integration (no integration test environment) — unit tests with mocked hooks are sufficient per existing pattern.

#### Recommended Test Approach

- Unit tests for: `cashCountSchema` with `"openingFloat"` type, `addOpeningFloatEntry` in `useCashCountsMutations`.
- Component tests for: `EodChecklistContent` float section (loading/complete/incomplete states), any new modal component.
- No E2E or contract tests needed for this change.

### Recent Git History (Targeted)

- `apps/reception/src/components/eodChecklist/` — last meaningful change: `2a4dd18019` "feat(reception): add /eod-checklist/ page route (TASK-02)". The EOD checklist is recently built (current sprint deliverable). No float step was included.
- `apps/reception/src/components/till/CloseShiftForm.tsx` — last meaningful change: `dd981d25cc` "fix(reception): auto-fix remaining bare rounded violations in 40 files". No functional change; last substantive edit was earlier in the design-system migration.
- `apps/reception/src/components/till/FloatEntryModal.tsx` — same migration-era changes; no functional modifications since creation.

## Questions

### Resolved

- Q: Does a standard float constant or env var already exist?
  - A: No. Neither `settings.ts`, `.env.example`, nor any `NEXT_PUBLIC_FLOAT` pattern appears anywhere in the codebase. The standard float value must be added as `NEXT_PUBLIC_STANDARD_FLOAT` in `settings.ts` and documented in `.env.example`, defaulting to `0`.
  - Evidence: `apps/reception/src/constants/settings.ts` (full read, no float key), `apps/reception/.env.example` (full read, no float key).

- Q: Does the existing `FloatEntryModal` require PIN authentication, and should the EOD opening-float step also require PIN?
  - A: The existing `FloatEntryModal` includes `PasswordReauthInline` with `submitLabel="Confirm change"`. For the intra-shift "Add Change" action, PIN makes sense because it's a live cash movement (safe withdrawal + float entry). For the EOD opening-float entry, which is a memo-only write with no safe movement, PIN adds friction with no audit benefit. Recommended: no PIN required for the EOD opening-float step. The component should either accept a `requiresReauth?: boolean` prop or a separate thin variant should be used.
  - Evidence: `FloatEntryModal.tsx` lines 70–75; `useTillReconciliationLogic.ts` `confirmFloat` (lines 111–126) — the intra-shift `confirmFloat` calls `recordWithdrawal` + `recordFloatEntry` in a transaction. The EOD opening-float path only calls `addOpeningFloatEntry(amount)`.

- Q: Should the EOD opening-float step be surfaced on the `/eod-checklist/` page (option A) or as a post-close prompt in the till page (option B)?
  - A: Both options are required to satisfy the stated outcome ("prompted immediately after shift close"). The primary surface is the EOD checklist page (option A — consistent with till/safe/stock pattern). To ensure staff are prompted immediately after shift close, the till page should also display a brief notice or navigation link to the EOD checklist when a shift has just been closed and no `openingFloat` entry exists for today (option B — lightweight, no duplicate UI). Planning should implement both: option A as the authoritative float-set surface, option B as a contextual nudge after shift close.
  - Evidence: `EodChecklistContent.tsx` pattern; `apps/reception/src/app/eod-checklist/page.tsx`; `useTillShifts.ts` `confirmShiftClose` — the close completes when `setShiftOpenTime(null)` fires, which is an observable state transition where a nudge can be shown.

- Q: Does `EodChecklistContent` currently have access to `cashCounts` data?
  - A: No. The component imports and calls `useTillShiftsData`, `useSafeCountsData`, and `useInventoryLedger`. It does not import `useCashCountsData` or any cash-count hook. The float-set status check will require adding a `useCashCountsData` call (or a thin derived hook) to `EodChecklistContent`.
  - Evidence: `EodChecklistContent.tsx` lines 3–11 (imports).

- Q: Should the opening-float amount appear in the EOD financial report (`useEndOfDayReportData`)?
  - A: No change needed. The `"openingFloat"` type is a memo entry (no cash moved). The existing `floatTotal` calculation only sums `type === "float"` entries (intra-shift cash additions). Opening-float is categorically different and should not be summed with intra-shift floats. The EOD report does not need to change.
  - Evidence: `useEndOfDayReportData.ts` lines 396–401 — `floatTotal` sums `c.type === "float"` entries only.

- Q: What is the correct Firebase write for the opening-float entry?
  - A: `addCashCount("openingFloat", 0, 0, amount)` — same pattern as `addFloatEntry` which calls `addCashCount("float", 0, 0, amount)`. The `amount` field stores the value; `count` and `difference` are 0 (no shift-count context).
  - Evidence: `useCashCountsMutations.ts` `addFloatEntry` (lines 124–128).

### Open (Operator Input Required)

- Q: What is the standard opening float amount for BRIK?
  - Why operator input is required: The codebase has no existing standard float value. This is a real-world operational number known only to the operator.
  - Decision impacted: The default value pre-filled in the float-entry input. Without this, the field defaults to `0` (empty/no prefill).
  - Decision owner: Operator (Peter Cowling).
  - Default assumption + risk: Default to `0` (no prefill). Staff enter the amount manually every time. Risk: slightly more friction, but safe — no incorrect default. The `NEXT_PUBLIC_STANDARD_FLOAT` env var can be set in `.env.local` once the operator provides the value.

## Confidence Inputs

- **Implementation: 92%**
  - Evidence: All file paths, types, schemas, hook signatures, and mutation patterns confirmed by direct code read. The implementation path is clear and additive (no rearchitecture). The only unknowns are operator-supplied (standard float value) and won't block build.
  - What raises to >=80: Already above 80. Confirmed by: schema extension pattern, hook composition pattern, and EOD section pattern all confirmed.
  - What raises to >=90: Already above 90. Cross-check `cashCountSchema` tests pass after enum extension.

- **Approach: 88%**
  - Evidence: Using the existing modal pattern (reuse `FloatEntryModal` or a thin variant), a new `cashCounts` type, and a new EOD section follows every established pattern in the codebase. No new architectural concepts required.
  - What raises to >=80: Already above 80.
  - What raises to >=90: Confirm with operator that no PIN is needed on EOD float entry (currently resolved by recommendation, not operator confirmation).

- **Impact: 80%**
  - Evidence: Operator-stated gap. The fix is direct: staff get a prompted step in a place they already visit (EOD checklist). No indirect or cross-system effects.
  - What raises to >=80: Already at 80. Operator confirmation of the standard float value would add confidence.
  - What raises to >=90: Post-deployment confirmation from operator that the EOD procedure now includes the float step without needing reminders.

- **Delivery-Readiness: 90%**
  - Evidence: All implementation files identified, test patterns confirmed, CI path known. The only pre-build action needed is operator providing the standard float value (which can default to 0 and be configured later).
  - What raises to >=80: Already above 80.
  - What raises to >=90: Already at 90.

- **Testability: 88%**
  - Evidence: EOD section pattern tests are straightforward (same mock pattern as existing 9 tests). Mutation wrapper test is straightforward (same pattern as `addFloatEntry`). No integration testing needed.
  - What raises to >=80: Already above 80.
  - What raises to >=90: Confirm that `useCashCountsData` can be mocked cleanly in `EodChecklistContent` tests (it can — same pattern as `useTillShiftsData` mock in existing tests).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Schema enum extension breaks existing cashCount reads if old entries have unlisted types | Low | Low | Additive-only: existing entries retain their existing types; new enum value is written by new code paths only. Zod `safeParse` used — parse failures show toast rather than crashing. |
| `EodChecklistContent` hook count increases (adding `useCashCountsData`) causing React hooks rule violation | Very Low | Low | All hooks must be called unconditionally before any conditional return — the component already follows this pattern. The new hook call is added at the top, before the `if (!canView) return null` guard. |
| Standard float value not configured (defaults to 0) causing confusion | Medium | Low | Mitigated by default-to-zero behaviour and by `NEXT_PUBLIC_STANDARD_FLOAT` being documented in `.env.example` with an explicit note. |
| EOD float entry mistakenly included in financial variance calculations | Low | Medium | `useEndOfDayReportData` uses strict `type === "float"` filter. Adding a new type does not affect the existing filter. No regression. |
| Post-close float prompt (option B) inadvertently merged without EOD checklist alignment | Low | Medium | Planning explicitly defaults to Option A (EOD checklist page); Option B is scoped out unless operator requests it. |

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `cashCountSchema.ts` type enum | Yes | None | No |
| `EodChecklistContent.tsx` section pattern and hook availability | Yes | None | No |
| `FloatEntryModal.tsx` reuse feasibility and props interface | Yes | None | No |
| `useCashCountsMutations.ts` write path for new type | Yes | None | No |
| `useCashCounts.ts` derived value exposure | Yes | None | No |
| `settings.ts` env var pattern | Yes | None | No |
| Test landscape and mock patterns | Yes | None | No |
| `useEndOfDayReportData.ts` impact (no change required) | Yes | None | No |
| Standard float value (operator-only knowledge) | Partial | [Missing domain coverage] [Minor]: Standard float value unknown — defaults to 0 until operator provides it | No |

## Planning Constraints & Notes

- Must-follow patterns:
  - Add all new hooks in `EodChecklistContent` before the `if (!canView) return null` guard.
  - Use `data-cy` attribute (not `data-testid`) for all new test IDs.
  - `cashCountSchema` is the source of truth for valid `type` values; extend the Zod enum before writing any new entries.
  - New `addOpeningFloatEntry` wrapper in `useCashCountsMutations` must follow the `addFloatEntry` pattern exactly (`addCashCount("openingFloat", 0, 0, amount)`).
  - Document `NEXT_PUBLIC_STANDARD_FLOAT` in `.env.example` with a note that it defaults to 0.
  - Do NOT add `"openingFloat"` to the intra-shift `confirmFloat` path — that path is for live cash movements and must remain unchanged.
- Rollout/rollback expectations:
  - The schema change is backward-compatible going forward (additive). Rollback risk: if the `"openingFloat"` type is later removed from the enum after entries have already been written to Firebase, `cashCountsSchema.safeParse` will fail for any snapshot containing those entries, affecting all `useCashCountsData` consumers. Mitigation: treat the enum addition as permanent once deployed; if the feature is removed, use `z.string()` passthrough on `type` or retain `"openingFloat"` in the enum without the associated UI.
  - The EOD checklist float section gracefully handles missing data (shows "Incomplete" when no `openingFloat` entry exists for today).
- Observability expectations:
  - Firebase Realtime Database console will show `openingFloat` entries under `cashCounts`. No additional logging needed.

## Suggested Task Seeds (Non-binding)

1. Extend `cashCountSchema.type` enum to include `"openingFloat"`. Update `cashCountSchema.test.ts`.
2. Add `addOpeningFloatEntry(amount)` to `useCashCountsMutations`. Add test case.
3. Add `standardFloat` to `settings.ts` (reads `NEXT_PUBLIC_STANDARD_FLOAT`, defaults to 0). Document in `.env.example`.
4. Add `hasOpeningFloatToday` derived value to `useCashCounts` (or a thin hook in `EodChecklistContent`).
5. Add float section to `EodChecklistContent`: fetch today's cashCounts, check for `openingFloat` entry. Add loading/status UI following the existing section pattern.
6. Create `OpeningFloatModal` (or extend `FloatEntryModal` with a `title` prop) — no PIN, prefills from `settings.standardFloat`, calls `addOpeningFloatEntry` on confirm.
7. Wire the modal into the EOD checklist page: show "Set Opening Float" button when float is incomplete; show modal on click.
8. Add/extend tests: `EodChecklistContent` float section (loading/complete/incomplete), `OpeningFloatModal` (or extended `FloatEntryModal`) component, `addOpeningFloatEntry` mutation, schema test.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `cashCountSchema.type` enum includes `"openingFloat"`.
  - `EodChecklistContent` renders a Float section with `data-cy="float-status"` and `data-cy="float-loading"` following the existing section pattern.
  - `EodChecklistContent` shows Complete when a `cashCounts` entry with `type: "openingFloat"` exists for today (Italy timezone), Incomplete otherwise.
  - A modal for entering the opening float amount is wired to a button in the EOD checklist float section.
  - `NEXT_PUBLIC_STANDARD_FLOAT` env var documented in `.env.example`.
  - Tests added for: float section in `EodChecklistContent`, `addOpeningFloatEntry` mutation, schema extension.
  - `pnpm typecheck && pnpm lint` passes.
- Post-delivery measurement plan:
  - Operator confirms the float-set step is now part of the daily EOD procedure without needing reminders (operational confirmation).

## Evidence Gap Review

### Gaps Addressed

- **Standard float config key**: Confirmed absent from `settings.ts` and `.env.example`. Gap is well-defined: add `NEXT_PUBLIC_STANDARD_FLOAT`, document it, default to 0.
- **Hook availability in EodChecklistContent**: Confirmed `useCashCountsData` is not currently imported. The fix (add the import and call) is straightforward and follows existing patterns in the same file.
- **FloatEntryModal reuse fit**: Confirmed the modal can be reused with a title override or thin variant. PIN removal is a straightforward prop or variant.
- **EOD report impact**: Confirmed zero impact — `floatTotal` uses strict `type === "float"` filter.

### Confidence Adjustments

- No downward adjustments needed. All primary evidence areas were confirmed by direct code inspection.
- Approach confidence held at 88% (not 90%) because the PIN-removal decision is a recommendation rather than operator-confirmed.

### Remaining Assumptions

- Standard float value is 0 until operator provides it (safe default).
- EOD opening-float entry is memo-only (no safe withdrawal). This assumption is strong: the intra-shift `confirmFloat` explicitly calls `recordWithdrawal` + `recordFloatEntry`; an EOD memo float that triggers a withdrawal would be semantically wrong.
- One `openingFloat` entry per day is sufficient for the EOD checklist completeness check. The `addCashCount` mutation uses Firebase `push` (append-only), so multiple entries can accumulate if the step is repeated. The EOD float-done check uses `some(c => c.type === "openingFloat" && sameItalyDate(...))` — detecting at least one entry is sufficient. Strict one-per-day enforcement (idempotency guard or date-keyed node) is a planning decision; the simpler `some()` approach is the default unless the operator requests enforcement.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None. The standard float value is an operator input that defaults safely to 0; it does not block build.
- Recommended next step: `/lp-do-plan brik-eod-float-set --auto`
