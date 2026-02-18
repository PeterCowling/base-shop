---
Type: Plan
Status: Draft
Domain: Business-OS
Workstream: Operations
Created: 2026-02-18
Last-updated: 2026-02-18
Build-Progress: TASK-01 complete; Wave 2 partially eligible (TASK-02 runnable; TASK-00 is DECISION — needs plan/replan resolution)
Feature-Slug: startup-loop-orchestrated-os-comparison-v2
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-sequence, lp-replan, lp-fact-find
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop Orchestrated OS Comparison v2 Plan

## Summary

This plan converts the v2 fact-find into an execution path that standardizes startup-loop workstream naming against the research taxonomy and adds explicit process assignment to canonical workflow phases. The plan is additive-first: it keeps stage IDs and stage ordering stable, introduces taxonomy and assignment contracts, and then layers compatibility-safe documentation and validation changes. High-coupling runtime surfaces (stage labels, addressing, derived-state naming) are treated as controlled interfaces and updated only where needed for compatibility. The result should be a planning/build-ready v2 baseline with unambiguous workstream language and machine-checkable process-to-workflow assignment.

## Goals
- Adopt the research canonical workstream naming as startup-loop standard vocabulary.
- Assign all 28 processes to exactly one canonical workstream and one or more workflow phases.
- Make assignments machine-readable and validation-enforced.
- Keep stage-graph and stage-ID behavior backward compatible.
- Produce a clear checkpoint for deciding whether a later wave should rename stage labels.

## Non-goals
- Changing stage ordering, stage IDs, or gate semantics in `docs/business-os/startup-loop/loop-spec.yaml`.
- Replacing process IDs (`CDI-1`..`DATA-4`) or re-scoping CAP-05/CAP-06 contracts.
- Shipping a full runtime orchestration rewrite in this plan.

## Constraints & Assumptions
- Constraints:
  - Stage addressing (`--stage`, `--stage-alias`, `--stage-label`) must remain valid for existing operators.
  - `weekly-kpcs-decision-prompt.md` remains canonical for S10 decision authority.
  - New business validation contracts must satisfy `docs/business-os/_shared/business-vc-quality-checklist.md`.
- Assumptions:
  - v2 will be delivered in two waves: additive naming/assignment first, optional stage-label rename second.
  - Existing v1 process registry content is substantively correct and can be refactored rather than re-authored.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-orchestrated-os-comparison-v2/fact-find.md`
- Key findings used:
  - Process coverage already exists (all 28 process IDs in `process-registry-v1.md`).
  - Main gap is vocabulary contract consistency and machine-readable assignment.
  - Highest coupling risk is stage-label consumer compatibility.
  - Workstream and workflow must be split into separate contract dimensions.

## Proposed Approach
- Option A: Additive taxonomy + assignment refactor, preserve stage labels in v2 core.
- Option B: Additive taxonomy + assignment + immediate stage label rename in same wave.
- Chosen approach: **Option A** (with explicit checkpoint for Option B).

## Authority & Deprecation Policy (Decision-Backed)
- Finalized in TASK-00 decision artifact before TASK-04 starts.
- Planned policy shape:
  - Process definitions: canonical source in `process-registry-v2.md`.
  - Process assignments: canonical source in `process-assignment-v2.yaml`.
  - `process-registry-v1.md`: deprecated reference with freeze policy (no new semantic edits).
  - Change rule: assignment updates land first in YAML, then reflected in registry prose.

## Plan Gates
- Foundation Gate: **Pass**
  - Fact-find includes required routing fields, delivery-readiness confidence, mixed-track evidence, and test landscape.
- Build Gate: **Fail (expected at planning start)**
  - Blocked by unresolved TASK-00 decision and downstream M-effort tasks below build-confidence threshold.
  - Pass criteria:
    - TASK-00 decision recorded (stage-label scope + registry migration mode).
    - TASK-01 baseline artifact completed.
    - TASK-02 and TASK-03 drafted and reviewer-acknowledged.
    - TASK-05 execution hook defined (`--check`/CI command contract), even if implementation is pending.
- Sequenced: **Yes**
  - Topological dependency graph is explicit in Task Summary + Parallelism Guide.
- Edge-case analysis captured: **Yes**
  - Mitigations scheduled for stage-label compatibility, assignment orphans, terminology drift, and rollout fallback.
- Auto-build eligible: **No**
  - `Auto-Build-Intent` is `plan-only` and Build Gate is not yet satisfied.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-00 | DECISION | Lock v2 scope boundary (stage-label scope + v1/v2 migration mode) | 84% | S | Pending (DECISION — not lp-build executable) | TASK-01 | TASK-04, TASK-06, TASK-07 |
| TASK-01 | INVESTIGATE | Produce canonical vocabulary + assignment baseline artifact (terms, mappings, migration aliases) | 86% | S | Complete (2026-02-18) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Define `workstream-workflow-taxonomy-v2` contract | 82% | S | Pending | TASK-01 | TASK-03, TASK-04, TASK-06 |
| TASK-03 | IMPLEMENT | Create machine-readable process assignment matrix (28 processes) | 82% | S | Pending | TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Refactor process registry to v2 naming/assignment structure | 78% | M | Pending | TASK-00, TASK-03 | TASK-06, TASK-07 |
| TASK-05 | IMPLEMENT | Add assignment validator script/tests for completeness + enum safety | 76% | M | Pending | TASK-03 | TASK-07 |
| TASK-06 | IMPLEMENT | Update dependent contracts, skills, prompt templates, and operator docs to v2 vocabulary | 81% | S | Pending | TASK-04 | TASK-08 |
| TASK-07 | IMPLEMENT | Add regression checks for compatibility (addressing + generator + assignment lint) | 76% | M | Pending | TASK-04, TASK-05 | TASK-08 |
| TASK-08 | CHECKPOINT | Horizon checkpoint for optional stage-label rename wave | 95% | S | Pending | TASK-06, TASK-07 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Baseline evidence package for deterministic naming/assignment |
| 2 | TASK-00, TASK-02 | TASK-01 | Scope/migration decision and taxonomy contract proceed in parallel |
| 3 | TASK-03 | TASK-02 | Assignment matrix becomes single mapping source |
| 4 | TASK-04, TASK-05 | TASK-03 (+ TASK-00 for TASK-04) | Registry refactor and validator can proceed in parallel |
| 5 | TASK-06, TASK-07 | TASK-04 (+ TASK-05 for TASK-07) | Consumer contracts/docs/skills + compatibility tests |
| 6 | TASK-08 | TASK-06, TASK-07 | Checkpoint before any stage-label rename work |

## Tasks

### TASK-00: Lock v2 scope boundary (stage-label scope + v1/v2 migration mode)
- **Type:** DECISION
- **Deliverable:** `docs/plans/startup-loop-orchestrated-os-comparison-v2/decisions/v2-scope-boundary-decision.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/process-registry-v1.md`, `[readonly] docs/plans/startup-loop-orchestrated-os-comparison-v2/fact-find.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-04, TASK-06, TASK-07
- **Confidence:** 84%
  - Implementation: 88% - options and affected surfaces are explicit.
  - Approach: 84% - tradeoff is clear, but needs explicit scope call.
  - Impact: 86% - avoids high-blast-radius naming churn.
- **Options:**
  - Option A: v2 core is additive taxonomy/assignment only; stage labels unchanged.
  - Option B: v2 includes immediate stage label rename and compatibility shim.
- **Recommendation:** Option A
  - Rationale: lower risk and aligns with coupling evidence in fact-find.
- **Decision input needed:**
  - question: Should stage short labels be renamed in this v2 wave?
  - why it matters: controls compatibility risk and task scope.
  - default + risk: default `No`; risk is delaying label-language unification to next wave.
  - question: What is the v1->v2 migration mode (`supersede-now` | `coexist-with-freeze` | `v2-assignments-only`)?
  - why it matters: determines registry authority, edit policy, and change sequencing for TASK-04/TASK-06.
  - default + risk: default `coexist-with-freeze`; risk is temporary duplication overhead.
- **Acceptance:**
  - Decision artifact captures chosen option, rationale, out-of-scope list, and trigger for future rename wave.
  - Decision artifact includes migration-mode consequences matrix with columns:
    - mode,
    - SoT (definitions),
    - SoT (assignments),
    - v1 edit policy,
    - required v1/v2 banners/pointers,
    - allowed PR scope while mode is active.
  - Decision artifact defines transitional canonical process-ID set for TASK-03/TASK-05 validation (default: frozen v1 ID set until v2 registry is approved).
  - Decision artifact includes **Authority & Deprecation Policy**:
    - process definitions source-of-truth,
    - assignment source-of-truth,
    - v1 edit freeze policy,
    - change-order rule (assignment update first, prose update second).
- **Validation contract:**
  - Decision closes only when downstream tasks have unambiguous file scope and no split interpretation.
- **Planning validation:**
  - None: decision task.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:**
  - Adds v2 decision artifact referenced by all downstream tasks.

### TASK-01: Produce canonical vocabulary + assignment baseline artifact
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-orchestrated-os-comparison-v2/artifacts/v2-vocabulary-and-assignment-baseline.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/process-registry-v1.md`, `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 86%
  - Implementation: 88% - evidence sources are local and already indexed.
  - Approach: 86% - output format is deterministic and bounded.
  - Impact: 88% - prevents assignment inconsistency downstream.
- **Questions to answer:**
  - Which current terms are canonical vs legacy aliases (`Domain`, `Workstream`, `Workflow`, `Stage`)?
  - What is the one-to-one mapping between 28 processes and canonical workstream IDs?
  - Which processes need multi-phase workflow assignment and why?
- **Acceptance:**
  - Baseline artifact includes:
    - canonical 7-workstream ID/name set (provisional values allowed),
    - canonical workflow-phase list with order,
    - vocabulary glossary and alias policy (legacy -> canonical mapping table),
    - full 28-row process mapping draft,
    - known ambiguity list (likely contested process mappings),
    - Option B delta appendix (what changes if stage labels are renamed),
    - impacted file list grouped by risk.
- **Validation contract:**
  - Investigation closes only when every process ID has a candidate `workstream_id` and at least one `workflow_phase`.
- **Planning validation:**
  - Checks run: `rg` evidence scans across research/process-registry/stage-dictionary consumers.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:**
  - Adds planning artifact used as source for TASK-02 and TASK-03.
- **Notes / references:**
  - `docs/plans/startup-loop-orchestrated-os-comparison-v2/fact-find.md`
- **Build Evidence (2026-02-18):**
  - Status: Complete
  - Deliverable: `docs/plans/startup-loop-orchestrated-os-comparison-v2/artifacts/v2-vocabulary-and-assignment-baseline.md`
  - Validation closure: 28/28 processes mapped to workstream_id and workflow_phases. 0 contested mappings.
  - Key findings:
    - `Domain` (section heading) confirmed as legacy alias for `Workstream`. `Domain` (frontmatter) is a separate concept — out of scope for this wave.
    - 4 workstream long-form names differ between v1 registry and research canonical (GTM/OPS/CX/FIN/DATA). All are unambiguous corrections.
    - 16/28 processes are multi-phase. 1 exception_only (DATA-3). 15 conditional. 18 always-active.
    - `Decide/Plan` is the most densely loaded phase (12 process touchpoints).
    - `Lane` is unused — no action needed.
  - Option B delta appendix included. Impacted file list by risk group captured.
  - Evidence method: 3 parallel read-only subagents (term audit, process mapping, phase assignment) + synthesized artifact.

### TASK-02: Define workstream/workflow taxonomy contract v2
- **Type:** IMPLEMENT
- **Deliverable:** Business contract doc defining canonical enums, descriptions, and usage rules
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.md` + `docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml`
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** draft may proceed with default-assumption note; final approval requires TASK-00 decision reference in header
- **Measurement-Readiness:** taxonomy adoption tracked via assignment validator pass-rate and no-orphan process count
- **Affects:** `docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.md`, `docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml`, `[readonly] docs/briefs/orchestrated-business-startup-loop-operating-system-research.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-06
- **Confidence:** 82%
  - Implementation: 84% - scope is narrowly defined and doc-first.
  - Approach: 82% - requires precise separation of workstream vs workflow semantics.
  - Impact: 85% - foundational contract for all v2 naming updates.
- **Acceptance:**
  - Defines 7 canonical workstream IDs/names aligned to research.
  - Defines canonical workflow phase set and ordering for weekly cycle.
  - Publishes machine-readable taxonomy artifact (`workstream-workflow-taxonomy-v2.yaml`) as enum source-of-truth for validators.
  - YAML includes:
    - `schema_version`,
    - ordered `workstreams[]` entries (`id`, `name`, `description`),
    - ordered `workflow_phases[]` entries (`id`, `name`, `description`, `order`),
    - activation enum definition (`activation_tokens`).
  - Defines **phase semantics** (what it means for a process to be assigned to one or more phases).
  - Defines phase assignment rules:
    - multi-phase interpretation,
    - ordering expectations,
    - whether `primary_workflow_phase` is required.
  - Defines activation semantics and allowed tokens for assignment rows (`always`, `conditional`, `exception_only`) and required companion fields for conditional cases.
  - Defines alias/deprecation policy for legacy terms (`Domain` etc.).
  - Includes terminology crosswalk section and at least one anti-example per workstream.
  - Includes decision-record pointer to TASK-00 scope/migration decision.
- **Validation contract (VC-02):**
  - VC-02-A: taxonomy completeness -> pass when all 7 workstreams and all workflow phases are defined with ID + name + description.
  - VC-02-B: terminology exclusivity -> pass when contract includes explicit anti-conflation rule (`workstream` != `workflow_phase`) and 2 reviewer sign-offs.
  - VC-02-C: research alignment -> pass when each workstream definition references matching research section in one review cycle.
  - VC-02-D: phase semantics clarity -> pass when two reviewers independently classify 5 sampled processes to phases with <=1 mismatch.
  - VC-02-E: machine-readability -> pass when YAML loads without parse errors and is referenced as enum source by TASK-03/TASK-05 artifacts.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: enumerate term conflicts and ambiguous definitions from v1.
  - Green evidence plan: publish canonical taxonomy with explicit usage rules.
  - Refactor evidence plan: simplify wording where reviewers disagree on interpretation.
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** None: scope is fully bounded by TASK-01 artifact.
- **Edge Cases & Hardening:**
  - Include rule for processes that span multiple workflow phases without changing primary workstream ownership.
- **What would make this >=90%:**
  - One pilot mapping exercise with two independent operators yielding <=1 terminology mismatch.
- **Rollout / rollback:**
  - Rollout: publish contract and reference from process and capability docs.
  - Rollback: mark contract as Draft and revert references to v1 wording.
- **Documentation impact:**
  - Adds canonical vocabulary contract in startup-loop docs.
- **Notes / references:**
  - `docs/business-os/_shared/business-vc-quality-checklist.md`

### TASK-03: Create machine-readable process assignment matrix (28 processes)
- **Type:** IMPLEMENT
- **Deliverable:** Assignment artifact linking process IDs to `workstream_id` and `workflow_phases[]`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/process-assignment-v2.yaml`
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** taxonomy contract cross-reference in header
- **Measurement-Readiness:** assignment completeness metric (`mapped_processes / 28`) tracked at each update
- **Affects:** `docs/business-os/startup-loop/process-assignment-v2.yaml`, `[readonly] docs/business-os/startup-loop/process-registry-v1.md`, `[readonly] docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.md`, `[readonly] docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml`
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 82%
  - Implementation: 84% - all processes already enumerated in v1 registry.
  - Approach: 82% - deterministic mapping once taxonomy is fixed.
  - Impact: 86% - enables validation and consistent downstream documentation.
- **Acceptance:**
  - YAML structure is schema-versioned and normalized:
    - `schema_version`,
    - `taxonomy_ref`,
    - `process_id_source`,
    - ordered `processes[]` list keyed by `process_id`,
    - required fields: `process_id`, `workstream_id`, `workflow_phases`, `activation`,
    - conditional companion field: `activation_condition` (required when `activation` is `conditional` or `exception_only`),
    - optional `notes`.
  - Contains all 28 process IDs with no omissions.
  - Process-ID set source is explicit and stable during migration (frozen v1 set unless TASK-00 decision states otherwise).
  - Each process has exactly one `workstream_id` and at least one `workflow_phase`.
  - `workflow_phases` are unique, canonical-token only, and stored in deterministic order.
  - File is human-reviewable and script-parseable.
- **Validation contract (VC-03):**
  - VC-03-A: coverage -> pass when 28/28 process IDs exist and match the declared transitional canonical process-ID source.
  - VC-03-B: enum validity -> pass when all workstream/phase tokens resolve to `workstream-workflow-taxonomy-v2.yaml` values.
  - VC-03-C: uniqueness -> pass when no process has multiple primary workstreams.
  - VC-03-D: normalization -> pass when process rows and phase lists are deterministically ordered.
  - VC-03-E: activation semantics -> pass when all rows use allowed activation tokens and required `activation_condition` fields are present for non-`always` rows.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: map all process IDs and identify ambiguous phase assignment candidates.
  - Green evidence plan: publish complete YAML with validated enums.
  - Refactor evidence plan: collapse overly broad phase assignments using reviewer feedback.
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** None: assignment semantics resolved by TASK-02 phase-definition rules.
- **Edge Cases & Hardening:**
  - Explicitly document exception-state processes that activate conditionally.
- **What would make this >=90%:**
  - Validator script pass + one successful dry-run review where no manual edits are needed.
- **Rollout / rollback:**
  - Rollout: commit assignment matrix and reference from registry/capability docs.
  - Rollback: revert matrix file and keep registry v1 as authoritative mapping source.
- **Documentation impact:**
  - Adds machine-readable process assignment contract.
- **Notes / references:**
  - `docs/business-os/startup-loop/process-registry-v1.md`

### TASK-04: Refactor process registry to v2 naming/assignment structure
- **Type:** IMPLEMENT
- **Deliverable:** v2 process registry aligned to taxonomy and assignment matrix
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/process-registry-v2.md` (plus compatibility note in v1 registry)
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** linked review note in plan decision log
- **Measurement-Readiness:** time-to-map top 3 weekly priorities to workstreams (minutes, target <=15) and legacy-term incidence in sampled notes over 2 weekly cycles
- **Affects:** `docs/business-os/startup-loop/process-registry-v2.md`, `docs/business-os/startup-loop/process-registry-v1.md`, `[readonly] docs/business-os/startup-loop/process-assignment-v2.yaml`
- **Depends on:** TASK-00, TASK-03
- **Blocks:** TASK-06, TASK-07
- **Confidence:** 78%
  - Implementation: 80% - content is known and migration mode is pre-decided by TASK-00.
  - Approach: 78% - authority/deprecation policy reduces dual-authority risk.
  - Impact: 83% - primary visible output of v2 naming refactor.
- **Acceptance:**
  - Registry sections use canonical `Workstream` naming (not `Domain`).
  - Every process row references assignment matrix fields.
  - Registry includes explicit **Authority & Deprecation Policy** aligned to TASK-00:
    - source-of-truth for process definitions,
    - source-of-truth for assignments,
    - v1 freeze policy,
    - change-order rule for assignment vs prose updates.
  - v1 compatibility note defines authoritative version and migration path.
- **Validation contract (VC-04):**
  - VC-04-A: structural consistency -> pass when each process entry includes `workstream_id` + `workflow_phases` and matches matrix values.
  - VC-04-B: authority clarity -> pass when registry header states stage ordering authority remains `loop-spec.yaml` and S10 DATA-4 non-duplication rule is preserved.
  - VC-04-C: migration safety -> pass when v1 registry points to v2 without conflicting process definitions.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: identify all v1 headings/phrasing that conflict with taxonomy contract.
  - Green evidence plan: produce v2 registry with complete process coverage and compatibility section.
  - Refactor evidence plan: simplify tables/fields for operator readability after reviewer pass.
- **Planning validation (required for M/L):**
  - Checks run: targeted read of v1 registry sections, stage coverage map, and CAP references.
  - Validation artifacts: v2 fact-find + TASK-03 assignment model.
  - Unexpected findings: none.
- **Scouts:** None: migration mode is resolved in TASK-00 before TASK-04 starts.
- **Edge Cases & Hardening:**
  - Prevent duplicate authoritative statements across v1 and v2 docs during transition.
- **What would make this >=80%:**
  - Already met once TASK-00 migration-mode decision is recorded.
- **What would make this >=90%:**
  - One end-to-end reviewer pass with zero authority/conflict comments.
- **Rollout / rollback:**
  - Rollout: publish v2 registry and add migration pointer in v1.
  - Rollback: retain v1 as canonical and archive v2 draft.
- **Documentation impact:**
  - Adds v2 registry and updates v1 compatibility notice.
- **Notes / references:**
  - `docs/business-os/startup-loop/process-registry-v1.md`

### TASK-05: Add assignment validator script/tests for completeness and enum safety
- **Type:** IMPLEMENT
- **Deliverable:** Code validator + tests for process assignment contract integrity
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/validate-process-assignment.ts`, `scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts`, `docs/business-os/startup-loop/process-assignment-v2.yaml`, `[readonly] docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml`
- **Depends on:** TASK-03
- **Blocks:** TASK-07
- **Confidence:** 76%
  - Implementation: 78% - parser/validation pattern already exists in generator tooling.
  - Approach: 76% - execution hook is now an explicit acceptance requirement.
  - Impact: 82% - removes manual validation risk.
- **Acceptance:**
  - Validator fails on missing process IDs, invalid workstream IDs, invalid phase values, and duplicate primary assignments.
  - Validator fails on schema-version mismatch and malformed required fields.
  - Validator loads enum tokens from `workstream-workflow-taxonomy-v2.yaml` (no duplicated hardcoded enum source).
  - Validator enforces activation semantics (`always`, `conditional`, `exception_only`) and required companion `activation_condition` values for non-`always` rows.
  - Validator passes for a complete valid matrix.
  - Deterministic error-ordering is enforced.
  - Execution hook is explicit (`--check` and/or CI command) and documented in plan/README note.
- **Validation contract (TC-05):**
  - TC-05-01: valid matrix input -> exits 0 with success message.
  - TC-05-02: missing process ID -> exits non-zero and reports missing ID list.
  - TC-05-03: unknown workstream/phase token -> exits non-zero with field-level error.
  - TC-05-04: duplicate primary assignment for one process -> exits non-zero.
  - TC-05-05: unsorted phases/process rows -> exits non-zero with normalization guidance.
  - TC-05-06: invalid activation token or missing `activation_condition` for non-`always` row -> exits non-zero with row-level error.
  - TC-05-07: taxonomy enum source mismatch (matrix references token not present in taxonomy YAML) -> exits non-zero and reports taxonomy file path.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing generator/addressing test patterns in `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts` and `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`.
  - Validation artifacts: v2 fact-find test landscape and command list.
  - Unexpected findings: none.
- **Scouts:** None: execution hook is a required acceptance criterion in this task.
- **Edge Cases & Hardening:**
  - Ensure deterministic error ordering to prevent flaky CI output.
- **What would make this >=80%:**
  - Already met once execution hook is encoded in acceptance and command contract.
- **What would make this >=90%:**
  - Run validator against both valid and intentionally broken fixtures in CI.
- **Rollout / rollback:**
  - Rollout: add validator and one command entry for local/CI checks; introduce CI as non-blocking for one cycle, then promote to blocking after stable pass baseline.
  - Rollback: demote CI check to non-blocking and keep validator command available for manual enforcement while issues are remediated.
- **Documentation impact:**
  - Adds validation script docs and test references.
- **Notes / references:**
  - `scripts/src/startup-loop/generate-stage-operator-views.ts`

### TASK-06: Update dependent contracts, skills, prompt templates, and operator docs to v2 vocabulary
- **Type:** IMPLEMENT
- **Deliverable:** Documentation + skill + prompt-template alignment patch for v2 workstream/workflow language
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** updated contracts/docs under `docs/business-os/startup-loop/` + startup-loop skill docs under `.claude/skills/` + workflow prompt templates under `docs/business-os/workflow-prompts/_templates/`
- **Reviewer:** startup-loop maintainers + operator
- **Approval-Evidence:** review acknowledgment in decision log
- **Measurement-Readiness:** time-to-map top 3 weekly priorities to workstreams (minutes, target <=15) + legacy-term incidence count (`Domain` as primary lane label) in sampled S10 notes
- **Affects:** `docs/business-os/startup-loop/marketing-sales-capability-contract.md`, `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/startup-loop/event-state-schema.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`, `.claude/skills/lp-readiness/SKILL.md`, `.claude/skills/lp-offer/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-fact-find/SKILL.md`, `.claude/skills/lp-plan/SKILL.md`, `.claude/skills/lp-build/SKILL.md`, `[readonly] docs/business-os/startup-loop/process-registry-v2.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-08
- **Confidence:** 81%
  - Implementation: 83% - file set is clear and bounded.
  - Approach: 81% - requires strict consistency checks across docs.
  - Impact: 84% - reduces operator-level naming ambiguity.
- **Acceptance:**
  - All touched contracts/docs reference canonical v2 workstream terms.
  - Skill docs and workflow prompt templates that mention loop process/workstream vocabulary are updated to canonical terms.
  - Any legacy term retained is marked as alias/deprecated.
  - No doc or skill guidance claims conflict with stage authority boundaries.
  - `rg` evidence appendix captures before/after counts for key legacy terms across touched files.
  - Evidence appendix records baseline metrics from most recent pre-v2 weekly cycle (N=1 minimum) using same counting protocol as post-update checks.
  - Stage label strings are unchanged unless explicitly authorized by TASK-00 decision.
- **Validation contract (VC-06):**
  - VC-06-01: terminology consistency -> pass when no touched doc uses `Domain` as primary process-lane term without alias note.
  - VC-06-02: authority integrity -> pass when docs still point stage ordering/gates to `loop-spec.yaml`.
  - VC-06-03: operator clarity -> pass when one reviewer can map top 3 weekly priorities to v2 workstream terms in <=15 minutes.
  - VC-06-04: skill/prompt alignment -> pass when all listed startup-loop skills and the weekly KPCs prompt use canonical terms or explicit alias notes.
  - VC-06-05: label stability -> pass when no stage label literal changes are present in this task scope unless TASK-00 explicitly authorizes rename.
  - VC-06-06: baseline comparability -> pass when pre-v2 and post-v2 samples use the same note window and counting rules, with exclusions documented.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: collect all pre-update term usage across target docs.
  - Green evidence plan: apply v2 terms and alias notes consistently.
  - Refactor evidence plan: trim duplicated glossary prose across docs.
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** None: consumers are already listed.
- **Edge Cases & Hardening:**
  - Avoid accidental stage-label changes while updating documentation language.
- **What would make this >=90%:**
  - Two-week reduction in naming confusion tickets/comments to near-zero.
- **Rollout / rollback:**
  - Rollout: update docs and include migration note.
  - Rollback: revert doc patch and keep v2 terms confined to new contracts.
- **Documentation impact:**
  - Updates operator + contract documentation with unified v2 vocabulary.
- **Notes / references:**
  - `docs/plans/startup-loop-orchestrated-os-comparison-v2/fact-find.md`

### TASK-07: Add compatibility regression checks (addressing, generator, assignment)
- **Type:** IMPLEMENT
- **Deliverable:** Test and check updates ensuring v2 does not break existing addressing semantics
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `scripts/src/startup-loop/__tests__/derive-state.test.ts`, `scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** TASK-08
- **Confidence:** 76%
  - Implementation: 78% - existing test suites provide clear extension points.
  - Approach: 76% - explicit legacy fixture and hook criteria reduce ambiguity.
  - Impact: 82% - critical for safe rollout and future CI guardrails.
- **Acceptance:**
  - Existing stage addressing behavior remains unchanged unless explicitly approved.
  - Assignment validator tests pass for valid/invalid fixtures.
  - Generator check still deterministic with no stale artifacts.
  - At least one legacy-addressing fixture (`--stage-alias`/`--stage-label`) is included to prove backward compatibility in CI.
- **Validation contract (TC-07):**
  - TC-07-01: `stage-addressing` tests -> all current ID/alias/label compatibility tests pass.
  - TC-07-02: `generate-stage-operator-views` tests -> deterministic and schema checks pass.
  - TC-07-03: `derive-state` tests -> stage name derivation behavior unchanged.
  - TC-07-04: new assignment validator tests -> pass/fail behavior matches spec.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing test coverage in three startup-loop test suites.
  - Validation artifacts: v2 fact-find test landscape and dependency map.
  - Unexpected findings: none.
- **Scouts:** None: check-command aggregation is resolved by TASK-05 execution hook.
- **Edge Cases & Hardening:**
  - Ensure snapshot/order-sensitive tests are deterministic across environments.
- **What would make this >=80%:**
  - Already met once TASK-05 execution hook is landed and one legacy-addressing fixture is codified in this task.
- **What would make this >=90%:**
  - Stable CI run with repeated pass on check commands across two consecutive runs.
- **Rollout / rollback:**
  - Rollout: include tests in targeted validation flow for changed packages.
  - Rollback: revert new tests/commands and keep manual review gate temporarily.
- **Documentation impact:**
  - Adds validation guidance to plan and possibly testing notes.
- **Notes / references:**
  - `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`

### TASK-08: Horizon checkpoint - reassess downstream rename wave
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-replan` for optional stage-label rename work
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md`
- **Depends on:** TASK-06, TASK-07
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - checkpoint procedure is standard.
  - Approach: 95% - prevents accidental expansion into high-risk rename work.
  - Impact: 95% - controls scope and confidence before next wave.
- **Acceptance:**
  - `/lp-build` checkpoint executor run.
  - `/lp-replan` run for any proposed rename-wave tasks.
  - confidence and dependency graph refreshed from implementation evidence.
  - plan updated and re-sequenced.
  - Rename-wave eligibility criteria evaluated explicitly:
    - validator + regression suite fully passing,
    - operator mapping-time metric improves or remains <=15 minutes,
    - no unresolved stage-label confusion in sampled weekly reviews.
- **Horizon assumptions to validate:**
  - v2 additive contracts reduced naming ambiguity enough to defer label rename.
  - compatibility tests prove no regressions in stage resolution and derived state displays.
- **Validation contract:**
  - Checkpoint is complete only when post-TASK-07 evidence is logged and either:
    - rename wave is explicitly deferred, or
    - rename wave tasks are added with >=80 confidence.
- **Planning validation:**
  - replan evidence path appended to decision log.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:**
  - updates this plan with checkpoint outcomes and next-wave decision.

## Risks & Mitigations
- Stage label compatibility regression.
  - Mitigation: additive-first scope, explicit compatibility tests (TASK-07), checkpoint gate (TASK-08).
- Dual-authority confusion between v1 and v2 process registries.
  - Mitigation: explicit authority statements + migration note in TASK-04.
- Assignment matrix drift from registry prose.
  - Mitigation: validator script + deterministic checks (TASK-05/TASK-07).
- Over-scoping into loop-spec refactor.
  - Mitigation: TASK-00 boundary decision + out-of-scope lock.

## Observability
- Logging:
  - Validator and check commands emit deterministic pass/fail summaries.
- Metrics:
  - Process assignment completeness (28/28).
  - Validator pass rate per run.
  - Time-to-map top 3 weekly priorities to workstreams (minutes, target <=15).
  - Legacy-term incidence in sampled weekly notes (`Domain` used as primary lane term).
- Alerts/Dashboards:
  - None in this wave; surfaced through CI check failures and weekly review notes.

## Acceptance Criteria (overall)
- [ ] Canonical taxonomy contract exists and is referenced by v2 artifacts.
- [ ] 28-process machine-readable assignment matrix exists with schema-versioned, normalized structure and validates cleanly.
- [ ] Process registry v2 uses canonical workstream/workflow language with compatibility-safe migration notes.
- [ ] Authority & deprecation policy (v1/v2 source-of-truth and edit rules) is explicit and referenced by v2 contracts.
- [ ] Dependent contracts/docs/skills/prompt templates are updated to consistent terminology without stage-authority drift.
- [ ] Compatibility/regression checks are in place and passing.
- [ ] Checkpoint decision for optional stage-label rename wave is explicitly recorded.

## Decision Log
- 2026-02-18: Initial v2 execution plan created from `docs/plans/startup-loop-orchestrated-os-comparison-v2/fact-find.md`.
- 2026-02-18: Plan patched from reviewer feedback: dependency unblocking, workflow-phase semantics, source-of-truth/deprecation policy, schema-versioned matrix requirements, and measurable rollout criteria.
- 2026-02-18: Plan patched again for consistency and enforcement: TASK-00/TASK-01 gating alignment, machine-readable taxonomy enum source, explicit transitional process-ID authority, activation field semantics/tests, CI rollout mode, and baseline observability protocol.
- 2026-02-18: TASK-01 complete. Vocabulary/assignment baseline artifact produced at `artifacts/v2-vocabulary-and-assignment-baseline.md`. Wave 2 partially eligible: TASK-02 runnable; TASK-00 is DECISION type (requires plan/replan resolution before TASK-04/TASK-06/TASK-07 can proceed).

## Overall-confidence Calculation
- Effort weights: `S=1`, `M=2`, `L=3`
- Task confidence inputs:
  - TASK-00=84 (S)
  - TASK-01=86 (S)
  - TASK-02=82 (S)
  - TASK-03=82 (S)
  - TASK-04=78 (M)
  - TASK-05=76 (M)
  - TASK-06=81 (S)
  - TASK-07=76 (M)
  - TASK-08=95 (S)
- Weighted sum = `970`
- Weight total = `12`
- Overall-confidence = `970 / 12 = 80.8%` -> **81%**

## What Would Make This >=90%
- Complete TASK-00 and TASK-01 to remove scope ambiguity and establish fixed taxonomy inputs.
- Raise TASK-04/TASK-05/TASK-07 from low/mid-70s by:
  - locking migration mode,
  - implementing validator/check command integration,
  - proving compatibility tests pass on first full run.
- Capture one pilot weekly-cycle evidence sample showing operator clarity improvement after TASK-06.

## Section Omission Rule

If a section becomes not relevant during updates, either omit it or write:
- `None: <reason>`
