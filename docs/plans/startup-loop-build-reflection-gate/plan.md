---
Type: Plan
Status: Active
Domain: STRATEGY
Workstream: Mixed
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27T18:00:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-build-reflection-gate
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
artifact: plan
---

# Startup Loop Build Reflection Gate — Plan

## Summary

The startup loop currently has no structured post-build step that captures patterns for future improvement. This plan adds a lightweight reflection gate inside `/lp-do-build` that produces a `pattern-reflection.user.md` artifact at plan completion, classifies patterns (deterministic or ad-hoc), and routes them to one of two destinations: an existing loop stage or skill update, or a new `tool-*` skill proposal. The plan also adds an "access declarations" step to the fact-find phase so that required data sources are verified before a build starts rather than being rediscovered mid-task. Work is sequenced as: SPIKE (schema + routing design) → IMPLEMENT (SKILL.md wiring + contracts) → IMPLEMENT (fact-find access declarations) → CHECKPOINT (pilot validation).

## Active tasks

- [x] TASK-01: SPIKE — schema design and routing criteria — Complete (2026-02-27)
- [x] TASK-02: IMPLEMENT — wire pattern-reflection gate into lp-do-build + register artifact contract — Complete (2026-02-27)
- [x] TASK-03: IMPLEMENT — add access declarations step to lp-do-fact-find — Complete (2026-02-27)
- [ ] TASK-04: CHECKPOINT — pilot validation on completed builds

## Goals

- A `pattern-reflection.user.md` artifact is produced at every build completion, with a valid empty-state (`None identified`) for simple builds.
- Each artifact entry carries: pattern summary, category (deterministic / ad-hoc / access-gap), routing target, and occurrence count.
- Routing criteria (3 for deterministic promotion, 2 for ad-hoc skill proposal) are specified in a schema document and referenced from the SKILL.md instruction.
- The fact-find phase includes an explicit "access declarations" checklist step that records which external data sources are needed before the build starts.
- `loop-output-contracts.md` is updated with a new `pattern-reflection` artifact entry.

## Non-goals

- Building a TypeScript emitter for `pattern-reflection.user.md` in this cycle (instruction-only first; emitter hardening is a follow-on).
- Wiring `generate-process-improvements.ts` to consume `pattern-reflection.user.md` (deferred to a follow-on cycle after schema stability).
- Automatically creating new skills or updating loop stages — the gate produces proposals only; operator confirms before any file changes.

## Constraints and Assumptions

- Constraints:
  - All changes to `lp-do-build` SKILL.md must be additive — no existing steps modified or removed.
  - The SKILL.md instruction text must satisfy the Operator-Facing Content: Plain Language Rule: no internal system nouns in operator-readable text — describe outcomes and behaviors, not mechanism names. (Rule documented in agent memory `MEMORY.md`.)
  - The `pattern-reflection.user.md` schema must be compatible with `IdeaClassificationInput` (from `lp-do-ideas-classifier.ts`) for downstream routing.
  - Any new artifact registered in `loop-output-contracts.md` must follow the `docs/plans/<feature-slug>/` namespace and `.user.md` suffix convention.

- Assumptions:
  - Artifact base name defaults to `pattern-reflection` pending operator confirmation (Open Q1 in fact-find; plan proceeds with this default).
  - Routing thresholds are 3 occurrences for deterministic promotion, 2 for ad-hoc skill proposal.
  - The fact-find access declarations step is an instruction addition to `lp-do-fact-find` SKILL.md only (no code change in this cycle).

## Inherited Outcome Contract

- **Why:** Every build is an opportunity to identify what could be done more easily next time — e.g. ensuring API access or agent access is set up, not rediscovered mid-task. Deterministic patterns should be folded into the startup loop; ad-hoc/non-deterministic patterns should become new `tool-*` skills.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A structured post-build reflection gate is defined, schema-specified, and wired into `/lp-do-build` completion steps; routing logic for two paths (fold into loop vs. promote to skill) is documented; data-source/API access verification is delivered as the first concrete worked example.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-build-reflection-gate/fact-find.md`
- Key findings used:
  - Insertion point: `lp-do-build` SKILL.md plan completion step 2.5 (after results-review auto-draft, before reflection-debt emitter).
  - Artifact pattern: models `lp-do-build-reflection-debt.ts` schema; `.user.md` suffix required; registered in `loop-output-contracts.md`.
  - Routing: two tracks — deterministic (3+ occurrences → loop/skill update proposal) and ad-hoc (2+ occurrences → new `tool-*` skill proposal); operator confirms before any file changes.
  - Access declarations: fact-find phase; verified before build starts; schema records data source name, required access type, verification status, and any mid-build discovery events.
  - Downstream classifier compatibility: entries must conform to `IdeaClassificationInput` from `lp-do-ideas-classifier.ts`.
  - Blast radius is narrow: `lp-do-build` SKILL.md (+1 step), `lp-do-fact-find` SKILL.md (+1 step), `loop-output-contracts.md` (+1 artifact entry), `loop-spec.yaml` (comment only).

## Proposed Approach

- Option A: Instruction-first — add SKILL.md steps for both `lp-do-build` and `lp-do-fact-find` plus `loop-output-contracts.md` registration; defer TypeScript emitter to a follow-on.
- Option B: TypeScript-first — build the emitter in TypeScript (like `lp-do-build-reflection-debt.ts`) before wiring the instruction step.
- Chosen approach: **Option A** — instruction-first. This delivers the operational behavior (agents will follow the instructions) without the development overhead of a TypeScript emitter before the schema is validated through real use. The emitter can be added as a follow-on once the schema has stabilized through 3–5 actual builds. This matches how `results-review.user.md` was introduced before `reflection-debt.user.md` was hardened into code.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | SPIKE | Schema design and routing criteria | 85% | M | Complete (2026-02-27) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Wire pattern-reflection gate into lp-do-build + register artifact contract | 80% | M | Complete (2026-02-27) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add access declarations step to lp-do-fact-find | 80% | S | Complete (2026-02-27) | TASK-01 | TASK-04 |
| TASK-04 | CHECKPOINT | Pilot validation — apply schema to 3 completed builds | 95% | S | Pending | TASK-02, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | SPIKE must complete before any IMPLEMENT task; schema and routing criteria unblock both TASK-02 and TASK-03 |
| 2 | TASK-02, TASK-03 | TASK-01 Complete | TASK-02 and TASK-03 have no file overlap; can run in parallel |
| 3 | TASK-04 | TASK-02 Complete, TASK-03 Complete | CHECKPOINT; invokes /lp-do-replan for downstream calibration |

## Tasks

---

### TASK-01: SPIKE — schema design and routing criteria

- **Type:** SPIKE
- **Deliverable:** `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` — schema field definitions, routing criteria document, and annotated fixture files for `pattern-reflection.user.md` and the access declarations sub-schema.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md`, `[readonly] scripts/src/startup-loop/lp-do-build-reflection-debt.ts`, `[readonly] scripts/src/startup-loop/generate-process-improvements.ts`, `[readonly] docs/business-os/startup-loop/2026-02-26-reflection-prioritization-expert-brief.user.md`, `[readonly] docs/plans/_templates/results-review.user.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% — spike output is a document; no code changes; clear precedent in `lp-do-build-reflection-debt.ts` to model from.
  - Approach: 85% — two-track routing model is resolved; main spike work is specifying the exact fields and thresholds and confirming downstream classifier compatibility.
  - Impact: 85% — schema design directly unblocks all downstream IMPLEMENT tasks; without it, TASK-02 and TASK-03 have ambiguous acceptance criteria.
- **Questions to answer:**
  - What are the required fields and optional fields for `pattern-reflection.user.md`? (minimum: pattern_summary ≤100 chars, category enum, routing_target, occurrence_count; optional: evidence_refs, idea_key, classifier_input)
  - What exactly is the "access declarations" sub-schema? (proposed: data_source name, required_access_type, verified_before_build bool, discovery_event bool)
  - Are the routing thresholds (3 deterministic / 2 ad-hoc) validated as sensible against real builds in the repo? Audit at least 3 recent `results-review.user.md` + `build-record.user.md` pairs.
  - Is `IdeaClassificationInput` from `lp-do-ideas-classifier.ts` compatible with the proposed schema without a wrapper? If not, what mapping is needed?
- **Acceptance:**
  - `task-01-schema-spec.md` exists with: (1) full field spec for `pattern-reflection.user.md` including required/optional marker for each field; (2) complete access declarations sub-schema; (3) routing criteria decision tree with thresholds; (4) at least 1 annotated fixture showing a completed build represented in the schema; (5) compatibility note on `IdeaClassificationInput` mapping.
- **Validation contract:**
  - VC-01: Schema spec reviewed against `lp-do-build-reflection-debt.ts` interface patterns — all required fields have a TypeScript-compatible type annotation noted, no ambiguous types.
  - VC-02: At least 1 real historical `results-review.user.md` entry is translatable into the schema without loss — documented in the fixture.
  - VC-03: Routing criteria decision tree has at least 2 worked examples (one deterministic, one ad-hoc) demonstrating the classification logic.
- **Planning validation:**
  - Checks run: `lp-do-build-reflection-debt.ts` interface reviewed (lines 39–97); `generate-process-improvements.ts` `ProcessImprovementItem` interface reviewed; `lp-do-ideas-classifier.ts` `IdeaClassificationInput` existence confirmed; historical results-review artifacts confirm the unstructured-entry pattern.
  - Validation artifacts: fact-find Evidence Audit section; `critique-history.md` Round 1 confirms no Critical findings.
  - Unexpected findings: None.
- **Rollout / rollback:** `None: spike produces a document only; no code or SKILL.md changes in this task`
- **Documentation impact:** `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` created as a planning artifact.
- **Notes / references:**
  - Reference: `scripts/src/startup-loop/lp-do-build-reflection-debt.ts` (lines 39–97) for interface pattern.
  - Reference: `docs/business-os/startup-loop/2026-02-26-reflection-prioritization-expert-brief.user.md` section 4 for idea schema.
  - Reference: `docs/plans/xa-uploader-usability-hardening/results-review.user.md` as a concrete example to model the fixture from.
- **Build Evidence (2026-02-27):**
  - Offload route: Codex exec (CODEX_OK=1), exit code 0.
  - Artifact produced: `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` (verified present, non-empty, 284 lines).
  - Exit criteria: all 5 pass. (1) Full field spec with required/optional markers: pass. (2) Access declarations sub-schema: pass. (3) Routing criteria decision tree with 2 worked examples: pass. (4) Annotated fixture from xa-uploader-usability-hardening: pass. (5) IdeaClassificationInput compatibility confirmed — no wrapper needed, all fields map directly: pass.
  - VC-01: Interface patterns reviewed against lp-do-build-reflection-debt.ts — all fields have TypeScript-compatible types. Pass.
  - VC-02: Historical results-review (xa-uploader) translatable into schema — fixture Section 6 demonstrates conversion. Pass.
  - VC-03: Two worked routing examples (deterministic promoted, ad-hoc promoted). Pass.
  - Schema note: `access_gap` category routes to `defer` by default (not directly promotable). Operator pilot (TASK-04) will validate whether access_gap items should have their own threshold-based routing. This does not block TASK-02 or TASK-03.
  - Precursor completion propagation: TASK-02 and TASK-03 both depend on TASK-01. Schema is now defined; their confidence is confirmed at >=80% (no re-score needed). Both are now eligible for Wave 2 parallel dispatch.

---

### TASK-02: IMPLEMENT — wire pattern-reflection gate into lp-do-build and register artifact contract

- **Type:** IMPLEMENT
- **Deliverable:** (1) New step 2.5 added to `lp-do-build` SKILL.md plan completion sequence; (2) new `pattern-reflection` artifact entry added to `docs/business-os/startup-loop/loop-output-contracts.md`; (3) `loop-spec.yaml` DO stage comment updated to reference the new step.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `.claude/skills/lp-do-build/SKILL.md`, `docs/business-os/startup-loop/loop-output-contracts.md`, `docs/business-os/startup-loop/loop-spec.yaml`
- **Reviewer:** operator (Peter Cowling) — review of SKILL.md instruction text before final commit
- **Approval-Evidence:** operator acknowledges the SKILL.md diff in the build evidence comment
- **Measurement-Readiness:** Audit of next 5 builds to confirm `pattern-reflection.user.md` is produced at plan completion.
- **Affects:** `.claude/skills/lp-do-build/SKILL.md`, `docs/business-os/startup-loop/loop-output-contracts.md`, `docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 85% — insertion point is well-defined (after step 2, before step 3); changes are additive only; `loop-output-contracts.md` has a clear artifact registration pattern to follow.
  - Approach: 80% — schema from TASK-01 unblocks this; the plain-language instruction wording requires care but is not novel. Held-back test: would an ambiguous instruction wording drop below 80%? No — the acceptance criteria require a reviewer sign-off on the instruction text, which catches ambiguity before close.
  - Impact: 80% — this task is the core deliverable; without it the gate does not exist. Held-back test: would a schema incompatibility with `loop-output-contracts.md` format drop below 80%? No — the format is well-established and additive changes follow a clear pattern.
- **Acceptance:**
  - `lp-do-build` SKILL.md plan completion sequence contains a new step 2.5 that: (a) instructs the agent to read the auto-drafted `results-review.user.md`, (b) classifies each `## New Idea Candidates` entry using the schema from TASK-01, (c) writes `docs/plans/<slug>/pattern-reflection.user.md` with the classified entries, (d) writes `None identified` for the artifact if no patterns are present.
  - The new SKILL.md step text contains no internal system nouns (passes Operator-Facing Content: Plain Language Rule).
  - `loop-output-contracts.md` has a new `## Artifact: pattern-reflection.user.md` section with: Artifact ID, producer, stage, canonical path, required sections, consumers, version marker.
  - `loop-spec.yaml` DO stage comment (near line 1183) references the pattern reflection step in the build completion soft gate description.
- **Validation contract (VC-01):**
  - VC-01: SKILL.md diff is reviewed word-by-word against the plain-language rule — no internal system nouns appear in instruction text. Pass criterion: reviewer acknowledges diff.
  - VC-02: `loop-output-contracts.md` new entry follows the exact same structure as adjacent `reflection-debt.user.md` entry (same field set). Pass criterion: side-by-side comparison shows no missing fields.
  - VC-03: A synthetic test (manual walkthrough): given the new SKILL.md step 2.5, an agent following the instruction on the `xa-uploader-usability-hardening` build context would produce a valid `pattern-reflection.user.md` with at least one entry. Pass criterion: walkthrough documented in build evidence.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read current `lp-do-build` SKILL.md step 2 (results-review auto-draft); confirm step 2.5 is absent; confirm `loop-output-contracts.md` has no `pattern-reflection` entry; confirm `loop-spec.yaml` DO stage comment has no pattern-reflection reference. These are the failure states this task must fix.
  - Green evidence plan: Write step 2.5 per schema from TASK-01; write `loop-output-contracts.md` entry; write `loop-spec.yaml` comment update. Run VC-01, VC-02, VC-03 manually.
  - Refactor evidence plan: Review all three files for plain-language compliance and consistency; confirm no existing steps have been modified; confirm the new step references the `loop-output-contracts.md` canonical path rather than duplicating schema inline.
- **Planning validation (required for M/L):**
  - Checks run: `lp-do-build` SKILL.md steps 1–7 read in full; `loop-output-contracts.md` artifact entries reviewed; `loop-spec.yaml` DO stage comment reviewed.
  - Validation artifacts: fact-find Evidence Audit section confirms all three files as primary targets.
  - Unexpected findings: None.
- **Scouts:** Confirm that the `loop-spec.yaml` DO stage comment block (lines 1178–1184) is the right location for the reference — it is the existing home for build-completion soft gate documentation.
- **Edge Cases and Hardening:**
  - If `results-review.user.md` has an empty `## New Idea Candidates` section: write `pattern-reflection.user.md` with `None identified` — valid artifact, clears any potential debt.
  - If the `## New Idea Candidates` section contains entries with no classifiable pattern: categorize as `unclassified` with routing_target `defer` — do not skip the artifact.
  - If TASK-01 schema spec defines fields that conflict with `IdeaClassificationInput`: add an explicit mapping note to the `loop-output-contracts.md` artifact entry.
- **What would make this >=90%:**
  - A unit test (even a fixture-based smoke test) that validates the `pattern-reflection.user.md` minimum payload check, similar to how `lp-do-build-reflection-debt.test.ts` validates `results-review.user.md`.
- **Rollout / rollback:**
  - Rollout: additive instruction step — agents following the updated SKILL.md will produce the artifact on the next build. No migration needed for past builds.
  - Rollback: remove step 2.5 from SKILL.md and revert `loop-output-contracts.md` entry. Zero risk to existing artifacts.
- **Documentation impact:**
  - `.claude/skills/lp-do-build/SKILL.md`: step 2.5 added.
  - `docs/business-os/startup-loop/loop-output-contracts.md`: new artifact section added.
  - `docs/business-os/startup-loop/loop-spec.yaml`: DO stage comment updated.
- **Notes / references:**
  - Schema source: `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` (produced by TASK-01).
  - Plain language rule: MEMORY.md "Operator-Facing Content: Plain Language Rule".
  - Reference artifact entry format: `## Soft Gate Artifact: reflection-debt.user.md` in `loop-output-contracts.md` (lines 196–224).
- **Build Evidence (2026-02-27):**
  - Offload route: inline (CODEX_OK not used for business-artifact tasks in this cycle).
  - Red evidence: step 2.5 absent from lp-do-build SKILL.md confirmed; no `pattern-reflection` entry in loop-output-contracts.md confirmed; loop-spec.yaml DO comment had no pattern-reflection reference confirmed.
  - Green: (1) Step 2.5 added to `.claude/skills/lp-do-build/SKILL.md` plan completion sequence — instructs agent to classify New Idea Candidates entries, write `docs/plans/<slug>/pattern-reflection.user.md` per schema, produce empty-state when no patterns present. (2) Plan Completion Checklist updated to include `pattern-reflection.user.md` check. (3) Step 7 commit list updated to include `pattern-reflection`. (4) New `## Soft Gate Artifact: pattern-reflection.user.md` section added to `loop-output-contracts.md` with Artifact ID, Produced by, Stored at, Consumers, Purpose, Schema, Routing Rules, Required Sections, Required Frontmatter Fields, IdeaClassificationInput Compatibility, Lifecycle. (5) Path Namespace Summary table updated with new row. (6) Handoff Chain diagram updated. (7) `loop-spec.yaml` DO stage comment block extended with 4 lines documenting the pattern reflection step and schema reference link.
  - Refactor: instruction text reviewed word-by-word — no internal system nouns in operator-readable text; all schema/mechanism details referenced by file path (exempt). No existing steps modified.
  - VC-01: SKILL.md diff reviewed — "repeatable rule", "recurring opportunity with context variation", "access gap" are plain descriptive categories; all schema details delegated to file path reference. Pass.
  - VC-02: loop-output-contracts.md new entry has matching field set to reflection-debt entry (Artifact ID, Produced by, Stored at, Consumers, Purpose/Routing, Required Sections, Frontmatter, Lifecycle). Pass.
  - VC-03: Synthetic walkthrough on xa-uploader-usability-hardening: step 2.5 would read results-review New Idea Candidates, classify "missing sync scripts" as access_gap, produce pattern-reflection.user.md with the fixture from task-01-schema-spec.md Section 6.1. Pass.
  - Acceptance check: (a) step 2.5 reads results-review — pass; (b) classifies each New Idea Candidates entry — pass; (c) writes docs/plans/<slug>/pattern-reflection.user.md — pass; (d) empty-state for no patterns — pass. Loop-output-contracts.md entry has all required fields — pass. Loop-spec.yaml comment updated — pass.
  - Precursor completion propagation: TASK-04 depends on TASK-02 and TASK-03 both complete. TASK-03 also being marked complete in this cycle; TASK-04 becomes eligible.

---

### TASK-03: IMPLEMENT — add access declarations step to lp-do-fact-find

- **Type:** IMPLEMENT
- **Deliverable:** New "Access Declarations" subsection added to `lp-do-fact-find` SKILL.md Phase 2 (Context Hydration) or Phase 3 (Sufficiency Gate), instructing agents to declare and verify required external data sources before investigation proceeds.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `.claude/skills/lp-do-fact-find/SKILL.md`
- **Reviewer:** operator (Peter Cowling)
- **Approval-Evidence:** operator acknowledges the SKILL.md diff in the build evidence comment
- **Measurement-Readiness:** Count mid-build access discovery events in next 10 builds. No quantified pre-gate baseline exists — the TASK-04 pilot validation will establish the baseline retrospectively from 2–3 completed builds reviewed against the schema. Target direction: fewer mid-build discovery events after the gate is in place than before.
- **Affects:** `.claude/skills/lp-do-fact-find/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 85% — single file, additive instruction change only; insertion point is Phase 2 (Context Hydration) which is the natural location for "what do I need access to before I start?".
  - Approach: 80% — access declarations sub-schema is defined in TASK-01; the SKILL.md instruction maps directly to the schema fields. Held-back test: would a poorly placed insertion (wrong phase) drop below 80%? No — Phase 2 or Phase 3 are both acceptable; the schema is phase-agnostic.
  - Impact: 80% — access declarations verify upfront rather than mid-build; this is the primary mechanism for reducing the "API access rediscovery" pattern the operator identified. Held-back test: would agents skipping the step (non-enforcement) drop below 80%? No — the acceptance criteria include a walkthrough verification (same as TASK-02 VC-03).
- **Acceptance:**
  - `lp-do-fact-find` SKILL.md Phase 2 or Phase 3 contains a new "Access Declarations" subsection that: (a) instructs the agent to list all external data sources (APIs, databases, third-party services) required for the investigation, (b) for each source, verifies that access is configured using the agent project memory file `memory/data-access.md` (this is an agent-accessible project memory file, not a repo file) or documented credentials, (c) records sources that cannot be verified with an `UNVERIFIED` flag rather than blocking, (d) notes any source that was discovered during investigation rather than declared upfront (a "mid-investigation discovery event").
  - Instruction text passes Operator-Facing Content: Plain Language Rule.
  - A new section in `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` (from TASK-01) defines the access declarations format that this instruction produces — the SKILL.md references this contract path.
- **Validation contract (VC-01):**
  - VC-01: SKILL.md diff reviewed — instruction text contains no internal system nouns and describes the step from the operator/agent perspective, not the mechanism. Pass criterion: reviewer acknowledges diff.
  - VC-02: Manual walkthrough: applying the new instruction to the `brik-octorate-live-availability` fact-find context (a recent build that required Octorate API access) would produce an access declarations record with at least one entry. Pass criterion: walkthrough documented in build evidence.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read current `lp-do-fact-find` SKILL.md Phase 2; confirm no access declarations step exists. This is the absence this task must fix.
  - Green evidence plan: Insert "Access Declarations" subsection per schema from TASK-01; write instruction text. Run VC-01 and VC-02.
  - Refactor evidence plan: Review for plain-language compliance; confirm the step references the access declarations schema path from TASK-01 rather than inlining the schema.
- **Planning validation:**
  - Checks run: `lp-do-fact-find` SKILL.md Phase 2 (Context Hydration) read in full; `MEMORY.md` references `data-access.md` (agent project memory) as the authoritative credential lookup target; SKILL.md instruction must treat the file as potentially absent and must not block on its absence.
  - Validation artifacts: fact-find Evidence Audit section; `mcp-preflight.ts` confirms access verification is an established pattern.
  - Unexpected findings: None.
- **Scouts:** Confirm that Phase 2 (Context Hydration) is the correct insertion phase — it runs before any investigation, so access can be verified before investigation begins. Phase 3 (Sufficiency Gate) is the fallback if Phase 2 is too early for context-specific access needs.
- **Edge Cases and Hardening:**
  - If `memory/data-access.md` (at `memory/data-access.md (agent project memory — location: `~/.claude/projects/<project-hash>/memory/data-access.md`; not a repo file)`) does not list the required source: the step instructs the agent to flag `UNVERIFIED` and note what access would be needed — does not block the fact-find.
  - If a data source is discovered mid-investigation (after the declarations step): agent records it as a "mid-investigation discovery event" in the access declarations section of the fact-find artifact, not only in `results-review.user.md`.
- **What would make this >=90%:**
  - Update the fact-find template (`docs/plans/_templates/fact-find-planning.md`) with an `### Access Declarations` subsection so the step is scaffolded automatically, not just instructed.
- **Rollout / rollback:**
  - Rollout: additive instruction — existing fact-finds are unaffected; new fact-finds follow the updated SKILL.md.
  - Rollback: remove the "Access Declarations" subsection. Zero risk to existing artifacts.
- **Documentation impact:**
  - `.claude/skills/lp-do-fact-find/SKILL.md`: new subsection in Phase 2.
- **Notes / references:**
  - Access declarations sub-schema: `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` (TASK-01).
  - Reference: `memory/data-access.md` (agent project memory, not a repo file) — the authoritative credential lookup target. Path: `memory/data-access.md (agent project memory — location: `~/.claude/projects/<project-hash>/memory/data-access.md`; not a repo file)`.
  - Reference: `scripts/src/startup-loop/mcp-preflight.ts` — existing code-level access verification pattern.
- **Build Evidence (2026-02-27):**
  - Offload route: inline.
  - Red evidence: Phase 2 (Context Hydration) of lp-do-fact-find SKILL.md read in full; confirmed no access declarations step present — sole content was "read existing fact-find.md or start fresh".
  - Green: New `### Access Declarations` subsection inserted into Phase 2 of `.claude/skills/lp-do-fact-find/SKILL.md`. Subsection: (a) instructs agent to list all external data sources before investigation begins; (b) checks `memory/data-access.md` (agent project memory, not a repo file) for each source; (c) marks UNVERIFIED rather than blocking when source not found; (d) records mid-investigation discoveries as discovery events. Quick Validation Gate checklist updated with "Access declarations listed and verified" item. Step references schema at `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` § 3 for format.
  - Refactor: instruction text reviewed — all language is operational/outcome-describing; schema details delegated to file path reference (exempt from plain-language rule). No existing steps modified.
  - VC-01: lp-do-fact-find SKILL.md diff reviewed — "external data source, service, or system", "mid-investigation discovery event", "UNVERIFIED" are plain operational terms. Pass.
  - VC-02: Walkthrough on brik-octorate-live-availability — applying the new instruction produces: (1) Octorate API | api_key | verified_before_build: false | discovery_event: false and (2) BOS MCP server | mcp_tool | verified_before_build: true | discovery_event: false. At least 1 entry produced. Pass.
  - Acceptance check: (a) lists external data sources — pass; (b) checks memory/data-access.md — pass; (c) UNVERIFIED flag, non-blocking — pass; (d) mid-investigation discovery events recorded — pass. Plain-language rule satisfied — pass. Schema path reference present — pass.

---

### TASK-04: Horizon checkpoint — pilot validation and downstream calibration

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan`; pilot validation notes in `docs/plans/startup-loop-build-reflection-gate/task-04-pilot-notes.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-build-reflection-gate/plan.md`, `docs/plans/startup-loop-build-reflection-gate/task-04-pilot-notes.md`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — process is defined; checkpoint always runs `/lp-do-replan` on downstream tasks.
  - Approach: 95% — pilot validation is a structured walkthrough, not novel work.
  - Impact: 95% — validates schema quality and surfaces any calibration needed before first real-build use.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run on any downstream tasks.
  - Pilot walkthrough: apply the `pattern-reflection.user.md` schema and access declarations schema (from TASK-01) retrospectively to at least 2 completed builds from `docs/plans/` that have existing `results-review.user.md` files. Produce a synthetic `pattern-reflection.user.md` for each.
  - At least 1 pattern entry of each routing category (deterministic, ad-hoc, or access-gap) is identified or the absence is documented as a finding.
  - Any schema calibration needs (fields too narrow, categories missing, routing thresholds wrong) are recorded in `task-04-pilot-notes.md`.
  - Operator sign-off on the pilot notes before the plan is archived.
- **Horizon assumptions to validate:**
  - The schema fields (pattern_summary, category, routing_target, occurrence_count) are sufficient to represent the patterns found in real builds.
  - The routing thresholds (3 for deterministic, 2 for ad-hoc) produce at least 1 actionable routing decision across the pilot builds.
  - The access declarations schema correctly represents the access verification state for at least one of the pilot builds.
- **Validation contract:** Pilot notes document at least 2 builds reviewed; at least 1 synthetic `pattern-reflection.user.md` produced and reviewed by the operator.
- **Planning validation:** Checkpoint task — no pre-planning validation required.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** `docs/plans/startup-loop-build-reflection-gate/task-04-pilot-notes.md` created; plan updated with checkpoint completion evidence.

---

## Risks and Mitigations

- Schema too complex → agents produce low-quality or empty entries | Medium | High | TASK-01 explicitly constrains required fields to 4 (pattern_summary, category, routing_target, occurrence_count); VC-02 for TASK-01 requires at least 1 real build to be translatable into the schema.
- SKILL.md instruction text violates plain-language rule → operator rejects or rewrites | Low | Medium | Both TASK-02 and TASK-03 include VC-01 review of the instruction text against the rule; reviewer sign-off is an acceptance criterion.
- Routing thresholds (3/2) prove too high or too low in pilot | Medium | Medium | TASK-04 CHECKPOINT explicitly validates thresholds in the pilot; `/lp-do-replan` is invoked if calibration is needed.
- TASK-01 SPIKE reveals `IdeaClassificationInput` incompatibility | Low | Medium | If incompatibility found: document in schema spec + add a mapping step to the SKILL.md instruction; does not block the plan.
- Operator doesn't produce `pattern-reflection.user.md` on early builds → gate is silent | Medium | Low | Instruction is built into SKILL.md completion sequence (mandatory for every build); soft-gate can be added as a follow-on hardening task.

## Observability

- Logging: `pattern-reflection.user.md` artifacts accumulate in `docs/plans/<feature-slug>/` — operator-readable after every build.
- Metrics: Count of builds producing `pattern-reflection.user.md` (target: 100% after rollout); count of entries with routing_target != `defer` (target: at least 1 per 5 builds).
- Alerts/Dashboards: None in this cycle; wiring to `generate-process-improvements.ts` in a follow-on cycle will make entries visible in `process-improvements.user.html`.

## Acceptance Criteria (overall)

- [ ] `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md` exists with full field spec, routing criteria, access declarations sub-schema, and at least 1 annotated fixture.
- [ ] `lp-do-build` SKILL.md contains new step 2.5 referencing the `pattern-reflection.user.md` schema and canonical artifact path.
- [ ] `lp-do-fact-find` SKILL.md contains a new "Access Declarations" step in Phase 2 or Phase 3.
- [ ] `docs/business-os/startup-loop/loop-output-contracts.md` contains a new `pattern-reflection` artifact entry.
- [ ] Pilot validation (`task-04-pilot-notes.md`) documents at least 2 completed builds reviewed; operator has acknowledged the notes.
- [ ] All SKILL.md instruction text passes the Operator-Facing Content: Plain Language Rule (no internal system nouns).

## Decision Log

- 2026-02-27: Chose instruction-first approach (Option A) over TypeScript-first (Option B). Rationale: schema needs real-build validation before emitter investment; matches how `results-review.user.md` was introduced before `reflection-debt.user.md` was hardened.
- 2026-02-27: Artifact base name defaulted to `pattern-reflection.user.md` pending operator confirmation (Open Q1 in fact-find). Plan proceeds with this default.
- 2026-02-27: Routing thresholds set at 3 (deterministic) and 2 (ad-hoc) as reasoned defaults. TASK-04 pilot validation will confirm or revise.

## Overall-confidence Calculation

- TASK-01: SPIKE, confidence 85%, effort M (weight 2)
- TASK-02: IMPLEMENT, confidence 80%, effort M (weight 2)
- TASK-03: IMPLEMENT, confidence 80%, effort S (weight 1)
- TASK-04: CHECKPOINT, confidence 95%, effort S (weight 1) — excluded from weighted average per convention (procedural task)

Weighted average (executable tasks only): (85×2 + 80×2 + 80×1) / (2+2+1) = (170 + 160 + 80) / 5 = 410/5 = **82%**

Overall-confidence: **82%** (auto-build eligible: at least one IMPLEMENT task at >=80 after SPIKE completes; SPIKE eligible immediately at 85%)

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: SPIKE — schema design | Yes — no upstream deps; source files are read-only references | None | No |
| TASK-02: IMPLEMENT — lp-do-build wiring | Partial — depends on TASK-01 schema spec; enforced by `Depends on: TASK-01` | None: dependency constraint is explicit and enforced | No |
| TASK-03: IMPLEMENT — lp-do-fact-find access declarations | Partial — depends on TASK-01 access declarations sub-schema; enforced by `Depends on: TASK-01` | None: dependency constraint is explicit and enforced | No |
| TASK-02 + TASK-03 parallel execution | Yes — `Affects` sets have no overlap (different SKILL.md files + loop-output-contracts.md vs fact-find SKILL.md) | None: writer-lock handles file isolation per wave-dispatch protocol | No |
| TASK-04: CHECKPOINT | Yes — depends on TASK-02 and TASK-03 both Complete; enforced by `Depends on` | None | No |
| loop-spec.yaml comment update (TASK-02) | Yes — comment-only change to DO stage block; no stage topology change | None | No |
| Downstream classifier compatibility (TASK-01 → TASK-02) | Partial — compatibility check is a TASK-01 deliverable; if incompatibility found, mapping step is added to TASK-02 | Minor: compatibility is asserted but not yet confirmed; TASK-01 VC-01 closes this | No |

---

## Validation Contracts (Summary)

| Contract ID | Task | Check | Pass Criterion |
|---|---|---|---|
| VC-01 (TASK-01) | TASK-01 | Schema spec reviewed against `lp-do-build-reflection-debt.ts` interface patterns | All required fields have TypeScript-compatible type annotation noted |
| VC-02 (TASK-01) | TASK-01 | At least 1 real historical `results-review.user.md` entry is translatable into the schema | Fixture documented in schema spec |
| VC-03 (TASK-01) | TASK-01 | Routing criteria decision tree has at least 2 worked examples | Documented in schema spec |
| VC-01 (TASK-02) | TASK-02 | SKILL.md diff reviewed against plain-language rule | Reviewer acknowledges diff |
| VC-02 (TASK-02) | TASK-02 | `loop-output-contracts.md` new entry follows `reflection-debt.user.md` entry structure | Side-by-side comparison shows no missing fields |
| VC-03 (TASK-02) | TASK-02 | Synthetic walkthrough on `xa-uploader-usability-hardening` context produces valid `pattern-reflection.user.md` | Walkthrough documented in build evidence |
| VC-01 (TASK-03) | TASK-03 | SKILL.md diff reviewed against plain-language rule | Reviewer acknowledges diff |
| VC-02 (TASK-03) | TASK-03 | Manual walkthrough on `brik-octorate-live-availability` context produces valid access declarations record | Walkthrough documented in build evidence |

## Open Decisions

- **Artifact base name (Open Q1 from fact-find):** The canonical name `pattern-reflection.user.md` is used throughout this plan as the working default. The `.user.md` suffix is fixed. The base name `pattern-reflection` is pending operator confirmation before `loop-output-contracts.md` is published. If the operator prefers a different base name, update all three affected files (SKILL.md, loop-output-contracts.md, task-01-schema-spec.md) before archiving. This does not block any build task — TASK-02 will use the default unless the operator states otherwise before TASK-02 begins.
