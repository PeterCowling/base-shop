---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-type-schema-deduplication
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Type/Schema Deduplication Plan

## Summary

Three classes of type duplication in `apps/reception/src/` create silent maintenance risk: `DateOfBirth` has a hand-written parallel interface and a redundant alias on top of the correct schema-inferred type; `Activity` has a diverged duplicate in `checkoutrow.ts` (missing the `who` field) and an unresolved hand-written/schema pair in the canonical source; `PayType` is defined identically in two files. All changes are type-only — no runtime code is modified. The primary validation gate is `pnpm --filter @apps/reception typecheck`. Tasks are independent and can run in parallel. Estimated total effort: 3 small tasks + 1 verification.

## Active tasks
- [ ] TASK-01: Consolidate DateOfBirth — delete hand-written duplicate and redundant alias
- [ ] TASK-02: Consolidate Activity — wire activitiesData.ts to schema; fix checkoutrow.ts divergence
- [ ] TASK-03: Consolidate PayType — single definition in cityTaxData.ts; re-export from cityTaxDomain.ts
- [ ] TASK-04: Typecheck verification gate

## Goals
- Eliminate all duplicate type definitions by consolidating each to one canonical source.
- Ensure `z.infer<>` is used wherever a Zod schema already exists (no parallel hand-written interfaces).
- All consumer import paths work without modification after consolidation.
- `pnpm --filter @apps/reception typecheck` and `pnpm --filter @apps/reception lint` pass with zero errors after all changes.

## Non-goals
- Changing runtime behaviour — no schema field changes, no validation logic changes.
- Modifying `checkInRowSchema.ts` inline `occupantDateOfBirthSchema` — intentionally looser than canonical.
- Migrating `KeycardPayType` enum — distinct concept from city-tax `PayType`.
- Migrating `ActivityByCodeItem` in `usePrepaymentData.ts` — structurally distinct Firebase node, not a duplicate.

## Constraints & Assumptions
- Constraints:
  - All consumer imports must be updated atomically — partial migration leaves competing definitions.
  - The Zod schema in `checkInRowSchema.ts` (`occupantDateOfBirthSchema`) must not be replaced with the canonical `dateOfBirthSchema` — it is intentionally looser (plain `z.string().optional()`) and the strict version would change validation behaviour.
  - `cityTaxData.ts` is a leaf file (only imports from `schemas/`). `cityTaxDomain.ts` already imports `CityTaxData` from `cityTaxData.ts`. Therefore `PayType` must be defined in `cityTaxData.ts` and re-exported from `cityTaxDomain.ts` — the reverse direction would create a circular import.
- Assumptions:
  - All hand-written type definitions verified structurally identical to their schema-inferred counterparts.
  - `z.infer<typeof activitySchema>` produces `{ code: number; timestamp?: string; who: string }` — identical to the existing hand-written `Activity` interface. All 15+ consumers continue to import from `activitiesData.ts` with no import path changes.

## Inherited Outcome Contract

- **Why:** Full-app simplify sweep flagged critical type duplication as a maintenance risk. Multiple definitions of DateOfBirth, Activity, and PayType diverge silently — a change to one definition won't propagate to the others, causing subtle type mismatches.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each duplicated type (DateOfBirth, Activity, PayType and others found during investigation) is consolidated to a single canonical definition. All consumers import from that definition. Zod schemas use z.infer<> instead of parallel hand-written interfaces.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-type-schema-deduplication/fact-find.md`
- Key findings used:
  - `checkInRowSchema.ts` inline DOB schema is intentionally loose — Zod schema must not be replaced.
  - `cityTaxDomain.ts` imports `CityTaxData` from `cityTaxData.ts` — circular import if `PayType` moved to domain; must keep definition in `cityTaxData.ts` and re-export from domain.
  - `activitiesData.ts Activity` interface has an identical Zod schema in `activitySchema.ts` — replace hand-written interface with `z.infer<typeof activitySchema>`.
  - `checkoutrow.ts Activity` has zero external consumers — safe to remove and import canonical.

## Proposed Approach
- Option A: Create a new shared types file and redirect all consumers.
- Option B: Consolidate in-place — delete duplicates, update consumer imports to existing canonical files, use `z.infer<>` for schema-backed types.
- Chosen approach: **Option B** — in-place consolidation. The canonical sources already exist and are already the correct import target for the majority of consumers. In-place changes require fewer import path updates, keep the existing relay file structure intact, and avoid creating a new indirection layer.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Consolidate DateOfBirth | 90% | S | Pending | - | TASK-04 |
| TASK-02 | IMPLEMENT | Consolidate Activity | 90% | S | Pending | - | TASK-04 |
| TASK-03 | IMPLEMENT | Consolidate PayType | 90% | S | Pending | - | TASK-04 |
| TASK-04 | IMPLEMENT | Typecheck verification gate | 90% | S | Pending | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | Fully independent; run in parallel |
| 2 | TASK-04 | TASK-01, TASK-02, TASK-03 | Run after all Wave 1 tasks complete |

## Tasks

### TASK-01: Consolidate DateOfBirth — delete hand-written duplicate and redundant alias
- **Type:** IMPLEMENT
- **Deliverable:** Modified import in `usePrepaymentData.ts`; deleted `types/hooks/data/occupantDetails.ts`; deleted `types/component/dob.ts`; updated imports in `buildCheckinRows.ts` and `useCheckinsData.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/types/hooks/data/occupantDetails.ts` (DELETE)
  - `apps/reception/src/types/component/dob.ts` (DELETE)
  - `apps/reception/src/hooks/client/checkin/usePrepaymentData.ts`
  - `apps/reception/src/hooks/orchestrations/checkin/buildCheckinRows.ts`
  - `apps/reception/src/hooks/orchestrations/checkin/useCheckinsData.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — all consumers enumerated; structural identity verified field-for-field
  - Approach: 95% — mechanical: delete files, update two import lines per consumer
  - Impact: 90% — type-only; TypeScript enforces correctness; no runtime behaviour changes
- **Acceptance:**
  - `types/hooks/data/occupantDetails.ts` deleted from filesystem
  - `types/component/dob.ts` deleted from filesystem
  - `usePrepaymentData.ts` imports `OccupantDetails as GuestOccupantDetails` from `../../../types/hooks/data/guestDetailsData` (was: `../../../types/hooks/data/occupantDetails`)
  - `buildCheckinRows.ts` imports `DateOfBirth` from `../../../types/hooks/data/guestDetailsData` (was: `OccupantDateOfBirth` from `../../../types/component/dob`)
  - `useCheckinsData.ts` imports `DateOfBirth` from `../../../types/hooks/data/guestDetailsData` (was: `OccupantDateOfBirth` from `../../../types/component/dob`)
  - All references to `OccupantDateOfBirth` in `buildCheckinRows.ts` and `useCheckinsData.ts` renamed to `DateOfBirth`
  - `checkInRowSchema.ts` — no change (inline Zod schema intentionally preserved)
- **Validation contract (TC-01):**
  - TC-01: `pnpm --filter @apps/reception typecheck` exits 0 — all import paths resolve; no unknown type errors
  - TC-02: `buildCheckinRows.ts` line `let dobObject: DateOfBirth = ...` compiles without error — structural assignability confirmed
- **Execution plan:** Red -> Green -> Refactor
  - Red: Delete `occupantDetails.ts` → typecheck fails (usePrepaymentData references missing file)
  - Red: Delete `dob.ts` → typecheck fails (buildCheckinRows, useCheckinsData reference missing file)
  - Green: Update `usePrepaymentData.ts` import to `guestDetailsData`; rename `GuestOccupantDetails` usage if needed
  - Green: Update `buildCheckinRows.ts` import from `dob` to `guestDetailsData`; rename all `OccupantDateOfBirth` references to `DateOfBirth`
  - Green: Update `useCheckinsData.ts` import from `dob` to `guestDetailsData`; rename all `OccupantDateOfBirth` references to `DateOfBirth`
  - Refactor: None needed — changes are purely mechanical
- **Planning validation:**
  - Checks run: `grep -rn "from.*types/component/dob"` → 2 consumers confirmed; `grep -rn "from.*types/hooks/data/occupantDetails\b"` → 1 consumer confirmed
  - Validation artifacts: fact-find grep evidence
  - Unexpected findings: None
- **Scouts:** None: all consumer paths verified by grep in fact-find phase
- **Edge Cases & Hardening:**
  - `usePrepaymentData.ts` uses `OccupantDetails as GuestOccupantDetails` alias — ensure alias rename is preserved (import alias, not type rename)
  - `buildCheckinRows.ts` and `useCheckinsData.ts` use `OccupantDateOfBirth` as a local variable type annotation (e.g., `let dobObject: OccupantDateOfBirth = ...`) — rename these usages to `DateOfBirth` in the same edit
- **What would make this >=90%:** Already at 90%. To reach 95%: run typecheck locally after changes.
- **Rollout / rollback:**
  - Rollout: Single commit; type-only change; no deploy step needed
  - Rollback: `git revert` — trivial
- **Documentation impact:** None: no public API or user-facing documentation affected
- **Notes / references:**
  - `guestDetailsData.ts` already re-exports `DateOfBirth` and `OccupantDetails` from `occupantDetailsSchema.ts` — this is the existing relay pattern for most of the codebase

### TASK-02: Consolidate Activity — wire activitiesData.ts to schema; fix checkoutrow.ts divergence
- **Type:** IMPLEMENT
- **Deliverable:** Modified `activitiesData.ts` (interface → `z.infer<>`); modified `checkoutrow.ts` (remove local Activity, import canonical)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/types/hooks/data/activitiesData.ts`
  - `apps/reception/src/types/component/checkoutrow.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — activitySchema verified identical shape; checkoutrow Activity has zero external consumers
  - Approach: 95% — `z.infer<typeof activitySchema>` is the established project pattern for schema-backed types
  - Impact: 90% — type-only change; all 15+ consumers continue importing from `activitiesData.ts` with no path changes
- **Acceptance:**
  - `activitiesData.ts` no longer contains a hand-written `Activity` interface; instead exports `export type Activity = z.infer<typeof activitySchema>` with imports `import { type z } from "zod"` and `import { activitySchema } from "../../../schemas/activitySchema"` (path: 3 levels up from `types/hooks/data/` to `schemas/`)
  - `activitiesData.ts` still exports `ActivityData` and `Activities` (no change to those types)
  - `checkoutrow.ts` no longer defines a local `Activity` interface
  - `checkoutrow.ts` imports `Activity` from `../hooks/data/activitiesData` and uses it in `CheckoutRow.activities: Activity[]`
  - All 15+ existing consumers of `Activity` from `activitiesData.ts` require no import path changes
- **Validation contract (TC-02):**
  - TC-01: `pnpm --filter @apps/reception typecheck` exits 0
  - TC-02: `CheckoutRow.activities` field accepts values produced by `useCheckoutClient.ts` (which already uses `Activity` from `activitiesData.ts`) — structurally identical, no cast needed
  - TC-03: `ActivityData` type (`{ [activityId: string]: Activity }`) still resolves correctly after `Activity` becomes `z.infer<>`
- **Execution plan:** Red -> Green -> Refactor
  - Red: Remove hand-written `Activity` interface from `activitiesData.ts` before adding import → temporary break
  - Green: Add `import { type z } from "zod"` and `import { activitySchema } from "../../../schemas/activitySchema"` to `activitiesData.ts`; replace hand-written interface with `export type Activity = z.infer<typeof activitySchema>`
  - Green: Remove local `Activity` interface from `checkoutrow.ts`; add `import { type Activity } from "../hooks/data/activitiesData"` at top of file; `CheckoutRow.activities` field type now uses imported `Activity`
  - Refactor: Remove JSDoc comment above the removed local interface in `checkoutrow.ts` ("Represents an activity related to the checkout process...")
- **Planning validation:**
  - Checks run: verified `activitySchema` exports `{ code: z.number(), timestamp: z.string().optional(), who: z.string() }` — identical to current hand-written interface; verified `checkoutrow.ts Activity` has zero external imports
  - Validation artifacts: fact-find grep evidence; `activitySchema.ts` direct read
  - Unexpected findings: None
- **Scouts:** None: schema shape verified directly; consumer count verified by grep
- **Edge Cases & Hardening:**
  - `ActivityData = { [activityId: string]: Activity }` — ensure this type still resolves after `Activity` is changed to `z.infer<>`. Since the shape is identical, this is guaranteed by TypeScript structural typing, but verify during typecheck.
  - `Activities = Record<string, ActivityData> | null` — same reasoning; unaffected.
- **What would make this >=90%:** Already at 90%. To reach 95%: confirmed by `pnpm --filter @apps/reception typecheck` output.
- **Rollout / rollback:**
  - Rollout: Single commit; type-only; no deploy
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:**
  - `usePrepaymentData.ts` defines `ActivityByCodeItem` — this is a different Firebase node (`activitiesByCode` path, no `code` field) and must NOT be touched.
  - `activitiesByCodeData.ts` defines `ActivityByCodeData` — also different; no change.

### TASK-03: Consolidate PayType — single definition in cityTaxData.ts; re-export from cityTaxDomain.ts
- **Type:** IMPLEMENT
- **Deliverable:** Modified `cityTaxData.ts` (keep definition, standardise value order); modified `cityTaxDomain.ts` (remove definition, import and re-export from `cityTaxData.ts`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/types/hooks/data/cityTaxData.ts`
  - `apps/reception/src/types/domains/cityTaxDomain.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — import direction confirmed safe (cityTaxData.ts is already leaf; cityTaxDomain.ts already imports from it)
  - Approach: 95% — re-export pattern is established; no new indirection layer
  - Impact: 90% — type-only; consumers of both files continue to get `PayType` without import path changes
- **Acceptance:**
  - `cityTaxData.ts` exports `PayType = "CASH" | "CC"` (canonical, standardised order)
  - `cityTaxDomain.ts` no longer defines its own `PayType`; instead re-exports: `export type { PayType } from "../hooks/data/cityTaxData"`
  - All three `PayType` consumers unchanged in their import paths:
    - `CityTaxPaymentButton.tsx` imports from `cityTaxDomain` — still works via re-export
    - `useCityTaxAmount.ts` imports from `cityTaxDomain` — still works via re-export
    - `useComputeOutstandingCityTax.ts` imports from `cityTaxData` — still works (definition stays there)
  - No circular import introduced: `cityTaxData.ts → schemas/cityTaxSchema.ts` (no change); `cityTaxDomain.ts → cityTaxData.ts` (already exists)
- **Validation contract (TC-03):**
  - TC-01: `pnpm --filter @apps/reception typecheck` exits 0
  - TC-02: `useComputeOutstandingCityTax.ts` receives `PayType` from `cityTaxData.ts` — same file, same definition — no breakage
  - TC-03: `CityTaxPaymentButton.tsx` and `useCityTaxAmount.ts` receive `PayType` via re-export from `cityTaxDomain.ts` — structurally identical union
- **Execution plan:** Red -> Green -> Refactor
  - Red: Remove `PayType` definition from `cityTaxDomain.ts` → typecheck fails (CityTaxPaymentButton, useCityTaxAmount reference missing type)
  - Green: Add `export type { PayType } from "../hooks/data/cityTaxData"` to `cityTaxDomain.ts` → all three consumers resolve
  - Green: In `cityTaxData.ts`, standardise value order to `"CASH" | "CC"` (was `"CC" | "CASH"`) — cosmetic only, no TS impact
  - Refactor: Remove JSDoc comment block above the removed `PayType` definition in `cityTaxDomain.ts` (if present)
- **Planning validation:**
  - Checks run: verified `cityTaxDomain.ts` line 3 already has `import { type CityTaxData } from "../hooks/data/cityTaxData"` — re-exporting `PayType` from same file is safe and does not create a new import edge
  - Validation artifacts: direct file reads; fact-find grep evidence
  - Unexpected findings: Circular import risk was identified and resolved — direction must be `cityTaxData.ts` defines, `cityTaxDomain.ts` re-exports (NOT the reverse)
- **Scouts:** None: import graph verified; no circular risk with chosen direction
- **Edge Cases & Hardening:**
  - Ensure `import type { CityTaxData }` in `cityTaxDomain.ts` remains a type-only import (already `import { type ... }`) — no change needed
  - Value order standardisation (`"CC" | "CASH"` → `"CASH" | "CC"`) is cosmetic in TypeScript but makes the codebase consistent with the domain definition
- **What would make this >=90%:** Already at 90%. To reach 95%: typecheck confirms.
- **Rollout / rollback:**
  - Rollout: Single commit; type-only; no deploy
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:**
  - `KeycardPayType` is a separate enum in `types/keycards.ts` — out of scope; do not touch

### TASK-04: Typecheck verification gate
- **Type:** IMPLEMENT
- **Deliverable:** Passing typecheck output for `apps/reception`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] apps/reception/src/` (reads only)
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — all three prior tasks have been verified at the type level before being scoped
  - Approach: 95% — `pnpm --filter @apps/reception typecheck` is the standard validation gate for this codebase
  - Impact: 90% — confirms all consumer paths resolve and no regressions were introduced
- **Acceptance:**
  - `pnpm --filter @apps/reception typecheck` exits with code 0 — zero TypeScript errors
  - `pnpm --filter @apps/reception lint` exits with code 0 — zero lint errors
  - Confirm: `types/hooks/data/occupantDetails.ts` and `types/component/dob.ts` no longer exist on disk
  - Confirm: `activitiesData.ts Activity` is `z.infer<typeof activitySchema>` (not hand-written interface)
  - Confirm: `cityTaxDomain.ts` re-exports `PayType` from `cityTaxData.ts`
  - If typecheck or lint fails on errors not introduced by TASK-01/02/03: do not silently pass; surface errors to operator with identification of whether errors are pre-existing; block task completion
- **Validation contract (TC-04):**
  - TC-01: `pnpm --filter @apps/reception typecheck` exits 0
  - TC-02: `pnpm --filter @apps/reception lint` exits 0
  - TC-03: If either gate fails on pre-existing errors unrelated to this change: block task; escalate to operator
- **Execution plan:** Red -> Green -> Refactor
  - Red: n/a (this task only validates; no implementation)
  - Green: Run `pnpm --filter @apps/reception typecheck && pnpm --filter @apps/reception lint`; confirm both exit 0
  - Refactor: If errors found in scope of TASK-01/02/03, diagnose and fix before marking complete; if pre-existing errors, escalate
- **Planning validation:**
  - Checks run: Fact-find confirmed all consumer paths; no unresolved circular imports
  - Validation artifacts: Wave 1 task acceptances feed into this gate
  - Unexpected findings: None anticipated
- **Scouts:** None: verification task only
- **Edge Cases & Hardening:**
  - If typecheck or lint finds unexpected errors in unrelated files: do not ignore; determine whether they are pre-existing (document) or newly introduced (fix in scope)
- **What would make this >=90%:** Already at 90%. To reach 95%: actually run and confirm 0 errors.
- **Rollout / rollback:**
  - Rollout: None — validation only
  - Rollback: None: `None: validation task, no deployment`
- **Documentation impact:** None

## Risks & Mitigations
- Circular import if `PayType` definition direction is reversed: mitigated by keeping definition in `cityTaxData.ts` (confirmed safe direction)
- `checkInRowSchema.ts` DOB Zod schema accidentally replaced with strict version: mitigated by explicit out-of-scope constraint in TASK-01
- Missed consumer import: `pnpm --filter @apps/reception typecheck` will catch at TASK-04; pre-commit hook enforces

## Observability
- Logging: None: type-only refactor
- Metrics: None: no runtime behaviour change
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] `pnpm --filter @apps/reception typecheck` passes (zero errors)
- [ ] `pnpm --filter @apps/reception lint` passes (zero errors)
- [ ] `types/hooks/data/occupantDetails.ts` deleted
- [ ] `types/component/dob.ts` deleted
- [ ] `activitiesData.ts` exports `Activity` as `z.infer<typeof activitySchema>`
- [ ] `checkoutrow.ts` has no local `Activity` definition; imports from `activitiesData.ts`
- [ ] `cityTaxData.ts` is sole definition of `PayType`; `cityTaxDomain.ts` re-exports it
- [ ] `checkInRowSchema.ts` inline DOB Zod schema unchanged (intentional preservation)
- [ ] No duplicate type definitions remain for the three target types

## Decision Log
- 2026-03-08: PayType canonical location chosen as `cityTaxData.ts` (leaf file) with re-export from `cityTaxDomain.ts`. Rationale: `cityTaxDomain.ts` already imports `CityTaxData` from `cityTaxData.ts`; reversing the direction would create a circular import. `PayType` has no Zod schema so belongs in a type file, not a schema file.
- 2026-03-08: `checkInRowSchema.ts` inline DOB schema explicitly preserved — it is intentionally looser than `dateOfBirthSchema` (plain optional strings vs regex/range validation). Replacing it would tighten validation — out of scope.

## Overall-confidence Calculation
- All tasks: S=1 weight, confidence 90%
- Overall-confidence = (90 * 1 + 90 * 1 + 90 * 1 + 90 * 1) / (1+1+1+1) = **90%**

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Delete `occupantDetails.ts`, delete `dob.ts`, update 3 consumer imports | Yes — canonical relay `guestDetailsData.ts` already exists and exports `DateOfBirth` and `OccupantDetails`; consumer count verified by grep | None | No |
| TASK-02: Replace `Activity` interface in `activitiesData.ts` with `z.infer<>`, fix `checkoutrow.ts` | Yes — `activitySchema.ts` already exists; `checkoutrow.ts Activity` has zero external consumers | None | No |
| TASK-03: Keep `PayType` in `cityTaxData.ts`, re-export from `cityTaxDomain.ts` | Yes — `cityTaxDomain.ts` already imports from `cityTaxData.ts`; re-export adds no new import edge | None | No |
| TASK-04: Run `pnpm --filter @apps/reception typecheck` | Yes — depends on TASK-01, TASK-02, TASK-03 completing first; sequence enforces this | None | No |

## Delivery Rehearsal

**Data lens:** No database records or fixtures involved. All changes are source-file-only. Pass.

**Process/UX lens:** No user-visible flows affected. Type-only changes. Pass.

**Security lens:** No auth boundaries, permission checks, or data access rules modified. Pass.

**UI lens:** No UI components modified. `checkoutrow.ts` and `checkoutrow.ts CheckoutRow` type only affects type annotations in `useCheckoutClient.ts`. No rendering path changes. Pass.

Adjacent ideas (logged, not added to plan):
- [Adjacent: delivery-rehearsal] Add `tsd` type-level tests to enforce structural compatibility of consolidated types — valuable for preventing regressions but adjacent to this plan's deduplication scope; route to post-build reflection.
