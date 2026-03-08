---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: reception-type-schema-deduplication
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-type-schema-deduplication/plan.md
Dispatch-ID: IDEA-DISPATCH-20260308214000-0002
Trigger-Source: dispatch-routed
---

# Reception Type/Schema Deduplication Fact-Find Brief

## Scope

### Summary

The `apps/reception/src/` codebase contains three classes of type duplication that create silent
maintenance risk:

1. **DateOfBirth** — two source definitions (one canonical schema-inferred, one hand-written
   duplicate) plus two relay/alias layers that add no structural value:
   - Canonical: `occupantDetailsSchema.ts` (`type DateOfBirth = z.infer<typeof dateOfBirthSchema>`)
   - Relay (legitimate): `guestDetailsData.ts` re-exports from `occupantDetailsSchema.ts`
   - Alias (redundant): `types/component/dob.ts` — `OccupantDateOfBirth = DateOfBirth` — no value
   - Hand-written duplicate: `types/hooks/data/occupantDetails.ts` — parallel interface, one consumer
   - Inline duplicate schema: `checkInRowSchema.ts` — `occupantDateOfBirthSchema` is a
     structurally looser variant (plain `z.string().optional()`, no regex/range validation). This
     is a **different schema from `dateOfBirthSchema`** — intentionally looser for the check-in
     row context. The type annotation `z.infer<typeof occupantDateOfBirthSchema>` can be replaced
     with the canonical `DateOfBirth` type (the loose schema produces an assignable supertype),
     but the Zod schema itself must NOT be replaced with the strict canonical — that would change
     validation behaviour.

2. **Activity** — two definitions with structural divergence, plus an unresolved hand-written/schema
   pair in the canonical source itself:
   - Canonical interface: `activitiesData.ts` (`code: number; timestamp?: string; who: string`)
   - Schema: `activitySchema.ts` — Zod schema for Activity (identical shape). The canonical
     `activitiesData.ts` uses a hand-written interface rather than `z.infer<typeof activitySchema>`.
   - Diverged duplicate: `checkoutrow.ts` — missing `who` field; zero external consumers of this
     local definition.
   - `usePrepaymentData.ts` defines `ActivityByCodeItem` for a structurally distinct Firebase node
     (no `code` field). This is NOT a duplicate — correct to keep separate.

3. **PayType** — two identical union types with values in different order (no runtime impact):
   - `cityTaxDomain.ts`: `"CASH" | "CC"`
   - `cityTaxData.ts`: `"CC" | "CASH"`
   - `PayType` has no Zod schema and is a domain-level union. Canonical home: `cityTaxDomain.ts`
     (the domain file), re-exported from `cityTaxData.ts` for hook-layer consumers.

A fourth issue: `types/hooks/data/occupantDetails.ts` is a hand-written parallel interface for
`OccupantDetails` used by exactly one file, while the schema-inferred type already exists and is
used by the rest of the codebase.

### Goals
- Eliminate all duplicate type definitions by consolidating each to one canonical source.
- Migrate all consumer imports to the canonical source.
- Ensure `z.infer<>` is the type derivation mechanism for any type that has a matching Zod schema
  (not parallel hand-written interfaces). Specifically: `activitiesData.ts Activity` should become
  `z.infer<typeof activitySchema>` re-exported from `activitySchema.ts`.
- Remove the `types/component/dob.ts` alias (no value) and `types/hooks/data/occupantDetails.ts`
  hand-written duplicate.
- Establish `cityTaxDomain.ts` as the single `PayType` definition; `cityTaxData.ts` re-exports it.

### Non-goals
- Changing runtime behaviour (no schema field changes, no validation logic changes).
- Migrating unrelated type files or schemas discovered during investigation.
- Touching `KeycardPayType` enum — it is a distinct concept from city-tax `PayType`.

### Constraints & Assumptions
- Constraints:
  - All consumer imports must be updated atomically with source consolidation — partial migration
    leaves the code in a worse state (two competing definitions both in use).
  - TypeScript structural compatibility is sufficient for `DateOfBirth` migration (hand-written
    interfaces match schema-inferred types field-for-field); no runtime impact.
  - `checkoutrow.ts Activity` omits the `who` field — this is a real structural gap. The canonical
    `activitiesData.ts Activity` includes `who`. CheckoutRow.activities is populated by
    `useCheckoutClient.ts` using `Activity` from `activitiesData.ts`, so the CheckoutRow type is
    already mis-typed at compile-time. Fix: use the canonical type, remove the local duplicate.
- Assumptions:
  - `types/hooks/data/occupantDetails.ts` hand-written `DateOfBirth` and `OccupantDetails` are
    structurally identical to schema-inferred types. Verified: both have `{yyyy?, mm?, dd?}` for
    DateOfBirth and identical optional fields for OccupantDetails.
  - `PayType` value order difference (`"CASH" | "CC"` vs `"CC" | "CASH"`) has no runtime impact
    since TypeScript union types are unordered for assignability.

## Outcome Contract

- **Why:** Full-app simplify sweep flagged critical type duplication as a maintenance risk. Multiple
  definitions of DateOfBirth, Activity, and PayType diverge silently — a change to one definition
  won't propagate to the others, causing subtle type mismatches.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each duplicated type (DateOfBirth, Activity, PayType and others
  found during investigation) is consolidated to a single canonical definition. All consumers import
  from that definition. Zod schemas use z.infer<> instead of parallel hand-written interfaces.
- **Source:** auto

## Access Declarations

None — investigation is purely codebase-local. No external APIs, databases, or services required.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/schemas/occupantDetailsSchema.ts` — canonical source for `DateOfBirth`,
  `OccupantDocument`, `OccupantDetails` via Zod schemas + `z.infer<>` exports
- `apps/reception/src/types/hooks/data/activitiesData.ts` — canonical `Activity` interface
  (`code: number, timestamp?: string, who: string`)
- `apps/reception/src/schemas/activitySchema.ts` — Zod schema for `Activity`; matches canonical
  interface exactly (`code: number, timestamp?: string, who: string`)
- `apps/reception/src/types/domains/cityTaxDomain.ts` — contains duplicate `PayType`

### Key Modules / Files

- `apps/reception/src/schemas/occupantDetailsSchema.ts` — **canonical DateOfBirth source**; exports
  `dateOfBirthSchema`, `dateOfBirthLooseSchema`, and `type DateOfBirth = z.infer<typeof dateOfBirthSchema>`
- `apps/reception/src/types/hooks/data/guestDetailsData.ts` — **relay file** that re-exports
  `DateOfBirth`, `OccupantDetails`, `OccupantDocument` from `occupantDetailsSchema`. This is
  already the canonical consumer path for most of the codebase.
- `apps/reception/src/types/component/dob.ts` — **alias file**: `OccupantDateOfBirth = DateOfBirth`
  imported from `guestDetailsData`. Two consumers: `buildCheckinRows.ts` and `useCheckinsData.ts`.
  The alias adds no structural value. After migration both consumers can import `DateOfBirth`
  directly from `guestDetailsData` or `occupantDetailsSchema`.
- `apps/reception/src/types/hooks/data/occupantDetails.ts` — **hand-written duplicate** of
  `DateOfBirth` + `OccupantDetails`. One consumer: `usePrepaymentData.ts` (imports as alias
  `GuestOccupantDetails`). Should be deleted after migrating that import.
- `apps/reception/src/schemas/checkInRowSchema.ts` — defines inline `occupantDateOfBirthSchema`
  as plain `z.string().optional()` fields (NO regex or range validation). This is intentionally
  looser than `dateOfBirthSchema`. The Zod schema must NOT be replaced with the canonical strict
  schema — that would tighten validation. However, the TypeScript type `z.infer<typeof
  occupantDateOfBirthSchema>` produces `{dd?: string; mm?: string; yyyy?: string}` which is
  structurally assignable from/to `DateOfBirth`. The type-level alias can use `DateOfBirth`
  from `occupantDetailsSchema.ts` via a helper export, but the runtime schema stays local.
- `apps/reception/src/types/component/checkoutrow.ts` — **diverged Activity definition** (missing
  `who`). Sole consumer is `useCheckoutClient.ts` for the `CheckoutRow` type. `useCheckoutClient.ts`
  already imports `Activity` from `activitiesData.ts` and populates `CheckoutRow.activities` with
  it — so the type annotation and the runtime value already disagree. Fix: remove the local
  `Activity` definition and change `CheckoutRow.activities` type to import `Activity` from
  `activitiesData.ts`.
- `apps/reception/src/types/hooks/data/activitiesData.ts` — **hand-written interface + Zod schema
  pair**: `activitiesData.ts` defines `Activity` as a hand-written interface while
  `activitySchema.ts` has an identical Zod schema. Per the project pattern, the interface should
  become `export type Activity = z.infer<typeof activitySchema>` in `activitiesData.ts`, importing
  the schema from `activitySchema.ts`.
- `apps/reception/src/types/domains/cityTaxDomain.ts` — **canonical `PayType` home** (domain
  concept, no Zod schema). Two consumers import from here: `CityTaxPaymentButton.tsx`,
  `useCityTaxAmount.ts`. Keep the definition here; remove it from `cityTaxData.ts`.
- `apps/reception/src/types/hooks/data/cityTaxData.ts` — **`PayType` duplicate** (`"CC" | "CASH"`).
  One consumer (`useComputeOutstandingCityTax.ts`) imports from here. Fix: remove definition,
  re-export from `cityTaxDomain.ts`. `PayType` does NOT belong in `schemas/cityTaxSchema.ts`
  because it has no Zod schema and is a domain/UI concept — placing it in a schema file would
  violate the schema file convention (Zod schemas + `z.infer<>` exports only).

### Patterns & Conventions Observed

- **Preferred pattern:** Zod schema in `schemas/`, `z.infer<>` type export, then thin relay files
  in `types/hooks/data/` that re-export. Example: `cityTaxSchema.ts` → `cityTaxData.ts`. The
  `types/hooks/data/guestDetailsData.ts` file already follows this for `DateOfBirth`.
- **Anti-pattern (to remove):** Hand-written TypeScript interfaces that duplicate `z.infer<>` types.
  Found in: `types/hooks/data/occupantDetails.ts`, `types/component/checkoutrow.ts` (Activity),
  `types/domains/cityTaxDomain.ts` (PayType), `schemas/checkInRowSchema.ts` (inline DOB schema).
- **Alias relay files** (`types/component/dob.ts`): acceptable for naming clarity but unnecessary
  when the alias is identical to the source type name.

### Data & Contracts

- Types/schemas/events:
  - `DateOfBirth`: `{ yyyy?: string; mm?: string; dd?: string }` — all four definitions match
  - `Activity` (canonical): `{ code: number; timestamp?: string; who: string }`
  - `Activity` (checkoutrow diverged): `{ code: number; timestamp?: string }` — missing `who`
  - `PayType` (both): `"CASH" | "CC"` union — values identical, order differs (no TS impact)
  - `OccupantDetails`: canonical via schema is `z.infer<typeof occupantDetailsSchema>`

### Dependency & Impact Map

- Upstream dependencies:
  - `schemas/occupantDetailsSchema.ts` is the root source; no upstream type dependencies
  - `schemas/activitySchema.ts` is the root Zod schema for Activity
  - `schemas/cityTaxSchema.ts` is root for `CityTaxRecord`/`CityTaxData`; `PayType` has no schema
- Downstream dependents (full consumer map):

  **DateOfBirth** (via `guestDetailsData` or `occupantDetailsSchema`):
  - 10+ files import `OccupantDetails` from `guestDetailsData` — no change needed
  - `buildCheckinRows.ts` and `useCheckinsData.ts` import `OccupantDateOfBirth` from `dob.ts` —
    migrate to `DateOfBirth` from `guestDetailsData`
  - `usePrepaymentData.ts` imports `OccupantDetails as GuestOccupantDetails` from `occupantDetails.ts` —
    migrate to `guestDetailsData`
  - `checkInRowSchema.ts` inline `occupantDateOfBirthSchema` — intentionally looser than the
    canonical schemas (plain `z.string().optional()` vs regex + range validation). The Zod schema
    must NOT be replaced. No change to `checkInRowSchema.ts` is required for this work.

  **Activity**:
  - `activitiesData.ts` canonical type consumed by at least 15 production files (components, hooks,
    domain types, utilities, orchestration code — see grep evidence). The `Activity` type re-export
    change (hand-written interface → `z.infer<typeof activitySchema>`) is type-only and
    structurally identical, so all 15+ consumers require no import path changes. Blast radius is
    low for runtime but the consumer count is high — TypeScript will catch any structural mismatch.
  - `checkoutrow.ts` local Activity used by 0 external files (only embedded in `CheckoutRow`)
  - `useCheckoutClient.ts` builds `CheckoutRow` objects using `Activity` from `activitiesData.ts`;
    `CheckoutRow.activities: Activity[]` type annotation updated to import canonical `Activity`

  **PayType**:
  - `cityTaxDomain.ts` consumed by: `CityTaxPaymentButton.tsx`, `useCityTaxAmount.ts`
  - `cityTaxData.ts` consumed by: `useComputeOutstandingCityTax.ts`
  - Canonical home: `cityTaxDomain.ts`. `PayType` has no Zod schema and is a domain/UI concept —
    it must NOT go in `schemas/cityTaxSchema.ts`. `cityTaxDomain.ts` already imports `CityTaxData`
    from `cityTaxData.ts`, so `cityTaxData.ts` is a leaf; to avoid a circular dependency, the
    re-export direction must be: `cityTaxDomain.ts` defines `PayType` → `cityTaxData.ts` re-exports
    `PayType` from `cityTaxDomain.ts`. This is safe because `cityTaxDomain.ts` imports `CityTaxData`
    (type only) from `cityTaxData.ts`, and TypeScript `import type` does not create a runtime cycle.
    Consumers of `cityTaxData.ts PayType` (`useComputeOutstandingCityTax.ts`) need no import path
    change — they get `PayType` from the re-export.

- Likely blast radius:
  - Low. All changes are type-only (no runtime code changes). TypeScript will catch any missed
    consumer at typecheck time. The changes are mechanical re-exports and import path updates.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`
- CI integration: tests run in CI only (see `docs/testing-policy.md`)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `occupantDetailsSchema` | Unit | `schemas/__tests__/occupantDetailsSchema.test.ts` | Validates DOB schema behaviour |
| `checkInRowSchema` | Unit | `schemas/__tests__/checkInRowSchema.test.ts` | Covers inline DOB schema |
| `activitySchema` | Unit | `schemas/__tests__/activitySchema.test.ts` | Validates activity fields |
| `cityTaxSchema` | Unit | `schemas/__tests__/cityTaxSchema.test.ts` | Validates city tax record |

#### Coverage Gaps
- No tests directly exercise `Activity` in `checkoutrow.ts` or `PayType` usage (type-only
  constructs; runtime behaviour is tested through consumer hooks).
- No type-level tests (e.g., `tsd` assertions); TypeScript structural compatibility is
  the primary safety net.

#### Recommended Test Approach
- Unit tests: not required for type-only refactors; existing tests catch schema regressions
- Type-check gate: `pnpm typecheck` must pass before merge — this is the primary validation

### Recent Git History (Targeted)
- `apps/reception/src/types/` — last touched in "Wave 1 — extract shared types, remove thin hooks"
  (810f729625). This commit shows prior consolidation work, confirming active maintenance.

## Questions

### Resolved

- Q: Is `checkoutrow.ts Activity` (missing `who`) ever consumed as a standalone import?
  - A: No. `grep -rn "import.*Activity.*from.*checkoutrow"` returns zero results. The type is only
    embedded as the annotation for `CheckoutRow.activities`. Safe to remove and replace.
  - Evidence: grep output — zero external imports

- Q: Does `usePrepaymentData.ts` need the hand-written `OccupantDetails` from `occupantDetails.ts`
  or will the schema-inferred type work?
  - A: Structurally identical — verified field-for-field. The schema-inferred type from
    `guestDetailsData.ts` is a safe drop-in replacement.
  - Evidence: `occupantDetails.ts` lines 3-29 vs `occupantDetailsSchema.ts` lines 94-123

- Q: Is the inline `occupantDateOfBirthSchema` in `checkInRowSchema.ts` identical to `dateOfBirthSchema`?
  - A: No — they are intentionally different. The inline schema uses plain `z.string().optional()`
    (no regex, no range validation). The canonical `dateOfBirthSchema` enforces digit patterns,
    month ranges (1-12), and day ranges (1-31). Replacing the inline Zod schema with the canonical
    one would tighten validation and is out of scope. TASK-01 leaves the Zod schema unchanged;
    only the relay/alias cleanup applies to `checkInRowSchema.ts` context.
  - Evidence: `checkInRowSchema.ts` lines 26-30 vs `occupantDetailsSchema.ts` lines 16-49

- Q: Should `PayType` live in the schema file or the domain file?
  - A: Domain file (`cityTaxDomain.ts`). `PayType` has no Zod schema; placing it in
    `schemas/cityTaxSchema.ts` would violate the convention that schema files contain Zod schemas
    + `z.infer<>` types only. The domain file is already the logical owner; it already imports
    `CityTaxData` from the data layer. Canonical definition stays in `cityTaxDomain.ts`; remove
    from `cityTaxData.ts` and re-export instead.
  - Evidence: `cityTaxDomain.ts` line 3 (already imports from `cityTaxData.ts`)

- Q: What type does `OccupantDateOfBirth` provide that `DateOfBirth` doesn't?
  - A: Nothing — `dob.ts` is a pure alias (`OccupantDateOfBirth = DateOfBirth`). Delete after
    migrating the two consumers.
  - Evidence: `dob.ts` lines 1-3

- Q: Should `activitiesData.ts Activity` interface be replaced with `z.infer<typeof activitySchema>`?
  - A: Yes — `activitySchema.ts` already has the Zod schema with an identical shape. The hand-
    written interface is a duplication anti-pattern. Migration: `activitiesData.ts` imports
    `activitySchema` and exports `type Activity = z.infer<typeof activitySchema>`. All existing
    consumers continue to import from `activitiesData.ts` (no import path changes needed).
  - Evidence: `activitySchema.ts` lines 3-7; `activitiesData.ts` lines 3-7

### Open (Operator Input Required)
None. All questions are resolvable from the codebase.

## Confidence Inputs

- Implementation: 95%
  - Evidence: All consumers identified via grep; types verified field-for-field; no runtime changes
  - To reach 100%: run typecheck after migration
- Approach: 92%
  - Evidence: Pattern is consistent with existing `guestDetailsData` relay pattern already in use
  - To reach 95%: confirm no dynamic type usages (e.g., `typeof DateOfBirth` in runtime code)
- Impact: 90%
  - Evidence: Type-only changes; TypeScript enforcement catches misses
  - To raise: CI typecheck pass
- Delivery-Readiness: 95%
  - Evidence: All consumer paths identified; migration steps are mechanical
- Testability: 88%
  - Evidence: `pnpm typecheck` is the primary gate; existing schema tests catch regressions

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Missed consumer import not caught before commit | Low | Medium | `pnpm typecheck` will fail; pre-commit hook enforces this |
| `checkoutrow.ts Activity` removal breaks `CheckoutRow` typing for downstream consumers | Low | Low | `CheckoutRow.activities` type changes from a local `Activity[]` to the identical canonical `Activity[]` — structurally compatible |
| Accidentally replacing `checkInRowSchema.ts` DOB schema with canonical strict version | Very Low | Medium | The inline schema is intentionally looser (plain strings, no regex/range). Task-01 explicitly scopes out this schema. The Zod schema in `checkInRowSchema.ts` must not be modified. |
| `OccupantDetails` from `occupantDetails.ts` missing a field the schema-inferred type doesn't cover | Very Low | Low | Verified: hand-written type is a subset of schema-inferred type — migration is safe in the direction of schema-inferred |

## Planning Constraints & Notes

- Must-follow patterns:
  - Canonical type location: `schemas/*.ts` for Zod schemas + `z.infer<>` types; `types/hooks/data/*.ts`
    as thin relay files for consumer-facing re-exports
  - Import from the canonical relay file (e.g., `guestDetailsData.ts`) rather than directly from
    `schemas/` where the relay already exists — maintains the existing indirection layer
- Rollout/rollback expectations:
  - Type-only change; rollback is trivial (revert commit). No runtime state or data migration.
- Observability expectations:
  - TypeScript typecheck must pass. No additional runtime observability needed for type-only changes.

## Suggested Task Seeds (Non-binding)

1. **TASK-01** — Consolidate `DateOfBirth` relay/alias/duplicate
   - Delete `types/hooks/data/occupantDetails.ts` (hand-written duplicate)
   - Update `usePrepaymentData.ts` to import `OccupantDetails` from `guestDetailsData.ts`
     (same re-export, structurally identical)
   - Delete `types/component/dob.ts` (alias, no added value) and update
     `buildCheckinRows.ts` + `useCheckinsData.ts` to import `DateOfBirth` directly from
     `guestDetailsData.ts`
   - Leave the inline `occupantDateOfBirthSchema` in `checkInRowSchema.ts` as-is (it is
     intentionally looser validation than `dateOfBirthSchema`; schema must not be replaced).
     Optionally add a comment noting the intentional looseness.

2. **TASK-02** — Consolidate `Activity` (schema-backed + remove checkoutrow divergence)
   - In `activitiesData.ts`: replace the hand-written `Activity` interface with
     `export type Activity = z.infer<typeof activitySchema>` (import schema from `activitySchema.ts`)
   - In `checkoutrow.ts`: remove local `Activity` interface; import `Activity` from
     `activitiesData.ts`; update `CheckoutRow.activities` field type to use the imported type

3. **TASK-03** — Consolidate `PayType` (domain-layer union, no schema)
   - Keep `PayType = "CASH" | "CC"` in `cityTaxDomain.ts` as the single canonical definition
   - In `cityTaxData.ts`: remove the duplicate definition; add
     `export type { PayType } from "../domains/cityTaxDomain"`
   - All three consumers (`CityTaxPaymentButton.tsx`, `useCityTaxAmount.ts`,
     `useComputeOutstandingCityTax.ts`) can keep their existing import paths unchanged since
     their source files will re-export correctly

4. **TASK-04** — Typecheck gate
   - Run `pnpm typecheck` for `apps/reception` to confirm zero errors

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `pnpm typecheck` passes (zero errors) for `apps/reception`
  - No duplicate type definitions remain for DateOfBirth (hand-written), Activity (checkoutrow),
    or PayType (cityTaxData.ts)
  - `types/hooks/data/occupantDetails.ts` deleted
  - `types/component/dob.ts` deleted
  - `activitiesData.ts Activity` uses `z.infer<typeof activitySchema>` (not hand-written interface)
  - `checkInRowSchema.ts` inline DOB Zod schema unchanged (intentionally loose); relay alias cleanup only
  - `cityTaxData.ts` re-exports `PayType` from `cityTaxDomain.ts`; `cityTaxDomain.ts` is sole definition
- Post-delivery measurement plan:
  - CI typecheck gate confirms correctness; no runtime measurement needed

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| DateOfBirth consumers (grep) | Yes | None | No |
| Activity consumers (grep) | Yes | None | No |
| PayType consumers (grep) | Yes | None | No |
| checkoutrow.ts Activity structural divergence | Yes | None (divergence documented and mitigated) | No |
| occupantDetails.ts hand-written type match | Yes | None (verified field-for-field identical) | No |
| checkInRowSchema.ts inline DOB schema | Yes | None (intentionally looser than canonical — schema must not be replaced; confirmed out of scope) | No |
| Test coverage for type-only changes | Yes | None (typecheck is sufficient gate) | No |

## Scope Signal

- **Signal: right-sized**
- **Rationale:** Three discrete deduplication targets with fully-mapped consumers, mechanical
  migration steps, and a hard typecheck gate. No ambiguity in approach. Scope does not require
  expanding — `ActivityByCodeItem` in `usePrepaymentData.ts` is correctly distinct (different
  Firebase node) and should not be merged with `Activity`.

## Evidence Gap Review

### Gaps Addressed

- Confirmed `checkoutrow.ts Activity` has zero external consumers — safe to remove
- Confirmed structural identity of `occupantDetails.ts` hand-written types vs schema-inferred types
- Confirmed `OccupantDateOfBirth` alias adds no value beyond `DateOfBirth`
- Confirmed `PayType` values are identical across both definitions
- Identified and corrected: `checkInRowSchema.ts` inline DOB schema is intentionally LOOSER than
  canonical — the Zod schema must not be replaced (only alias/relay cleanup applies)
- Identified and added: `activitiesData.ts Activity` hand-written interface should become
  `z.infer<typeof activitySchema>` (schema already exists)
- Corrected `PayType` canonical location: `cityTaxDomain.ts` (domain file), NOT `schemas/cityTaxSchema.ts`

### Confidence Adjustments

- Implementation confidence: 95% (all consumer paths mapped, schema difference identified and scoped)
- One initial error corrected (DOB schema replacement was non-runtime-neutral — now scoped correctly)

### Remaining Assumptions

- `activitiesData.ts` consumers treat `Activity` structurally — `z.infer<typeof activitySchema>`
  produces the identical shape, so all 19 consumer files require no import path changes

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-type-schema-deduplication --auto`
