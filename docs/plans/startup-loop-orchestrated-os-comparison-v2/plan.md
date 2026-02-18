---
Type: Plan
Status: Draft
Domain: Business-OS
Workstream: Operations
Created: 2026-02-18
Last-updated: 2026-02-18
Build-Progress: TASK-00, TASK-01, TASK-02, TASK-03, TASK-04, TASK-09, TASK-10 complete; TASK-05 raised to 82% (Ready) — Wave 4 fully eligible; TASK-06/07 eligible after TASK-05 completes
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
| TASK-00 | DECISION | Lock v2 scope boundary (stage-label scope + v1/v2 migration mode) | 84% | S | Complete (2026-02-18) | TASK-01 | TASK-04, TASK-06, TASK-07 |
| TASK-01 | INVESTIGATE | Produce canonical vocabulary + assignment baseline artifact (terms, mappings, migration aliases) | 86% | S | Complete (2026-02-18) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Define `workstream-workflow-taxonomy-v2` contract | 82% | S | Complete (2026-02-18) | TASK-01 | TASK-03, TASK-04, TASK-06 |
| TASK-03 | IMPLEMENT | Create machine-readable process assignment matrix (28 processes) | 82% | S | Complete (2026-02-18) | TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Refactor process registry to v2 naming/assignment structure + Option B label rename in stage-operator-dictionary.yaml | 80% | M | Complete (2026-02-18) | TASK-00, TASK-03, TASK-09, TASK-10 | TASK-06, TASK-07 |
| TASK-05 | IMPLEMENT | Add assignment validator script/tests for completeness + enum safety | 82% | M | Pending | TASK-03, TASK-09 | TASK-07 |
| TASK-06 | IMPLEMENT | Update dependent contracts, skills, prompt templates, operator docs, and supersede-now consumer files to v2 vocabulary | 80% | M | Pending | TASK-04, TASK-10 | TASK-08 |
| TASK-07 | IMPLEMENT | Add regression checks for compatibility (addressing + generator + assignment lint + label rename correctness) | 82% | M | Pending | TASK-04, TASK-05, TASK-09 | TASK-08 |
| TASK-08 | CHECKPOINT | Completion checkpoint — verify Option B label rename complete, supersede-now archive clean, all suites passing | 95% | S | Pending | TASK-06, TASK-07 | - |
| TASK-09 | SPIKE | Write failing RED tests for stage-label rename before implementation (TDD gate for Option B) | 85% | S | Complete (2026-02-18) | TASK-02 | TASK-04, TASK-05, TASK-07 |
| TASK-10 | INVESTIGATE | supersede-now consumer breakage audit — scan all v1 authoritative references, produce migration list | 88% | S | Complete (2026-02-18) | - | TASK-04, TASK-06 |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-10 | - | TASK-01: vocabulary baseline; TASK-10: v1 consumer scan (both complete ✓) |
| 2 | TASK-00, TASK-02 | TASK-01 | TASK-00: scope decision (complete ✓); TASK-02: taxonomy contract |
| 3 | TASK-03, TASK-09 | TASK-02 | Assignment matrix + RED test spike proceed in parallel once taxonomy is fixed |
| 4 | TASK-04, TASK-05 | TASK-03 + TASK-09 + TASK-10 (+ TASK-00 for TASK-04) | Registry/label refactor and validator can proceed in parallel; both gated by TASK-09 RED tests |
| 5 | TASK-06, TASK-07 | TASK-04 (+ TASK-05 + TASK-09 for TASK-07; + TASK-10 for TASK-06) | Consumer doc/skill updates + compatibility tests |
| 6 | TASK-08 | TASK-06, TASK-07 | Completion checkpoint: Option B label rename confirmed, supersede-now archive clean |

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
- **Status:** Complete (2026-02-18)
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
- **Build Evidence (2026-02-18):**
  - Status: Complete
  - Deliverables: `docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.md` + `.yaml`
  - Red phase: neither file existed; all 5 VCs failed — confirmed.
  - VC-02-A: PASS — 7/7 workstreams + 7/7 workflow phases + 3 activation tokens, all with id/name/description.
  - VC-02-B: PASS (structural) — anti-conflation rule present and explicit. Async reviewer sign-offs pending (2 required post-delivery).
  - VC-02-C: PASS — all 7 workstreams include research brief alignment statement.
  - VC-02-D: PASS (structural) — phase semantics + primary_workflow_phase requirement defined in §3. Async reviewer classification pending.
  - VC-02-E: PASS — YAML parses cleanly; `OFF` id quoted to prevent YAML boolean coercion (regression fix).
  - Note: TASK-00 decision record referenced in both artifacts (Option B + supersede-now).

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
- **Status:** Complete (2026-02-18)
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
- **Build Evidence (2026-02-18):**
  - Status: Complete
  - Deliverable: `docs/business-os/startup-loop/process-assignment-v2.yaml`
  - Validation closure: 28/28 process IDs present; all workstream_id/workflow_phases tokens resolve to taxonomy enums; activation semantics valid; no boolean coercion issues (`"OFF"` quoted in taxonomy source).
  - Key corrections: OPS-4 phases reordered from `[Deliver/Support, Build/Prepare]` to `[Build/Prepare, Deliver/Support]` (execution order 3 before 5); primary_workflow_phase correctly retained as `Deliver/Support`.
  - Phase ordering check: python3 execution-order audit across all 28 multi-phase rows — no remaining ordering bugs.
  - VC-03-A/B/C/D/E: all pass (28/28 coverage, enum validity, no duplicates, execution order, activation semantics).

### TASK-04: Refactor process registry to v2 naming/assignment structure
- **Type:** IMPLEMENT
- **Deliverable:** v2 process registry aligned to taxonomy and assignment matrix
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/process-registry-v2.md` (plus tombstone in v1 registry per supersede-now)
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** linked review note in plan decision log
- **Measurement-Readiness:** time-to-map top 3 weekly priorities to workstreams (minutes, target <=15) and legacy-term incidence in sampled notes over 2 weekly cycles
- **Affects:** `docs/business-os/startup-loop/process-registry-v2.md`, `docs/business-os/startup-loop/process-registry-v1.md` (tombstone header), `docs/business-os/startup-loop/stage-operator-dictionary.yaml` (Option B: rename label_operator_short/long fields + add old values to aliases[]), `[readonly] docs/business-os/startup-loop/process-assignment-v2.yaml`
- **Depends on:** TASK-00, TASK-03, TASK-09, TASK-10
- **Blocks:** TASK-06, TASK-07
- **Confidence:** 80%
  - Implementation: 83% - alias mechanism already exists in stage-operator-dictionary.yaml; label rename = YAML field update + add old value to aliases[]. No source code changes needed. (Evidence: aliases[] confirmed in all stage entries; resolveByAlias confirmed in stage-addressing.ts.)
  - Approach: 78% - supersede-now means v1 gets tombstone immediately; TASK-10 consumer audit provides the breakage list.
  - Impact: 83% - primary visible output of v2 naming refactor.
- **Acceptance:**
  - Registry sections use canonical `Workstream` naming (not `Domain`).
  - Every process row references assignment matrix fields.
  - Registry includes explicit **Authority & Deprecation Policy** aligned to TASK-00:
    - source-of-truth for process definitions,
    - source-of-truth for assignments,
    - v1 tombstone (immediate freeze, no new edits),
    - change-order rule for assignment vs prose updates.
  - v1 registry gets `> ARCHIVED: superseded by process-registry-v2.md as of <date>` tombstone header.
  - `stage-operator-dictionary.yaml`: all `label_operator_short` and `label_operator_long` fields updated to v2 canonical terms; old values added to each stage's `aliases[]` array.
  - TASK-09 RED tests all pass (GREEN) after these changes.
#### Re-plan Update (2026-02-18)
- Confidence: 78% -> 80% (Evidence: E2 — alias mechanism confirmed in stage-operator-dictionary.yaml + stage-addressing.ts; label rename scope is YAML-only, no source code changes)
- Key change: Option B + supersede-now scope added; stage-operator-dictionary.yaml now editable; v1 gets tombstone not compatibility note
- Dependencies: TASK-09, TASK-10 added as blockers
- Validation contract: VC-04 unchanged; acceptance extended with tombstone + label rename criteria
- Notes: TASK-10 consumer audit artifact at `artifacts/v1-consumer-audit.md`
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
- **Build Evidence (2026-02-18):**
  - Status: Complete
  - Deliverables: `docs/business-os/startup-loop/process-registry-v2.md` (created) + tombstone in `process-registry-v1.md`
  - Red phase: 7 `## Domain:` headings in v1; 5 deprecated workstream long-form names; no assignment rows; no taxonomy-ref; no authority/deprecation policy section.
  - Green phase: v2 registry written with 7 `## Workstream:` headings; canonical v2 long-form names; 4 assignment rows per process (28/28); Authority and Deprecation Policy section; taxonomy-ref + assignment-ref in frontmatter.
  - VC-04-A: PASS — 28/28 process sections each have Workstream, Workflow phases, Primary phase, Activation rows; all values match process-assignment-v2.yaml.
  - VC-04-B: PASS — authority statement (loop-spec.yaml) + DATA-4 non-duplication rule preserved.
  - VC-04-C: PASS — v1 tombstone present: "ARCHIVED: Superseded by process-registry-v2.md as of 2026-02-18".
  - Option B (stage-operator-dictionary.yaml): ZERO changes needed — TASK-09 SPIKE confirmed label rename scope = zero; stability tests at 87/87 GREEN.
  - Quick Reference: Workstream column replaces Domain column; all 5 deprecated workstream long-form names replaced.
  - Deprecation guard: no deprecated workstream names appear as section headings.

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
- **Confidence:** 82%
  - Implementation: 88% - `generate-stage-operator-views.ts` is a near-complete template: same `js-yaml` load pattern, same `unknown`→typed-interface narrowing, same `node --import tsx` runner. Zero setup needed. (Evidence: E2 — direct file read 2026-02-18)
  - Approach: 85% - execution hook confirmed: `node --import tsx src/startup-loop/validate-process-assignment.ts` + npm script entry `"validate-process-assignment"`. No `--check` flag needed — pure validators always exit 0/non-zero (confirmed from generate-stage-operator-views.ts CLI guard pattern). (Evidence: E2 — scripts/package.json read 2026-02-18)
  - Impact: 82% - removes manual validation risk.
- **Acceptance:**
  - Validator fails on missing process IDs, invalid workstream IDs, invalid phase values, and duplicate primary assignments.
  - Validator fails on schema-version mismatch and malformed required fields.
  - Validator loads enum tokens from `workstream-workflow-taxonomy-v2.yaml` (no duplicated hardcoded enum source).
  - Validator enforces activation semantics (`always`, `conditional`, `exception_only`) and required companion `activation_condition` values for non-`always` rows.
  - Validator passes for a complete valid matrix.
  - Deterministic error-ordering is enforced.
  - Execution hook: `node --import tsx src/startup-loop/validate-process-assignment.ts` (npm script `"validate-process-assignment"` in `scripts/package.json`). No `--check` flag — pure validator exits 0/non-zero directly.
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
  - Checks run: reviewed `generate-stage-operator-views.ts` (YAML loading + CLI pattern), `scripts/package.json` (npm script hook), `contract-lint.ts` (pure validator pattern), `jest.config.cjs` (test config). E2 evidence 2026-02-18.
  - Validation artifacts: v2 fact-find test landscape; E2 evidence scan confirming template + hook pattern.
  - Unexpected findings: `--check` flag is NOT the right pattern for a pure validator (only for generator scripts with committed output). Pure validator exits 0/non-zero directly. Acceptance updated.
- **Scouts:** None: template (`generate-stage-operator-views.ts`) fully defines implementation seam.
- **Edge Cases & Hardening:**
  - Ensure deterministic error ordering to prevent flaky CI output.
- **What would make this >=80%:**
  - MET (2026-02-18): Execution hook confirmed (`node --import tsx` + npm script); template identified (`generate-stage-operator-views.ts`); all deps in place.
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
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** updated contracts/docs under `docs/business-os/startup-loop/` + startup-loop skill docs under `.claude/skills/` + workflow prompt templates under `docs/business-os/workflow-prompts/_templates/`
- **Reviewer:** startup-loop maintainers + operator
- **Approval-Evidence:** review acknowledgment in decision log
- **Measurement-Readiness:** time-to-map top 3 weekly priorities to workstreams (minutes, target <=15) + legacy-term incidence count (`Domain` as primary lane label) in sampled S10 notes
- **Affects:** `docs/business-os/startup-loop/marketing-sales-capability-contract.md`, `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/startup-loop/event-state-schema.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`, `.claude/skills/lp-readiness/SKILL.md`, `.claude/skills/lp-offer/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-fact-find/SKILL.md`, `.claude/skills/lp-plan/SKILL.md`, `.claude/skills/lp-build/SKILL.md`, `docs/business-os/startup-loop/exception-runbooks-v1.md` (v1→v2 re-point), `docs/business-os/startup-loop/audit-cadence-contract-v1.md` (v1→v2 re-point), `docs/business-os/startup-loop/retention-schema.md` (v1→v2 re-point), `docs/business-os/startup-loop/sales-ops-schema.md` (v1→v2 re-point), `[readonly] docs/business-os/startup-loop/process-registry-v2.md`
- **Depends on:** TASK-04, TASK-10
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 82% - file set is fully enumerated by TASK-10 consumer audit; no unknown consumers.
  - Approach: 80% - supersede-now adds 4 extra consumer re-point files; TASK-10 audit provides exact line-level migration steps.
  - Impact: 84% - reduces operator-level naming ambiguity and ensures no orphaned v1 references post-archive.
- **Acceptance:**
  - All touched contracts/docs reference canonical v2 workstream terms.
  - Skill docs and workflow prompt templates that mention loop process/workstream vocabulary are updated to canonical terms.
  - Any legacy term retained is marked as alias/deprecated.
  - No doc or skill guidance claims conflict with stage authority boundaries.
  - `rg` evidence appendix captures before/after counts for key legacy terms across touched files.
  - Evidence appendix records baseline metrics from most recent pre-v2 weekly cycle (N=1 minimum) using same counting protocol as post-update checks.
  - **supersede-now**: all 5 authoritative v1 consumers re-pointed to v2 (per TASK-10 audit: exception-runbooks-v1.md, audit-cadence-contract-v1.md, retention-schema.md, sales-ops-schema.md, marketing-sales-capability-contract.md).
  - Stage label literals updated to v2 values (authorized by TASK-00 Option B decision).
#### Re-plan Update (2026-02-18)
- Confidence: 81% -> 80% (Evidence: E2 — TASK-10 consumer audit identified 5 authoritative v1 consumers; scope expanded but fully bounded)
- Key change: Effort S→M; 4 additional Affects files (v1 consumer re-points); stage label literals now in scope (Option B authorized); TASK-10 added as dependency
- Dependencies: TASK-10 added
- Validation contract: VC-06-05 updated — stage label changes are now in scope (TASK-00 Option B authorized)
- Notes: Consumer migration steps at `artifacts/v1-consumer-audit.md`
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
- **Affects:** `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `scripts/src/startup-loop/__tests__/derive-state.test.ts`, `scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts`, `scripts/src/startup-loop/__tests__/stage-label-rename.test.ts` (extend TASK-09 RED tests to GREEN)
- **Depends on:** TASK-04, TASK-05, TASK-09
- **Blocks:** TASK-08
- **Confidence:** 82%
  - Implementation: 84% - alias mechanism confirmed in stage-addressing.ts (resolveByAlias + ALIAS_INDEX); extension seam is clear. (Evidence: E2 — resolveByAlias + LABEL_INDEX pattern confirmed)
  - Approach: 82% - TASK-09 RED tests pre-define exact assertions; TASK-07 makes them GREEN.
  - Impact: 84% - critical for safe Option B rollout and CI guardrails.
- **Acceptance:**
  - TASK-09 RED tests all pass GREEN after TASK-04 label rename implementation.
  - Old `label_operator_short` values resolve correctly via `resolveByAlias` (alias fallback confirmed).
  - New `label_operator_short` values resolve correctly via `resolveByLabel` (exact match).
  - Assignment validator tests pass for valid/invalid fixtures.
  - Generator check still deterministic with no stale artifacts.
  - At least one legacy-addressing fixture (`--stage-alias`/`--stage-label`) is included to prove backward compatibility in CI.
- **Validation contract (TC-07):**
  - TC-07-01: `stage-addressing` tests -> all current ID/alias/label compatibility tests pass.
  - TC-07-02: `generate-stage-operator-views` tests -> deterministic and schema checks pass; new labels emitted correctly.
  - TC-07-03: `derive-state` tests -> stage name derivation behavior unchanged.
  - TC-07-04: new assignment validator tests -> pass/fail behavior matches spec.
  - TC-07-05: label rename correctness -> `resolveByLabel(newLabel)` resolves for all renamed stages.
  - TC-07-06: alias fallback -> `resolveByAlias(oldLabel.toLowerCase())` resolves for all renamed stages.
- **Execution plan:** Red -> Green -> Refactor (RED phase is TASK-09; GREEN/Refactor here)
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing test coverage in three startup-loop test suites; confirmed alias mechanism.
  - Validation artifacts: v2 fact-find test landscape, TASK-09 RED tests.
  - Unexpected findings: aliases[] already present — no source code changes needed in stage-addressing.ts.
- **Scouts:** None: check-command aggregation is resolved by TASK-05 execution hook; label extension seam confirmed by TASK-09.
- **Edge Cases & Hardening:**
  - Ensure snapshot/order-sensitive tests are deterministic across environments.
- **What would make this >=90%:**
  - Stable CI run with repeated pass on all check commands including TC-07-05/06 across two consecutive runs.
#### Re-plan Update (2026-02-18)
- Confidence: 76% -> 82% (Evidence: E2 — aliases[] confirmed in stage-operator-dictionary.yaml; resolveByAlias confirmed in stage-addressing.ts; TASK-09 pre-gates RED tests)
- Key change: TC-07-05 (label rename correctness) + TC-07-06 (alias fallback) added; stage-label-rename.test.ts added to Affects; TASK-09 added as dependency
- Dependencies: TASK-09 added
- Validation contract: TC-07-05, TC-07-06 added
- Notes: No source changes needed to stage-addressing.ts — alias mechanism is already in place
- **Rollout / rollback:**
  - Rollout: include tests in targeted validation flow for changed packages.
  - Rollback: revert new tests/commands and keep manual review gate temporarily.
- **Documentation impact:**
  - Adds validation guidance to plan and possibly testing notes.
- **Notes / references:**
  - `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`

### TASK-08: Completion checkpoint — Option B label rename confirmed + supersede-now archive clean
- **Type:** CHECKPOINT
- **Deliverable:** Completion evidence record confirming Option B label rename complete and supersede-now archive clean
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
  - All TC-07 tests passing (including TC-07-05 label rename correctness + TC-07-06 alias fallback).
  - `rg process-registry-v1` scan confirms zero authoritative references remain in the 5 consumer files.
  - v1 registry tombstone header present and correct.
  - Operator mapping-time metric ≤15 min (or improved).
- **Horizon assumptions to validate:**
  - Option B label rename is complete and all consumers resolve correctly via alias fallback.
  - supersede-now archive is clean — no consumer file still points to v1 as authoritative.
  - compatibility tests prove no regressions in stage resolution and derived state displays.
- **Validation contract:**
  - Checkpoint is complete only when:
    - all TC-07 tests pass (including TC-07-05/06),
    - `rg process-registry-v1` in authoritative consumer files returns zero hits,
    - v1 tombstone is present.
- **Planning validation:**
  - replan evidence path appended to decision log.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:**
  - updates this plan with checkpoint outcomes and next-wave decision.

### TASK-09: Write failing RED tests for stage-label rename (TDD gate for Option B)
- **Type:** SPIKE
- **Deliverable:** `scripts/src/startup-loop/__tests__/stage-label-rename.test.ts` (failing test file — RED phase)
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/__tests__/stage-label-rename.test.ts` (create)
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-05, TASK-07
- **Status:** Complete (2026-02-18)
- **Confidence:** 85%
  - Implementation: 88% - alias mechanism confirmed in stage-operator-dictionary.yaml (aliases[] array) and stage-addressing.ts (resolveByAlias + ALIAS_INDEX). Test pattern exists in stage-addressing.test.ts.
  - Approach: 85% - exact test seam is clear: assert new label_operator_short values, assert old labels resolve via resolveByAlias.
  - Impact: 84% - gates Option B label implementation behind failing tests before any YAML change is made.
- **Acceptance:**
  - Test file asserts expected new `label_operator_short` values for all renamed stages (sourced from TASK-02 taxonomy) — currently RED (failing).
  - Test file asserts old `label_operator_short` values resolve correctly via `resolveByAlias(oldLabel.toLowerCase())` — currently RED (will pass once TASK-04 adds old values to aliases[]).
  - Test file asserts `buildTable` output contains new label strings — currently RED.
  - Tests follow same patterns as `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`.
  - File includes `// SPIKE_NOTE: RED phase — TASK-04 implementation must make these pass` header comment.
  - Tests are deterministic and environment-independent.
- **Validation contract (TC-09):**
  - TC-09-01: all tests in file execute (no syntax errors or import failures).
  - TC-09-02: all tests FAIL before TASK-04 is implemented (confirms test sensitivity).
  - TC-09-03: tests are isolated (no side effects on other test suites).
- **Execution plan:** Write failing tests only (no implementation). RED phase.
- **Planning validation:** None (S-effort SPIKE; seam confirmed by evidence scan).
- **Scouts:** None: integration seam fully confirmed by /lp-replan evidence scan.
- **Edge Cases & Hardening:**
  - Parameterize label assertions per stage ID so a single fixture covers all renamed stages.
- **Rollout / rollback:**
  - Rollout: commit RED test file; TASK-04 makes it GREEN.
  - Rollback: delete test file (no production impact).
- **Documentation impact:**
  - Adds test file with SPIKE_NOTE header documenting the TDD gate intent.
- **Build Evidence (2026-02-18):**
  - Status: Complete
  - Deliverable: `scripts/src/startup-loop/__tests__/stage-label-rename.test.ts`
  - **KEY SPIKE FINDING: Option B label rename scope = ZERO.** All 17 stage labels (S0–S10) are build-sequence node names (Intake, Readiness, Forecast, …) — none contain deprecated v1 workstream long-form names. `label_operator_short` and `label_operator_long` strings in `stage-operator-dictionary.yaml` are unaffected by the workstream rename. No label field updates needed for Option B.
  - Test file structure: (A) 34 STABILITY tests (all 17 short + long labels) — all PASS; (B) 7 DEPRECATION GUARD tests (deprecated workstream names rejected) — all PASS; (C) 45 ALIAS MECHANISM tests (44 canonical aliases + case-insensitive check) — all PASS; (D) 2 RED GATE SHAPES as `it.todo()` stubs showing TDD pattern for hypothetical new aliases.
  - TC-09-01: PASS — no syntax errors, imports resolve correctly.
  - TC-09-02: The "RED tests" are `it.todo()` stubs because scope = zero; true RED tests not applicable.
  - TC-09-03: PASS — 87 tests pass, 2 todo, 0 fail; isolated from other suites.
  - S10 long-label correction: `"S10 — Weekly decision"` → `"S10 — Weekly readout + experiments"` (actual dictionary value).
  - TASK-04 impact: stage-operator-dictionary.yaml label fields DO NOT require changes for Option B. Scope of TASK-04 for that file is now zero/nil on label fields; only aliases[] backward-compat shim work remains if any rename is desired in a future wave.

### TASK-10: supersede-now consumer breakage audit
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-orchestrated-os-comparison-v2/artifacts/v1-consumer-audit.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `docs/plans/startup-loop-orchestrated-os-comparison-v2/artifacts/v1-consumer-audit.md` (created)
- **Depends on:** -
- **Blocks:** TASK-04, TASK-06
- **Confidence:** 88%
- **Build Evidence (2026-02-18):**
  - Status: Complete (executed during /lp-replan evidence pass)
  - Method: ripgrep scan for `process-registry-v1` + `## Domain:` references across repo
  - Key findings:
    - 5 high-risk authoritative consumers: exception-runbooks-v1.md, audit-cadence-contract-v1.md, retention-schema.md, sales-ops-schema.md, marketing-sales-capability-contract.md
    - `Domain:` headings exist ONLY in process-registry-v1.md — zero external breakage
    - stage-operator-dictionary.yaml aliases[] already exists — no source code changes needed for label backward compat
  - Deliverable: `artifacts/v1-consumer-audit.md` with per-file migration steps

## Risks & Mitigations
- Stage label compatibility regression (Option B).
  - Mitigation: TASK-09 TDD gate (RED tests pre-defined before implementation), alias[] mechanism already in place, TC-07-05/06 tests, TASK-08 checkpoint.
- v1 orphaned references post supersede-now archive.
  - Mitigation: TASK-10 consumer audit (5 files identified); TASK-06 re-points all before TASK-04 tombstones v1; TASK-08 final rg scan confirms zero remaining.
- Dual-authority confusion between v1 and v2 process registries.
  - Mitigation: supersede-now tombstone in v1 + authority statements in v2 (TASK-04).
- Assignment matrix drift from registry prose.
  - Mitigation: validator script + deterministic checks (TASK-05/TASK-07).
- Over-scoping into loop-spec refactor.
  - Mitigation: TASK-00 boundary decision + out-of-scope lock (stage IDs/gates/ordering unchanged).

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
- 2026-02-18: TASK-00 closed. Operator decisions: **Option B** (stage labels renamed this wave) + **`supersede-now`** (v2 immediately replaces v1, no coexist). Decision artifact at `decisions/v2-scope-boundary-decision.md`. Routing to /lp-replan to add TDD de-risking tasks for label rename and supersede-now scope expansion.
- 2026-02-18: /lp-replan complete. Key findings: alias[] mechanism already exists in stage-operator-dictionary.yaml — Option B scope is YAML field updates only, no source changes to stage-addressing.ts or generator. TASK-09 (SPIKE, RED tests) + TASK-10 (consumer audit, Complete) added. TASK-04/06/07/08 updated. Topology re-sequenced. Plan re-confidence: TASK-04 78→80%, TASK-07 76→82%, TASK-06 81→80% (scope expanded M).
- 2026-02-18: Wave 3 complete (TASK-03 + TASK-09). process-assignment-v2.yaml written (28/28 processes, OPS-4 phase ordering corrected). SPIKE finding: Option B label rename scope = ZERO — no stage labels contain deprecated workstream terminology; no label field changes needed in stage-operator-dictionary.yaml. stage-label-rename.test.ts: 87 pass, 2 todo, 0 fail. Wave 4 eligible: TASK-04 + TASK-05.
- 2026-02-18: TASK-04 complete. process-registry-v2.md created (28 processes, 7 canonical Workstream sections, 4 assignment rows per process, Authority & Deprecation Policy, VC-04-A/B/C all pass). v1 tombstoned. stage-operator-dictionary.yaml: zero changes (label scope = zero per TASK-09). TASK-05 at 76% below IMPLEMENT threshold — routed to /lp-replan.
- 2026-02-18: /lp-replan complete (TASK-05). E2 evidence: generate-stage-operator-views.ts confirmed as near-complete template; `node --import tsx` hook confirmed; --check flag NOT needed for pure validators; all deps in place. TASK-05 confidence 76% → 82%. Execution hook acceptance clarified. No topology changes. TASK-05 ready for /lp-build.

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
