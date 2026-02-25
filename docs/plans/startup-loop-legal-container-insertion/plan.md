---
Type: Plan
Status: Draft
Domain: Platform
Workstream: Mixed
Created: 2026-02-24
Last-reviewed: 2026-02-24
Last-updated: 2026-02-24
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-legal-container-insertion
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: startup-loop, lp-do-plan
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
artifact: plan
---

# Startup Loop LEGAL Container Insertion Plan

## Summary
This plan adds a new `LEGAL` container to startup-loop immediately after `ASSESSMENT` and before `MEASURE-00`, with two mandatory stages: `LEGAL-01` (trademark/IP protection initiation) and `LEGAL-02` (competitive/compelling claim posture plus terms-and-conditions risk architecture). The implementation is sequenced to resolve policy decisions first, then apply topology and contract updates, then align process/registry/workflow artifacts and tests. The design keeps FIN-3 as ongoing compliance/incident ownership while assigning pre-launch legal strategy to LEGAL stages. Execution stays in plan-only mode.

## Active tasks
- [ ] TASK-01: Lock container semantics, workstream placement, jurisdiction protocol, and gate pass schema
- [ ] TASK-02: Insert LEGAL container/stages and gate wiring into `loop-spec.yaml`
- [ ] TASK-03: Add LEGAL process entries and FIN/LEGAL boundary contract
- [ ] TASK-04: Add canonical LEGAL artifacts to artifact registry/contracts
- [ ] TASK-05: Update workflow/dictionary/generated stage maps for LEGAL visibility
- [ ] TASK-06: Add/adjust startup-loop tests for LEGAL IDs and sequence invariants
- [ ] TASK-07: Checkpoint - validate docs/tooling coherence and replan rollout activation

## Goals
- Introduce `LEGAL`, `LEGAL-01`, and `LEGAL-02` as canonical startup-loop stages.
- Ensure legal protection starts post-ASSESSMENT before MEASURE execution.
- Define and enforce hard gate behavior that prevents MEASURE from bypassing LEGAL outputs.
- Preserve clear ownership boundaries between LEGAL (pre-launch legal strategy) and FIN-3 (ongoing compliance operations/incidents).

## Non-goals
- Producing business-specific legal copy deliverables in this cycle.
- Replacing FIN-3 exception runbooks.
- Shipping external legal advice automation.

## Constraints & Assumptions
- Constraints:
  - `docs/business-os/startup-loop/loop-spec.yaml` remains stage-order authority.
  - Process authority remains `docs/business-os/startup-loop/process-registry-v2.md` + `process-assignment-v2.yaml`.
  - Existing startup-loop IDs and aliases must remain stable except intentional LEGAL additions.
- Assumptions:
  - Legal-stage insertion reduces late-stage legal/claims rework when enforced by hard gate.
  - Operator can provide a jurisdiction baseline decision at planning/build time.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-legal-container-insertion/fact-find.md`
- Key findings used:
  - Current sequence is `ASSESSMENT -> MEASURE-00` with no legal container.
  - FIN-3 handles ongoing compliance but does not cover explicit post-assessment legal strategy stages.
  - Stage-addressing tests depend on generated map refresh after stage topology changes.
  - Gate disposition for ASSESSMENT/LEGAL/MEASURE boundary must be explicitly resolved.

## Proposed Approach
- Option A: Expand FIN-3 only (no new stages).
  - Rejected: does not create enforceable pre-MEASURE legal stage contract.
- Option B: Add dedicated `LEGAL` container with two stages and hard gate to MEASURE.
  - Chosen: explicit topology and contracts make legal baseline mandatory and testable.

### Container/Stage Semantic Model
LEGAL follows the same "container completion node" pattern as ASSESSMENT. In the existing spec, ASSESSMENT-11 is followed by ASSESSMENT (the container root node used as an ordering anchor), then MEASURE-00. LEGAL uses identical semantics: LEGAL-01 and LEGAL-02 are child stages; the `LEGAL` node in ordering.sequential represents "all LEGAL work complete" and serves as the gate anchor before MEASURE-00. This model means `LEGAL` is both a container grouping label and an executable ordering node — this is not ambiguous, it is the established pattern. TASK-02 must use this model explicitly.

### Gate Enforcement Contract
- **Gate key:** `GATE-LEGAL-00 (Hard)` guarding the `LEGAL → MEASURE-00` edge.
- **Enforcement point:** to be confirmed in TASK-01, but must be one of: (a) derive-state next-stage computation blocking `MEASURE-00` as a valid next-stage until LEGAL-01 and LEGAL-02 artifacts pass lint; (b) stage-addressing resolver rejecting MEASURE-00 advancement when called from a LEGAL-incomplete run state; or (c) execution runner hard-fail before the MEASURE-00 stage object is loaded. CI-lint-only enforcement is insufficient — it does not prevent runtime bypass.
- **Pass criteria:** LEGAL-01 artifact exists at canonical path with required fields; LEGAL-02 artifact exists at canonical path with required fields. Both defined in TASK-04.
- **Bypass policy:** no bypass without an explicit `waiver` token recorded in the run manifest; conditions for issuing a waiver to be defined in TASK-01 decision record.
- **Observable signal:** a structured log line (or stage-event entry) must be emitted when GATE-LEGAL-00 blocks a MEASURE-00 advancement attempt.
- **GATE-ASSESSMENT-01 disposition:** GATE-ASSESSMENT-01 currently guards the ASSESSMENT completeness check. After LEGAL insertion, it remains responsible for ASSESSMENT completeness (ASSESSMENT-10/11 outputs). A new `GATE-LEGAL-00` guards the LEGAL → MEASURE-00 edge. These two gates have distinct responsibilities and must not be merged. TASK-01 must confirm this is compatible with how GATE-ASSESSMENT-01 is currently evaluated in the runtime.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: No (gate disposition and container/stage semantic model unresolved until TASK-01 closes)
- Auto-build eligible: No (pending decision closure + no explicit auto-build intent)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Lock container semantics, workstream, jurisdiction protocol, gate pass schema | 85% | S | Pending | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Add LEGAL container/stages/gate in loop spec | 80% | L | Pending | TASK-01 | TASK-05, TASK-06 |
| TASK-03 | IMPLEMENT | Add LEG process model and FIN/LEGAL collision rules | 85% | M | Pending | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | Register LEGAL artifact contracts and canonical paths | 82% | M | Pending | TASK-01 | TASK-05 |
| TASK-05 | IMPLEMENT | Update workflow/operator dictionary/generated map | 82% | M | Pending | TASK-02, TASK-03, TASK-04 | TASK-06, TASK-07 |
| TASK-06 | IMPLEMENT | Update/add tests for LEGAL ID and ordering invariants | 85% | M | Pending | TASK-02, TASK-05 | TASK-07 |
| TASK-07 | CHECKPOINT | Reassess rollout activation and downstream plan | 95% | S | Pending | TASK-05, TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Policy lock before structural edits |
| 2 | TASK-02, TASK-03, TASK-04 | TASK-01 | Spec/process/artifact contracts can proceed in parallel |
| 3 | TASK-05 | TASK-02, TASK-03, TASK-04 | Align operator-facing docs after source-of-truth updates |
| 4 | TASK-06 | TASK-02, TASK-05 | Tests should run against final topology/dictionary outputs |
| 5 | TASK-07 | TASK-05, TASK-06 | Checkpoint before rollout handoff |

## Validation Contracts
- TC-02 (TASK-02): `loop-spec.yaml` defines `LEGAL`, `LEGAL-01`, `LEGAL-02`, and legal gate sequencing with no broken stage edges.
- VC-03 (TASK-03): process registry and assignment include LEG process entries with explicit FIN-3 boundary notes. Time-box: validation passes when build task accepted at TASK-07 checkpoint; failure before checkpoint triggers TASK-07 replan path.
- VC-04 (TASK-04): artifact registry contains canonical LEGAL output paths and required field/section expectations. Time-box: validation passes when build task accepted at TASK-07 checkpoint; failure before checkpoint triggers TASK-07 replan path.
- VC-05 (TASK-05): startup-loop workflow/operator dictionary/generated stage map include LEGAL stages and next-step prompts. Time-box: validation passes when build task accepted at TASK-07 checkpoint; failure before checkpoint triggers TASK-07 replan path.
- TC-06 (TASK-06): stage addressing and derive-state tests validate LEGAL IDs and `ASSESSMENT -> LEGAL -> MEASURE` ordering invariants.
- TC-07 (TASK-07): checkpoint confirms contract coherence and identifies rollout activation/no-go criteria.

## Tasks

### TASK-01: Lock container semantics, workstream placement, jurisdiction protocol, and gate pass schema
- **Type:** DECISION
- **Deliverable:** decision record in plan with 4 explicit outputs; all 4 must be logged before TASK-02, TASK-03, or TASK-04 proceeds.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-legal-container-insertion/plan.md`, `[readonly] docs/plans/startup-loop-legal-container-insertion/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 90% - decision points are explicitly scoped; no external dependencies.
  - Approach: 85% - single upfront lock avoids downstream contract churn.
  - Impact: 85% - all four outputs have direct implementation impact on TASK-02/03/04 deliverables.
- **Required decision outputs (all 4 must be logged to close TASK-01):**

  **Output 1 — Container/stage semantic model**
  Confirm that LEGAL uses the container-completion-node pattern (same as ASSESSMENT): LEGAL-01 → LEGAL-02 → LEGAL → MEASURE-00. The `LEGAL` node in ordering.sequential is the gate anchor, not a container-only label. Log this choice with a one-sentence rationale so TASK-02 has an unambiguous model to implement.

  **Output 2 — Workstream placement**
  Choose one option and log it:
  - Option A: New top-level `LEG` workstream in `workstream-workflow-taxonomy-v2.yaml`. Affects reporting and operator routing conventions; requires taxonomy file update in TASK-03.
  - Option B: Legal processes under the existing `FIN` workstream with an explicit `process_type: prelaunch_legal` subtype. No taxonomy file schema change; boundary enforced by subtype field.
  Include rationale. TASK-03 implements the logged choice; the workstream question must not be re-opened as a scout in TASK-03.

  **Output 3 — Jurisdiction selection protocol**
  Mandate explicit operator-supplied jurisdiction selection at LEGAL-01 entry. A default suggestion (EU-first) may be surfaced in the LEGAL-01 prompt, but it must not be silently applied — the operator must write the selection into the LEGAL-01 artifact. The gate (GATE-LEGAL-00) fails if the `jurisdictions` field is absent or set to a reserved placeholder value. Log the default suggestion and the field name.

  **Output 4 — Gate pass schema**
  Log the following before TASK-02 proceeds:
  - Gate key: `GATE-LEGAL-00 (Hard)` guarding `LEGAL → MEASURE-00`.
  - Enforcement point: choose one code path — derive-state next-stage computation, stage-addressing resolver, or execution runner — and log it. CI-lint-only is not acceptable.
  - LEGAL-01 artifact pass criteria (minimum required fields): `jurisdictions`, `brand-name-candidates`, `trademark-search-status`, `filing-intent` (one of: file / defer / confirm), `counsel-review` (yes/no), `notes`.
  - LEGAL-02 artifact pass criteria (minimum required fields): `top-claims`, `claim-evidence-owner`, `claim-risk-level`, `required-policies-list`, `launch-surface`, `risk-acceptance-role`, `known-gaps`.
  - Bypass policy: gate may not be bypassed without an explicit `waiver` token in the run manifest. Log the conditions under which a waiver may be issued (e.g., internal-only test run, operator-confirmed legal counsel signed off externally).
  - Observable signal: log line or stage-event entry emitted when GATE-LEGAL-00 blocks.
  - GATE-ASSESSMENT-01 disposition: confirm whether GATE-ASSESSMENT-01 continues to guard ASSESSMENT completeness (ASSESSMENT-10/11) independently from GATE-LEGAL-00, or whether the insertion changes its evaluation point. Log the answer explicitly; TASK-02 must not proceed without this confirmation.

- **Acceptance:**
  - All 4 decision outputs logged in Decision Log with explicit choices (not questions).
  - Gate pass schema includes enforcement point, artifact field lists, bypass policy, and observable signal.
  - Jurisdiction protocol specifies that selection must be written into LEGAL-01 artifact (no silent defaulting).
  - GATE-ASSESSMENT-01 disposition is logged.
- **Validation contract:** all 4 outputs present in Decision Log; TASK-02/03/04 acceptance criteria reference the logged decisions.
- **Planning validation:** `None: decision task`
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** plan decision log updated with all 4 outputs.

### TASK-02: Insert LEGAL container/stages and gate wiring into `loop-spec.yaml`
- **Type:** IMPLEMENT
- **Deliverable:** canonical stage topology includes `LEGAL`, `LEGAL-01`, `LEGAL-02` and resolved gate wiring.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `scripts/src/startup-loop/stage-addressing.ts`, `scripts/src/startup-loop/derive-state.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 80%
  - Implementation: 85% - known insertion edge and naming conventions exist.
  - Approach: 80% - gate displacement with existing ASSESSMENT gate requires careful contract choice.
  - Impact: 90% - topology controls all downstream stage behavior.
- **Acceptance:**
  - `LEGAL` container and child stages appear in stage graph.
  - ordering edges include `ASSESSMENT -> LEGAL-01 -> LEGAL-02 -> LEGAL -> MEASURE-00`.
  - gate disposition is explicitly represented and consistent with TASK-01 decision.
- **Validation contract (TC-02):**
  - TC-02-01: stage IDs resolve without alias collisions.
  - TC-02-02: sequential ordering has no dead edges and no skipped MEASURE bypass.
  - TC-02-03: gate keys referenced in spec are defined and point to valid edges.
  - TC-02-04 (spec-lint, first-class deliverable): a deterministic spec-lint check verifies (a) no direct bypass edge `[ASSESSMENT, MEASURE-00]` exists, (b) all gate keys referenced in the spec are defined in the gate registry, (c) container/stage node semantics are internally consistent (LEGAL-01 and LEGAL-02 precede LEGAL in ordering, LEGAL precedes MEASURE-00). This lint must run as part of the TASK-02 build acceptance and must be incorporated into CI.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "ASSESSMENT|MEASURE-00|GATE-ASSESSMENT-01|ordering:" docs/business-os/startup-loop/loop-spec.yaml -S`
  - Validation artifacts: existing direct edge and gate comment references confirmed.
  - Unexpected findings: generated stage map coupling requires explicit downstream regen.
- **Scouts:** validate whether gate can be moved without breaking legacy assumptions in stage consumers.
- **Edge Cases & Hardening:** preserve backward compatibility for existing stage aliases and legacy run packets.
- **What would make this >=90%:** extend spec-lint (TC-02-04) to also verify that gate pass criteria field names in loop-spec.yaml gate definitions match the field names in artifact-registry.md entries (cross-file field name parity).
- **Rollout / rollback:**
  - Rollout: spec update + immediate downstream doc/test alignment.
  - Rollback: revert LEGAL edges and restore direct ASSESSMENT->MEASURE edge.
- **Documentation impact:** spec version notes and stage comments updated.
- **Notes / references:** `docs/plans/startup-loop-legal-container-insertion/fact-find.md`

### TASK-03: Add LEGAL process entries and FIN/LEGAL boundary contract
- **Type:** IMPLEMENT
- **Deliverable:** process registry and assignment include legal processes with explicit non-overlap with FIN-3.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/process-registry-v2.md`, `docs/business-os/startup-loop/process-assignment-v2.yaml`, `docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% - process ID patterns and registry shape are stable.
  - Approach: 85% - separate LEG from FIN-3 reduces collision risk.
  - Impact: 88% - clarifies ownership and operator execution expectations.
- **Acceptance:**
  - `LEG-1` and `LEG-2` entries exist in process assignment and registry, using the workstream placement logged in TASK-01 Output 2.
  - stage anchors and cadence for LEG processes are explicit.
  - FIN-3 collision note explicitly states ongoing compliance boundary.
  - RACI boundary between LEGAL and FIN-3 is written into the process registry entry for LEG, covering: (a) LEGAL owns pre-launch IP/claims/terms baseline; (b) FIN-3 owns ongoing compliance, incident response, and audits; (c) tie-breaker rule for overlapping issues (e.g., terms changes after launch: LEGAL consult for strategy, FIN-3 executes operational update).
- **Validation contract (VC-03):**
  - VC-03-01: LEG process IDs are unique and taxonomy-valid per TASK-01 Output 2 workstream placement.
  - VC-03-02: no conflicting ownership statements between LEG and FIN-3 entries; the collision note must explicitly state which process owns each category of legal work.
- **Execution plan:** VC-first Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "FIN-3|process_id|workstream_id" docs/business-os/startup-loop/process-* -S`
  - Validation artifacts: existing FIN-3 ownership and process ID schema confirmed.
  - Unexpected findings: workstream placement decision is logged in TASK-01 Output 2; no scouting required here.
- **Edge Cases & Hardening:** avoid breaking exception-runbook references tied to FIN-3.
- **What would make this >=90%:** add cross-doc lint verifying process IDs in registry and assignment are identical sets.
- **Rollout / rollback:**
  - Rollout: registry + assignment update in same change.
  - Rollback: remove LEG entries and restore prior process map.
- **Documentation impact:** process registry quick index and stage coverage map updates.
- **Notes / references:** `docs/business-os/startup-loop/process-registry-v2.md`

### TASK-04: Add canonical LEGAL artifacts to artifact registry/contracts
- **Type:** IMPLEMENT
- **Deliverable:** canonical LEGAL output artifacts and required fields documented in contract registry.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/artifact-registry.md`, `docs/business-os/startup-loop/loop-output-contracts.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 82% - artifact registry extension is straightforward, but schema detail needs precision.
  - Approach: 82% - contract-first path limits drift risk.
  - Impact: 88% - consumers need explicit legal artifact paths.
- **Artifact format decision (locked here, not scouted):** one artifact per stage, not a single legal-pack. LEGAL-01 produces `legal-protection.user.md`; LEGAL-02 produces `legal-claims.user.md`. Canonical paths: `docs/business-os/strategy/<BIZ>/legal-protection.user.md` and `docs/business-os/strategy/<BIZ>/legal-claims.user.md`. Sign-off role: Operator (must be written into the artifact `risk-acceptance-role` field; not auto-signed by the build process).
- **Acceptance:**
  - `legal-protection.user.md` registered with canonical path, producer (Operator via LEGAL-01 stage), consumer (GATE-LEGAL-00 lint), and required fields: `jurisdictions`, `brand-name-candidates`, `trademark-search-status`, `filing-intent`, `counsel-review`, `notes`.
  - `legal-claims.user.md` registered with canonical path, producer (Operator via LEGAL-02 stage), consumer (GATE-LEGAL-00 lint), and required fields: `top-claims`, `claim-evidence-owner`, `claim-risk-level`, `required-policies-list`, `launch-surface`, `risk-acceptance-role`, `known-gaps`.
  - loop-output-contracts.md entries added for both LEGAL artifacts.
  - No collision with FIN incident artifact paths.
- **Validation contract (VC-04):**
  - VC-04-01: registry rows for both legal artifacts are present and path-unique.
  - VC-04-02: contract text matches the field lists logged in TASK-01 Output 4 gate pass schema; any deviation requires TASK-01 decision log update first.
- **Execution plan:** VC-first Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "artifact-registry|loop-output-contracts|market-pack|logistics-pack" docs/business-os/startup-loop -S`
  - Validation artifacts: canonical path and schema conventions established.
  - Unexpected findings: legal artifacts are absent from current registry; one-per-stage pattern matches existing artifact conventions.
- **Edge Cases & Hardening:** ensure no collision with FIN incident artifacts.
- **What would make this >=90%:** include first lint rule skeleton for legal artifact required keys.
- **Rollout / rollback:**
  - Rollout: add legal artifact rows + references in one commit.
  - Rollback: remove new rows and references.
- **Documentation impact:** artifact and loop-output contract docs updated.
- **Notes / references:** `docs/plans/startup-loop-legal-container-insertion/fact-find.md`

### TASK-05: Update workflow/dictionary/generated stage maps for LEGAL visibility
- **Type:** IMPLEMENT
- **Deliverable:** operator-facing docs and generated maps include LEGAL stages and prompts.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-06, TASK-07
- **Confidence:** 82%
  - Implementation: 85% - update points are explicit.
  - Approach: 82% - generated artifacts require deterministic regen and consistency checks.
  - Impact: 85% - operators need visible stage guidance for adoption.
- **Acceptance:**
  - workflow guide includes LEGAL in canonical stage list and handoff map, with an operator-delta paragraph (see below).
  - stage dictionary has LEGAL-01 and LEGAL-02 labels, purpose descriptions, expected outputs, and next-step prompts.
  - generated map (`stage-operator-map.json`) and table (`stage-operator-table.md`) regenerated in the same commit as dictionary/spec updates, using the confirmed regeneration command. Generated outputs must not be committed separately from their source changes.
  - parity check passes: a script or lint step confirms that the stage IDs in `stage-operator-map.json` match those in `loop-spec.yaml`. This check must run in CI.
- **Operator delta (required content for workflow guide LEGAL section):** The workflow guide LEGAL section must include a short paragraph summarising what changes for an operator in practice: (a) two new stages appear between ASSESSMENT and MEASURE-00; (b) LEGAL-01 expected effort is [TBD by operator; suggest 1–3 working days for trademark scoping]; (c) LEGAL-02 expected effort is [TBD]; (d) escalation path if counsel is needed: [to be defined by operator; a placeholder must exist in the template]; (e) gate behaviour: MEASURE-00 is blocked until both artifacts are present and lint-pass.
- **Validation contract (VC-05):**
  - VC-05-01: LEGAL stages appear in generated map and table with correct IDs.
  - VC-05-02: workflow references align with spec ordering and gate behavior.
  - VC-05-03: parity check script confirms stage-operator-map.json matches loop-spec.yaml stage list; test fails if map is stale.
- **Execution plan:** VC-first Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "canonical stage IDs|stage-operator" docs/business-os/startup-loop* -S`
  - Validation artifacts: existing generated outputs and workflow canonical list confirmed. Regeneration command identified as part of TASK-05 green step (not a scout — confirmation is required acceptance, not optional scouting).
  - Unexpected findings: stale generated outputs can mask missing LEGAL IDs in tests.
- **Edge Cases & Hardening:** ensure no legacy alias regressions.
- **What would make this >=90%:** parity check included in CI (now a first-class acceptance criterion, not a stretch goal).
- **Rollout / rollback:**
  - Rollout: update dictionary/workflow then regenerate artifacts.
  - Rollback: restore prior dictionary and generated outputs.
- **Documentation impact:** operator workflow and generated stage references updated.
- **Notes / references:** `docs/business-os/startup-loop/_generated/stage-operator-map.json`

### TASK-06: Add/adjust startup-loop tests for LEGAL IDs and sequence invariants
- **Type:** IMPLEMENT
- **Deliverable:** startup-loop test suite covers LEGAL stage addressing and ordering invariants.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `scripts/src/startup-loop/__tests__/derive-state.test.ts`, `scripts/src/startup-loop/stage-addressing.ts`
- **Depends on:** TASK-02, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 85% - target test files are known.
  - Approach: 85% - adds deterministic checks on new topology.
  - Impact: 85% - protects against silent stage-map drift.
- **Acceptance:**
  - stage-addressing tests include LEGAL IDs and expected resolution behavior.
  - derive-state tests assert `ASSESSMENT -> LEGAL -> MEASURE` ordering.
  - bypass-prevention test: a test simulates an attempt to advance to MEASURE-00 from a run state where ASSESSMENT is complete but LEGAL artifacts are absent; the test asserts a hard block (gate failure), not a silent pass-through. This is the real gate test — topology ordering alone does not verify enforcement.
  - stale map risk is covered by explicit regen/check step (parity check from TASK-05).
- **Validation contract (TC-06):**
  - TC-06-01: tests pass with LEGAL IDs and fail if LEGAL IDs are removed from map/spec.
  - TC-06-02: tests fail if direct `ASSESSMENT -> MEASURE-00` bypass is reintroduced.
  - TC-06-03: bypass-prevention test fails if GATE-LEGAL-00 does not block MEASURE-00 advancement when LEGAL artifacts are absent.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "resolveById|ASSESSMENT|MEASURE-00" scripts/src/startup-loop/__tests__ -S`
  - Validation artifacts: test seams and existing assertions confirmed.
  - Unexpected findings: generated map dependency means test setup must enforce fresh generation.
- **Scouts:** verify that the bypass-prevention test (TC-06-03) is exercising the same enforcement code path that TASK-01 Output 4 designated; if the designated path differs from the current code path, flag for TASK-01 Decision Log update before merging.
- **Edge Cases & Hardening:** ensure legacy stage aliases still resolve where expected.
- **What would make this >=90%:** add one explicit regression test for gate-edge coherence key.
- **Rollout / rollback:**
  - Rollout: add tests with deterministic fixtures and run targeted suite.
  - Rollback: revert LEGAL-specific test blocks if stage design reverts.
- **Documentation impact:** test policy note for generated map freshness.
- **Notes / references:** `docs/plans/startup-loop-legal-container-insertion/fact-find.md`

### TASK-07: Horizon checkpoint - validate docs/tooling coherence and replan rollout activation
- **Type:** CHECKPOINT
- **Deliverable:** updated rollout recommendation after evidence review via `/lp-do-replan` if needed.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-legal-container-insertion/plan.md`
- **Depends on:** TASK-05, TASK-06
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - checkpoint protocol is standard.
  - Approach: 95% - prevents rolling out LEGAL with inconsistent contracts.
  - Impact: 95% - controls topology change risk.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - docs/spec/tests consistency reviewed and statused.
  - downstream rollout plan updated or replan invoked.
- **Horizon assumptions to validate:**
  - LEGAL stages are visible and executable in operator guidance and tooling.
  - gate semantics are unambiguous after insertion.
- **Rollout no-go conditions (any one of these blocks rollout activation):**
  - Operator-facing workflow docs reference LEGAL stages but stage graph in loop-spec.yaml does not include them, or vice versa.
  - Stage graph includes LEGAL but process registry does not assign LEG process ownership.
  - GATE-LEGAL-00 is defined in the spec but its pass criteria are missing from loop-output-contracts.md or artifact-registry.md.
  - Tests pass but generated stage-operator-map.json parity check fails (stale map).
  - Bypass-prevention test (TC-06-03) is absent or skipped.
  - TASK-01 Decision Log is incomplete (any of the 4 required outputs missing or marked as open question rather than decision).
- **Validation contract:** checkpoint evidence block added to plan with pass/fail on assumptions.
- **Planning validation:** `None: checkpoint task`
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** checkpoint outcome logged in plan decision log.

## Risks & Mitigations
- Ambiguous gate disposition causes broken stage progression.
  - Mitigation: decision-first TASK-01 and explicit gate test coverage in TASK-06.
- `loop-spec.yaml` comment places `GATE-ASSESSMENT-01` at `ASSESSMENT→MEASURE-01` but sequential ordering edge is `[ASSESSMENT, MEASURE-00]` — unresolved ambiguity may cause TASK-02 to insert gate at wrong edge.
  - Mitigation: add explicit gate-edge clarification question to TASK-01 decision record; TASK-02 must not proceed until gate placement is logged.
- LEGAL/FIN overlap creates operational confusion.
  - Mitigation: explicit boundary text in process registry (TASK-03).
- Stage map staleness hides topology regressions.
  - Mitigation: regeneration + tests referencing regenerated outputs (TASK-05/06).

## Migration & Versioning
Inserting mandatory stages between existing stages is a migration hazard for runs already in progress. Chosen strategy: **versioned spec, new-runs-only**. Runs reference the loop-spec version they started on. Runs already past ASSESSMENT and currently at or beyond MEASURE-00 continue under the pre-LEGAL topology. New runs started after rollout are required to pass through LEGAL. No forced migration of in-flight runs.
- **In-flight run handling:** runs at ASSESSMENT or earlier at rollout time will encounter LEGAL on next advancement. These runs need the operator to be notified that two new stages are required before MEASURE-00 can proceed. A changelog entry in `startup-loop-workflow.user.md` covers this.
- **Deadlock prevention:** a run cannot be deadlocked by the insertion because the LEGAL stages are new — there is no prior state that conflicts with them. The only risk is surprise (operator doesn't know why MEASURE-00 is blocked). The operator-delta paragraph in TASK-05 addresses this.
- **Rollback path:** if LEGAL stages are removed after rollout, runs that have completed LEGAL stages retain their artifacts; MEASURE-00 becomes accessible again without rerunning anything. No data loss.

## Observability
- Logging:
  - stage resolution and gate evaluation logs include LEGAL IDs after rollout.
  - GATE-LEGAL-00 emits a structured block event whenever MEASURE-00 advancement is rejected (observable signal required by TASK-01 Output 4).
- Metrics:
  - LEGAL completion rate before MEASURE — numerator: runs that have passed GATE-LEGAL-00; denominator: runs that have reached ASSESSMENT completion; reported per business cycle.
  - Legal-tagged WEBSITE/DO rework events per business cycle — numerator: revision cycles at WEBSITE or DO stages where the cause tag includes `legal` or `claims`; denominator: all WEBSITE/DO revision cycles; baseline must be established in the first two cycles before LEGAL rollout for meaningful comparison.
- Thresholds:
  - LEGAL completion rate <80% after 3 business cycles: investigate operator friction (stage too complex, missing tooling, unclear prompts).
  - Legal-tagged rework rate not declining after 5 business cycles: review whether LEGAL stage outputs are actually being used in WEBSITE/DO execution.
- Alerts/Dashboards:
  - None: initial report-only validation via weekly review artifacts. Alert thresholds above trigger manual investigation, not automated alerts, at this stage.

## Acceptance Criteria (overall)
- [ ] `LEGAL`, `LEGAL-01`, `LEGAL-02` are canonical stages in `loop-spec.yaml` with valid ordering.
- [ ] Hard gate contract prevents MEASURE from bypassing required LEGAL outputs.
- [ ] Process and artifact contracts explicitly define LEGAL ownership and outputs.
- [ ] Workflow/operator dictionary/generated maps include LEGAL stages.
- [ ] Startup-loop tests enforce LEGAL ID and sequence invariants.

## Decision Log
- 2026-02-24: Plan created from legal-container fact-find; default execution mode is `plan-only`.
- 2026-02-24: **TASK-01 Output 3 — Jurisdiction**: Italy (EU). LEGAL-01 trademark research targets Italian IP Office (UIBM) and EU-wide EUIPO trademark registration. Consumer terms and claims defaults follow Italian Consumer Code (D.Lgs. 206/2005) and EU Unfair Commercial Practices Directive. US appendix is explicitly out of scope for initial LEGAL passes. The `jurisdictions` field in `legal-protection.user.md` must be set to `["IT", "EU"]`; gate fails if absent or set to a placeholder.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Per-task headline confidence = min(Implementation, Approach, Impact)
- Task weights and confidence:
  - TASK-01: min(90,85,85)=85 x 1 = 85
  - TASK-02: min(85,80,90)=80 x 3 = 240
  - TASK-03: min(85,85,88)=85 x 2 = 170
  - TASK-04: min(82,82,88)=82 x 2 = 164
  - TASK-05: min(85,82,85)=82 x 2 = 164
  - TASK-06: min(85,85,85)=85 x 2 = 170
  - TASK-07: min(95,95,95)=95 x 1 = 95
- Total weighted score: 1088
- Total weight: 13
- Overall-confidence: 1088 / 13 = 83.69% -> 84%

## Section Omission Rule
- None: all standard plan sections are applicable for this feature.
