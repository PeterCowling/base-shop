---
Type: Build-Record
Status: Complete
Feature-Slug: reception-type-schema-deduplication
Completed-date: 2026-03-08
artifact: build-record
---

# Build Record: Reception Type/Schema Deduplication

## Outcome Contract

- **Why:** A full-app simplify sweep flagged critical type duplication as a maintenance risk. Multiple definitions of DateOfBirth, Activity, and PayType could diverge silently — a change to one definition would not propagate to the others, causing subtle type mismatches.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each duplicated type (DateOfBirth, Activity, PayType) is consolidated to a single canonical definition. All consumers import from that definition. Zod schemas use z.infer<> instead of parallel hand-written interfaces.
- **Source:** auto

## What Was Built

**TASK-01 (DateOfBirth consolidation):** Deleted two redundant files — `types/hooks/data/occupantDetails.ts` (hand-written duplicate of `DateOfBirth` and `OccupantDetails`) and `types/component/dob.ts` (alias file: `OccupantDateOfBirth = DateOfBirth`). Updated three consumers: `usePrepaymentData.ts` now imports `OccupantDetails` from `guestDetailsData`; `buildCheckinRows.ts` and `useCheckinsData.ts` now import `DateOfBirth` from `guestDetailsData` (renaming all `OccupantDateOfBirth` usage to `DateOfBirth`). The canonical relay file `guestDetailsData.ts` was already the correct source for both types; this change eliminates the redundant parallel files.

**TASK-02 (Activity consolidation):** Replaced the hand-written `Activity` interface in `activitiesData.ts` with `export type Activity = z.infer<typeof activitySchema>`. The Zod schema in `activitySchema.ts` was already structurally identical (`{ code: number; timestamp?: string; who: string }`). Removed the diverged local `Activity` interface from `checkoutrow.ts` (which was missing the `who` field and had zero external consumers) and added an import from `activitiesData.ts`. All 15+ existing consumers of `Activity` required no import path changes.

**TASK-03 (PayType consolidation):** Standardised the `PayType` union order in `cityTaxData.ts` to `"CASH" | "CC"` (was `"CC" | "CASH"`). Removed the duplicate `PayType = "CASH" | "CC"` definition from `cityTaxDomain.ts` and replaced it with `export type { PayType } from "../hooks/data/cityTaxData"`. The three consumers (`CityTaxPaymentButton.tsx`, `useCityTaxAmount.ts` importing from `cityTaxDomain`; `useComputeOutstandingCityTax.ts` importing from `cityTaxData`) required no import path changes.

**TASK-04 (Verification gate):** Both `pnpm --filter @apps/reception typecheck` and `pnpm --filter @apps/reception lint` exited 0. Eight pre-existing warnings remain in unrelated files (layout primitive usage in inbox/user-management components); zero errors.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | 0 errors; run via pre-commit hook (turbo cache miss; full check executed) |
| `pnpm --filter @apps/reception lint` | Pass | 0 errors; 8 pre-existing warnings in unrelated files |

## Validation Evidence

### TASK-01
- TC-01: Typecheck exits 0 — `guestDetailsData.ts` exports `DateOfBirth` and `OccupantDetails`; all three updated consumers resolve correctly
- TC-02: `buildCheckinRows.ts` `let dobObject: DateOfBirth = { dd: "", mm: "", yyyy: "" }` compiles without error — structural assignability confirmed by typecheck

### TASK-02
- TC-01: Typecheck exits 0 — `z.infer<typeof activitySchema>` resolves to `{ code: number; timestamp?: string; who: string }` which is compatible with all 15+ downstream consumers
- TC-02: `CheckoutRow.activities: Activity[]` field uses imported `Activity` from `activitiesData.ts` — same canonical type now for both checkout and checkin paths
- TC-03: `ActivityData = { [activityId: string]: Activity }` resolves correctly; `Activities = Record<string, ActivityData> | null` unaffected

### TASK-03
- TC-01: Typecheck exits 0 — `cityTaxDomain.ts` re-exports `PayType` transparently; `CityTaxPaymentButton.tsx` and `useCityTaxAmount.ts` resolve the type via re-export
- TC-02: `useComputeOutstandingCityTax.ts` imports directly from `cityTaxData.ts` — definition still present, no change needed
- TC-03: No circular import — `cityTaxData.ts` imports only from `schemas/`; `cityTaxDomain.ts` already imported from `cityTaxData.ts`

### TASK-04
- TC-01: `pnpm --filter @apps/reception typecheck` → exit 0 ✓
- TC-02: `pnpm --filter @apps/reception lint` → exit 0 (8 warnings, 0 errors) ✓
- TC-03: Verified deleted files no longer exist on disk; `activitiesData.ts` confirmed using `z.infer<>`; `cityTaxDomain.ts` confirmed re-exporting

## Scope Deviations

**Import normalisation (additive, in-scope):** During the lint fix pass, import declarations in `buildCheckinRows.ts` and `useCheckinsData.ts` were normalised — duplicate `guestDetailsData` imports were merged into a single declaration and import sort order was corrected. This is consistent with the task's mechanical cleanup objective and did not modify any types or logic. `activitiesData.ts` imports were converted to `import type` form as required by the `@typescript-eslint/consistent-type-imports` rule.
