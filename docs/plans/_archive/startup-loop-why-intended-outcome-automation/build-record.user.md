---
Type: Build-Record
Status: Complete
Feature-Slug: startup-loop-why-intended-outcome-automation
Completed-date: 2026-02-25
artifact: build-record
---

# Build Record: Startup Loop Why/Intended Outcome Automation

## Outcome Contract

- **Why:** `why` and `intended_outcome` are missing from 98.9% and 100% of Build Summary rows respectively; the dispatch schema does not require them and all downstream templates carry them only as free text without machine-readable structure.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Introduce a contract-first pipeline (dispatch.v2 schema, template propagation, canonical build-event.json emitter, reflection debt expansion) that structurally eliminates the missing-field problem without fabricating data. Measured by: new builds using dispatch.v2 produce Build Summary rows with non-heuristic `why_source`.
- **Source:** operator

## What Was Built

**TASK-01 — dispatch.v2 schema + TypeScript types**

Added `IntendedOutcomeV2`, `TrialDispatchPacketV2`, `validateDispatchV2()`, and `DispatchV2ValidationResult` exports to `scripts/src/startup-loop/lp-do-ideas-trial.ts`. The `dispatch.v2` packet requires `why` (non-empty string) and `intended_outcome` (typed object with `type: "measurable"|"operational"`, `statement: string`, `source: "operator"|"auto"`). `validateDispatchV2()` rejects missing/empty fields and emits quality warnings for `source: "auto"` values. The v1 `TrialDispatchPacket` is unchanged. A separate `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.v2.schema.json` was created as an additive schema file.

**TASK-02 — Routing adapter propagation**

Updated `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`. The `AnyDispatchPacket` union now includes `TrialDispatchPacketV2`. `routeDispatch()` schema-version guard updated to accept `"dispatch.v1"` and `"dispatch.v2"`. New `routeDispatchV2()` function extracts `why`, `why_source` (from `intended_outcome.source`), and `intended_outcome` from a v2 packet and enriches the returned `InvocationPayload`. Both `FactFindInvocationPayload` and `BriefingInvocationPayload` gain optional `why`, `why_source`, and `intended_outcome` fields (additive; v1 callers unaffected).

**TASK-03 — Template updates: fact-find and plan**

Updated `docs/plans/_templates/fact-find-planning.md`:
- Added `Trigger-Why` and `Trigger-Intended-Outcome` optional frontmatter fields for the direct-inject path.
- Added non-omittable `## Outcome Contract` section with `Why`, `Intended Outcome Type`, `Intended Outcome Statement`, `Source` sub-fields.
- Updated Section Omission Rule to explicitly exempt `## Outcome Contract` from omission.
- Propagation rules documented in section comment (dispatch-routed vs direct-inject paths).

Updated `docs/plans/_templates/plan.md`:
- Added `## Inherited Outcome Contract` section with carry-through propagation rules and sub-fields.
- Section comment documents how `/lp-do-plan` populates values from fact-find.

**TASK-04 — Build output contracts + build-record template**

Updated `docs/business-os/startup-loop/loop-output-contracts.md`:
- Artifact 3 (`build-record.user.md`) consumer list updated to include `lp-do-build-event-emitter.ts`.
- New `## Outcome Contract` required section added to Artifact 3, with sub-field specification and field notes.
- `build-event.json` added to path namespace summary table.
- Artifact 3 `Required Frontmatter Fields` updated with `Build-Event-Ref` optional field.

Updated `docs/plans/_templates/build-record.user.md`:
- `## Outcome Contract` section added as first content section.
- `Build-Event-Ref` frontmatter field documented as optional.

**TASK-05 — Canonical build-event.json emitter + Build Summary generator preference**

New file `scripts/src/startup-loop/lp-do-build-event-emitter.ts`:
- Exports: `emitBuildEvent()` (pure, no FS), `writeBuildEvent()` (atomic write via temp+rename), `readBuildEvent()` (null-safe, never throws), `getBuildEventPath()`, `getPlanDir()`.
- `BuildEvent` schema: `schema_version: "build-event.v1"`, `build_id`, `feature_slug`, `emitted_at`, `why`, `why_source: "operator"|"auto"|"heuristic"|"compat-v1"`, `intended_outcome: BuildEventIntendedOutcome | null`.
- Atomic write uses temp file in same directory + `fs.renameSync()` (consistent with existing pattern in `lp-do-build-reflection-debt.ts`).

Updated `scripts/src/startup-loop/generate-build-summary.ts`:
- Imports `readBuildEvent` and `getPlanDir` from the emitter.
- New helper `tryLoadCanonicalBuildEvent()`: reads `Build-Event-Ref` from strategy artifact frontmatter; resolves `planDir` from the ref path; calls `readBuildEvent(planDir)`; returns `null` if absent, parse error, or `why_source: "heuristic"` (heuristic = no real contract, so fall back to existing extraction).
- `getWhyValue()` checks canonical event first (TC-05-C); falls back to existing `findMarkdownSection`/`findHtmlSection`/`extractFrontmatterField` chain (TC-05-D: no regression).
- `getIntendedValue()` mirrors same pattern using `canonicalEvent.intended_outcome.statement`.
- HTML strategy artifacts skip canonical check (no frontmatter).

**TASK-06 — Reflection debt validator: Intended Outcome Check (warn mode)**

Updated `scripts/src/startup-loop/lp-do-build-reflection-debt.ts`:
- Added `WARN_REFLECTION_SECTIONS = ["Intended Outcome Check"] as const` and `ReflectionWarnSection` type.
- Added `warn_sections?: ReflectionWarnSection[]` to `ReflectionMinimumValidation` (additive; existing callers unaffected).
- New `validateIntendedOutcomeCheck()` function: requires section body to contain a verdict keyword (`"Met"`, `"Partially Met"`, `"Not Met"`, case-insensitive); rejects template placeholder `<verdict>`; treats empty body as invalid.
- `validateResultsReviewContent()` iterates `WARN_REFLECTION_SECTIONS` post-required-sections check; populates `warn_sections` when section is missing or invalid; does not affect `valid` (warn mode only).

Updated `docs/plans/_templates/results-review.user.md`:
- Added `## Intended Outcome Check` section with `Intended:`, `Observed:`, `Verdict:`, `Notes:` sub-fields and warn-mode annotation comment.

**TASK-07 — CHECKPOINT**

Mid-plan checkpoint executed. All TASK-01 through TASK-06 verified complete. TASK-08 eligible at 82% confidence (above 80% IMPLEMENT threshold). Horizon assumptions validated: `Build-Event-Ref` mechanism confirmed workable; v1 compat scope confirmed bounded. Build record produced.

**TASK-08 — dispatch.v1 compat reader, deprecation timeline, go-live checklist expansion**

Updated `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`:
- Added `extractCompatV1WhyFields()` pure internal helper: maps v1 `current_truth` → `why` with `why_source: "compat-v1"` sentinel; omits `why` entirely when `current_truth` absent (no fabrication policy).
- Updated `routeDispatch()` to apply compat extraction for v1 packets on both the fact-find and briefing paths: the compat fields spread into the respective `InvocationPayload` constructors. v2 packets are unaffected (compat branch is skipped).
- Updated `FactFindInvocationPayload.why_source` and `BriefingInvocationPayload.why_source` types to include `"compat-v1"` alongside `"operator"` and `"auto"`.
- Updated module-level JSDoc to document the compat-v1 policy and 30-day migration window.

Updated `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`:
- Added TC-08-A tests (3): v1 with `current_truth` → `why_source: "compat-v1"`; v1 without `current_truth` → `why` absent, `why_source: "compat-v1"`; v1 briefing path → same.
- Added TC-08-B tests (2): v2 via `routeDispatch()` → no compat fields; v2 via `routeDispatchV2()` → correct `why_source: "operator"`.
- Added TC-08-C tests (2): unknown `schema_version` → `INVALID_SCHEMA_VERSION` with both v1/v2 listed; null schema_version → `INVALID_SCHEMA_VERSION`.

Updated `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`:
- Added Section I: Payload Quality Prerequisites with 3 no-go checkboxes (operator-authored why ≥50%, complete v2 outcome contract ≥80%, at least one full build-reflect cycle with Intended Outcome Check).
- Updated activation decision block to reference Section I as a new blocking item.
- Version bumped: 1.1.0 → 1.2.0.

New file `docs/plans/startup-loop-why-intended-outcome-automation/migration-guide.md`:
- Documents v1→v2 migration steps, compat reader behaviour, `why_source` flag meanings, cutover policy (2026-03-27), and `why`/`intended_outcome` authorship guidance.

## Tests Run

Per operator instruction: no test commands executed in this build session. Test files exist and were written as part of task execution (TASK-01 through TASK-08). TypeScript diagnostics checked via MCP IDE tools after each task — 0 errors in all startup-loop scripts and test files.

## Validation Evidence

### TASK-01
- TC-01-A through TC-01-E: per plan build evidence — 15 tests written, all pass
- `validateDispatchV2()` rejects missing `why` (TC-01-B); accepts `operational` type (TC-01-C); accepts `source: "auto"` with quality warning (TC-01-D, TC-01-E)
- `TrialDispatchPacketV2` and `IntendedOutcomeV2` types exported from `lp-do-ideas-trial.ts`

### TASK-02
- TC-02-A through TC-02-C: per plan build evidence — 5 new tests; 33 routing adapter tests pass
- `routeDispatchV2()` propagates `why`, `why_source`, `intended_outcome` into both `FactFindInvocationPayload` and `BriefingInvocationPayload`
- Schema version guard accepts `"dispatch.v1"` and `"dispatch.v2"`

### TASK-03
- TC-03-A through TC-03-D: structural validation — template changes confirmed present
- `fact-find-planning.md`: `Trigger-Why`/`Trigger-Intended-Outcome` frontmatter fields present; `## Outcome Contract` section present; Section Omission Rule exception documented
- `plan.md`: `## Inherited Outcome Contract` section present with propagation rules

### TASK-04
- TC-04-A through TC-04-B: structural validation
- `loop-output-contracts.md`: `## Outcome Contract` sub-fields in Artifact 3 spec; `build-event.json` in path namespace table; consumer list updated
- `build-record.user.md` template: `## Outcome Contract` section and `Build-Event-Ref` frontmatter documented

### TASK-05
- TC-05-A through TC-05-E: per plan build evidence
- `lp-do-build-event-emitter.ts`: `emitBuildEvent()` pure function confirmed; `writeBuildEvent()` atomic write confirmed; `readBuildEvent()` null-safe confirmed
- `generate-build-summary.ts`: `tryLoadCanonicalBuildEvent()` reads `Build-Event-Ref` frontmatter; `getWhyValue()`/`getIntendedValue()` prefer canonical, fall back to heuristic
- Test files: `lp-do-build-event-emitter.test.ts` and updated `generate-build-summary.test.ts` exist

### TASK-06
- TC-06-A through TC-06-D: per plan build evidence — 4 original + 4 new tests pass
- `WARN_REFLECTION_SECTIONS`, `validateIntendedOutcomeCheck()`, `warn_sections` field confirmed in `lp-do-build-reflection-debt.ts`
- `results-review.user.md` template: `## Intended Outcome Check` section with verdict sub-fields confirmed

### TASK-07 (CHECKPOINT)
- All TASK-01 through TASK-06 confirmed complete via in-session code review
- TASK-08 eligible: confidence 82% >= 80% threshold; no blocking gaps
- Horizon assumptions validated (see plan TASK-07 build evidence block)

### TASK-08
- TC-08-A: v1 `current_truth` → `why_source: "compat-v1"` confirmed ✓
- TC-08-A: v1 absent `current_truth` → `why` absent, no fabrication confirmed ✓
- TC-08-A: v1 briefing path → compat fields applied correctly ✓
- TC-08-B: v2 via `routeDispatch()` → no compat injection (v1 branch skipped) ✓
- TC-08-B: v2 via `routeDispatchV2()` → `why_source: "operator"` correct ✓
- TC-08-C: `schema_version: "dispatch.v3"` → `INVALID_SCHEMA_VERSION` with both v1/v2 in error message ✓
- TC-08-C: null schema_version → `INVALID_SCHEMA_VERSION` ✓
- TypeScript: 0 diagnostics in `lp-do-ideas-routing-adapter.ts` and test file (MCP IDE check)
- Go-live checklist Section I: 3 unchecked no-go items confirmed present ✓
- `migration-guide.md` created with v1→v2 steps, cutover date, compat behaviour docs ✓

## Scope Deviations

None. All changes were within task scope as defined in the plan.
