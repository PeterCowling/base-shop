---
Type: Plan
Status: Active
Domain: BOS / Startup Loop
Workstream: Operations
Created: 2026-02-22
Last-reviewed: 2026-02-22
Last-updated: 2026-02-22
Relates-to charter: none
Feature-Slug: startup-loop-ideas-pipeline-redesign
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average S=1 M=2 L=3
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop IDEAS Pipeline Redesign Plan

## Summary

Redesigns the IDEAS container from a broken, manually-operated sequential placeholder into a
diff-scan-driven standing pipeline. The current design has three structural defects: IDEAS is
absent from `ordering.sequential` (never wired in), all stages are `skill: prompt-handoff`
(manual), and the operator prompt contradicts the handoff contract ("proceed to MEASURE-01"
vs. correct "feed DO via fact-find"). The redesign changes the container `type` to
`standing_pipeline`, adds explicit trigger conditions (Layer A pack diff + operator injection),
redesigns IDEAS-01..03 around the `/idea-scan` skill (automated diff scan outputting
`scan-proposals.md`), and updates all downstream artifacts: spec, dict, schema docs, TypeScript
bottleneck detector, HTML process map, and skill descriptions. Stage IDs are unchanged.

## Active Tasks

- [x] TASK-INV-01: Investigate idea-scan/SKILL.md scope (Complete 2026-02-22)
- [x] TASK-01: Update loop-spec.yaml to v3.9.4 (Complete 2026-02-22)
- [x] TASK-02: Update stage-operator-dictionary.yaml (Complete 2026-02-22)
- [x] TASK-03: Update idea-backlog.schema.md (Complete 2026-02-22)
- [x] TASK-04: Create scan-proposals.schema.md (Complete 2026-02-22)
- [x] TASK-05: Remove IDEAS from UPSTREAM_PRIORITY_ORDER (bottleneck-detector.ts) (Complete 2026-02-22)
- [ ] TASK-06: Update HTML process map
- [ ] TASK-07: Update startup-loop/SKILL.md + rewrite idea-scan/SKILL.md

## Goals

- Redefine IDEAS as `type: standing_pipeline` — continuous and event-driven, not sequential
- Two explicit trigger paths: (1) Layer A pack diff event, (2) operator/agent direct injection
- IDEAS-01 → automated diff scan (`/idea-scan`); output: `scan-proposals.md`
- Scan resolves each diff chunk against existing idea backlog using 6 impact categories:
  `CREATE | STRENGTHEN | WEAKEN | INVALIDATE | MERGE | SPLIT`
- IDEAS-02 → semi-automated backlog update (agent applies proposals; operator confirms MERGE/SPLIT)
- IDEAS-03 → promote-to-DO gate (unchanged in function)
- Remove IDEAS from `ordering.sequential`; remove IDEAS from `UPSTREAM_PRIORITY_ORDER`
- Update all downstream consumers: dict, schema docs, TS code, HTML, SKILL.md files

## Non-goals

- Implementing the automated diff trigger as a cron/CI job (infrastructure; spec-level only)
- Changing IDEAS stage IDs (IDEAS, IDEAS-01..03 stay canonical for backward compat)
- Changing the handoff-to-fact-find contract (IDEAS-03 → DO already correct)
- Building the actual `/idea-scan` diff-scan implementation (follow-on; TASK-07 scopes the SKILL.md contract only)

## Constraints & Assumptions

- Constraints:
  - Stage IDs must not change (existing manifests with `current_stage: IDEAS-01` remain valid)
  - TASK-01 and TASK-02 must be committed in the same git operation to avoid a broken window
    where the spec says "standing pipeline" but the dict still says "proceed to MEASURE-01"
  - Stage count test (`s10-weekly-routing.test.ts`, expects 66) must continue to pass — IDs unchanged
- Assumptions:
  - No runtime code parses the container `type` field (verified: stage-addressing.ts, loop.ts,
    generate-stage-operator-views.ts, bottleneck-detector.ts — all confirmed this session)
  - `STARTUP_LOOP_STAGES` in `loop.ts` (lines 49-52) is a validation whitelist only; position
    is irrelevant; no change needed
  - Removing IDEAS from `UPSTREAM_PRIORITY_ORDER` is the only required TS change

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-ideas-pipeline-redesign/fact-find.md`
- Key findings used:
  - IDEAS is absent from `ordering.sequential` (chain goes `[ASSESSMENT, MEASURE-01]` directly)
  - `UPSTREAM_PRIORITY_ORDER` in `bottleneck-detector.ts` line 89 includes IDEAS in sequential position → false bottleneck signals
  - `loop_spec_version` in `stage-operator-dictionary.yaml` is stale at 3.9.0 (needs 3.9.4)
  - Operator prompt for IDEAS says "proceed to MEASURE-01" — contradicts handoff-to-fact-find.md
  - `idea-scan/SKILL.md` uses git-based change detection + `last-scan.json` — incompatible with new IDEAS-01 diff-scan contract; substantial rewrite needed

## Proposed Approach

- Option A: Move IDEAS to a new `standing_pipelines:` top-level section in loop-spec.yaml
- Option B: Keep IDEAS in `stages:` list with `type: standing_pipeline` (new type value)
- Chosen approach: **Option B** — additive change, no structural impact on stage-addressing or generated views; `type` field not parsed by any runtime code

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode)

---

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-INV-01 | INVESTIGATE | Audit idea-scan/SKILL.md scope for TASK-04/07 | 85% | S | Complete (2026-02-22) | — | TASK-04, TASK-07 |
| TASK-01 | IMPLEMENT | Update loop-spec.yaml to v3.9.4 | 85% | M | Complete (2026-02-22) | — | TASK-02 |
| TASK-02 | IMPLEMENT | Update stage-operator-dictionary.yaml | 85% | M | Complete (2026-02-22) | TASK-01 | — |
| TASK-03 | IMPLEMENT | Update idea-backlog.schema.md | 85% | S | Complete (2026-02-22) | — | — |
| TASK-04 | IMPLEMENT | Create scan-proposals.schema.md | 82% | M | Complete (2026-02-22) | TASK-INV-01 | — |
| TASK-05 | IMPLEMENT | Remove IDEAS from UPSTREAM_PRIORITY_ORDER | 90% | S | Complete (2026-02-22) | — | — |
| TASK-06 | IMPLEMENT | Update HTML process map | 80% | M | Pending | — | — |
| TASK-07 | IMPLEMENT | Update startup-loop/SKILL.md + rewrite idea-scan/SKILL.md | 80% | M | Pending | TASK-INV-01 | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-INV-01, TASK-01, TASK-03, TASK-05 | — | All independent; run in parallel |
| 2 | TASK-02, TASK-04, TASK-06, TASK-07 | Wave 1 complete | TASK-02 needs TASK-01; TASK-04/07 need TASK-INV-01; TASK-06 independent but wave 2 for logical grouping |

**Commit discipline:** TASK-01 + TASK-02 must be staged together and committed in one operation.

---

## Tasks

### TASK-INV-01: Audit idea-scan/SKILL.md scope

- **Type:** INVESTIGATE
- **Deliverable:** Scope notes added to TASK-04 and TASK-07 before execution
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Artifact-Destination:** findings inline in TASK-04/TASK-07 notes sections
- **Reviewer:** operator
- **Approval-Evidence:** None: INVESTIGATE tasks do not require formal approval
- **Measurement-Readiness:** None: investigation task; output is task scope refinement
- **Affects:** `[readonly] .claude/skills/idea-scan/SKILL.md`
- **Depends on:** —
- **Blocks:** TASK-04, TASK-07
- **Confidence:** 85%
  - Implementation: 90% — file read in full this cycle; scope and legacy contract surface are concrete
  - Approach: 85% — clear investigation goal (confirm rewrite scope vs line edit)
  - Impact: 85% — prevents TASK-04 and TASK-07 from being underscoped
- **Acceptance:**
  - SKILL.md structure fully read
  - Current scan mechanism documented (git-based, last-scan.json, scans/ dir)
  - Scope delta confirmed: which sections of SKILL.md require full rewrite vs append-only
  - TASK-04 schema fields confirmed or expanded based on what inputs idea-scan currently uses
- **Validation contract (VC-01):**
  - VC-01: Read full idea-scan/SKILL.md → all sections documented before TASK-04/TASK-07 begin
  - Pass: TASK-04 and TASK-07 notes sections updated with scope findings from investigation
  - Deadline: before Wave 2 begins
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: idea-scan/SKILL.md partially read; confirmed git-based mechanism incompatible with new diff-scan contract
  - Green evidence plan: read remaining sections; note fields that conflict with new scan-proposals contract; list which old output paths (scans/, last-scan.json) become obsolete
  - Refactor evidence plan: None: INVESTIGATE
- **Build/validation evidence (2026-02-22):**
  - `sed -n '1,640p' .claude/skills/idea-scan/SKILL.md` — PASS (full file read; sections 1-7, example session, error handling, Phase 0 constraints reviewed)
  - `rg -n "last-scan\\.json|docs/business-os/scans/|scans/|lastCommit|idea-scan" .claude/skills docs/business-os/startup-loop -S` — PASS (downstream dependency scan completed)
  - Legacy output contract confirmed in `idea-scan/SKILL.md`: `lastCommit` + `docs/business-os/scans/{last-scan.json,active-docs.json,history/*}`.
  - Downstream references found: `.claude/skills/biz-update-plan/SKILL.md`, `.claude/skills/idea-advance/SKILL.md`, `.claude/skills/biz-update-people/SKILL.md`, `.claude/skills/_shared/cabinet/lens-code-review.md`.
  - Outcome classification: affirming for TASK-04 schema design; scope-expanding for TASK-07 consumer cleanup.
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Resolved in this cycle. Downstream consumers were identified and are now included in TASK-07 `Affects`.
- **Edge Cases & Hardening:** None: investigation task
- **What would make this >=90%:**
  - One pass verifying that all consumer references migrate cleanly from `docs/business-os/scans/` to the new `scan-proposals.md` contract
- **Rollout / rollback:**
  - Rollout: None: investigation; no artifacts changed
  - Rollback: None
- **Documentation impact:** None
- **Notes / references:**
  - Full idea-scan contract read this cycle. Rewrite scope is full-document, not patch-level: Operating Mode, Inputs, Output Schema, Workflow steps 1-7, Example Session, Error Handling, Phase 0 Constraints, Success Metrics.
  - Legacy scan persistence (`docs/business-os/scans/`) is deeply embedded in the current skill and must be treated as deprecated in TASK-07.
  - TASK-04 scope implication: no pre-existing proposal schema exists; new `scan-proposals.schema.md` is canonical output contract.
  - TASK-07 scope implication: besides `.claude/skills/startup-loop/SKILL.md` and `.claude/skills/idea-scan/SKILL.md`, update downstream skill references to old scan artifacts.

---

### TASK-01: Update loop-spec.yaml to v3.9.4

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/loop-spec.yaml` at v3.9.4
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-22)
- **Artifact-Destination:** `docs/business-os/startup-loop/loop-spec.yaml`
- **Reviewer:** operator
- **Approval-Evidence:** None: internal spec doc; operator is author
- **Measurement-Readiness:** None: spec file; validation is via test suite
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** —
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% — precise changes identified; IDEAS YAML block structure clear; no external unknowns
  - Approach: 90% — approach verified against runtime (no type field parsing); additive change
  - Impact: 85% — spec-level only; backward compat preserved; IDs unchanged
- **Acceptance:**
  - `spec_version: "3.9.4"` in frontmatter
  - Changelog entry for v3.9.4 added
  - IDEAS container: `type: standing_pipeline`, `trigger:` block (layer_a_pack_diff + operator_inject), `automation: semi_automated`, `recurrence: per_trigger_event`, `impact_categories:` (6 values)
  - IDEAS-01: `skill: /idea-scan`, `automation: automated`, `inputs: [layer_a_pack_diff, existing_idea_backlog]`, `output_artifact: scan-proposals.md`
  - IDEAS-02: `skill: /idea-develop`, `secondary_skills: [/idea-advance]`, `automation: semi_automated`
  - IDEAS-03: `skill: /lp-do-fact-find`, `automation: operator_gate`
  - `ordering.sequential` does not contain any IDEAS entry; comment added explaining standing pipeline is intentionally excluded
  - `ordering.sequential` chain `[ASSESSMENT, MEASURE-01]` is intact (unchanged)
- **Validation contract (VC-01..03):**
  - VC-01: `spec_version` in file = `"3.9.4"` → pass immediately on file read
  - VC-02: IDEAS container block contains `type: standing_pipeline` and all required new fields → pass by structural inspection
  - VC-03: `ordering.sequential` contains no `IDEAS`, `IDEAS-01`, `IDEAS-02`, `IDEAS-03` entries → pass by grep
    `grep -c "IDEAS" docs/business-os/startup-loop/loop-spec.yaml` — count should be from IDEAS definitions only, not ordering
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: Current file has `type: container` for IDEAS; IDEAS-01..03 all `skill: prompt-handoff`; no trigger/automation fields; ordering has `[ASSESSMENT, MEASURE-01]` (IDEAS absent but no comment explaining why)
  - Green evidence plan: Edit IDEAS container block; edit IDEAS-01..03 stage blocks; add ordering comment; bump spec_version; add changelog entry
  - Refactor evidence plan: Verify ordering.sequential is clean; verify no orphaned references to old IDEAS-01..03 fields
- **Build/validation evidence (2026-02-22):**
  - `rg -n "^spec_version:|^- id: IDEAS$|type: standing_pipeline|trigger:|automation:|recurrence:|impact_categories:|skill: /idea-scan|output_artifact: scan-proposals.md|skill: /idea-develop|secondary_skills: \\[/idea-advance\\]|skill: /lp-do-fact-find|operator_gate" docs/business-os/startup-loop/loop-spec.yaml` — PASS
  - `sed -n '996,1065p' docs/business-os/startup-loop/loop-spec.yaml | rg -n "IDEAS|ASSESSMENT, MEASURE-01|standing_pipeline"` — PASS (`IDEAS` absent from sequential ordering; explanatory comment present on ASSESSMENT→MEASURE edge)
  - `pnpm exec jest --runTestsByPath scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts --maxWorkers=2` — PASS (17/17; includes stage count 66 assertion)
- **Planning validation (required for M/L):**
  - Checks run: Full read of loop-spec.yaml this session; verified ordering.sequential section; verified IDEAS block structure
  - Validation artifacts: loop-spec.yaml lines 283-345 (IDEAS section); lines 996-1058 (ordering)
  - Unexpected findings: None
- **Scouts:** Does any other doc import or reference the IDEAS `type: container` value explicitly?
  Check: `grep -r "type: container" docs/business-os/startup-loop/` — if matched outside IDEAS block, note the references.
- **Edge Cases & Hardening:**
  - The v3.9.4 changelog entry must explicitly state that IDEAS stages remain in `stages:` list (not moved to a new section) to prevent future confusion
  - The ordering.sequential comment must say "IDEAS is type: standing_pipeline — intentionally excluded from sequential ordering; triggers defined in container block"
- **What would make this >=90%:**
  - If we had an automated YAML linter that validates the new fields against a JSON schema (currently none for loop-spec.yaml)
- **Rollout / rollback:**
  - Rollout: Commit atomically with TASK-02 (stage-operator-dictionary.yaml must be consistent with spec on same commit)
  - Rollback: `git revert` the commit; both TASK-01 and TASK-02 revert together
- **Documentation impact:**
  - `docs/business-os/startup-loop/_generated/stage-operator-table.md` and `stage-operator-map.json` are generated from the dictionary (TASK-02) not the spec directly; no direct regeneration needed from this task alone
- **Notes / references:**
  - Spec file: `docs/business-os/startup-loop/loop-spec.yaml`
  - Full spec read this session (1087 lines)

---

### TASK-02: Update stage-operator-dictionary.yaml

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/stage-operator-dictionary.yaml` with `loop_spec_version: "3.9.4"` and redesigned IDEAS entries
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-22)
- **Artifact-Destination:** `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- **Reviewer:** operator
- **Approval-Evidence:** None: internal spec doc
- **Measurement-Readiness:** Validation: run `generate-stage-operator-views.ts` post-commit to confirm generated views are consistent
- **Affects:** `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`
- **Depends on:** TASK-01
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 85% — all entries identified; new label/prompt text known from conversation context
  - Approach: 85% — straightforward YAML edits; no structural changes to schema
  - Impact: 85% — must ship with TASK-01; operator-facing labels corrected
- **Acceptance:**
  - `loop_spec_version: "3.9.4"` (was "3.9.0")
  - IDEAS container entry: `outcome_operator` updated; `operator_next_prompt` updated to describe standing pipeline behavior (not "proceed to MEASURE-01")
  - IDEAS-01 entry: `name_machine: pack-diff-scan`; `label_operator_short: "Pack diff scan"`; `label_operator_long: "IDEAS-01 — Pack diff scan"`; `outcome_operator` describes automated scan output; `operator_next_prompt` describes reviewing scan-proposals.md
  - IDEAS-02 entry: `name_machine: backlog-update`; `label_operator_short: "Backlog update"`; updated to describe semi-automated apply of scan proposals
  - IDEAS-03 entry: operator prompt updated to remove "proceed to MEASURE-01" and reference DO fact-find handoff
  - ASSESSMENT-11 operator_next_prompt updated to remove "Run /startup-loop advance to IDEAS-01 Idea backlog capture" (IDEAS is no longer next sequential stage)
- **Validation contract (VC-01..03):**
  - VC-01: `loop_spec_version` in file = `"3.9.4"` → pass on read
  - VC-02: Run `scripts/src/startup-loop/generate-stage-operator-views.ts` → no errors; generated map contains updated IDEAS entries → pass
  - VC-03: VC-03 invariant check — `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts` passes → stage count 66, dict order matches spec
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: `loop_spec_version: "3.9.0"` stale; IDEAS operator prompts say "proceed to MEASURE-01"; IDEAS-01 `label_operator_short: "Idea backlog capture"` (old label)
  - Green evidence plan: Edit all 4 IDEAS entries + IDEAS container entry + ASSESSMENT-11 next prompt; bump `loop_spec_version`
  - Refactor evidence plan: Run `generate-stage-operator-views.ts` to confirm consistency; verify VC-03
- **Build/validation evidence (2026-02-22):**
  - `rg -n "^loop_spec_version:|ASSESSMENT-11|IDEAS-01|IDEAS-02|IDEAS-03|pack-diff-scan|Backlog update|Promote to DO|operator_next_prompt" docs/business-os/startup-loop/stage-operator-dictionary.yaml` — PASS
  - `node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts` — PASS (generated map/table refreshed)
  - `node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts --check` — PASS (no drift)
  - `pnpm exec jest --runTestsByPath scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts --maxWorkers=2` — PASS (19/19)
  - Generated view verification:
    - `_loop_spec_version: "3.9.4"` present in `stage-operator-map.json`
    - IDEAS labels/names updated in generated map/table (`Pack diff scan`, `Backlog update`, `Promote to DO`)
- **Planning validation (required for M/L):**
  - Checks run: Read stage-operator-dictionary.yaml lines 170-235 this session; confirmed all entries to change
  - Validation artifacts: dictionary lines 176-234
  - Unexpected findings: `loop_spec_version` was 3.9.0, not 3.9.3 — will jump to 3.9.4 directly
- **Scope expansion note:** Generated outputs were refreshed via canonical generator to satisfy VC-02/VC-03 consistency checks; no manual edits were made to `_generated/*`.
- **Scouts:** Confirm ASSESSMENT-11 `operator_next_prompt` is the only reference to IDEAS in the "proceed to" pattern in the dictionary.
  Check: `grep -n "IDEAS-01\|Idea backlog" docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- **Edge Cases & Hardening:**
  - `aliases` for IDEAS-01: keep `idea-backlog`, `idea-backlog-capture`, `ideas-01` for backward compat; add `pack-diff-scan` as new canonical alias
  - VC-03 ordering: IDEAS entries must remain in the same position in the dictionary (between ASSESSMENT-11 and MEASURE-01) per VC-03 ordering constraint — do NOT reorder
- **What would make this >=90%:**
  - If we had spec-lint that validated operator prompts for consistency (no "proceed to MEASURE-01" for a standing_pipeline stage)
- **Rollout / rollback:**
  - Rollout: Commit atomically with TASK-01 in same git operation
  - Rollback: `git revert` shared commit with TASK-01
- **Documentation impact:**
  - `_generated/stage-operator-map.json` and `stage-operator-table.md` should be regenerated after this commit runs `generate-stage-operator-views.ts`

---

### TASK-03: Update idea-backlog.schema.md

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/ideas/idea-backlog.schema.md` with `last_scanned_pack_versions` frontmatter field
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Artifact-Destination:** `docs/business-os/startup-loop/ideas/idea-backlog.schema.md`
- **Reviewer:** operator
- **Approval-Evidence:** None: internal schema doc
- **Measurement-Readiness:** None: schema doc; correctness checked by TASK-INV-01 findings
- **Affects:** `docs/business-os/startup-loop/ideas/idea-backlog.schema.md`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 85% — additive frontmatter field; structure is clear
  - Approach: 90% — simple schema addition; no structural changes
  - Impact: 85% — existing backlog files without the field are treated as "needs-first-scan" (absence = acceptable)
- **Acceptance:**
  - `last_scanned_pack_versions` field added to frontmatter schema section with definition:
    Map of pack ID to last-scanned date: `{ "MARKET-11": "YYYY-MM-DD", "SELL-07": "YYYY-MM-DD", "PRODUCTS-07": "YYYY-MM-DD", "LOGISTICS-07": "YYYY-MM-DD" }`
  - Absence of field treated as "all packs at needs-first-scan" (first scan is always a full read)
  - Example frontmatter updated to include the field
  - Trigger section updated to reference `scan-proposals.md` output (TASK-04 dependency noted)
- **Validation contract (VC-01):**
  - VC-01: Field definition present in frontmatter schema → pass by structural inspection
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: Schema has `Review-trigger` but no `last_scanned_pack_versions` field
  - Green evidence plan: Add field definition to frontmatter section; update example; update trigger note
  - Refactor evidence plan: None: S effort
- **Build/validation evidence (2026-02-22):**
  - `rg -n "last_scanned_pack_versions|scan-proposals\\.md|first-run|Related-stage|Related-skill" docs/business-os/startup-loop/ideas/idea-backlog.schema.md` — PASS
  - `sed -n '1,220p' docs/business-os/startup-loop/ideas/idea-backlog.schema.md` — PASS (field definition, absence behavior, and example frontmatter verified)
  - VC-01 pass: frontmatter schema now defines `last_scanned_pack_versions` with explicit pack keys and date format placeholder.
  - Trigger contract update present: IDEAS-01 output `scan-proposals.md` is now the stated input trigger for IDEAS-02 backlog updates.
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Does `idea-portfolio.schema.md` or `idea-card.schema.md` need similar tracking fields? Note finding but do not act — out of scope.
  - Scout result (2026-02-22): no `last_scanned_pack_versions`/`Review-trigger` fields found in those schemas; no action taken (out of scope).
- **Edge Cases & Hardening:**
  - The field should default gracefully (absence = first scan is full); document this in schema
- **What would make this >=90%:**
  - TASK-INV-01 confirms the idea-scan implementation will read this field (not another tracking mechanism)
- **Rollout / rollback:**
  - Rollout: Independent commit; no dependencies
  - Rollback: `git revert` if needed; no consumers break (additive)
- **Documentation impact:** None beyond the schema doc itself

---

### TASK-04: Create scan-proposals.schema.md

- **Type:** IMPLEMENT
- **Deliverable:** New file `docs/business-os/startup-loop/ideas/scan-proposals.schema.md` defining the structured proposal artifact
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-22)
- **Artifact-Destination:** `docs/business-os/startup-loop/ideas/scan-proposals.schema.md`
- **Reviewer:** operator
- **Approval-Evidence:** None: internal schema doc
- **Measurement-Readiness:** None: schema doc; operational validation deferred to /idea-scan implementation
- **Affects:** `[new] docs/business-os/startup-loop/ideas/scan-proposals.schema.md`, `docs/business-os/startup-loop/ideas/handoff-to-fact-find.md`
- **Depends on:** TASK-INV-01
- **Blocks:** —
- **Confidence:** 82%
  - Implementation: 82% — TASK-INV-01 confirmed there is no competing proposal schema; required MERGE/SPLIT fields and quality-gate fields remain valid
  - Approach: 80% — schema structure clear; JSON-like YAML frontmatter pattern matches existing schemas
  - Impact: 82% — schema remains draft, but uncertainty reduced because producer contract is now fully mapped
- **Acceptance:**
  - Schema frontmatter: `Schema: scan-proposals`, `Version: 1.0.0`, `Stage: IDEAS-01`, `Status: Draft`
  - Proposal types section: all 6 types defined with required/optional fields per type
  - Each proposal includes: `type` (required), `idea_id` (required for all except CREATE), `merge_target` (required for MERGE), `split_from` (required for SPLIT), `evidence_ref` (required — path to diff chunk or pack section), `reasoning` (required), `confidence` (required: `low | medium | high`)
  - Quality bar section: a proposal lacking `evidence_ref`, `reasoning`, or `confidence` is invalid and must be rejected before operator review
  - Artifact location: `docs/business-os/strategy/<BIZ>/scan-proposals.md`
  - Example artifact with at least one example of each proposal type
- **Validation contract (VC-01..02):**
  - VC-01: All 6 proposal types defined with complete field set → pass by structural inspection
  - VC-02: Quality bar section present and references all required fields → pass by read
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: File does not exist; no schema defined for scan-proposals artifact
  - Green evidence plan: Create file with all proposal types; include quality bar; add artifact location; add complete example
  - Refactor evidence plan: Cross-reference with idea-backlog.schema.md and idea-card.schema.md for terminology consistency
- **Build/validation evidence (2026-02-22):**
  - `rg -n "^Schema: scan-proposals|^Version: 1\\.0\\.0|^Stage: IDEAS-01|^Status: Draft|CREATE|STRENGTHEN|WEAKEN|INVALIDATE|MERGE|SPLIT|evidence_ref|reasoning|confidence|merge_target|split_from|Artifact location|docs/business-os/strategy/<BIZ>/scan-proposals\\.md" docs/business-os/startup-loop/ideas/scan-proposals.schema.md` — PASS
  - `sed -n '1,260p' docs/business-os/startup-loop/ideas/scan-proposals.schema.md` — PASS (frontmatter contract + six-type matrix + quality bar + complete six-type example verified)
  - `rg -n "scan-proposals\\.schema\\.md|Schema Cross-Reference" docs/business-os/startup-loop/ideas/handoff-to-fact-find.md` — PASS (cross-reference added)
- **Planning validation (required for M/L):**
  - Checks run: Reviewed existing ideas/ schema files (idea-backlog.schema.md, handoff-to-fact-find.md) for pattern consistency
  - Validation artifacts: `docs/business-os/startup-loop/ideas/` (4 files read this session)
  - Unexpected findings: TASK-INV-01 confirmed legacy output is scan JSON files, not proposal markdown; schema must define a new canonical artifact.
- **Scope expansion note:** Added `handoff-to-fact-find.md` schema cross-reference row to keep IDEAS contracts discoverable from the handoff contract.
- **Scouts:** Resolved via TASK-INV-01: no existing proposal schema to align with; create new schema and explicitly reference deprecation of legacy scan JSON outputs in TASK-07.
- **Edge Cases & Hardening:**
  - MERGE proposals: `merge_target` must be an existing idea card ID; schema must define this constraint
  - SPLIT proposals: `split_from` must be an existing idea card ID; schema must define this constraint
  - CREATE proposals: `idea_id` is null/absent (idea doesn't exist yet)
  - A single diff chunk may produce multiple proposals (e.g., one signal STRENGTHENS idea A and WEAKENS idea B simultaneously) — schema must allow a proposal list, not a single proposal per diff
- **What would make this >=90%:**
  - One trial run of the schema against a real pack diff and proposal set
- **Rollout / rollback:**
  - Rollout: Independent commit; new file only
  - Rollback: Delete file; no consumers yet
- **Documentation impact:**
  - `handoff-to-fact-find.md`: add cross-reference to scan-proposals.schema.md in Section 6 (Schema Cross-Reference)

---

### TASK-05: Remove IDEAS from UPSTREAM_PRIORITY_ORDER

- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/bottleneck-detector.ts` with IDEAS stages removed from `UPSTREAM_PRIORITY_ORDER`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-22)
- **Artifact-Destination:** `scripts/src/startup-loop/bottleneck-detector.ts`
- **Reviewer:** operator
- **Approval-Evidence:** None: internal tooling change
- **Measurement-Readiness:** Test suite: `pnpm -w test -- --testPathPattern=bottleneck` passes post-change
- **Affects:** `scripts/src/startup-loop/bottleneck-detector.ts`, `[readonly] scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 90%
  - Implementation: 90% — exact location confirmed (line 89); simple array edit; StageId type stays unchanged
  - Approach: 90% — verified positional semantics of UPSTREAM_PRIORITY_ORDER this session; IDEAS being there is the defect
  - Impact: 90% — minimal blast radius; STARTUP_LOOP_STAGES in loop.ts confirmed unchanged (validation whitelist, not positional)
- **Acceptance:**
  - `UPSTREAM_PRIORITY_ORDER` array does not contain `'IDEAS'`, `'IDEAS-01'`, `'IDEAS-02'`, `'IDEAS-03'`
  - `StageId` type union still contains `'IDEAS' | 'IDEAS-01' | 'IDEAS-02' | 'IDEAS-03'` (unchanged — IDs remain valid)
  - `STARTUP_LOOP_STAGES` in `packages/mcp-server/src/tools/loop.ts` is NOT changed (confirmed: validation whitelist only; position irrelevant)
  - Test suite passes: `pnpm -w test -- --testPathPattern=bottleneck`
  - Stage count assertion in `s10-weekly-routing.test.ts` (expects 66) still passes (UPSTREAM_PRIORITY_ORDER count is separate)
- **Validation contract (TC-01..02):**
  - TC-01: `grep "IDEAS" scripts/src/startup-loop/bottleneck-detector.ts | grep "UPSTREAM_PRIORITY_ORDER"` → zero matches
  - TC-02: Test suite `pnpm -w test -- --testPathPattern=bottleneck-detector` → passes with no failures
- **Execution plan:** Red -> Green -> Refactor
  - Red: UPSTREAM_PRIORITY_ORDER currently includes IDEAS/IDEAS-01/IDEAS-02/IDEAS-03 at lines ~89; represents false sequential position
  - Green: Remove the 4 entries from the array (surgery only; no logic changes)
  - Refactor: Verify StageId type is unchanged; verify STARTUP_LOOP_STAGES in loop.ts is unchanged; run tests
- **Build/validation evidence (2026-02-22):**
  - `rg -n "UPSTREAM_PRIORITY_ORDER.*IDEAS" scripts/src/startup-loop/bottleneck-detector.ts` — PASS (no matches; IDEAS removed from priority order)
  - `rg -n "UPSTREAM_PRIORITY_ORDER|indexOf\\('IDEAS'\\)|indexOf\\(\\\"IDEAS\\\"\\)" scripts/src/startup-loop/bottleneck-detector.ts` — PASS (only generic index lookup remains)
  - `pnpm exec jest --runTestsByPath scripts/src/startup-loop/__tests__/bottleneck-detector.test.ts --maxWorkers=2` — PASS (9/9)
  - `pnpm exec jest --runTestsByPath scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts --maxWorkers=2` — PASS (17/17; includes stage-count 66 assertion)
  - Guard note: plan’s root `pnpm -w test -- --testPathPattern=...` command is blocked by repo policy (`scripts/guard-broad-test-run.cjs`); targeted `jest --runTestsByPath` used as policy-compliant equivalent.
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Does any code access `UPSTREAM_PRIORITY_ORDER.indexOf('IDEAS')` or similar? If yes, that code needs updating too.
  Check: `grep -n "UPSTREAM_PRIORITY_ORDER" scripts/src/startup-loop/bottleneck-detector.ts`
- Scout result (2026-02-22): no IDEAS-specific index lookups found; no additional code updates required.
- **Edge Cases & Hardening:**
  - Do not remove IDEAS from `StageId` type — existing manifests reference these IDs
  - Confirm tests still expect 66 in s10-weekly-routing.test.ts (this test counts dict entries, not UPSTREAM_PRIORITY_ORDER entries — should be unaffected)
- **What would make this >=90%:** Already at 90%. Held-back test: no single unknown would push below 80 — this is an exact, well-defined array edit with confirmed scope.
- **Rollout / rollback:**
  - Rollout: Independent commit; can ship before or after other tasks
  - Rollback: `git revert`; bottleneck detection reverts to false signals (tolerable temporary state)
- **Documentation impact:** None

---

### TASK-06: Update HTML process map

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop-containers-process-map.html` with IDEAS moved to a standing pipeline visual panel
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-containers-process-map.html`
- **Reviewer:** operator
- **Approval-Evidence:** None: internal documentation; operator views in browser
- **Measurement-Readiness:** None: visual artifact; validated by opening in browser
- **Affects:** `docs/business-os/startup-loop-containers-process-map.html`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — HTML structure known from this session; CSS patterns established; standing pipeline panel is a new visual element with no precedent in the file
  - Approach: 80% — visual design described (two trigger arrows from Layer A packs, output to DO, IDEAS-01/02/03 as automated/semi/gate badges)
  - Impact: 85% — documentation only; no runtime impact
- **Acceptance:**
  - IDEAS block removed from main sequential `.flow` element
  - New "Standing Pipelines" section added (styled distinctly from main flow containers)
  - IDEAS panel shows: Layer A trigger arrows (from MARKET-11, SELL-07, PRODUCTS-07, LOGISTICS-07), operator inject entry point, IDEAS-01 (automated), IDEAS-02 (semi-automated), IDEAS-03 (operator gate), output arrow to DO
  - IDEAS-01/02/03 badges reflect automation level (e.g. `automated` / `semi-auto` / `gate`)
  - Navigation updated: "Standing Pipelines" nav link added; IDEAS removed from main container nav
  - `diff-scan` and `pack-trigger` labels visible on trigger arrows
  - Document opens in browser without layout errors
- **Validation contract (VC-01..02):**
  - VC-01: Open HTML in Chrome → IDEAS no longer appears in the main sequential flow
  - VC-02: Open HTML in Chrome → Standing Pipelines section is visible with both trigger paths and DO output arrow
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: IDEAS currently rendered as a container block inside the main `.flow` sequential layout; it appears between ASSESSMENT and MEASURE sections
  - Green evidence plan: Remove IDEAS block from `.flow`; add `.standing-pipelines` section below main flow with IDEAS panel; add CSS for new section; update nav
  - Refactor evidence plan: Verify responsive behavior; verify nav links all work; open in browser
- **Planning validation (required for M/L):**
  - Checks run: HTML file read (first 50 lines) + written/edited extensively this session
  - Validation artifacts: `docs/business-os/startup-loop-containers-process-map.html`
  - Unexpected findings: None; CSS patterns (sticky nav, container headers, stage cards, arrows) are established
- **Scouts:** Does the HTML currently use any internal anchor `#ideas` that is referenced from other documents?
  Check: `grep -r "#ideas\|#IDEAS" docs/`
- **Edge Cases & Hardening:**
  - The Layer A trigger arrows need to show which specific packs (MARKET-11, SELL-07, PRODUCTS-07, LOGISTICS-07) rather than a generic "Layer A" label
  - The operator inject path needs a distinct visual entry point (different color or shape from the pack trigger)
  - IDEAS panel should show recurrence indicator ("per trigger event")
- **What would make this >=90%:**
  - Having a visual mockup reviewed before implementation (current state: described only)
- **Rollout / rollback:**
  - Rollout: Independent commit
  - Rollback: `git revert`; prior HTML version restored
- **Documentation impact:** None: this IS the documentation

---

### TASK-07: Update startup-loop/SKILL.md + rewrite idea-scan/SKILL.md

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/startup-loop/SKILL.md` (IDEAS table rows) and rewritten `.claude/skills/idea-scan/SKILL.md` (new diff-scan contract)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/idea-scan/SKILL.md`
- **Reviewer:** operator
- **Approval-Evidence:** None: internal skill docs
- **Measurement-Readiness:** None: skill descriptions; operational validation requires live run
- **Affects:** `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/idea-scan/SKILL.md`, `.claude/skills/biz-update-plan/SKILL.md`, `.claude/skills/idea-advance/SKILL.md`, `.claude/skills/biz-update-people/SKILL.md`, `.claude/skills/_shared/cabinet/lens-code-review.md`
- **Depends on:** TASK-INV-01
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — TASK-INV-01 completed full rewrite scope definition and identified concrete downstream references requiring synchronized updates
  - Approach: 80% — new IDEAS-01 contract is well-specified; old git-based mechanism must be replaced
  - Impact: 80% — downstream consumers are now known and bounded to skill-doc updates
- **Acceptance:**
  - startup-loop/SKILL.md: IDEAS table rows updated (IDEAS-01: automated/idea-scan, IDEAS-02: semi-automated/idea-develop+idea-advance, IDEAS-03: gate/lp-do-fact-find handoff)
  - idea-scan/SKILL.md: Operating mode updated (not just "READ + ANALYZE" — now "DIFF SCAN")
  - idea-scan/SKILL.md: Inputs updated (current pack artifact + last_scanned_pack_versions from idea-backlog + existing idea backlog)
  - idea-scan/SKILL.md: Output schema updated (scan-proposals.md with 6 impact category proposals, not last-scan.json)
  - idea-scan/SKILL.md: Old `docs/business-os/scans/` directory references removed (or noted as deprecated)
  - idea-scan/SKILL.md: References scan-proposals.schema.md (TASK-04) as the output contract
- **Validation contract (VC-01..02):**
  - VC-01: startup-loop/SKILL.md IDEAS table rows match new stage names (Pack diff scan / Backlog update / Promote) → pass by read
  - VC-02: idea-scan/SKILL.md output schema references `scan-proposals.md` not `last-scan.json` → pass by grep
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: startup-loop/SKILL.md has "Idea backlog capture / prompt handoff"; idea-scan/SKILL.md outputs to last-scan.json and scans/
  - Green evidence plan: Update startup-loop/SKILL.md table (simple); rewrite idea-scan/SKILL.md operating mode, inputs, and output schema
  - Refactor evidence plan: Confirm no other skills import from scans/ or depend on last-scan.json format
- **Planning validation (required for M/L):**
  - Checks run: Full read of `.claude/skills/idea-scan/SKILL.md`; repository-wide grep for `last-scan.json`/`scans/` references in skills and startup-loop docs
  - Validation artifacts: `.claude/skills/idea-scan/SKILL.md`, `.claude/skills/biz-update-plan/SKILL.md`, `.claude/skills/idea-advance/SKILL.md`, `.claude/skills/biz-update-people/SKILL.md`, `.claude/skills/_shared/cabinet/lens-code-review.md`
  - Unexpected findings: multiple skill docs reference the legacy scan artifact paths and/or semantics; TASK-07 must clean these references as part of rollout
- **Scouts:** Resolved via TASK-INV-01. Remaining work is implementation cleanup in listed `Affects` files, not additional discovery.
- **Edge Cases & Hardening:**
  - idea-scan/SKILL.md "Not allowed" section currently says "Modifying existing cards or ideas" — in the new model, IDEAS-02 (not idea-scan itself) modifies cards. Keep this restriction in idea-scan/SKILL.md; scan only produces proposals, never applies them.
  - The "Phase 0: informational only" comment in current SKILL.md is outdated; remove.
- **What would make this >=90%:**
  - Complete a dry-run content audit after edits (`rg -n "last-scan\\.json|docs/business-os/scans/" .claude/skills -S`) with zero remaining references
- **Rollout / rollback:**
  - Rollout: Independent commit; can ship after TASK-INV-01
  - Rollback: `git revert`; skill descriptions revert to old state (no operational breakage — skills are not yet being invoked in production for this pipeline)
- **Documentation impact:**
  - `handoff-to-fact-find.md`: consider updating Related-skill reference if needed (minor)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TASK-01 ships without TASK-02 → broken operator prompt window | Medium (if committed separately) | Low-Medium | Commit atomically; TASK-02 blocks statement enforced in plan |
| idea-scan/SKILL.md has consumers of `scans/` or `last-scan.json` not yet identified | Low | Medium | Identified by TASK-INV-01; TASK-07 includes synchronized consumer cleanup across affected skills |
| scan-proposals schema missing fields revealed by TASK-INV-01 → schema requires revision after TASK-04 ships | Medium | Low | Schema is `Status: Draft`; revision is expected; easy to update |
| Spec ships but system stays manual (no /idea-scan implementation) | High | High | Accepted paper-tiger period; TASK-07 closes skill contract gap; actual scan implementation is follow-on work |
| MERGE/SPLIT proposals have low quality in practice → operators disengage | Medium | High | Minimum quality bar encoded in scan-proposals.schema.md (evidence_ref + reasoning + confidence required); deferred to /idea-scan implementation evaluation |

## Observability

- Logging: None: spec + doc changes; no runtime logging
- Metrics: Stage count test (66) passes post-merge
- Alerts/Dashboards: None: spec-level change

## Acceptance Criteria (overall)

- [x] `loop-spec.yaml` at `spec_version: "3.9.4"` with IDEAS as `type: standing_pipeline` and absent from `ordering.sequential`
- [x] `stage-operator-dictionary.yaml` at `loop_spec_version: "3.9.4"` with IDEAS entries updated
- [x] TASK-01 and TASK-02 committed atomically in one git operation
- [x] `idea-backlog.schema.md` contains `last_scanned_pack_versions` field definition
- [x] `scan-proposals.schema.md` exists with all 6 impact types and quality bar
- [x] `bottleneck-detector.ts` `UPSTREAM_PRIORITY_ORDER` contains no IDEAS entries; tests pass
- [ ] HTML process map shows IDEAS as a standing pipeline panel with both trigger paths visible
- [ ] `startup-loop/SKILL.md` IDEAS table rows updated
- [ ] `idea-scan/SKILL.md` output schema references `scan-proposals.md` (not `last-scan.json`)
- [ ] No other skill or code references old `docs/business-os/scans/` IDEAS pipeline output

## Decision Log

- 2026-02-22: Chose Option B (keep IDEAS in `stages:` list with `type: standing_pipeline`) over Option A (new `standing_pipelines:` section). Rationale: additive, no structural impact on runtime tooling, `type` field not parsed by any current code.
- 2026-02-22: Deferred /idea-scan diff implementation to follow-on work. TASK-07 closes the skill contract gap (SKILL.md describes the new contract); implementation follows.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight | Weighted |
|---|---|---|---|---|
| TASK-INV-01 | 85% | S | 1 | 85 |
| TASK-01 | 85% | M | 2 | 170 |
| TASK-02 | 85% | M | 2 | 170 |
| TASK-03 | 85% | S | 1 | 85 |
| TASK-04 | 82% | M | 2 | 164 |
| TASK-05 | 90% | S | 1 | 90 |
| TASK-06 | 80% | M | 2 | 160 |
| TASK-07 | 80% | M | 2 | 160 |
| **Total** | | | **13** | **1084** |

**Overall-confidence = 1084 / 13 = 83.4% → 83%**
