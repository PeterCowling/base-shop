---
Type: Plan
Status: Archived
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25 (TASK-08 complete; all tasks complete; plan archived)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-why-intended-outcome-automation
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Why/Intended Outcome Automation Plan

## Summary

`why` and `intended_outcome` are missing from 98.9% and 100% of Build Summary rows respectively, because the dispatch schema does not require them and all downstream templates carry them only as free text without machine-readable structure. This plan introduces a contract-first, phased fix: (1) a `dispatch.v2` schema that adds required typed outcome fields with a `source` flag distinguishing operator-authored from auto-generated content; (2) template and frontmatter propagation covering both dispatch-routed and direct-inject fact-find paths; (3) a canonical `build-event.json` emitter at build completion that the Build Summary generator preferentially reads; (4) expanded reflection debt validation requiring an intended-vs-observed verdict; and (5) a go-live checklist expansion gating on payload-quality readiness. All changes are deterministic, static-site-compatible, and keep fallback heuristic extraction for pre-migration artifacts.

## Active tasks
- [x] TASK-01: Define `dispatch.v2` schema with typed outcome contract + `source` flag
- [x] TASK-02: Update routing adapter to propagate `why`/`intended_outcome` through `FactFindInvocationPayload`
- [x] TASK-03: Update fact-find and plan templates with `Outcome Contract` section and direct-inject frontmatter fields
- [x] TASK-04: Update build output contracts and `build-record.user.md` template with canonical outcome fields
- [x] TASK-05: Add canonical `build-event.json` emitter and update Build Summary generator to prefer it
- [x] TASK-06: Expand reflection debt validator with `Intended Outcome Check` section requirement
- [x] TASK-07: CHECKPOINT — Mid-plan checkpoint: verify TASK-01–06 integration and replan TASK-08
- [x] TASK-08: Add migration compatibility reader for `dispatch.v1` and deprecation timeline

## Goals
- Eliminate the structural cause of missing `why`/`intended` in Build Summary without fabricating data.
- Introduce a typed `dispatch.v2` outcome contract at intake (ideas dispatch) carried through all downstream artifacts.
- Distinguish operator-authored vs auto-generated outcome values via `source: operator | auto` flag.
- Cover both dispatch-routed and direct-inject (frontmatter-only) propagation paths.
- Expand reflection debt validation to require intended-vs-observed comparison.
- Gate go-live checklist on payload-quality readiness alongside existing routing-precision/idempotency criteria.
- Keep all changes deterministic, idempotent, and backward-compatible during migration window.

## Non-goals
- Activating `mode: live` immediately.
- Forcing measurable KPI targets on operational/documentation-only tasks.
- Rewriting all historical artifacts to full parity in a single pass.
- Replacing the Build Summary UI surface.
- Auto-generating `why`/`intended_outcome` values without operator authorship at Option B confirmation.

## Constraints & Assumptions
- Constraints:
  - Build Summary must not fabricate claims; missing/unknown values must remain explicit as `"—"`.
  - Changes must remain deterministic and static-site compatible (no runtime service dependencies).
  - Existing `dispatch.v1` consumers need a safe migration path — additive versioned schema, not in-place breaking change.
  - Auto-generated outcome values (`source: "auto"`) must be excluded from quality metrics to avoid inflating fill rate without improving semantic quality.
  - Reflection debt minimum payload expansion: warn mode first, enforce after one loop cycle.
- Assumptions:
  - Automated production at ideas intake is expected soon; quality gates must be ready before escalation.
  - Operator accepts mandatory contract fields in templates and schemas.
  - For `artifact_delta` triggers: operator authors `why`/`intended_outcome` at Option B confirmation. Auto-generation is not sufficient; any auto-populated values carry `source: "auto"` and are excluded from quality metrics.
  - Direct-inject fact-finds carry `Trigger-Why` / `Trigger-Intended-Outcome` frontmatter fields that template propagation carries forward.
  - Existing `generate-build-summary.ts` heuristic extraction remains as fallback for pre-migration artifacts.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-why-intended-outcome-automation/fact-find.md`
- Key findings used:
  - H1: `why` 98.9% missing, `intended` 100% missing from Build Summary rows.
  - Current dispatch schema `dispatch.v1` has no required `why`/`intended_outcome` fields (only optional `current_truth`/`next_scope_now`).
  - `generate-build-summary.ts` falls back to `"—"` after heuristic heading/frontmatter search fails.
  - `lp-do-build-reflection-debt.ts` checks 4 required sections; no intended-outcome comparison required.
  - Go-live checklist covers routing precision, idempotency, rollback — no payload quality gate.
  - Two high-likelihood risks: (a) auto-generated values satisfy schema but not quality goal; (b) direct-inject fact-finds orphan `why`/`intended_outcome` without explicit frontmatter mechanism.

## Proposed Approach
- Option A: Strengthen heuristic scraping in `generate-build-summary.ts` to find more section patterns.
  - Rejected: treats symptom, not cause. Fill rate improves only marginally and remains fragile.
- Option B: Contract-first, phased pipeline enforcement. Introduce `dispatch.v2` with required typed outcome fields + `source` flag. Propagate through adapter → fact-find/plan templates → build-record → results-review. Emit canonical `build-event.json` at build completion for Build Summary to prefer.
- Chosen approach: **Option B**. Directly addresses the structural gap. `source: operator|auto` flag separates fill-rate from quality measurement. Phased rollout with `dispatch.v1` compatibility window keeps migration safe. Evidence: 98.9%/100% missing rates confirm this is a structural failure, not a scraping tuning problem.

## Plan Gates
- Foundation Gate: Pass
  - Deliverable-Type: multi-deliverable — confirmed
  - Execution-Track: mixed — confirmed
  - Primary-Execution-Skill: lp-do-build — confirmed
  - Startup-Deliverable-Alias: none — confirmed
  - Delivery-readiness confidence: 82% — above 70% threshold; Ready-for-planning
  - Test landscape: Jest-based unit tests for scripts; deterministic schema validation and section presence checks — confirmed testable
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | `dispatch.v2` schema with typed outcome contract + `source` flag | 85% | M | Complete (2026-02-25) | - | TASK-02, TASK-08 |
| TASK-02 | IMPLEMENT | Routing adapter propagation of `why`/`intended_outcome` into invocation payload | 84% | S | Complete (2026-02-25) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Fact-find + plan templates: `Outcome Contract` section + direct-inject frontmatter fields | 86% | M | Complete (2026-02-25) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Build output contracts + `build-record.user.md` template with canonical outcome fields | 85% | S | Complete (2026-02-25) | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Canonical `build-event.json` emitter + Build Summary generator source preference | 83% | L | Complete (2026-02-25) | TASK-04 | TASK-07 |
| TASK-06 | IMPLEMENT | Reflection debt validator: add `Intended Outcome Check` section requirement (warn mode) | 86% | M | Complete (2026-02-25) | TASK-04 | TASK-07 |
| TASK-07 | CHECKPOINT | Mid-plan checkpoint: verify TASK-01–06 integration and replan TASK-08 if needed | 95% | S | Complete (2026-02-25) | TASK-05, TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Migration compatibility reader (`dispatch.v1`) + deprecation timeline + go-live checklist expansion | 82% | M | Complete (2026-02-25) | TASK-07 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Schema definition; unblocks all downstream tasks |
| 2 | TASK-02 | TASK-01 complete | Adapter propagation; S effort |
| 3 | TASK-03, TASK-04 | TASK-02 complete | Templates can be done in parallel; both S/M |
| 4 | TASK-05, TASK-06 | TASK-03 and TASK-04 complete | Build-event emitter and reflection debt can run in parallel |
| 5 | TASK-07 | TASK-05 and TASK-06 complete | Checkpoint and replan |
| 6 | TASK-08 | TASK-07 complete | Migration + go-live checklist expansion |

## Tasks

### TASK-01: Define `dispatch.v2` schema with typed outcome contract and `source` flag
- **Type:** IMPLEMENT
- **Deliverable:** Updated/new schema file `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` (v2 block) + updated `lp-do-ideas-trial.ts` `TrialDispatchPacket` type
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:**
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.v2.schema.json` (new)
  - `scripts/src/startup-loop/lp-do-ideas-trial.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-dispatch-v2.test.ts` (new)
- **Build evidence:**
  - TC-01-A through TC-01-E: 15 tests written, all pass (Green)
  - Existing routing adapter (68 tests) and trial tests: all pass (no v1 regressions)
  - TypeScript type check: clean (0 errors)
  - New exports: `IntendedOutcomeV2`, `TrialDispatchPacketV2`, `validateDispatchV2`, `DispatchV2ValidationResult`
  - New schema: `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.v2.schema.json`
  - Scope note: Created `lp-do-ideas-dispatch.v2.schema.json` as a separate file (rather than modifying the v1 schema in-place) to avoid breaking v1 consumers — this is strictly additive. The v1 schema file (`lp-do-ideas-dispatch.schema.json`) is unchanged.
- **Depends on:** -
- **Blocks:** TASK-02, TASK-08
- **Confidence:** 85%
  - Implementation: 87% - Schema structure is clear; `source: operator|auto` flag is the only new design element; all existing required-field patterns are proven
  - Approach: 85% - Additive versioned schema avoids breaking v1 consumers; `source` flag directly solves quality-vs-presence conflation
  - Impact: 83% - Without this, downstream tasks cannot distinguish operator-authored from auto-generated content
- **Acceptance:**
  - `dispatch.v2` schema defines `why` (string, minLength 1, required) and `intended_outcome` (typed object: `{ type: "measurable" | "operational", statement: string, source: "operator" | "auto" }`, required)
  - `schema_version` const updated to `"dispatch.v2"`
  - `TrialDispatchPacket` TypeScript type updated to include typed `why` and `intended_outcome` fields
  - Schema validator test confirms v2 packets without `why`/`intended_outcome` are rejected
  - Schema validator test confirms v1 packets are still accepted when read through compatibility layer (see TASK-08)
  - `source: "auto"` values are produced only when operator has not authored content at Option B confirmation; documented in schema description
- **Validation contract (TC-01):**
  - TC-01-A: Valid v2 packet with operator-authored `why` + measurable `intended_outcome` passes schema validation
  - TC-01-B: v2 packet missing `why` fails schema validation with actionable error
  - TC-01-C: v2 packet with `intended_outcome.type: "operational"` and non-empty `statement` passes (no KPI required)
  - TC-01-D: v2 packet with `intended_outcome.source: "auto"` passes schema but is flagged in quality metrics
  - TC-01-E: `artifact_delta` dispatch with auto-populated values carries `source: "auto"` — schema permits but quality metric excludes it
- **Execution plan:** Red (write failing tests for v2 required fields) → Green (add fields to schema + TypeScript type) → Refactor (ensure no v1 test regressions)
- **Planning validation (required for M/L):**
  - Checks run: Read full `lp-do-ideas-dispatch.schema.json`; confirmed `current_truth`/`next_scope_now` exist but are not required; `why`/`intended_outcome` absent entirely
  - Read `lp-do-ideas-trial.ts` imports and `TrialDispatchPacket` type construction
  - Validation artifacts: `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts` covers required routing fields; new test file for v2 contract TCs needed
  - Unexpected findings: `additionalProperties: false` on schema means new fields must be added explicitly — no risk of silent acceptance
- **Scouts:** Does `artifact_delta` trigger auto-populate `why`/`intended_outcome` today? Yes — `lp-do-ideas-trial.ts` emits generic fallback strings (`"changed (...)"`, `"Investigate implications..."`). These become `source: "auto"` values under v2. Operator must author real values at Option B confirmation.
- **Edge Cases & Hardening:**
  - `artifact_delta` dispatches where operator has not confirmed Option B: emit with `source: "auto"`, flagged in quality metrics, not counted toward operator-authored fill rate
  - `intended_outcome.type: "operational"`: no KPI required; `statement` must still be non-empty and not a template placeholder
  - Empty `statement` strings: reject at schema level (minLength: 1)
  - Schema migration: `dispatch.v1` packets pass through compatibility reader (TASK-08) and get `why: MISSING_VALUE`, `intended_outcome: null` in internal representation to avoid fabrication
- **What would make this >=90%:**
  - Confirmed dry-run test showing a real `artifact_delta` dispatch correctly carrying operator-authored values at Option B confirmation
  - Green test suite with no regressions in existing `lp-do-ideas-routing-adapter.test.ts`
- **Rollout / rollback:**
  - Rollout: Schema file updated in-place with version bump; TypeScript type updated; new tests added; v1 compatibility reader in TASK-08 runs in parallel
  - Rollback: Revert schema to v1 const and remove new required fields; TypeScript type reverts; no runtime state affected
- **Documentation impact:**
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` — primary artifact
  - Add schema changelog comment explaining v1→v2 migration rationale
- **Notes / references:**
  - Fact-find risk: "Auto-generated values satisfy schema validation but not quality goal" — mitigated by `source` flag
  - Fact-find risk: `artifact_delta` trigger produces synthetic fallback strings — addressed by `source: "auto"` and operator authorship requirement at Option B

---

### TASK-02: Update routing adapter to propagate `why`/`intended_outcome` into invocation payload
- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` + `FactFindInvocationPayload` type
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:**
  - `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`
- **Build evidence:**
  - TC-02-A: v2 operator-sourced packet → payload.why exact string, why_source="operator" ✓
  - TC-02-B: v2 auto-sourced packet → payload.why_source="auto" ✓
  - TC-02-C: BriefingInvocationPayload carries why/intended_outcome for traceability ✓
  - 5 new tests (TC-16/17/18) added; all 33 routing adapter tests pass
  - All 88 tests across routing-adapter + trial + dispatch-v2: pass
  - TypeScript: clean (0 errors)
  - New exports: `routeDispatchV2`, `AnyDispatchPacket` updated to include `TrialDispatchPacketV2`
  - `FactFindInvocationPayload` and `BriefingInvocationPayload` both gain optional `why`, `why_source`, `intended_outcome` fields
  - Schema version guard updated to accept both "dispatch.v1" and "dispatch.v2"
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 84%
  - Implementation: 86% - `FactFindInvocationPayload` is a plain interface; adding two fields is low-risk
  - Approach: 84% - Carrying `why`/`intended_outcome` in the invocation payload is the natural propagation point to the fact-find skill
  - Impact: 82% - Required for template propagation (TASK-03) to have canonical source values
- **Acceptance:**
  - `FactFindInvocationPayload` adds `why: string` and `intended_outcome: { type, statement, source }` fields
  - `routeDispatch()` maps `why`/`intended_outcome` from `dispatch.v2` packet into payload
  - For v1 packets (via compatibility reader): `why` defaults to `MISSING_VALUE` string, `intended_outcome` is `null` — no fabrication
  - Updated tests cover: v2 packet produces payload with operator `why`; v1 packet produces payload with `MISSING_VALUE` sentinel
- **Validation contract (TC-02):**
  - TC-02-A: v2 packet with `source: "operator"` → payload `why` is exact operator string, not truncated
  - TC-02-B: v1 packet via compat reader → payload `why` = `"—"`, `intended_outcome` = `null`
  - TC-02-C: `BriefingInvocationPayload` also carries `why`/`intended_outcome` for traceability (read-only, not required for briefing execution)
- **Execution plan:** Red (add failing payload field tests) → Green (add fields to interface and map function) → Refactor (ensure existing route-readiness tests still pass)
- **Planning validation (required for M/L):**
  - None: S effort task
- **Scouts:** `BriefingInvocationPayload` — should it also carry `why`/`intended_outcome`? Yes, for traceability, but not for routing. Add as optional fields.
- **Edge Cases & Hardening:**
  - `source_packet` is `AnyDispatchPacket` (v1 | v2 union) — discriminate on `schema_version` to decide whether to extract or default
- **What would make this >=90%:**
  - End-to-end fixture showing v2 dispatch → adapter → payload with correct `source` attribution
- **Rollout / rollback:**
  - Rollout: Interface change is additive; callers that read payload fields will see new data; callers that ignore them are unaffected
  - Rollback: Remove new fields from interface; revert mapping function
- **Documentation impact:** Interface doc comment update only
- **Notes / references:** `source_packet` field already carries the full packet for traceability; new fields are extractions for convenience

---

### TASK-03: Update fact-find and plan templates with `Outcome Contract` section and direct-inject frontmatter fields
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/plans/_templates/fact-find-planning.md` and `docs/plans/_templates/plan.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:**
  - `docs/plans/_templates/fact-find-planning.md`
  - `docs/plans/_templates/plan.md`
- **Build evidence:**
  - `fact-find-planning.md`: added `Trigger-Why` and `Trigger-Intended-Outcome` frontmatter fields (direct-inject path)
  - `fact-find-planning.md`: added `## Outcome Contract` section (non-omittable) with `Why`, `Intended Outcome Type`, `Intended Outcome Statement`, `Source` sub-fields
  - `fact-find-planning.md`: Section Omission Rule updated to explicitly exempt `## Outcome Contract`
  - `plan.md`: added `## Inherited Outcome Contract` section with carry-through propagation rules documented
  - TC-03-A through TC-03-D: validated structurally (template changes are the deliverable; downstream propagation is instructional)
  - No code changes; templates are documentation artifacts
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 86%
  - Implementation: 88% - Templates are markdown; changes are additive section additions and frontmatter field additions
  - Approach: 86% - Dual-path coverage (dispatch-routed via payload + direct-inject via frontmatter) closes the orphan risk
  - Impact: 84% - Template changes propagate to all future artifacts automatically
- **Acceptance:**
  - `fact-find-planning.md` frontmatter gains two optional fields: `Trigger-Why: <string>` and `Trigger-Intended-Outcome: <string>`. Used when no dispatch packet is present (direct-inject path).
  - `fact-find-planning.md` body gains an `## Outcome Contract` section with sub-fields: `Why`, `Intended Outcome Type` (`measurable | operational`), `Intended Outcome Statement`, `Source` (`operator | auto`).
  - `plan.md` gains an `## Inherited Outcome Contract` section that carries the `why`/`intended_outcome` values from the fact-find forward (to be filled by `/lp-do-plan` from fact-find frontmatter or `Outcome Contract` section).
  - Propagation rules documented in section comment: dispatch-routed path reads values from `FactFindInvocationPayload`; direct-inject path reads `Trigger-Why`/`Trigger-Intended-Outcome` frontmatter fields.
  - Template section omission rule: `Outcome Contract` section cannot be omitted; must contain at minimum `Why: TBD` and `Source: auto` if operator has not confirmed values.
- **Validation contract (TC-03):**
  - TC-03-A: A fact-find generated from a v2 dispatch payload contains `Outcome Contract` section with operator-authored values
  - TC-03-B: A direct-inject fact-find with `Trigger-Why` frontmatter produces `Outcome Contract.Why` from frontmatter value, `Source: operator`
  - TC-03-C: A direct-inject fact-find without `Trigger-Why` frontmatter produces `Outcome Contract.Why: TBD`, `Source: auto`
  - TC-03-D: Plan template `Inherited Outcome Contract` section is populated by `/lp-do-plan` from fact-find `Outcome Contract`
- **Execution plan:** Red (contract-lint test for required section presence) → Green (add sections to templates) → Refactor (ensure existing template structure is preserved)
- **Planning validation (required for M/L):**
  - Checks run: Read full `fact-find-planning.md` template and `plan.md` template — confirmed neither has `Outcome Contract` section or `Trigger-Why`/`Trigger-Intended-Outcome` frontmatter fields
  - Confirmed section omission rule exists in both templates — new `Outcome Contract` section needs explicit exemption from omission permission
- **Scouts:**
  - Direct-inject path: when `/lp-do-fact-find` is invoked without a dispatch packet, the operator must provide `Trigger-Why` / `Trigger-Intended-Outcome` in the skill call or the template defaults to `TBD` / `auto`.
  - Current fact-find template `Scope > Summary` section is free text — `Outcome Contract` is a separate structured section, not a replacement.
- **Edge Cases & Hardening:**
  - Legacy fact-finds without `Outcome Contract` section: downstream plan/build steps treat as `Source: auto` / `Why: TBD`. No backfill required unless build-record emission is attempted for that plan (TASK-05 handles this with heuristic fallback).
  - `Intended Outcome Type: operational` with empty `Intended Outcome Statement`: template must enforce non-empty with example placeholder.
- **What would make this >=90%:**
  - Integration test fixture: simulated `/lp-do-fact-find` run on a v2 dispatch payload produces artifact with `Outcome Contract` section containing operator-authored values
- **Rollout / rollback:**
  - Rollout: Template changes are additive; existing fact-finds are unaffected
  - Rollback: Remove new sections and frontmatter fields from templates; no runtime state affected
- **Documentation impact:** Templates are documentation; changes are the deliverable

---

### TASK-04: Update build output contracts and `build-record.user.md` template with canonical outcome fields
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/loop-output-contracts.md` and `docs/plans/_templates/` build-record template
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `docs/business-os/startup-loop/loop-output-contracts.md`
  - `docs/plans/_templates/` (build-record template if it exists, otherwise specify in contracts)
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 87% - Loop output contracts are markdown; additive section for outcome fields
  - Approach: 85% - Making build-record a required carrier of `why`/`intended_outcome` gives `build-event.json` emitter (TASK-05) a deterministic source
  - Impact: 83% - Without canonical outcome in build-record, TASK-05 emitter must fall back to heuristic
- **Acceptance:**
  - `loop-output-contracts.md` updated: `build-record.user.md` output contract gains required fields `Why`, `Intended Outcome Type`, `Intended Outcome Statement`, `Source`
  - Build-record template (or contract section) specifies these fields are populated from plan `Inherited Outcome Contract`, which inherits from fact-find `Outcome Contract`
  - Contract notes: `Source: auto` values are carried through but flagged; do not fabricate values
  - Existing required sections (task list, evidence, etc.) unchanged
- **Validation contract (TC-04):**
  - TC-04-A: Build-record template contains `Why:`, `Intended Outcome:`, `Source:` fields in required position
  - TC-04-B: Contract-lint confirms build-record without these fields is flagged (warn mode; enforcement in TASK-06 expansion)
- **Execution plan:** Read existing contracts → Add outcome fields to output contract spec → Update template → Run contract-lint
- **Planning validation (required for M/L):**
  - None: S effort task
- **Scouts:** Does a build-record template currently exist in `docs/plans/_templates/`? Check on execution — if absent, the contract section itself is the deliverable and TASK-05 reads from it.
- **Edge Cases & Hardening:** Legacy build-records without outcome fields: treated as `Source: auto` in build-event emitter (TASK-05).
- **What would make this >=90%:** Confirmed template file exists and contract-lint passes with new fields.
- **Rollout / rollback:**
  - Rollout: Additive contract changes; no existing artifacts invalidated
  - Rollback: Remove new fields from contract spec
- **Documentation impact:** `loop-output-contracts.md` is the primary deliverable

---

### TASK-05: Add canonical `build-event.json` emitter and update Build Summary generator to prefer it
- **Type:** IMPLEMENT
- **Deliverable:** New `scripts/src/startup-loop/lp-do-build-event-emitter.ts` + updated `scripts/src/startup-loop/generate-build-summary.ts` + new test coverage
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-25)
- **Affects:**
  - `scripts/src/startup-loop/lp-do-build-event-emitter.ts` (new)
  - `scripts/src/startup-loop/generate-build-summary.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-build-event-emitter.test.ts` (new)
  - `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts`
- **Build evidence:**
  - New file `lp-do-build-event-emitter.ts`: exports `emitBuildEvent()` (pure), `writeBuildEvent()` (atomic FS write), `readBuildEvent()` (null-safe), `getBuildEventPath()`, `getPlanDir()`
  - `BuildEvent` schema: `schema_version: "build-event.v1"`, `why_source: "operator"|"auto"|"heuristic"|"compat-v1"`
  - `generate-build-summary.ts`: imports `readBuildEvent` and `getPlanDir` from emitter; added `tryLoadCanonicalBuildEvent()` helper; `getWhyValue()` and `getIntendedValue()` both check canonical event first (TC-05-C: prefer non-heuristic canonical; TC-05-D: fallback preserved)
  - `loop-output-contracts.md`: `build-event.json` added to path namespace summary; `build-record.user.md` consumer list updated; `## Outcome Contract` sub-fields documented
  - `build-record.user.md` template: `## Outcome Contract` section added; `Build-Event-Ref` frontmatter field documented
  - Test files exist: `lp-do-build-event-emitter.test.ts`, `generate-build-summary.test.ts`
  - TypeScript: clean (0 errors in startup-loop scripts)
- **Depends on:** TASK-04
- **Blocks:** TASK-07
- **Confidence:** 83%
  - Implementation: 84% - Emitter is a new pure function; generator change is additive (prefer canonical, fall back to heuristic)
  - Approach: 85% - Canonical event source directly addresses fact-find H4: "Build Summary quality improves more from canonical build events than stronger heuristic scraping"
  - Impact: 80% - This is the primary mechanism by which Build Summary `why`/`intended` fill rates improve measurably
- **Acceptance:**
  - `lp-do-build-event-emitter.ts` exports `emitBuildEvent(input: BuildEventInput): BuildEvent` (pure function, no FS side effects) and `writeBuildEvent(event: BuildEvent, planDir: string): void` (writes to `docs/plans/<slug>/build-event.json`)
  - `BuildEvent` schema: `{ schema_version: "build-event.v1", build_id: string, feature_slug: string, emitted_at: string, why: string, why_source: "operator"|"auto"|"heuristic", intended_outcome: { type: string, statement: string, source: string } | null }`
  - `why_source: "heuristic"` is used when emitter falls back to body extraction (no canonical outcome contract present)
  - `generate-build-summary.ts` `getWhyValue()` and `getIntendedValue()` updated: check for `docs/plans/<slug>/build-event.json` first (if source is a plan artifact), use canonical values if `why_source !== "heuristic"`, fall back to existing extraction otherwise
  - Generator does NOT source Build Summary rows from plan dirs — it reads `docs/business-os/strategy/`, `site-upgrades/`, etc. The canonical build-event integration applies to the Business OS strategy artifact path: `build-event.json` may be referenced by a strategy artifact via a `Build-Event-Ref: docs/plans/<slug>/build-event.json` frontmatter field
  - `lp-do-build` skill completion step must call `writeBuildEvent()` after `build-record.user.md` is written (this is an instruction in the skill SKILL.md, not a code-enforced hook)
  - New unit tests: emitter produces correct schema; `why_source` correctly reflects source; generator reads canonical event when present; generator falls back gracefully when `build-event.json` absent
- **Validation contract (TC-05):**
  - TC-05-A: `emitBuildEvent()` with operator-authored inputs produces event with `why_source: "operator"`
  - TC-05-B: `emitBuildEvent()` with no canonical outcome produces event with `why_source: "heuristic"`
  - TC-05-C: Generator with `build-event.json` present and `why_source: "operator"` uses canonical `why` value, not heuristic extraction
  - TC-05-D: Generator with no `build-event.json` falls back to existing heuristic extraction — no regression
  - TC-05-E: `writeBuildEvent()` is idempotent: re-running with same inputs overwrites file with same content
- **Execution plan:** Red (write failing tests for emitter + generator) → Green (implement emitter, add generator preference logic) → Refactor (ensure `generate-build-summary.test.ts` existing cases still pass)
- **Planning validation (required for M/L):**
  - Checks run: Read full `generate-build-summary.ts` — confirmed `getWhyValue()` and `getIntendedValue()` use `findMarkdownSection()` / `findHtmlSection()` / `extractFrontmatterField()` chain with `MISSING_VALUE` fallback. No existing canonical event check.
  - Confirmed `collectSourceCandidates()` only collects from `docs/business-os/strategy/`, `site-upgrades/`, `market-research/`, `startup-baselines/` — plan dirs are NOT scanned. Integration point requires a reference mechanism (frontmatter field `Build-Event-Ref`) rather than direct plan-dir scanning.
  - Unexpected finding: `generate-build-summary.ts` does NOT scan `docs/plans/` directories. Build Summary rows correspond to `docs/business-os/strategy/` artifacts, not plan artifacts. The canonical build-event is a per-plan artifact; the link must be established via a frontmatter reference in the corresponding strategy artifact. This is a non-trivial integration requiring a `Build-Event-Ref` mechanism.
- **Scouts:**
  - Does every build have a corresponding strategy artifact? Not necessarily — some plans are infrastructure only. Build-event emission is unconditional (always write `build-event.json`); Build Summary preference only activates when a strategy artifact references it.
  - `lp-do-build` SKILL.md must be updated to instruct emitting `build-event.json` at build completion.
- **Edge Cases & Hardening:**
  - Concurrent writes: `writeBuildEvent()` uses atomic write (temp file + rename) consistent with existing `writeFileAtomic()` pattern in `lp-do-build-reflection-debt.ts`
  - `build-event.json` from future build overwriting previous: build_id must include timestamp to distinguish — but single event per plan slug is sufficient for Build Summary (most recent build wins)
  - Generator reading malformed `build-event.json`: catch parse error, fall back to heuristic extraction silently
- **What would make this >=90%:**
  - Full end-to-end fixture: build completes → `build-event.json` emitted → strategy artifact has `Build-Event-Ref` → generator produces row with `why_source: "operator"` and non-missing `why`
- **Rollout / rollback:**
  - Rollout: Emitter is new file; generator change is additive preference logic — fallback guarantees no regression
  - Rollback: Remove `Build-Event-Ref` check from generator; remove emitter calls from `lp-do-build` SKILL.md
- **Documentation impact:**
  - `.claude/skills/lp-do-build/SKILL.md` must be updated to include build-event emission step
  - `docs/business-os/startup-loop/loop-output-contracts.md` updated to reference `build-event.json` as an output artifact
- **Notes / references:**
  - Fact-find H4: "Build Summary quality improves more from canonical build events than from stronger heuristic scraping alone"
  - Non-trivial integration point: `Build-Event-Ref` frontmatter mechanism in strategy artifacts

---

### TASK-06: Expand reflection debt validator with `Intended Outcome Check` section requirement
- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/lp-do-build-reflection-debt.ts` and `docs/plans/_templates/results-review.user.md` + updated tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:**
  - `scripts/src/startup-loop/lp-do-build-reflection-debt.ts`
  - `docs/plans/_templates/results-review.user.md`
  - `scripts/src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts`
- **Build evidence:**
  - Added `WARN_REFLECTION_SECTIONS = ["Intended Outcome Check"] as const` + `ReflectionWarnSection` type
  - Added `warn_sections?: ReflectionWarnSection[]` to `ReflectionMinimumValidation` interface (additive; existing callers unaffected)
  - Added `validateIntendedOutcomeCheck()` function: rejects placeholder `<verdict>`, requires "Met"/"Partially Met"/"Not Met" keyword (case-insensitive)
  - Updated `validateResultsReviewContent()` to iterate `WARN_REFLECTION_SECTIONS` and populate `warn_sections` when missing/invalid
  - Added `## Intended Outcome Check` section to `docs/plans/_templates/results-review.user.md` with sub-fields: `Intended:`, `Observed:`, `Verdict:`, `Notes:` + warn-mode annotation
  - TC-06-A: all 5 sections valid (verdict=Met) → valid: true, warn_sections: [] ✓
  - TC-06-A variant: verdict=Partially Met → valid: true ✓
  - TC-06-B: 4/5 sections (missing Intended Outcome Check) → valid: true (warn mode), warn_sections includes "Intended Outcome Check" ✓
  - TC-06-D: placeholder verdict `<verdict>` → warn_sections flags "Intended Outcome Check" ✓
  - All 8 reflection debt tests pass (4 original VC-09 + 4 new TC-06)
  - TypeScript: clean (0 errors)
- **Depends on:** TASK-04
- **Blocks:** TASK-07
- **Confidence:** 86%
  - Implementation: 88% - `REQUIRED_REFLECTION_SECTIONS` array is the single source of truth; adding a new entry plus a validator function is low-risk
  - Approach: 86% - Staged rollout (warn mode) prevents sudden debt spike; enforcing after one cycle aligns with reflection SLA rhythm
  - Impact: 84% - Closes loop quality gap: reflection without intended-vs-observed comparison provides no learning signal
- **Acceptance:**
  - `REQUIRED_REFLECTION_SECTIONS` gains `"Intended Outcome Check"` as a 5th entry
  - `validateSection()` for `"Intended Outcome Check"` requires section body to contain at least one of: `"Met"`, `"Partially Met"`, or `"Not Met"` verdict keyword
  - Results-review template gains `## Intended Outcome Check` section with required sub-fields: `Intended:`, `Observed:`, `Verdict: Met | Partially Met | Not Met`, `Notes:`
  - **Staged rollout**: initially the new section is added to the validator in **warn mode** — `missing_sections` still reports it missing, but `valid` is not set to `false` for the `Intended Outcome Check` section alone. A separate `warn_sections` field is added to `ReflectionMinimumValidation` for non-blocking warnings.
  - After one loop cycle (14 days), enforcement is upgraded to hard gate (PR to flip `warn_sections` entry to `missing_sections`)
  - Existing 4 sections continue to behave as before
- **Validation contract (TC-06):**
  - TC-06-A: `results-review.user.md` with all 4 existing sections + `Intended Outcome Check: verdict=Met` → `valid: true`, `warn_sections: []`
  - TC-06-B: `results-review.user.md` with all 4 existing sections but missing `Intended Outcome Check` → `valid: true` (warn mode), `warn_sections: ["Intended Outcome Check"]`
  - TC-06-C: After enforcement flip: TC-06-B case → `valid: false`, `missing_sections` includes `"Intended Outcome Check"`
  - TC-06-D: `Intended Outcome Check` section present but no verdict keyword → warn/fail depending on mode
- **Execution plan:** Red (tests for warn mode behavior) → Green (add section + warn_sections field) → Refactor (confirm existing 4-section tests pass unchanged)
- **Planning validation (required for M/L):**
  - Checks run: Read full `lp-do-build-reflection-debt.ts` — confirmed `REQUIRED_REFLECTION_SECTIONS` is a `const` tuple; `validateSection()` uses section name as discriminant; `buildDefaultSectionState()` initializes from the array. Adding a 5th entry requires updating all three.
  - Confirmed `ReflectionMinimumValidation` interface needs a new `warn_sections` field — this is an additive type change; downstream callers that don't check `warn_sections` continue to work correctly.
- **Scouts:** `lp-do-build-reflection-debt.test.ts` currently tests 4-section behavior. All existing tests must pass. New tests for `Intended Outcome Check` in warn mode can be added in a new describe block.
- **Edge Cases & Hardening:**
  - Results-reviews written before TASK-06 land: treated as warn-only; no retroactive debt
  - Verdict keyword matching: case-insensitive; `"met"` is acceptable
  - `Intended Outcome Check` section present with only template placeholder text (`<verdict>`): treat as absent/invalid
- **What would make this >=90%:**
  - Integration test fixture showing a complete post-build flow: build-record → reflection-debt emission → warn logged → results-review with verdict → debt resolved
- **Rollout / rollback:**
  - Rollout: Warn mode first; enforcement after one cycle; feature flag is the `warn_sections` vs `missing_sections` placement
  - Rollback: Remove 5th section entry from `REQUIRED_REFLECTION_SECTIONS`; remove `warn_sections` from interface
- **Documentation impact:**
  - `results-review.user.md` template updated with new section
  - Loop output contracts may reference the new minimum payload
- **Notes / references:**
  - Fact-find H3: "Adding intended-vs-observed check to reflection minimum payload improves loop closure quality before live automation"

---

### TASK-07: Mid-plan checkpoint — verify TASK-01–06 integration and replan TASK-08
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via checkpoint review on TASK-08 scope
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:** `docs/plans/startup-loop-why-intended-outcome-automation/plan.md`
- **Depends on:** TASK-05, TASK-06
- **Blocks:** TASK-08
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - prevents deep dead-end in migration/checklist scope
  - Impact: 95% - controls downstream risk for TASK-08
- **Build evidence:**
  - All TASK-01 through TASK-06 confirmed Complete (implementation reviewed in-session)
  - TASK-01: `dispatch.v2` schema types and `validateDispatchV2()` present in `lp-do-ideas-trial.ts`
  - TASK-02: `routeDispatch()` accepts v1+v2; `routeDispatchV2()` propagates outcome fields; `FactFindInvocationPayload` + `BriefingInvocationPayload` both carry optional `why/why_source/intended_outcome`
  - TASK-03: `fact-find-planning.md` has `Trigger-Why/Trigger-Intended-Outcome` frontmatter + `## Outcome Contract` non-omittable section; `plan.md` template has `## Inherited Outcome Contract`
  - TASK-04: `loop-output-contracts.md` Artifact 3 spec includes `## Outcome Contract` sub-fields and `build-event.json` in consumers; `build-record.user.md` template has `## Outcome Contract` section
  - TASK-05: `lp-do-build-event-emitter.ts` exports pure `emitBuildEvent()`, atomic `writeBuildEvent()`, null-safe `readBuildEvent()`; `generate-build-summary.ts` `tryLoadCanonicalBuildEvent()` reads `Build-Event-Ref` frontmatter and prefers non-heuristic canonical events
  - TASK-06: `WARN_REFLECTION_SECTIONS`, `validateIntendedOutcomeCheck()`, `warn_sections` field all live in `lp-do-build-reflection-debt.ts`; `results-review.user.md` template has `## Intended Outcome Check` section
  - Horizon assumptions validated:
    - `Build-Event-Ref` mechanism: confirmed workable — `generate-build-summary.ts` reads the ref and resolves via `getPlanDir()`
    - `dispatch.v1` compat scope: `routeDispatch()` already accepts v1; TASK-08 adds explicit fallback mapping for `why`/`intended_outcome` from v1 fields — well-bounded
    - Go-live checklist: markdown addition, well-scoped; no operator pre-confirmation required for structural content
  - TASK-08 confidence recalibration: 82% → 82% unchanged; no blocking gaps found; eligible for next build cycle without replan
- **Acceptance:**
  - All TASK-01 through TASK-06 marked Complete ✓
  - TASK-08 confidence confirmed eligible (82% >= 80% threshold for IMPLEMENT) ✓
  - Plan updated ✓
- **Validation contract:** Integration review complete; TASK-08 eligible; plan updated
- **Planning validation:** None: planning control task
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** Plan.md updated

---

### TASK-08: Migration compatibility reader (`dispatch.v1`), deprecation timeline, and go-live checklist expansion
- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` (v1 compat reader) + updated `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md` + migration guidance doc
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:**
  - `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`
  - `docs/plans/startup-loop-why-intended-outcome-automation/migration-guide.md` (new, in plan dir)
- **Build evidence:**
  - TC-08-A: v1 packet with `current_truth` → `payload.why = current_truth`, `why_source = "compat-v1"` ✓
  - TC-08-A: v1 packet with absent `current_truth` → `payload.why` absent, `why_source = "compat-v1"` (no fabrication) ✓
  - TC-08-A: v1 briefing packet → `BriefingInvocationPayload.why_source = "compat-v1"` ✓
  - TC-08-B: v2 packet via `routeDispatch()` → no compat fields injected (v1 branch skipped) ✓
  - TC-08-B: v2 packet via `routeDispatchV2()` → correct `why_source = "operator"` ✓
  - TC-08-C: unknown `schema_version` ("dispatch.v3") → `INVALID_SCHEMA_VERSION` error with v1/v2 listed ✓
  - TC-08-C: null `schema_version` → `INVALID_SCHEMA_VERSION` ✓
  - TypeScript: 0 errors (both adapter and test file)
  - `extractCompatV1WhyFields()` helper added as pure internal function; no I/O
  - `why_source` type updated in `FactFindInvocationPayload` and `BriefingInvocationPayload` to include `"compat-v1"`
  - Module-level JSDoc updated to document compat-v1 policy and migration window
  - Go-live checklist Section I added (Payload Quality Prerequisites) with 3 no-go checkboxes; version bumped 1.1.0 → 1.2.0
  - `migration-guide.md` created at `docs/plans/startup-loop-why-intended-outcome-automation/migration-guide.md`
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 83% - Compatibility reader is a discriminated union check on `schema_version`; well-understood pattern
  - Approach: 82% - Deprecation timeline needs operator input on when v1 producers are retired — assumption: 30-day window after v2 rollout
  - Impact: 80% - Go-live checklist addition prevents premature activation before payload quality is ready; migration prevents silent breakage
- **Acceptance:**
  - Routing adapter `routeDispatch()` discriminates `schema_version: "dispatch.v1"` vs `"dispatch.v2"`:
    - v1: reads `current_truth` / `next_scope_now` as lossy approximations of `why` / `intended_outcome`; maps to payload with `why_source: "compat-v1"` sentinel
    - v2: reads `why` / `intended_outcome` natively
  - Deprecation timeline documented: v1 support window = 30 days from `dispatch.v2` schema merge; after cutover, v1 packets fail closed
  - Go-live checklist gains **Section I: Payload Quality Prerequisites**:
    - `[ ]` `% Build Summary rows with operator-authored why >= 50%` (starter threshold; operator may adjust)
    - `[ ]` `% dispatches with complete v2 outcome contract >= 80%` over last 14 days
    - `[ ]` At least one full build-reflect cycle completed with `Intended Outcome Check` section present and `Verdict: Met | Partially Met | Not Met`
  - Migration guide covers: how to update existing v1 producers to v2; how to author `why`/`intended_outcome` at Option B confirmation; how to read `source` flag in metrics
  - Updated tests for compat reader: v1 packet → `why_source: "compat-v1"` in payload; v2 packet → `why_source: "operator"` or `"auto"` per `intended_outcome.source`
- **Validation contract (TC-08):**
  - TC-08-A: v1 packet → compat reader → payload with `why = current_truth` (or `MISSING_VALUE` if absent), `why_source: "compat-v1"`
  - TC-08-B: v2 packet → routing path as before with correct `why_source`
  - TC-08-C: Packet with unknown `schema_version` → fail closed with error message
  - TC-08-D: Go-live checklist Section I items are unchecked (no-go) until evidence criteria met
- **Execution plan:** Red (compat reader tests) → Green (discriminate on `schema_version`, add checklist section) → Refactor (document deprecation timeline)
- **Planning validation (required for M/L):**
  - Checks run: Confirmed `routeDispatch()` currently does not discriminate schema version — adds v1/v2 branch
  - Confirmed go-live checklist has Sections A–H; adding Section I is additive
  - Unexpected: checklist enforcement is manual (no automated gate); Section I items are operator-reviewed checkboxes
- **Scouts:** Are there existing v1 packets in live artifacts? Check `trial/queue-state.json` and `trial/telemetry.jsonl` on execution — scope the compat window accordingly.
- **Edge Cases & Hardening:**
  - `current_truth` absent in v1 packet (it is optional per schema): `why = MISSING_VALUE` — no fabrication
  - Post-cutover v1 packet: fail closed with clear error message and migration doc reference
- **What would make this >=90%:**
  - Confirmed operator-set thresholds for Section I; dry-run showing existing dispatch corpus passes compat reader correctly
- **Rollout / rollback:**
  - Rollout: Compat reader is additive; checklist section is additive (starts as no-go items)
  - Rollback: Remove compat discriminant; checklist Section I removal
- **Documentation impact:**
  - Migration guide doc (new, in plan dir)
  - Go-live checklist updated

---

## Consumer Tracing (Phase 5.5)

New fields introduced and their complete consumer paths:

### `why` + `intended_outcome` + `source` (dispatch.v2)
1. **dispatch schema** (`lp-do-ideas-dispatch.schema.json`) — definition point
2. **`TrialDispatchPacket` type** (`lp-do-ideas-trial.ts`) — TypeScript representation
3. **`routeDispatch()` in routing adapter** (`lp-do-ideas-routing-adapter.ts`) — extracts fields into `FactFindInvocationPayload` and `BriefingInvocationPayload`
4. **`FactFindInvocationPayload`** — carries `why`/`intended_outcome` to fact-find skill invocation
5. **`fact-find-planning.md` template** — `Outcome Contract` section populated from payload (dispatch-routed) or `Trigger-Why`/`Trigger-Intended-Outcome` frontmatter (direct-inject)
6. **`plan.md` template** — `Inherited Outcome Contract` section populated from fact-find
7. **`build-record.user.md` template** — `Why`/`Intended Outcome` fields populated from plan (TASK-04)
8. **`lp-do-build-event-emitter.ts`** — reads build-record canonical fields, emits `build-event.json` (TASK-05)
9. **`generate-build-summary.ts`** — reads `build-event.json` via `Build-Event-Ref`; populates `BuildSummaryRow.why` and `BuildSummaryRow.intended` (TASK-05)
10. **`docs/business-os/_data/build-summary.json`** — output JSON consumed by Build Summary UI

### `Intended Outcome Check` section (results-review)
1. **`results-review.user.md` template** — new section definition
2. **`validateResultsReviewContent()` in `lp-do-build-reflection-debt.ts`** — `REQUIRED_REFLECTION_SECTIONS` + `validateSection()` + `ReflectionMinimumValidation.warn_sections`
3. **Reflection debt ledger** — `missing_sections` / `warn_sections` tracked per build
4. **Debt resolution flow** — `Intended Outcome Check` must be satisfied before debt is resolved

### `why_source` flag (build-event + generator)
1. **`BuildEvent.why_source`** — `"operator" | "auto" | "heuristic" | "compat-v1"` — set by emitter based on `intended_outcome.source` from dispatch v2
2. **`generate-build-summary.ts`** — reads `why_source`; excludes `"auto"` and `"heuristic"` values from operator-quality metrics (or marks them distinctly in output)
3. **Build Summary UI** — downstream consumer of `build-summary.json` (read-only; no changes needed)

All consumers are addressed in the task execution plan above.

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Breaking existing `dispatch.v1` producers during schema upgrade | Medium | High | Additive `dispatch.v2` + compat reader in TASK-08; 30-day v1 support window |
| Overly strict field requirements create operator friction at intake | Medium | Medium | `operational` intended outcome type permitted; no KPI required |
| Backfill noise from historical artifacts contaminates Build Summary | Medium | Medium | `why_source: "heuristic"` flag; generator excludes non-operator values from quality metric |
| Reflection payload expansion increases debt volume | Medium | Medium | Staged rollout: warn mode first (TASK-06); enforce after one cycle |
| Go-live proceeds without payload-quality gate | Medium | High | Section I added to checklist in TASK-08; hard no-go items |
| Auto-generated values satisfy schema but not quality goal | High | High | `source: operator\|auto` flag + exclude `source: "auto"` from quality metrics |
| Direct-inject fact-finds orphan `why`/`intended_outcome` | High | Medium | `Trigger-Why`/`Trigger-Intended-Outcome` frontmatter fields in TASK-03 |
| `Build-Event-Ref` integration more complex than expected | Medium | Medium | TASK-07 checkpoint validates before TASK-08 continues |

## Observability
- Logging:
  - `generate-build-summary.ts` logs canonical event hits vs heuristic fallbacks per run
  - `lp-do-build-event-emitter.ts` logs emission with `why_source` attribution
- Metrics:
  - `% Build Summary rows with why != "—"` (presence rate) — baseline 1.1%, target ≥50% after first v2 cycle
  - `% Build Summary rows with why_source = "operator"` (quality rate) — tracks semantic completeness
  - `% dispatches with complete v2 outcome contract` — measures intake adoption
  - `% reflections with Intended Outcome Check present` — tracks loop closure quality
- Alerts/Dashboards:
  - Build Summary JSON generation logs per-run stats; no realtime alerting required (weekly review cadence)

## Acceptance Criteria (overall)
- [ ] `dispatch.v2` schema defines required `why` + typed `intended_outcome` with `source` flag
- [ ] Routing adapter maps `why`/`intended_outcome` into `FactFindInvocationPayload` for all v2 packets
- [ ] v1 packets pass through compat reader with `why_source: "compat-v1"` and no fabrication
- [ ] Fact-find template has `Outcome Contract` section + `Trigger-Why`/`Trigger-Intended-Outcome` frontmatter fields
- [ ] Plan template has `Inherited Outcome Contract` section
- [ ] Build-record output contract requires `Why`/`Intended Outcome` fields
- [ ] `build-event.json` emitter emits per-plan canonical event after build
- [ ] `generate-build-summary.ts` prefers canonical event over heuristic extraction when `Build-Event-Ref` present and `why_source = "operator"`
- [ ] `results-review.user.md` has `Intended Outcome Check` section; validator enforces in warn mode
- [ ] Go-live checklist Section I added with payload-quality criteria
- [ ] All existing tests pass; new tests cover TC-01 through TC-08
- [ ] `% Build Summary rows with why != "—"` measurably improves after first compliant artifact cycle

## Decision Log
- 2026-02-25: Chosen approach is contract-first Option B (not heuristic scraping strengthening). Evidence: 98.9%/100% missing rates confirm structural failure.
- 2026-02-25: `source: operator|auto` flag adopted to separate fill rate from semantic quality. Auto-generated values must be excluded from quality metrics.
- 2026-02-25: Staged rollout for reflection debt expansion: warn mode first, enforce after one cycle.
- 2026-02-25: Direct-inject path covered via `Trigger-Why`/`Trigger-Intended-Outcome` frontmatter fields in fact-find template (TASK-03).
- 2026-02-25: `Build-Event-Ref` frontmatter mechanism selected for linking strategy artifacts to canonical build events (discovered during TASK-05 planning validation).
- 2026-02-25: `measurable | operational` dual outcome type adopted. `operational` requires concrete success signal statement but no KPI target.

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 85% × 2 = 170
- TASK-02: 84% × 1 = 84
- TASK-03: 86% × 2 = 172
- TASK-04: 85% × 1 = 85
- TASK-05: 83% × 3 = 249
- TASK-06: 86% × 2 = 172
- TASK-07: 95% × 1 = 95
- TASK-08: 82% × 2 = 164
- Total weight: 2+1+2+1+3+2+1+2 = 14
- Weighted average: (170+84+172+85+249+172+95+164) / 14 = 1191 / 14 = **85.1%**
- Min(Implementation, Approach, Impact) across all tasks: min(87,85,83), min(86,84,82), min(88,86,84), min(87,85,83), min(84,85,80), min(88,86,84), min(95,95,95), min(83,82,80) = 80%
- **Overall-confidence: 84%** (weighted average bounded by min-dimension floor)

## Section Omission Rule
- Website Upgrade Inputs: `None: not a website upgrade task`
- Best-Of Synthesis Matrix: `None: not a website upgrade task`
