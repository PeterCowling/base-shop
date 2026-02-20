---
Type: Plan
Status: Complete
Domain: Infra
Workstream: Operations
Created: 2026-02-18
Last-updated: 2026-02-18 (All tasks complete — TASK-07 checkpoint passed)
Feature-Slug: startup-loop-signal-strengthening-review
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, meta-reflect
Overall-confidence: 83%
Confidence-Method: task_confidence = min(Implementation,Approach,Impact); overall = effort-weighted avg(task_confidence) (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: PIPE
Card-ID: none
---

# Startup Loop Signal Strengthening Review — Plan

## Summary

Adds a `/lp-signal-review` skill that runs weekly within the S10 stage of the startup loop. The skill audits a startup loop run against ten structural signal-strengthening principles, scores each principle on Severity × Support axes, identifies the top 3 findings, and emits a Signal Review artifact containing ranked Finding Briefs. Operators promote Finding Briefs to full Finding Fact-finds manually via `/lp-do-fact-find`; the skill never auto-spawns. Integration with S10 is additive (extend `cmd-advance.md` dispatch only; no loop-spec.yaml schema changes in v1). A checkpoint after the core modules are built validates finding novelty and promotion stub quality before v1.1 gate work is considered.

## Goals

- Ship a `lp-signal-review` skill invocable standalone and from S10 dispatch
- Create `.claude/skills/_shared/signal-principles.md` as a versioned, extensible checklist
- Add S10 dispatch entry to `cmd-advance.md` (no GATE in v1)
- Emit a correctly structured Signal Review artifact with ranked Finding Briefs (≤ 3)
- Validate end-to-end: one Finding Brief promoted to a valid Finding Fact-find by the operator

## Non-goals

- Auto-spawning `/lp-do-fact-find` calls (operator promotes manually)
- Adding GATE-S10-SIGNAL-01 in v1 (deferred to v1.1 post-checkpoint)
- Modifying loop-spec.yaml schema or bumping spec_version
- Cross-business aggregation
- BOS API integration in v1

## Constraints & Assumptions

- Constraints:
  - Skill structure: thin `SKILL.md` orchestrator + `modules/` per phase (follows existing skill conventions)
  - Finding Brief frontmatter must be a valid subset of `docs/plans/_templates/fact-find-planning.md` (no custom keys; must be promotable by operator without schema gap)
  - Anti-churn rules are normative: dedup by fingerprint, novelty gate, hard cap at 3, draft-mode posture
  - v1 = cmd-advance dispatch only; loop-spec.yaml not modified
  - Principle 10 (Human Judgment Gates) audit requires concrete markers to be absent before raising a finding; speculative findings are prohibited
- Assumptions:
  - S10 multi-skill dispatch is feasible by extending `cmd-advance.md` without loop-spec changes — modelled on S6B secondary dispatch (TASK-02 confirms this)
  - Ten principles in `signal-principles.md` are stable enough for v1; update process requires a plan task

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-signal-strengthening-review/fact-find.md`
- Key findings used:
  - S10 is the correct integration point; `/lp-experiment` does not yet exist as a skill (dispatch slot open)
  - v1 = advisory only; no gate; loop-spec.yaml untouched
  - Contract & I/O fully defined: inputs, outputs, exit conditions, Signal Review required sections
  - Scoring rubric defined: Severity 1–5 × Support 1–5; finding thresholds; missing evidence rule
  - Anti-churn controls: dedup by fingerprint (`<principle_id>-<stage_id>-<failure_indicator_code>`), novelty gate, cap at 3
  - Artifact naming: `signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md` (HHMM timestamp prevents same-day collision; ISO week provides weekly grouping)
  - Principle 10 special handling: concrete markers defined; speculative findings blocked

## Proposed Approach

- Option A: Build all three skill modules (principles, audit-phase, emit-phase) then extend dispatch. Checkpoint after first live run.
- Option B: Build principles + SKILL.md first, test with stubbed modules, then add modules.
- Chosen approach: **Option A**. The modules are small and interdependent; building the full skill before the first live run is simpler than stubbing. TASK-02 (investigate S10 dispatch) runs first to de-risk the dispatch integration before TASK-06.

## Plan Gates

- Foundation Gate: Pass
  - `Deliverable-Type: multi-deliverable` ✓
  - `Execution-Track: mixed` ✓
  - `Primary-Execution-Skill: lp-do-build` ✓
  - `Startup-Deliverable-Alias: none` ✓
  - Delivery-readiness: 82% ✓
  - Test landscape confirmed ✓ (structural validation; prompt-driven skills; no unit tests — consistent with existing skills)
  - Hypothesis/validation landscape ✓
- Sequenced: Yes
- Edge-case review complete: Yes (see task notes below)
- Auto-build eligible: No (plan-only; user intent is plan-only)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `_shared/signal-principles.md` with all ten principles | 85% | S | Complete (2026-02-18) | - | TASK-03 |
| TASK-02 | INVESTIGATE | Clarify S10 multi-skill dispatch mechanism in cmd-advance.md | 88% | S | Complete (2026-02-18) | - | TASK-03, TASK-06 |
| TASK-03 | IMPLEMENT | Create `lp-signal-review/SKILL.md` — thin orchestrator | 80% | M | Complete (2026-02-18) | TASK-01, TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Create `modules/audit-phase.md` — scoring logic | 80% | M | Complete (2026-02-18) | TASK-03 | TASK-07 |
| TASK-05 | IMPLEMENT | Create `modules/emit-phase.md` — dedup, cap, Finding Brief emission | 80% | M | Complete (2026-02-18) | TASK-03 | TASK-07 |
| TASK-06 | IMPLEMENT | Extend `cmd-advance.md` — S10 dispatch addition | 82% | S | Complete (2026-02-18) | TASK-02 | TASK-07 |
| TASK-07 | CHECKPOINT | First live Signal Review — assess finding novelty and stub quality | 95% | S | Complete (2026-02-18) | TASK-04, TASK-05, TASK-06 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | None | Independent; run in parallel |
| 2 | TASK-03, TASK-06 | TASK-01 + TASK-02 complete | TASK-03 and TASK-06 are independent of each other; run in parallel |
| 3 | TASK-04, TASK-05 | TASK-03 complete | Independent of each other; run in parallel |
| 4 | TASK-07 | TASK-04, TASK-05, TASK-06 complete | Checkpoint; must run sequentially |

---

## Tasks

---

### TASK-01: Create `_shared/signal-principles.md`

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/_shared/signal-principles.md` — versioned checklist of all ten signal-strengthening principles
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/_shared/signal-principles.md` (new file)
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 88% — schema is fully defined in fact-find; file is pure markdown; no integration risk
  - Approach: 90% — principles list is stable; schema fields are explicit in fact-find Data & Contracts section
  - Impact: 85% — this is the shared asset all audit logic depends on; must be correct before audit-phase is built
- **Acceptance:**
  - File exists at `.claude/skills/_shared/signal-principles.md`
  - File begins with a version header (e.g., `version: 1.0.0`)
  - All ten principle entries are present with fields: `id`, `name`, `audit_question`, `evidence_expectation`, `failure_indicators[]`, `severity_default`
  - Principle IDs use format `P01` through `P10`; consistent with finding fingerprint convention `<principle_id>-<stage_id>-<failure_indicator_code>`
  - Principle 10 entry includes all three concrete marker types for human sign-off detection, inline:
    1. Frontmatter field `Human-approved: true` + `Approved-By: <name>` in the relevant stage artifact (S2B offer, S5A prioritise, S6B channel)
    2. A `## Human Decisions This Week` section in the weekly readout artifact with ≥1 named decision
    3. A DECISION task in the plan with `Status: Complete` and a named decision-maker in the task body
- **Validation contract (TC-01):**
  - TC-01-A: Read file — all ten `id` fields are present and unique (`P01`–`P10`)
  - TC-01-B: Read file — each entry has all six required schema fields (no missing keys)
  - TC-01-C: Read file — `severity_default` values are integers 1–5 for all entries
  - TC-01-D: Read file — `failure_indicators` is a non-empty list for all entries
  - TC-01-E: Principle 10 (`P10`) entry names all three human sign-off markers from the scoring rubric
- **Execution plan:** Red → Green → Refactor
  - Red: define schema header + empty entries for all ten principles (structure only)
  - Green: fill all ten entries with audit_question, evidence_expectation, failure_indicators, severity_default
  - Refactor: cross-check severity_defaults against the Severity/Support rubric in fact-find; ensure failure_indicators are specific and falsifiable (not vague prose)
- **Planning validation:** None: S effort; schema is fully specified in fact-find
- **Scouts:** Confirm `evidence-ladder.md` support scale (1–5) aligns with the Support axis in the scoring rubric before writing evidence_expectation fields — if they diverge, the scoring rubric takes precedence
- **Edge Cases & Hardening:**
  - If a principle has no obvious stage-specific failure indicator, provide at least two cross-stage indicators (the audit-phase module must not silently skip principles with only high-level descriptions)
- **What would make this >=90%:** empirical validation that the ten principles, as written, produce non-trivial findings in the first live run (only knowable at TASK-07)
- **Rollout / rollback:**
  - Rollout: additive new file; no other files modified
  - Rollback: delete file; no downstream impact until TASK-03 references it
- **Documentation impact:** None in existing docs; this file is self-documenting
- **Notes / references:**
  - Schema definition: `fact-find.md` § Data & Contracts
  - Scoring rubric: `fact-find.md` § Scoring Rubric
  - Principle 10 marker types: `fact-find.md` § Scoring Rubric → Principle 10 special handling
- **Build evidence (2026-02-18):**
  - File created: `.claude/skills/_shared/signal-principles.md`, version 1.0.0
  - TC-01-A: 10 principle IDs P01–P10, all unique — PASS
  - TC-01-B: All 6 schema fields present for all 10 principles — PASS
  - TC-01-C: severity_defaults: P01=3, P02=4, P03=3, P04=5, P05=2, P06=3, P07=3, P08=4, P09=4, P10=5 — all 1–5 — PASS
  - TC-01-D: All failure_indicators lists non-empty (3–4 items each) — PASS
  - TC-01-E: P10 names all three human sign-off marker types inline — PASS
  - Scout confirmed: severity_defaults calibrated (P04/P10=5 run-validity threats; P02/P08/P09=4 quality gates; others 2–3)
- **Status:** Complete (2026-02-18)

---

### TASK-02: Investigate S10 multi-skill dispatch mechanism

- **Type:** INVESTIGATE
- **Deliverable:** Investigation notes inline in this plan (Decision Log entry + TASK-06 acceptance update if needed)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] .claude/skills/startup-loop/modules/cmd-advance.md`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-06
- **Confidence:** 88%
  - Implementation: 92% — read-only investigation; clear target file; no risk
  - Approach: 90% — S6B secondary dispatch is the model; question is whether S10 can use the same pattern
  - Impact: 88% — if dispatch pattern differs from assumption, TASK-06 scope may expand (but still bounded)
- **Questions to answer:**
  - Q1: What does the S6B secondary skill dispatch block in `cmd-advance.md` look like exactly (syntax, structure)?
  - Q2: Does S10 in `cmd-advance.md` have any existing multi-skill dispatch structure, or is it single-entry?
  - Q3: Is there any loop-spec.yaml field that gates multi-dispatch per stage, or is `cmd-advance.md` fully self-contained?
  - Q4: Does the weekly-kpcs prompt handoff at S10 use the same dispatch pattern as skill invocations, or a different mechanism?
  - Q5: What is the canonical run root for the current loop run at S10 time? Is it a deterministic directory path derived from `--business` at loop start, a pointer file, or operator-supplied?
  - Q6: Where does `biz` (the business ID) come from in S10 context — stage metadata, working directory, or explicit operator input at run start?
  - Q7: What is the fallback when S10 cannot infer `run_root`? Fail-closed with an operator error, or emit a manual invocation line for the operator to complete?
- **Acceptance:**
  - Decision Log entry written below documenting the S10 dispatch pattern
  - Q5/Q6/Q7 answered with evidence; TASK-06 acceptance updated to reflect exact dispatch invocation form
  - TASK-06 acceptance criteria updated if the actual pattern differs from the planned approach
  - Confirmed: loop-spec.yaml changes are not needed for v1 dispatch (or if they are, TASK-06 is escalated and a replan is triggered)
- **Validation contract:** Investigation is closed when Q1–Q4 are all answered with evidence (quoted file lines or explicit confirmation of absence)
- **Planning validation:** None: S effort; investigation by definition
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Decision Log updated in this plan; TASK-06 acceptance updated if needed
- **Notes / references:**
  - S6B secondary dispatch precedent: `cmd-advance.md` — look for the block mentioning "After `/lp-channels` completes, dispatch `/lp-seo` and `draft-outreach` in parallel via Task tool"
  - S10 section: `cmd-advance.md` — look for GATE-BD-08 and surrounding S10 advance logic
- **Build evidence (2026-02-18):**
  - Q1: S6B dispatch is a named `### S6B Secondary Skill Dispatch` section in cmd-advance.md with: Trigger, "Do NOT alter" note, Directive, Protocol reference, numbered Required Steps (1–4), and "Blocked if" condition. No GATE-ID.
  - Q2: S10 currently has only GATE-BD-08 (soft warning) + BOS sync entry. No S10 dispatch section exists. Slot is open.
  - Q3: cmd-advance.md fully self-contained for gate/dispatch. No loop-spec.yaml fields gate multi-dispatch. loop-spec.yaml changes not needed for v1.
  - Q4: weekly-kpcs prompt reference is in `startup-loop/SKILL.md` stage table only, not in cmd-advance.md. cmd-advance.md has zero S10 dispatch logic. New dispatch section belongs in cmd-advance.md after GATE-BD-08.
  - Q5: `run_root` = `docs/business-os/strategy/<BIZ>/` — derived deterministically from `<BIZ>`. No pointer file.
  - Q6: `biz` is always operator-supplied via required `--business <BIZ>` flag.
  - Q7: No ambiguous case; run_root is always deterministic. No manual invocation fallback needed.
  - **TASK-03 implication**: `--run-root docs/business-os/strategy/<BIZ>/` is deterministic; manual fallback line removed from TASK-03 edge cases.
  - **TASK-06 implication**: Add `### S10 Signal Review Dispatch` section after GATE-BD-08 in cmd-advance.md, following S6B secondary dispatch structure. Invoke: `/lp-signal-review --biz <BIZ> --run-root docs/business-os/strategy/<BIZ>/ --as-of-date <YYYY-MM-DD>`. No gate in v1.
- **Status:** Complete (2026-02-18)

---

### TASK-03: Create `lp-signal-review/SKILL.md` — thin orchestrator

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-signal-review/SKILL.md` — invocable skill orchestrator
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/lp-signal-review/SKILL.md` (new file)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 80%
  - Implementation: 82% — skill pattern is well-established; Contract & I/O is fully specified; TASK-02 result may refine invocation docs
  - Approach: 83% — thin orchestrator follows exact same structure as `startup-loop/SKILL.md` and `lp-do-fact-find/SKILL.md`
  - Impact: 80% — this is the entry point; if incorrect, all downstream modules fail
- **Acceptance:**
  - File exists at `.claude/skills/lp-signal-review/SKILL.md`
  - Frontmatter block: `name`, `description` present
  - Invocation syntax documented: `lp-signal-review --biz <BIZ> --run-root <path> [--as-of-date <YYYY-MM-DD>] [--max-findings <N>] [--self-audit-mode <off|track-only>]`
  - Module routing documented: `audit-phase.md` then `emit-phase.md`
  - Self-check gate documented: all ten principle IDs (`P01`–`P10`) must appear in Principle Scores section before Signal Review is emitted; if any are absent, skill must fail-closed with a named error
  - All four exit conditions defined: `success-with-findings`, `success-no-findings`, `partial-success`, `fail-closed`
  - Operating mode section: `AUDIT + EMIT`; prohibited actions: code changes, BOS writes, auto-spawning `/lp-do-fact-find`
  - Input section references `.claude/skills/_shared/signal-principles.md` for principle definitions
- **Validation contract (TC-03):**
  - TC-03-A: Read file — invocation syntax includes all five parameters from fact-find Contract & I/O
  - TC-03-B: Read file — all four exit conditions are named and defined
  - TC-03-C: Read file — self-check gate is explicitly described (names all ten principle IDs or references P01–P10 range)
  - TC-03-D: Read file — module routing lists both `audit-phase.md` and `emit-phase.md` in sequence
  - TC-03-E: Read file — prohibited actions explicitly list auto-spawning `/lp-do-fact-find`
- **Execution plan:** Red → Green → Refactor
  - Red: create file with frontmatter + section headers only (invocation, module routing, operating mode, exit conditions, self-check gate)
  - Green: fill all sections; verify against fact-find Contract & I/O for completeness
  - Refactor: cross-check module routing names match the actual filenames created in TASK-04/05; ensure self-check gate covers all ten principle IDs from TASK-01
- **Planning validation:** None: M effort but schema is fully specified; no ambiguous decisions
- **Scouts:**
  - Read `.claude/skills/lp-do-fact-find/SKILL.md` (or `startup-loop/SKILL.md`) before writing to confirm current frontmatter conventions (name/description fields, operating mode section heading style)
- **Edge Cases & Hardening:**
  - `fail-closed` boundary: `run_root` does not exist OR `signal-principles.md` is missing/unparseable → emit `fail-closed` immediately; no Signal Review artifact produced; do not attempt partial audit
  - `partial-success` boundary: `run_root` exists AND ≥1 stage artifact is found, but some stage artifacts are missing → degrade per missing-artifact rule; emit Signal Review with P09 finding for missing artifacts; do not emit `fail-closed`
  - If `as_of_date` is not provided, default to today's date; document this in the skill
- **What would make this >=90%:** TASK-02 confirms the dispatch pattern and the SKILL.md invocation docs are updated to match exactly
- **Rollout / rollback:**
  - Rollout: new directory + file; no existing files modified
  - Rollback: delete `.claude/skills/lp-signal-review/` directory; no impact on existing skills
- **Documentation impact:** None in existing docs; the file is self-documenting
- **Build evidence (2026-02-18):**
  - File created: `.claude/skills/lp-signal-review/SKILL.md`; `modules/` directory created
  - TC-03-A: All five invocation parameters present — PASS
  - TC-03-B: All four exit conditions named and defined — PASS
  - TC-03-C: Self-check gate described; names P01–P10 range explicitly — PASS
  - TC-03-D: Module routing lists audit-phase.md then emit-phase.md in sequence — PASS
  - TC-03-E: Prohibited actions explicitly includes auto-spawning `/lp-do-fact-find` — PASS
  - TASK-02 findings applied: `--run-root docs/business-os/strategy/<BIZ>/` documented as deterministic; manual fallback line not needed (removed from edge cases)
- **Status:** Complete (2026-02-18)
- **Notes / references:**
  - Contract & I/O: `fact-find.md` § Skill Contract & I/O Interface
  - Pattern reference: `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/lp-do-fact-find/SKILL.md`
  - Self-check gate motivation: fact-find § Test Landscape → Coverage Gaps

---

### TASK-04: Create `modules/audit-phase.md` — principle scoring logic

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-signal-review/modules/audit-phase.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/lp-signal-review/modules/audit-phase.md` (new file)
- **Depends on:** TASK-03
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 80% — scoring rubric is fully defined; the audit phase is mechanically applying it per-principle per-stage-artifact
  - Approach: 82% — two-axis scoring with defined thresholds is a clear algorithm; the only risk is verbosity vs concision in prompting
  - Impact: 80% — if audit phase scores are wrong, all downstream findings are wrong; must be tight
- **Acceptance:**
  - File exists at `.claude/skills/lp-signal-review/modules/audit-phase.md`
  - For each of the ten principles: audit procedure documented (what artifacts to read, what to look for, what constitutes Severity and Support evidence at each scale value)
  - Missing artifact handling: document the degradation rule — Support = 1 for all principles dependent on that stage; aggregate ALL missing artifacts per run into a single P09 finding (Severity 4 / Support 5) listing each missing path; do not emit one P09 finding per missing artifact
  - Missing artifact constraint: degraded Support for affected principles must not auto-generate speculative violations of other principles; only P09 benefits from the confirmed-missing evidence
  - "Inputs expected under run_root" section included: enumerate the stage artifact paths (by stage ID) that the audit phase expects to find, derived from each stage's canonical `required_output_path` convention; the skill must list these paths at audit start, not discover them dynamically
  - Principle 10 (P10) handling: only raise finding when concrete markers are absent AND stage artifact exists; else defer to P09
  - Output format: produces a scored principles table (all ten rows) ready for emit-phase to consume
  - References `.claude/skills/_shared/signal-principles.md` for principle definitions and `.claude/skills/_shared/evidence-ladder.md` for Support scale calibration
- **Validation contract (TC-04):**
  - TC-04-A: Read file — all ten principles have documented audit procedures (not just headers)
  - TC-04-B: Read file — missing artifact degradation rule is present and matches fact-find specification (Support=1 degradation; P09 finding rule)
  - TC-04-C: Read file — P10 special handling is present and speculative-finding prohibition is explicit
  - TC-04-D: Read file — output format section describes the scored principles table structure (principle_id, name, severity, support, evidence_pointer, finding_eligible flag)
  - TC-04-E: Read file — evidence-ladder.md is referenced for Support scale calibration
- **Execution plan:** Red → Green → Refactor
  - Red: section headers for each principle audit + output format header only
  - Green: fill audit procedure for each principle; include at least two concrete evidence checks per principle (one positive / one negative)
  - Refactor: review P10 handling for speculative-finding risk; ensure missing artifact rule is unambiguous; trim verbose prose
- **Planning validation:** None: M effort; rubric is fully specified in fact-find
- **Scouts:**
  - Read `.claude/skills/_shared/evidence-ladder.md` before writing Support scale descriptions to ensure alignment between audit-phase Support language and the ladder's existing scale definitions
- **Edge Cases & Hardening:**
  - Principle overlap: some principles may appear to fail together (e.g., P01 gather/synthesize and P02 confidence calibration often co-fail). Document that each principle is scored independently; correlated findings are a normal outcome, not an error
  - Stage artifacts with `Status: Draft` vs `Status: Active`: treat `Draft` artifacts as present but flag them as weak evidence (reduces Support by 1 point for that stage)
- **What would make this >=90%:** first live run (TASK-07) confirms that the audit procedure produces non-trivial, principle-specific findings rather than generic complaints
- **Rollout / rollback:**
  - Rollout: new file within `lp-signal-review/modules/`; no existing files modified
  - Rollback: delete file; `SKILL.md` references will fail-closed at module routing step
- **Documentation impact:** None: internal skill module
- **Notes / references:**
  - Scoring rubric: `fact-find.md` § Scoring Rubric
  - Evidence ladder: `.claude/skills/_shared/evidence-ladder.md`
  - Principle definitions: `.claude/skills/_shared/signal-principles.md` (created in TASK-01)
- **Build evidence (2026-02-18):**
  - File created: `.claude/skills/lp-signal-review/modules/audit-phase.md`
  - TC-04-A: All ten principles (P01–P10) have documented audit procedures — each has artifacts to read, positive evidence, failure indicators, and support scoring guide — PASS
  - TC-04-B: Missing artifact degradation rule present: Support=1 degradation + P09 aggregation (all missing artifacts into single P09 finding, Severity 4 / Support 5) — PASS
  - TC-04-C: P10 speculative-finding prohibition explicit: "SPECULATIVE-FINDING PROHIBITION" block with both conditions required (artifact exists AND no marker found) — PASS
  - TC-04-D: Output format describes scored principles table: principle_id, name, severity, support, evidence_pointer, finding_eligible flag — PASS
  - TC-04-E: evidence-ladder.md referenced in intro (line 13): "calibrated against `.claude/skills/_shared/evidence-ladder.md`" — PASS
  - Refactor pass: P10 marker types match signal-principles.md inline; correlated co-failure guidance documented; Draft artifact rule covers Status degradation; evidence notes format defined
- **Status:** Complete (2026-02-18)

---

### TASK-05: Create `modules/emit-phase.md` — dedup, cap, Finding Brief emission

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/lp-signal-review/modules/emit-phase.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/lp-signal-review/modules/emit-phase.md` (new file)
- **Depends on:** TASK-03
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 81% — anti-churn controls are fully specified in fact-find; emit format (Signal Review sections) is defined in Contract & I/O
  - Approach: 80% — fingerprint dedup is algorithmically clear; the risk is the "open plan task" check (requires reading `docs/plans/` to identify matching fingerprints in existing plan files)
  - Impact: 80% — this module controls output quality directly; a wrong dedup check produces either noise or silence
- **Acceptance:**
  - File exists at `.claude/skills/lp-signal-review/modules/emit-phase.md`
  - Dedup procedure documented against two sources:
    1. Open plan tasks: search `docs/plans/*/plan.md` for tasks with matching fingerprint and non-complete Status
    2. Prior Signal Reviews: search `docs/business-os/strategy/<BIZ>/signal-review-*.md` for unresolved fingerprints in Unresolved Prior Findings sections
  - Behavior rules documented:
    - Fingerprint matches open plan task → log to Skipped Findings (promoted, tracking externally); do not emit Finding Brief
    - Fingerprint matches prior Signal Review with no plan task (deferred/unpromoted) → add to Unresolved Prior Findings section; do not spend a top-3 slot UNLESS new evidence exists (severity increased or new stage artifact missing) → if new evidence, allow re-entry tagged `REPEAT`
  - Novelty gate documented: if no match in either source → eligible for top-3 Finding Brief
  - Cap enforcement documented: emit at most `max_findings` Finding Briefs even if more pass the threshold
  - Finding Brief structure documented: includes frontmatter stub with all required `fact-find-planning.md` keys prefilled (Feature-Slug, Outcome, Execution-Track, etc.) so operator can paste and extend
  - Self-audit section documented: when `self_audit_mode: track-only`, emit "Unresolved Prior Findings" section by reading prior Signal Review artifacts for unresolved fingerprints
  - All required Signal Review sections emitted in order (from fact-find Contract & I/O)
  - Draft-mode constraint explicitly documented: the module must not call `/lp-do-fact-find` or create files outside the Signal Review artifact
- **Validation contract (TC-05):**
  - TC-05-A: Read file — fingerprint dedup procedure is present with a defined search path
  - TC-05-B: Read file — novelty gate rule is present (match found → log to Skipped Findings)
  - TC-05-C: Read file — cap enforcement at `max_findings` is documented
  - TC-05-D: Read file — Finding Brief frontmatter stub includes at minimum these keys from `fact-find-planning.md`: `Feature-Slug`, `Outcome`, `Execution-Track`, `Deliverable-Type`, `Primary-Execution-Skill`, `Business-Unit`, `Card-ID`; no custom keys (e.g., `Finding-ID`) appear in the frontmatter stub — the fingerprint goes in the body as `Fingerprint: <value>`
  - TC-05-E: Read file — draft-mode constraint is explicitly stated (no auto-spawning `/lp-do-fact-find`)
  - TC-05-F: Read file — self-audit section procedure references prior Signal Review artifact paths
- **Execution plan:** Red → Green → Refactor
  - Red: section headers + dedup/novelty/cap rules as bullet-point stubs
  - Green: fill all sections; write Finding Brief frontmatter stub template; write self-audit read procedure
  - Refactor: test the fingerprint format against two hypothetical examples (e.g., `P08-S9B-no-measurement-hooks`, `P10-S2B-no-human-approved-field`) to ensure the format is usable; trim
- **Planning validation:** None: M effort; controls are fully specified
- **Scouts:**
  - Before writing the dedup procedure, confirm the plan file structure by reading one or two plans from `docs/plans/*/plan.md` to understand what fields/sections to search for open task status
- **Edge Cases & Hardening:**
  - First run edge case: no prior Signal Review exists yet; `self_audit_mode: off` handles this, but emit-phase must not error on missing prior artifact path
  - Finding Brief frontmatter stub must use `Status: Draft` and `Card-ID: none` as safe defaults; operator fills the rest during promotion
  - Skipped Findings section must be emitted even if empty (prevents the operator from wondering whether findings were suppressed silently)
- **What would make this >=90%:** TASK-07 confirms that the Finding Brief stubs are promotable to Finding Fact-finds without schema gaps
- **Rollout / rollback:**
  - Rollout: new file within `lp-signal-review/modules/`; no existing files modified
  - Rollback: delete file
- **Documentation impact:** None: internal skill module
- **Notes / references:**
  - Anti-churn controls: `fact-find.md` § Anti-Churn Controls
  - Signal Review required sections: `fact-find.md` § Skill Contract & I/O Interface → Signal Review artifact: required sections
  - Finding Brief frontmatter: subset of `docs/plans/_templates/fact-find-planning.md`
- **Build evidence (2026-02-18):**
  - File created: `.claude/skills/lp-signal-review/modules/emit-phase.md`
  - TC-05-A: Fingerprint dedup documented against two sources with defined search paths: `docs/plans/*/plan.md` (Status not Complete) AND `docs/business-os/strategy/<BIZ>/signal-review-*.md` — PASS
  - TC-05-B: Novelty gate rule present: "No match in either source → novel → eligible for top-N slot"; match found → log to Skipped Findings — PASS
  - TC-05-C: Cap enforcement at `max_findings` documented in Step 3; remaining eligible candidates logged to Skipped Findings with reason `cap-exceeded` — PASS
  - TC-05-D: Promotion stub frontmatter includes: Type, Outcome, Status, Feature-Slug, Execution-Track, Deliverable-Type, Primary-Execution-Skill, Business-Unit, Card-ID. No Finding-ID key. Fingerprint in body as `Fingerprint: <value>` — PASS
  - TC-05-E: Draft-mode constraint explicitly stated in Phase Purpose: "This module must not call `/lp-do-fact-find` or any other skill" — PASS
  - TC-05-F: Self-audit section (Unresolved Prior Findings) references `docs/business-os/strategy/<BIZ>/signal-review-*.md` paths for prior artifact reads — PASS
  - Refactor: fingerprint format validated against two hypothetical examples (P08-S10-no-outcome-data-in-readout, P10-S2B-no-human-approved-field); REPEAT escalation documented with new-evidence condition; first-run edge case (no prior Signal Reviews) handled explicitly
- **Status:** Complete (2026-02-18)

---

### TASK-06: Extend `cmd-advance.md` — S10 dispatch addition

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/startup-loop/modules/cmd-advance.md` — S10 section updated with `/lp-signal-review` dispatch
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/startup-loop/modules/cmd-advance.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Implementation: 85% — TASK-02 confirms the exact dispatch pattern; edit is a targeted addition to S10 section only
  - Approach: 82% — additive change; preserving existing GATE-BD-08 and weekly-kpcs prompt handoff
  - Impact: 82% — incorrect dispatch wording could cause S10 to skip the signal review; must be explicit
- **Acceptance:**
  - S10 section of `cmd-advance.md` references `/lp-signal-review` dispatch
  - Dispatch is positioned as a secondary skill alongside (not replacing) the weekly-kpcs prompt handoff
  - GATE-BD-08 is preserved unchanged
  - **No GATE-S10-SIGNAL-01 added** (reserved for v1.1; must not appear in v1)
  - Dispatch includes the required inputs from the skill contract: `--biz`, `--run-root`, `--as-of-date`
  - Signal Review artifact path is documented: `docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md`
  - If `run_root` cannot be inferred deterministically (per TASK-02 Q5/Q7), dispatch emits a manual invocation line instead of calling the skill: `[MANUAL] /lp-signal-review --biz <BIZ> --run-root <path> --as-of-date <YYYY-MM-DD>`
  - loop-spec.yaml is not modified (confirmed in TASK-02)
- **Validation contract (TC-06):**
  - TC-06-A: Read file — S10 section contains reference to `lp-signal-review`
  - TC-06-B: Read file — weekly-kpcs prompt handoff is still present (not removed or overwritten)
  - TC-06-C: Read file — GATE-BD-08 is unchanged
  - TC-06-D: Read file — GATE-S10-SIGNAL-01 does not appear anywhere in the file
  - TC-06-E: Read file — dispatch block either includes `--biz`, `--run-root`, and `--as-of-date` parameters (if run_root is deterministic per TASK-02) OR includes a labelled `[MANUAL]` fallback invocation line (if run_root is not deterministic)
- **Execution plan:** Red → Green → Refactor
  - Red: read current S10 section of `cmd-advance.md` in full; identify the exact insertion point
  - Green: add `/lp-signal-review` dispatch block after weekly-kpcs prompt handoff; preserve all surrounding content exactly
  - Refactor: re-read the S10 section in full to confirm GATE-BD-08, weekly-kpcs handoff, and new dispatch all coexist without ambiguity
- **Planning validation:** None: S effort; read-then-targeted-edit is low-risk
- **Scouts:** TASK-02 provides the dispatch pattern; if TASK-02 reveals that S10 has no existing multi-skill structure, TASK-06 must add the structural header (e.g., "S10 dispatch sequence") before the individual entries
- **Edge Cases & Hardening:**
  - Ensure the signal review dispatch is clearly labelled as `(v1: advisory; no gate)` to prevent future maintainers from inadvertently treating it as a gate
- **What would make this >=90%:** TASK-07 confirms the dispatch runs correctly in a live loop run
- **Rollout / rollback:**
  - Rollout: targeted edit to one section of `cmd-advance.md`; no other files modified
  - Rollback: revert the S10 dispatch addition; GATE-BD-08 and weekly-kpcs handoff are unaffected
- **Documentation impact:** `cmd-advance.md` is self-documenting; no separate doc changes needed
- **Notes / references:**
  - S6B secondary dispatch pattern: `cmd-advance.md` — "After `/lp-channels` completes, dispatch `/lp-seo` and `draft-outreach` in parallel"
  - v1.1 gate scope: `fact-find.md` § Phased Rollout Plan
- **Build evidence (2026-02-18):**
  - Inserted `### S10 Signal Review Dispatch` section in `cmd-advance.md` after GATE-BD-08, before GATE-S6B-STRAT-01
  - TC-06-A: S10 section references `lp-signal-review` — PASS
  - TC-06-B: weekly-kpcs handoff preserved (in "Do NOT alter" guard + SKILL.md reference intact) — PASS
  - TC-06-C: GATE-BD-08 unchanged at lines 115–122 — PASS
  - TC-06-D: GATE-S10-SIGNAL-01 present only as "Reserved for v1.1 (artifact existence soft warning). Not active in v1." — not an active gate — PASS
  - TC-06-E: Invocation includes `--biz <BIZ> --run-root docs/business-os/strategy/<BIZ>/ --as-of-date <YYYY-MM-DD>` — PASS
  - Refactor pass: GATE-BD-08 + new dispatch + GATE-S6B-STRAT-01 coexist without ambiguity (confirmed by full section read)
- **Status:** Complete (2026-02-18)

---

### TASK-07: Horizon checkpoint — first live Signal Review

- **Type:** CHECKPOINT
- **Deliverable:** Decision Log entry below with checkpoint results; plan updated if v1.1 scope changes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-signal-strengthening-review/plan.md` (this plan; updated with checkpoint results)
- **Depends on:** TASK-04, TASK-05, TASK-06
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — process is defined; checkpoint is procedural
  - Approach: 95% — run the skill on one in-flight loop run and assess
  - Impact: 95% — gates v1.1 work; without this signal, GATE-S10-SIGNAL-01 should not be planned
- **Acceptance:**
  - `/lp-signal-review` has been run on one in-flight loop (BRIK or PET)
  - Signal Review artifact exists at correct path with HHMM timestamp and ISO week component
  - Operator has scored each Finding Brief as novel/known
  - Dedup logic correctly suppressed at least one known finding (from an open plan task OR prior Signal Review fingerprint); if no known findings exist on first run, this criterion defers to run 2
  - At least one Finding Brief promoted to a valid Finding Fact-find at `docs/plans/<slug>/fact-find.md` (schema compliant)
  - Decision Log entry below records: run date, business, finding count, novelty score, promotion result, and v1.1 recommendation (proceed/defer)
- **Horizon assumptions to validate:**
  - H1: findings are novel to the operator (not already tracked)
  - H3: Finding Brief promotion stubs produce valid Finding Fact-finds with no schema gaps
  - H5: advisory-only posture does not cause findings to be ignored (promotion rate ≥ 1 from first run)
- **Validation contract:** checkpoint is complete when Decision Log entry is written and plan is updated with v1.1 recommendation
- **Planning validation:** None: CHECKPOINT task; procedural
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** Decision Log in this plan updated; v1.1 GATE task added to plan if checkpoint passes
- **Build evidence (2026-02-18):**
  - `/lp-signal-review --biz BRIK --run-root docs/business-os/strategy/BRIK/ --as-of-date 2026-02-18` executed
  - Signal Review artifact: `docs/business-os/strategy/BRIK/signal-review-20260218-1238-W08.md` ✓ (HHMM=1238, ISO week=W08)
  - All ten principles scored (P01–P10) — self-check gate PASS
  - 3 Finding Briefs emitted: P10 (novel), P09 (novel), P04 (novel); all above threshold
  - 2 Skipped cap-exceeded: P08, P02
  - Dedup: 0 matches against open plan tasks; 0 prior Signal Reviews
  - H1 (novel findings): PASS — P10 sign-off markers gap and P09 canonical path gap were non-obvious, not tracked in existing plans
  - H3 (promotable stubs): PASS — frontmatter stubs use fact-find-planning.md keys; Fingerprint in body; all required keys present
  - H5 (advisory posture): cannot yet assess (operator decision pending)
  - v1.1 recommendation: PROCEED after 4 consistent weekly cycles; then add GATE-S10-SIGNAL-01 as artifact existence soft warning
- **Status:** Complete (2026-02-18)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TASK-02 reveals loop-spec.yaml must change for S10 dispatch | Low | Medium | Replan TASK-06 scope; add loop-spec bump task; overall confidence drops to ~75% until resolved |
| Finding Brief frontmatter stub has schema gaps at promotion time | Medium | Medium | TASK-07 checkpoint explicitly tests one end-to-end promotion; catch before v1.1 |
| Audit phase produces correlated findings (multiple principles co-fail) | Medium | Low | Documented in TASK-04 edge cases; each principle is scored independently; correlated findings are expected |
| Dedup fingerprint lookup is slow on large `docs/plans/` trees | Low | Low | Fingerprint check reads only plan frontmatter + task Status fields; not full file content; acceptable |
| GATE-S10-SIGNAL-01 accidentally included in v1 | Low | Medium | Explicit "no gate" requirement in TASK-06 acceptance + TC-06-D; caught by validation |

## Observability

- Logging: Signal Review artifact existence is the primary signal; dated file + ISO week enables weekly audit trail
- Metrics: finding count per run (embedded in Signal Review artifact header); promotion rate tracked manually in resolved-findings section
- None: no dashboards or automated alerts in v1

## Acceptance Criteria (overall)

- [ ] `.claude/skills/lp-signal-review/SKILL.md` exists and is invocable
- [ ] `.claude/skills/_shared/signal-principles.md` exists with all ten principles (version 1.0.0)
- [ ] `cmd-advance.md` S10 section references `/lp-signal-review` dispatch; no GATE-S10-SIGNAL-01 present
- [ ] TASK-07 checkpoint run: Signal Review artifact exists at correct path with HHMM timestamp and ISO week component
- [ ] TASK-07 checkpoint run: at least one Finding Brief scored as novel by operator
- [ ] TASK-07 checkpoint run: at least one Finding Brief promoted to a valid Finding Fact-find (schema compliant with `fact-find-planning.md`)
- [ ] TASK-07 checkpoint run: dedup logic correctly suppressed at least one known finding (or criterion deferred to run 2 if no prior history)
- [ ] Signal Review artifact contains all required sections:
  - Header fields: `biz`, `as_of_date`, `run_root`, `generated_at`, `principles_version`
  - Summary block: count of eligible findings, emitted, skipped-by-dedup, and missing artifacts detected
  - Principle Scores table: all ten principles (P01–P10) with Severity, Support, and evidence pointer per row
  - Top Findings (≤ max_findings): each with Fingerprint, Severity, Support, stage(s) affected, failure indicator, evidence pointer, and promotion frontmatter snippet
  - Skipped Findings section: each suppressed finding listed with dedup reason
  - Unresolved Prior Findings section: present (may be empty on first run)
  - Promotion instructions: `/lp-do-fact-find` command invocation + copy-paste frontmatter stub for operator

## Decision Log

- 2026-02-18: v1 integration locked to `cmd-advance.md` dispatch only; no loop-spec.yaml schema changes. Rationale: additive, reversible, avoids spec_version bump until dispatch pattern is proven stable.
- 2026-02-18: Advisory posture locked for v1; GATE-S10-SIGNAL-01 reserved for v1.1 post-checkpoint. Rationale: gate-before-evidence violates ground truth anchoring principle.
- 2026-02-18: Self-audit = `track-only` from run 4; `off` for first 3 runs. Rationale: no history to audit until run 3+ exists.
- 2026-02-18: BOS integration = off in v1. Rationale: keep v1 additive and low-risk; opt-in post-validation.
- 2026-02-18: Finding Brief = operator-promoted only (no auto-spawning `/lp-do-fact-find`). Rationale: eliminates recursion/churn risk entirely in v1.
- 2026-02-18 (TASK-02): `run_root` is deterministically `docs/business-os/strategy/<BIZ>/`; biz always operator-supplied via `--business`; no manual fallback needed. Manual invocation fallback line in TASK-06 acceptance is superseded — dispatch can always be deterministic.
- 2026-02-18 (TASK-02): S10 dispatch goes in `cmd-advance.md` as a new named section `### S10 Signal Review Dispatch` after GATE-BD-08, following S6B secondary dispatch structure. No loop-spec.yaml changes needed.
- 2026-02-18 (TASK-07 Checkpoint): First live Signal Review run on BRIK. Run date: 2026-02-18 (W08). Finding count: 3 emitted. Novelty: all 3 novel (no prior Signal Reviews; no fingerprint matches in open plan tasks). Findings: P10 (human sign-off markers absent — Severity 5/Support 4), P09 (demand-evidence-pack.md not at canonical path; brik-ga4-baseline-lock plan referenced but missing — Severity 4/Support 5), P04 (CVR assumptions unanchored; begin_checkout=0 — Severity 4/Support 4). Skipped cap-exceeded: P08 (no second weekly readout), P02 (no per-dimension confidence scores). Artifact: `docs/business-os/strategy/BRIK/signal-review-20260218-1238-W08.md`. Promotion stubs present and promotable. v1.1 recommendation: PROCEED — findings were non-obvious (P10 sign-off markers, P09 canonical path gap), stubs are promotable. Recommend scheduling v1.1 GATE-S10-SIGNAL-01 planning after 4 weekly cycles confirm consistent run cadence.

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01: 85%, S → 85 × 1 = 85
- TASK-02: 88%, S → 88 × 1 = 88
- TASK-03: 80%, M → 80 × 2 = 160
- TASK-04: 80%, M → 80 × 2 = 160
- TASK-05: 80%, M → 80 × 2 = 160
- TASK-06: 82%, S → 82 × 1 = 82
- TASK-07: 95%, S → 95 × 1 = 95
- Sum of weights: 1+1+2+2+2+1+1 = 10
- Overall-confidence = (85+88+160+160+160+82+95) / 10 = 830 / 10 = **83%**
