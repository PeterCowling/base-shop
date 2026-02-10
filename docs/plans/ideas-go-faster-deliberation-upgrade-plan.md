---
Type: Plan
Status: Draft
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-10
Last-updated: 2026-02-10
Last-reviewed: 2026-02-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-go-faster-deliberation-upgrade
Related-Fact-Find: docs/plans/ideas-go-faster-deliberation-upgrade-fact-find.md
Deliverable-Type: code-change
Execution-Track: mixed
Primary-Execution-Skill: build-feature
Supporting-Skills: re-plan
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact) after scope right-sizing + mechanism hardening
Business-OS-Integration: off
Business-Unit: BOS
---

# Ideas-Go-Faster Deliberation Upgrade Plan (Right-Sized v2)

## Summary

This revision keeps the right-sized strategy and incorporates the latest critique in full where it improves execution quality.

The only deliberate pushback retained is unchanged: a pure report-only patch is not sufficient for non-idempotent write safety, so 3A/3B remains mandatory.

## Direct Fixes From Latest Critique

1. Re-scoped baseline work: RS-01 is now primarily a CHECKPOINT with explicit reuse of existing sweep metrics; optional instrumentation is conditional.
2. Split RS-02 into three focused tasks (additive transparency, behavioral gates, and interface controls).
3. Fully specified 3A/3B correctness mechanism (manifest schema, fingerprinting, reconciliation, dependency injection, rerun skip rules).
4. Tightened evidence gate and made subjective quality input blind-scored.
5. Added anchored rubric definitions and baseline establishment method.
6. Resolved artifact-policy contradiction: F1-F6 are report sections by default; separate files are debug-only.
7. Specified validator scope split (contract checker extension + output artifact validator).
8. Restored explicit handling of legacy 24 checklist items + 20 red flags.
9. Fixed dependency gap: artifact policy task now depends on 3A/3B.
10. Rewrote ">=90%" section to target concrete unknowns instead of tautologies.

## Goals

1. Deliver F1-F6 transparency improvements without destabilizing weekly operations.
2. Add deterministic write safety with explicit 3A/3B behavior.
3. Keep complexity proportional to run frequency and team size.
4. Use evidence to decide whether decomposition is needed.
5. Preserve compatibility until objective cutover gates pass.

## Non-goals (Current Revision)

- Full 7-phase pipeline rewrite.
- State-machine orchestration and phase-level re-entry.
- Hierarchical invocation logging.
- Always-on large intermediate artifact graphs.

## Evidence Baseline and Escalation Gate

### RS-01 Baseline Data Sources

RS-01 reuses existing sweep outputs first:

- `Sub-Experts-Run` / `Sub-Experts-Planned`
- `Sub-Expert-Coverage`
- `Context-Discipline`
- `Quality-Rerun-Required`

If required metrics are missing, RS-01B adds only lightweight fields:

- `elapsed_seconds`
- `prompt_size_estimate_chars`
- `stage_runtime_notes` (coarse, optional)

### Escalation Gate (Decomposition Eligibility)

Proceed to optional decomposition only when both A and B are true in the 5-run sample.

- A (reliability signal):
  - `Sub-Expert-Coverage < 95%` in at least 2 runs, or
  - `Quality-Rerun-Required=true` in at least 2 runs.
- B (performance/quality signal):
  - median `elapsed_seconds` worsens by >=25% vs baseline, or
  - blinded rubric comparison shows >=1-point decline in at least 2 categories across at least 2 runs.

Emergency override:

- Any single run with `Sub-Expert-Coverage < 85%` or hard sweep failure triggers immediate decomposition design review.

## Resolved Open Questions From Fact-Find

1. Assumptions input supports both inline and file:
   - inline assumptions block in invocation text.
   - optional `--assumptions-file <path>`.
   - if both are present, file input takes precedence and report notes source.
2. Report verbosity supports:
   - `--verbosity=compact|standard|extended` (default: `standard`).
   - deterministic per-idea length limits by mode.

## Architecture (Right-Sized)

### Stage A1: Additive Transparency Sections (Low Risk)

Keep monolithic flow and add F1/F2/F4/F6 as sections in `sweep-report.user.md`:

- F1 Who Said What
- F2 Tool-Gap Register
- F4 Kill/Hold Rationale
- F6 Delta/Coverage

### Stage A2: Behavioral Gates (Targeted Logic Changes)

Add:

- F3 Assumption challenge verdict path (accept/condition/reject).
- F5 Economics gate: no promotion without required economics fields.

### Stage A3: Invocation UX Controls

Add:

- assumptions precedence behavior (inline vs file).
- verbosity controls.
- technical cabinet simplification: `applies_to: [<BIZ>...]` or `["cross-cutting"]`.

### Stage B: 3A/3B Write-Safety Split (Mandatory)

Still in monolithic orchestrator, but split commit behavior:

- 3A Prepare:
  - generate card payloads + fact-find templates + dependency manifest.
  - perform zero writes.
- 3B Commit/Reconcile:
  - apply dependency-ordered writes.
  - reconciliation before retry.
  - dry-run: no writes, full preview accounting.

### Stage C: Optional Decomposition (Evidence-Gated)

Only if escalation gate is met:

- first decomposition is per-business generation only.
- gating/priority/synthesis remain centralized.
- no state-machine or deep artifact framework in first decomposition step.

## 3A/3B Correctness Mechanism (Explicit)

### Manifest Contract (`priority/commit-manifest.json`)

Each operation includes:

- `operation_id` (stable deterministic id)
- `kind` (`card_create` | `factfind_create`)
- `slug`
- `payload_fingerprint` (SHA256 of canonicalized payload/template)
- `depends_on` (array of `operation_id`)
- `endpoint`
- `method`

### Ledger Contract (`commit/write-ledger.jsonl`)

Each line includes:

- `timestamp`
- `operation_id`
- `payload_fingerprint`
- `request_hash`
- `status` (`created` | `skipped_existing` | `failed` | `would_create`)
- `entity_id` (when known)
- `reconciliation_source` (`prewrite_lookup` | `postfail_lookup` | `none`)

### Execution Rules

1. 3A computes manifest and fingerprints with canonical JSON key ordering.
2. 3B processes operations in dependency order.
3. For `card_create`, 3B does pre-write lookup; if existing entity matches, record `skipped_existing`.
4. On successful card create, 3B records `card-id-map` (`slug -> cardId`).
5. For `factfind_create`, 3B injects resolved `cardId` into template; if absent, fail fast.
6. Rerun skip rule: if ledger already has `created` or `skipped_existing` for same `operation_id + payload_fingerprint`, skip operation.
7. Dry-run writes no entities and logs `would_create` with dependency validation.

## Model Quality Enforcement (Right-Sized)

Use practical L1-L3 only:

1. L1 skill contract requires `model: opus`.
2. L2 invocation contract uses literal `model: "opus"` where Task calls are used.
3. L3 checker verifies L1/L2 contract presence.

## Artifact Policy

### Default Mode (Operator-First)

Default output is report-centric:

- `sweep-report.user.md` (contains F1-F6 sections)
- `priority/commit-manifest.json` (Stage B+)
- `commit/write-ledger.jsonl` (Stage B+)
- `commit/persistence-accounting.md` (Stage B+)
- optional `run-metrics.json` (only if RS-01B is activated)

### Debug Mode (Opt-In)

Debug mode may emit separate supporting files:

- per-expert attribution tables
- detailed assumption verdict breakdowns
- expanded tool-gap fragments

### Retention

- default artifacts stay in normal sweep path.
- debug artifacts retain last 10 runs or 21 days (whichever is larger).

## Quality Rubric (Anchored + Blinded)

### Category Anchors

| Category | Score 1 | Score 3 | Score 5 |
|---|---|---|---|
| Completeness | key required sections missing | all required sections present, some shallow | all required sections present and actionable |
| Attribution clarity | idea ownership unclear | ownership mostly clear, occasional ambiguity | clear who-said-what for all promoted/held ideas |
| Economic rigor | promotions lack required economics | most promotions have economics, some weak specificity | all promotions include complete economics with explicit blockers |
| Operator usability | difficult to decide next actions | usable but requires cross-referencing | decisions and next steps clear in one pass |
| Technical cabinet usefulness | low relevance/no routing clarity | mixed relevance | high relevance with clear `applies_to` or cross-cutting outcome |

### Baseline and Scoring Process

1. Baseline = median category score across 3 recent pre-change sweeps.
2. Comparison runs are blind-labeled (`Report X`, `Report Y`) before scoring.
3. Scoring is performed without version labels shown.

## Migration Strategy (Revised)

1. 3 dry-run dual-run period on updated monolith.
2. Enable 3A/3B live after dry-run gate passes.
3. Keep compatibility path for at least 2 live sweeps.
4. Cut over references only after rubric gate passes.
5. Rollback is objective and includes reference-path rollback if cutover had started.

## Rollback Triggers

Immediate rollback if any occur:

- one write-safety defect (duplicate create or broken card->fact-find linkage).
- two rubric categories at `baseline - 2` or worse in a single live run.
- mean rubric delta < -0.5 across two consecutive live runs.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| IGF-RS-01 | CHECKPOINT | Capture 5-run baseline using existing metrics and baseline rubric scores | 88% | S | Pending | - | IGF-RS-07, IGF-RS-06 |
| IGF-RS-01B | IMPLEMENT | Add lightweight run metrics only if RS-01 finds missing fields | 82% | S | Conditional | IGF-RS-01 | IGF-RS-07 |
| IGF-RS-02A | IMPLEMENT | Add additive F1/F2/F4/F6 report sections in monolithic output | 86% | M | Completed | - | IGF-RS-04, IGF-RS-07 |
| IGF-RS-02B | IMPLEMENT | Add F3/F5 behavioral gates (assumption challenge + economics blocker) | 79% | M | Completed | IGF-RS-02C | IGF-RS-03, IGF-RS-04, IGF-RS-07 |
| IGF-RS-02C | IMPLEMENT | Add assumptions/verbosity/technical-cabinet interface controls | 83% | S | Completed | - | IGF-RS-02B, IGF-RS-04, IGF-RS-07 |
| IGF-RS-03 | IMPLEMENT | Implement explicit 3A/3B split with manifest/ledger/reconciliation contracts | 78% | M | Completed | IGF-RS-02B | IGF-RS-04, IGF-RS-05, IGF-RS-07 |
| IGF-RS-04 | IMPLEMENT | Extend contract checker + add output validator + legacy control mapping | 80% | M | Completed | IGF-RS-02A, IGF-RS-02B, IGF-RS-02C, IGF-RS-03 | IGF-RS-07 |
| IGF-RS-05 | IMPLEMENT | Enforce default-vs-debug artifact policy and retention/prune behavior | 81% | S | Pending | IGF-RS-02A, IGF-RS-03 | IGF-RS-07 |
| IGF-RS-07 | CHECKPOINT | Run 3 dry + 2 live evaluations and make go/no-go cutover decision | 71% | M | Pending | IGF-RS-01, IGF-RS-01B, IGF-RS-04, IGF-RS-05 | IGF-RS-06 |
| IGF-RS-06 | DESIGN | Optional per-business generation decomposition design (evidence-gated) | 70% | S | Pending | IGF-RS-01, IGF-RS-07 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | IGF-RS-01, IGF-RS-02A, IGF-RS-02C | - | baseline + additive contracts + interface controls |
| 2 | IGF-RS-02B, IGF-RS-01B (conditional) | Wave 1 | behavioral gates + optional metrics |
| 3 | IGF-RS-03, IGF-RS-05 | Wave 2 | write-safety split + artifact policy |
| 4 | IGF-RS-04 | Wave 3 | validators after behavior stabilizes |
| 5 | IGF-RS-07 | Wave 4 | checkpoint and cutover decision |
| 6 | IGF-RS-06 (optional) | Wave 5 + escalation gate met | decomposition design only if warranted |

## Task Details

### IGF-RS-01: Baseline Capture

- **Type:** CHECKPOINT
- **Acceptance:**
  - 5 dry-run sweeps captured with existing coverage/degradation signals.
  - baseline rubric scores computed from 3 recent pre-change sweeps.
  - explicit record: whether RS-01B instrumentation is needed.

### IGF-RS-01B: Conditional Instrumentation

- **Type:** IMPLEMENT (conditional)
- **Acceptance:**
  - add only missing metrics required by gate (`elapsed_seconds`, `prompt_size_estimate_chars`).
  - no architectural changes.

### IGF-RS-02A: Additive Transparency

- **Type:** IMPLEMENT
- **Acceptance:**
  - F1/F2/F4/F6 appear as deterministic sections inside `sweep-report.user.md`.
  - no write behavior changes.

### IGF-RS-02B: Behavioral Gates

- **Type:** IMPLEMENT
- **Acceptance:**
  - F3 assumption challenge supports accept/condition/reject with rationale.
  - F5 economics gate blocks promotion when required fields are missing.
  - blocked ideas are explicitly listed with missing-field reasons.

### IGF-RS-02C: Input and UX Controls

- **Type:** IMPLEMENT
- **Acceptance:**
  - assumptions precedence behavior implemented and documented.
  - verbosity limits implemented:
    - compact: <=120 words per promoted idea summary
    - standard: <=220 words
    - extended: <=350 words
  - technical cabinet simplified to `applies_to` semantics.

### IGF-RS-03: 3A/3B Write-Safety Split

- **Type:** IMPLEMENT
- **Acceptance:**
  - manifest and ledger include required fields defined above.
  - card->fact-find dependency injection is enforced and testable.
  - rerun skip behavior uses `operation_id + payload_fingerprint`.
  - dry-run emits `would_create` entries with zero writes.

### IGF-RS-04: Validators and Legacy Controls

- **Type:** IMPLEMENT
- **Acceptance:**
  - extend `scripts/check-ideas-go-faster-contracts.sh` for new SKILL contract checks.
  - add output validator for report sections + 3A/3B artifacts.
  - add mapping matrix for legacy 24 checklist items + 20 red flags to revised flow.
  - deliberate-failure checks cover at least 5 defect types.

### IGF-RS-05: Artifact Policy and Retention

- **Type:** IMPLEMENT
- **Acceptance:**
  - default mode keeps F1-F6 in report (not split files).
  - debug mode can emit separate detail files.
  - prune behavior is documented and runnable.

### IGF-RS-07: Gate Checkpoint

- **Type:** CHECKPOINT
- **Acceptance:**
  - 3 dry-runs + 2 live runs scored with anchored rubric.
  - blind-scoring process is followed.
  - explicit decision: continue monolith+3A/3B or proceed to RS-06.

### IGF-RS-06: Optional Decomposition Design

- **Type:** DESIGN
- **Acceptance:**
  - started only if escalation gate is met.
  - scope limited to per-business generation split.
  - includes stop criteria and migration cost estimate.

## Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Under-correction leaves context issues unresolved | Medium | objective escalation gate + optional decomposition |
| 3A/3B defects create write duplication | High | explicit manifest/ledger contracts + immediate rollback trigger |
| Rubric subjectivity biases decisions | Medium | anchored rubric + blind-labeled scoring |
| Artifact sprawl returns | Medium | report-first default + debug-only detail + prune policy |
| Legacy quality controls regress silently | High | explicit mapping of 24 checklist + 20 red flags in RS-04 |
| Migration path confusion | Medium | compatibility period + explicit path rollback procedure |

## Acceptance Criteria (Overall)

1. F1-F6 are delivered as report sections by default.
2. Assumptions and verbosity controls are implemented with deterministic behavior.
3. 3A/3B split is live with explicit manifest/ledger/reconciliation rules.
4. Dry-run performs zero writes and produces complete preview accounting.
5. Validator coverage includes SKILL contracts, outputs, and legacy checklist/red-flag mapping.
6. Cutover/rollback decisions use anchored, blind-scored rubric and objective triggers.
7. Decomposition work is blocked unless escalation gate is met.

## Decision Log

- 2026-02-10: Initial full-rewrite plan created.
- 2026-02-10: Scope reduced to right-sized staged rollout.
- 2026-02-10: Retained pushback: 3A/3B required for write safety.
- 2026-02-10: Latest critique integrated: RS-02 split, RS-03 hard-spec, report-first artifacts, anchored rubric, validator scope clarified, legacy controls restored, dependency fixes applied.
- 2026-02-10: Implementation progress: RS-02A/RS-02B/RS-02C contract updates applied in `.claude/skills/ideas-go-faster/SKILL.md`; checker extended for F1-F6 + assumptions/verbosity/applies_to/economics gate contracts.
- 2026-02-10: Implementation progress: RS-03 3A/3B contract applied in `.claude/skills/ideas-go-faster/SKILL.md` (Stage 5.5 prepare manifest, Stage 6/7 commit with write ledger + card-id map + rerun skip guard); checker extended with F22 persistence-split assertions.
- 2026-02-10: Implementation progress: RS-04 completed with new output validator (`scripts/check-ideas-go-faster-output.sh`), deliberate-failure self-test suite (1 pass + 6 failure fixtures), legacy control mapping (`docs/business-os/ideas-go-faster-legacy-control-mapping.md`), and checker integration (F23).

## Overall-confidence Calculation

- Implementation confidence: 80% (largest uncertainty remains 3A/3B correctness under reruns)
- Approach confidence: 84% (incremental rollout + objective gates)
- Impact confidence: 88% (addresses F1-F6 and write safety without overbuild)
- Overall = min(Implementation, Approach, Impact) = 80%

## What Would Make This >=90%

- Evidence that added report sections do not re-trigger truncation/context fallback in 5-run sample.
- Proof that payload fingerprinting is stable across reruns with unchanged business input.
- Proof that blind rubric scoring has low variance (repeat-score drift <=1 point/category).
- Validation that output checker is robust to formatting noise but fails true contract defects.
- Two consecutive live runs with zero write-safety incidents and non-negative rubric delta.
