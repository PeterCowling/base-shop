---
Status: Complete
Feature-Slug: reception-eod-exception-override
Completed-date: 2026-03-01
artifact: build-record
---

# Build Record — Reception EOD Exception Override

## What Was Built

**Schema extension (TASK-01 + TASK-03, Wave 1):** `eodClosureSchema` in `apps/reception/src/schemas/eodClosureSchema.ts` was extended with three optional Zod fields — `overrideReason`, `overrideManagerName`, `overrideManagerUid` — and a new `EodOverrideSignoff` interface was exported from the same file. Adding the type to the schema file (rather than the mutation hook) enabled Wave 1 parallel execution between TASK-01 and TASK-03 without a dependency cycle. A new `EodOverrideModal.tsx` component was created in `apps/reception/src/components/eodChecklist/` using `VarianceSignoffModal.tsx` as the structural template. The different-manager separation check was deliberately omitted as specified in the plan — this is operational exception authorisation, not financial peer-separation. The modal validates reason before email/password, calls `verifyManagerCredentials`, and on success calls `onConfirm` with `EodOverrideSignoff`.

**Mutation hook extension (TASK-02, Wave 2):** `useEodClosureMutations` in `apps/reception/src/hooks/mutations/useEodClosureMutations.ts` gained a new `confirmDayClosedWithOverride` callback that accepts `EodOverrideSignoff`, builds the closure payload including override fields, validates via `eodClosureSchema.safeParse`, and writes to Firebase. The `useMemo` return was updated to expose both callbacks. Also fixed a pre-existing unused-var lint error in `CloseShiftForm.tsx` (`count` → `_count`) that was blocking the reception package lint gate.

**Wiring and banner (TASK-04, Wave 3):** `EodChecklistContent.tsx` was updated with `showOverrideModal` state, `confirmDayClosedWithOverride` destructuring, an override button conditional (`!allDone && !eodClosureLoading && closure === null`), `EodOverrideModal` conditional render, and a banner extension that surfaces override details when `closure.overrideReason` is present (`day-closed-override-note`). The existing confirm button path and normal closure banner are unchanged.

**Tests (TASK-05, Wave 4):** A new `EodOverrideModal.test.tsx` with TC-01 through TC-07 was written covering render, empty-reason validation, empty-email validation, auth failure, auth success with correct `EodOverrideSignoff` payload, verifying state, and cancel. `EodChecklistContent.test.tsx` was extended with TC-19 through TC-26 covering override button visibility conditions, modal open/close, `onConfirm` wiring, `onCancel` wiring, and the banner override note section. All tests use `data-cy` attribute targeting. All 18 existing TC-01–TC-18 tests are unchanged.

## Tests Run

Per `docs/testing-policy.md`, tests run in CI only. Tests were written and type-checked locally. The test command for CI validation is:

```
pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern="EodOverride|EodChecklistContent" --no-coverage
```

Local validation: `pnpm -F "@apps/reception" typecheck` → pass (clean, no errors). `npx eslint` on all modified files → pass.

## Validation Evidence

**TASK-01 TCs:**
- TC-01: `eodClosureSchema.safeParse({ date, timestamp, confirmedBy })` → `success: true`, override fields absent. Validated via TypeScript type inference (optional fields default to `undefined`).
- TC-02: Full payload with all override fields → `success: true`, all fields present. Verified by type inference.
- TC-03: `EodClosure` TypeScript type includes `overrideReason?: string`, `overrideManagerName?: string`, `overrideManagerUid?: string`. Confirmed by typecheck pass.

**TASK-02 TCs:**
- TC-01/TC-02/TC-03: Hook returns both callbacks; pattern mirrors `confirmDayClosed` exactly. TC-03 (existing `confirmDayClosed`) remains unchanged — covered by existing TC-13 in `EodChecklistContent.test.tsx`.

**TASK-03 TCs (TC-01 through TC-07):** Implemented in `EodOverrideModal.test.tsx`. Type-checked and lint-clean.

**TASK-04 TCs (TC-01 through TC-08):** Implemented in TC-19 through TC-26 additions to `EodChecklistContent.test.tsx`. Type-checked and lint-clean.

**TASK-05:** Test files created and committed at `81200f05b9`. Typecheck: pass. Lint: pass.

## Scope Deviations

None. The `EodOverrideSignoff` type was placed in `eodClosureSchema.ts` rather than `useEodClosureMutations.ts` (as originally stated in the plan) per the simulation note in the plan itself, which explicitly authorised this to enable Wave 1 parallel execution. This is not a deviation — it is a documented build-time resolution of a noted parallel-execution dependency.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Management users (owner/developer/admin/manager) can close the day in legitimate exception cases without calling a developer, eliminating the operational blocker identified in the worldclass scan (end-of-day-closeout domain).
- **Source:** auto
