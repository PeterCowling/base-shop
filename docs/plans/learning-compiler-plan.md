---
Type: Plan
Status: Draft
Domain: Venture-Studio
Workstream: Process
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Replan-date: TBD
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: learning-compiler
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: control-plane
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-experiment, /lp-replan
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact) after defining immutable snapshots, bounded machine interface, deterministic identity, supersede replacement semantics, and manifest lifecycle
Business-OS-Integration: on
Business-Unit: BOS
---

# Experiment-to-Baseline Learning Compiler Plan

## Summary

Implement a control-plane mechanism that converts S10 experiment readouts into durable baseline prior updates. The loop currently generates weekly readouts, but outcomes are not promoted into canonical baseline state. This plan closes that gap with deterministic contracts:

1. Append experiment outcomes to a deterministic learning ledger.
2. Compile outcomes into prior deltas using explicit prior links (`prior_refs`) when available.
3. Apply deltas only to a machine-owned priors block in baseline artifacts.
4. Write immutable baseline snapshot artifacts and update manifest pointers.
5. Preserve replacement-consistent state when corrected readouts supersede prior entries.
6. Seed next-run S2B/S3/S6B inputs from manifest-tracked `next_seed` artifacts.

## Goals

1. Make experiment outcomes durable and traceable as first-class baseline state.
2. Preserve deterministic, idempotent behavior across reruns, partial failures, and corrected readouts.
3. Keep human narrative docs editable without breaking machine compilation.
4. Prevent accidental retests of already-rejected priors.

## Non-goals

1. Automated experiment execution (S10 remains operator-supervised).
2. Multi-armed bandit optimization.
3. Causal inference modeling.
4. Cross-business transfer learning.

## Constraints & Assumptions

**Constraints:**
- Must stay in TypeScript/monorepo.
- Must integrate with startup-loop control-plane artifacts (event ledger, stage-result, baseline manifest).
- Must preserve auditability via append-only learning ledger and immutable baseline snapshots.
- Must not break existing S10 `/lp-experiment` contracts.

**Assumptions:**
- S10 readouts contain verdict (`PASS|FAIL|INCONCLUSIVE`) and confidence (`HIGH|MEDIUM|LOW`).
- Experiment spec/readout can carry optional `prior_refs: string[]` in Phase 1.
- One active run per business (single-writer policy).
- Learning compiler executes inside S10 completion before stage-result finalization.

## Control-Plane Invariants

1. **Baseline immutability:** learning writeback never mutates prior snapshots in place; S10 writes new versioned artifact files and updates manifest pointers.
2. **Machine canonical interface:** compiler only reads/writes priors from a bounded `## Priors (Machine)` JSON code fence.
3. **Deterministic identity:** dedup key is `entry_id = sha256(run_id + experiment_id + readout_digest)`.
4. **Supersede replacement consistency:** when entry B supersedes entry A, resulting baseline equals "base + B" (not "base + A + B").
5. **Mapping precedence:** `prior_refs` exact mapping first, keyword heuristics fallback second (with `mapping_confidence`).
6. **Bounded write surface:** writer may modify only machine priors block and optional single `Last updated` field.
7. **Deterministic snapshots:** snapshot path includes `entry_id`; identical inputs must produce identical path/content.
8. **Digest normalization:** `readout_digest` hashes canonical compiler-relevant payload only (no editorial timestamps).

## Manifest Pointer Lifecycle

Manifest schema will be extended to use explicit pointer classes:

- `current`: baseline snapshot set used to seed the current run.
- `stage_candidate`: optional stage-local outputs before S4 merge.
- `next_seed`: baseline snapshot set produced by S10 learning writeback for the next run.

Lifecycle timeline:

1. **Run start (S0):** initialize `current` from previous run `next_seed`.
2. **During run (S2B/S3/S6B):** stages may update `stage_candidate` only.
3. **S4 merge:** set run-authoritative merged baseline as `current`.
4. **S10 learning:** write immutable learning-updated snapshots; set `next_seed` pointers.
5. **Next run:** loader promotes previous `next_seed` to new run `current`.

Single-writer responsibility:

- S2B/S3/S6B: write `stage_candidate` only.
- S4: writes `current` only.
- S10: writes `next_seed` only.

## Prior Reference and Routing Contract

Prior reference forms (in order of preference):

1. `artifact_scope#prior_id` (example: `forecast#forecast.target.mrr_month3`).
2. `artifact_path#prior_id` (example: `docs/.../HEAD-forecast-seed.user.md#forecast.target.mrr_month3`).
3. Bare `prior_id` only when globally unique across manifest-tracked baseline set.

Routing rules:

- Compiler builds baseline prior index from manifest-tracked artifacts.
- Duplicate bare `prior_id` values are invalid unless references are scope/path-qualified.
- Compiler emits `artifact_path` in each `priorDelta` for deterministic writer grouping.

## Readout Digest Normalization

`readout_digest` is computed from canonical `digest_payload`:

- Included fields: `experiment_id`, `verdict`, `confidence`, `prior_refs`, and compiler-consumed metric values.
- Excluded fields: editorial timestamps, prose-only narrative, formatting-only changes.
- Canonicalization: stable JSON serialization with sorted keys.
- Hash function: SHA-256 over canonical payload bytes.

## Existing System Notes

- Event ledger: `runs/<run_id>/events.jsonl`.
- Baseline manifest: `runs/<run_id>/baseline.manifest.json`.
- Stage results: `runs/<run_id>/stages/<stage>/stage-result.json`.
- Baseline artifacts: `docs/business-os/startup-baselines/<BIZ>-{offer,forecast-seed,channels}-*.user.md`.
- S10 artifacts: `docs/business-os/strategy/<BIZ>/...` readouts and weekly decision docs.

## Proposed Approach

### Phase 0: Baseline Migration

- Add `## Priors (Machine)` blocks to active baseline docs (HEAD/PET/BRIK minimum).
- Validate machine-block extraction passes before runtime integration.

### Phase 1A: Ledger + Explicit Linking (No Baseline Writes)

- Define ledger schema with stable identity and correction fields.
- Extend S10 readout/spec contracts with optional `prior_refs`.
- Emit compiled `priorDeltas` artifacts for audit and replay.

### Phase 1B: Canonical Priors Block + Bounded Writer

- Extract priors only from machine block.
- Writer updates only machine-owned block and optional `Last updated`.
- Enforce deterministic snapshot naming using `entry_id`.

### Phase 1C: Writeback + Manifest Pointer Update

- On successful S10 compile, write new immutable snapshots.
- If superseding, invert superseded deltas before applying new deltas.
- Update manifest `next_seed` pointers.
- Emit stage-result artifact paths and diagnostics.

### Phase 2: Operational Hardening

- Add retest warning hook in S10 design flow for high-confidence rejected priors.
- Add richer conflict/observability reporting for fallback mappings.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| LC-00 | MIGRATE | Migrate active baseline docs to canonical `Priors (Machine)` block | 92% | M | Pending | - | LC-03, LC-05 |
| LC-01 | DECISION | Finalize schemas, supersede semantics, prior refs, and manifest lifecycle | 90% | S | Complete (2026-02-13) | - | LC-02, LC-03, LC-06 |
| LC-02 | IMPLEMENT | Implement learning ledger append/query with deterministic dedup and effective-view semantics | 88% | S | Complete (2026-02-13) | LC-01 | LC-04 |
| LC-03 | IMPLEMENT | Implement canonical priors extraction/indexing/serialization | 86% | M | Pending | LC-00, LC-01 | LC-04, LC-05 |
| LC-04 | IMPLEMENT | Implement compiler with prior-ref routing and invertible deltas | 85% | M | Pending | LC-02, LC-03 | LC-06 |
| LC-05 | IMPLEMENT | Implement bounded writer with deterministic snapshot paths and replay safety | 84% | M | Pending | LC-03, LC-04 | LC-06 |
| LC-06 | IMPLEMENT | Integrate compiler into S10 with manifest lifecycle and correction handling | 86% | M | Pending | LC-01, LC-04, LC-05 | LC-07 |
| LC-07 | CHECKPOINT | Validate two-run seed propagation and supersede correctness | 88% | M | Pending | LC-06 | - |

## Tasks

### LC-00: Migrate active baseline docs to canonical `Priors (Machine)` block

- **Type:** MIGRATE
- **Status:** Pending
- **Deliverable:** business-artifact + migration script
- **Execution-Skill:** /lp-build
- **Confidence:** 92%
- **Effort:** M
- **Affects:**
  - `docs/business-os/startup-baselines/HEAD-*.user.md`
  - `docs/business-os/startup-baselines/PET-*.user.md`
  - `docs/business-os/startup-baselines/BRIK-*.user.md`
  - `scripts/src/startup-loop/migrate-priors-machine-block.ts` (new)
- **Acceptance:**
  - All active baseline docs contain valid `## Priors (Machine)` JSON block.
  - Migration preserves human narrative sections.
  - Extraction tests pass on migrated docs.
- **Validation contract (VC-LC-00):**
  - **VC-LC-00-01:** Migration inserts valid machine block in all targeted artifacts.
  - **VC-LC-00-02:** Pre/post diff confirms narrative sections unchanged.
  - **VC-LC-00-03:** `extractPriors` succeeds across all migrated artifacts.

### LC-01: Finalize schemas, supersede semantics, prior refs, and manifest lifecycle

- **Type:** DECISION
- **Status:** Pending
- **Deliverable:** business-artifact (schema docs)
- **Execution-Skill:** /lp-build
- **Confidence:** 90%
- **Effort:** S
- **Affects:**
  - `docs/business-os/startup-loop/learning-ledger-schema.md` (new)
  - `docs/business-os/startup-loop/baseline-prior-schema.md` (new)
  - `docs/business-os/startup-loop/manifest-schema.md` (update)
- **Acceptance:**
  - Ledger schema defines `entry_id`, `run_id`, `experiment_id`, `readout_path`, `readout_digest`, `created_at`, `verdict`, `confidence`, `affected_priors`, `prior_deltas_path`, `supersedes_entry_id?`.
  - Prior delta schema is invertible and includes old/new values (minimum `old_confidence`, `new_confidence`; optional old/new typed fields).
  - Prior schema defines machine block format and typed fields: `id`, `type`, `statement`, `confidence`, `value?`, `unit?`, `operator?`, `range?`, `last_updated`, `evidence`.
  - PriorRef grammar and uniqueness rules are defined.
  - Manifest pointer lifecycle (`current`, `stage_candidate`, `next_seed`) and writer ownership are documented.
- **Validation contract (VC-LC-01):**
  - **VC-LC-01-01:** Schema coverage maps all S10 fields and deterministic identity fields.
  - **VC-LC-01-02:** Supersede algorithm is specified with worked example showing replacement-consistent outcome.
  - **VC-LC-01-03:** PriorRef validation examples cover scope-qualified, path-qualified, and duplicate-id failure cases.
  - **VC-LC-01-04:** Manifest lifecycle timeline includes who writes each pointer at each stage.
  - **VC-LC-01-05:** Digest normalization rules and included/excluded fields are explicit.

### LC-02: Implement learning ledger append/query with deterministic dedup and effective-view semantics

- **Type:** IMPLEMENT
- **Status:** Complete (2026-02-13)
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 88%
- **Effort:** S
- **Depends on:** LC-01
- **Affects:**
  - `scripts/src/startup-loop/learning-ledger.ts` (new)
  - `scripts/src/startup-loop/__tests__/learning-ledger.test.ts` (new)
- **Acceptance:**
  - `appendLearningEntry(business, entry)` appends to `docs/business-os/startup-baselines/<BIZ>/learning-ledger.jsonl`.
  - Dedup key is `entry_id`.
  - Each entry references deterministic `prior_deltas_path` artifact.
  - Query API supports `all` and `effective` views (`effective` excludes superseded entries).
  - Entries returned chronological (oldest first).
- **Validation contract (VC-LC-02):**
  - **VC-LC-02-01:** Append 3 unique entries -> 3 valid lines.
  - **VC-LC-02-02:** Append same digest twice -> one stored entry.
  - **VC-LC-02-03:** Append correction with `supersedes_entry_id` -> `all` returns both, `effective` returns latest only.
  - **VC-LC-02-04:** Broken supersede references fail validation.

### LC-03: Implement canonical priors extraction/indexing/serialization

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change + business-artifact
- **Execution-Skill:** /lp-build
- **Confidence:** 86%
- **Effort:** M
- **Depends on:** LC-00, LC-01
- **Affects:**
  - `scripts/src/startup-loop/baseline-priors.ts` (new)
  - `scripts/src/startup-loop/__tests__/baseline-priors.test.ts` (new)
  - `scripts/src/startup-loop/__fixtures__/baseline-priors/*` (new)
- **Acceptance:**
  - `extractPriors(artifactMarkdown)` reads only machine block.
  - `serializePriors(priors, originalMarkdown)` writes only machine block.
  - `buildPriorIndex(manifestPointers)` returns prior index with `artifact_path` routing metadata.
  - Duplicate bare `prior_id` detection is enforced.
- **Validation contract (VC-LC-03):**
  - **VC-LC-03-01:** Machine block fixture parses to expected priors.
  - **VC-LC-03-02:** Round-trip extract/serialize/extract is byte-stable for priors JSON.
  - **VC-LC-03-03:** Narrative edits outside machine block do not affect extraction.
  - **VC-LC-03-04:** Duplicate id detection triggers explicit error unless refs are qualified.

### LC-04: Implement compiler with prior-ref routing and invertible deltas

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 85%
- **Effort:** M
- **Depends on:** LC-02, LC-03
- **Affects:**
  - `scripts/src/startup-loop/learning-compiler.ts` (new)
  - `scripts/src/startup-loop/__tests__/learning-compiler.test.ts` (new)
- **Acceptance:**
  - `compileExperimentLearning(readout, currentBaseline, priorIndex)` returns `{ learningEntry, priorDeltas, mappingDiagnostics }`.
  - Mapping precedence: `prior_refs` exact mapping first; fallback keyword mapping only when absent.
  - `priorDeltas` include `artifact_path`, `old_confidence`, `new_confidence`, `reason`, `evidence_ref`, `mapping_confidence`.
  - Delta weights: `HIGH=1.0`, `MEDIUM=0.5`, `LOW=0.25`; PASS `+0.2*w`, FAIL `-0.3*w`, INCONCLUSIVE `0`.
  - `readout_digest` derived from canonical digest payload only.
- **Validation contract (VC-LC-04):**
  - **VC-LC-04-01:** PASS/HIGH `0.6 -> 0.8`; PASS/MEDIUM `0.6 -> 0.7`.
  - **VC-LC-04-02:** FAIL/HIGH `0.8 -> 0.5`; FAIL/LOW `0.8 -> 0.725`.
  - **VC-LC-04-03:** `prior_refs` present -> exact mapping, no keyword matcher call.
  - **VC-LC-04-04:** Fallback mapping emits `mapping_confidence` and ambiguity warning.
  - **VC-LC-04-05:** Digest normalization excludes non-semantic text edits.

### LC-05: Implement bounded writer with deterministic snapshot paths and replay safety

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 84%
- **Effort:** M
- **Depends on:** LC-03, LC-04
- **Affects:**
  - `scripts/src/startup-loop/prior-update-writer.ts` (new)
  - `scripts/src/startup-loop/__tests__/prior-update-writer.test.ts` (new)
- **Acceptance:**
  - `applyPriorDeltas(sourceArtifactPath, priorDeltas, entryId)` writes immutable snapshot path including `entry_id`.
  - If target snapshot path exists, content hash must match expected; mismatch fails loudly.
  - Writer updates only machine block and optional single `Last updated` field.
  - Snapshot path/content are deterministic for identical inputs.
- **Validation contract (VC-LC-05):**
  - **VC-LC-05-01:** Apply one delta -> new file created; source unchanged.
  - **VC-LC-05-02:** Diff shows only machine block and allowed metadata line changed.
  - **VC-LC-05-03:** Re-run identical input -> same path/content.
  - **VC-LC-05-04:** Existing-path hash mismatch -> explicit integrity failure.

### LC-06: Integrate compiler into S10 with manifest lifecycle and correction handling

- **Type:** IMPLEMENT
- **Status:** Pending
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 86%
- **Effort:** M
- **Depends on:** LC-01, LC-04, LC-05
- **Affects:**
  - `.claude/skills/lp-experiment/SKILL.md` (update)
  - `scripts/src/startup-loop/s10-learning-hook.ts` (new)
  - `scripts/src/startup-loop/__tests__/s10-learning-hook.test.ts` (new)
- **Acceptance:**
  - S10 hook appends ledger entry, writes prior-delta artifact, writes immutable baseline snapshots, updates manifest `next_seed` pointers.
  - Supersede flow is replacement-consistent: inverse superseded deltas then apply new deltas before snapshot write.
  - Stage-result includes `learning_ledger`, `prior_deltas_path`, `updated_baselines`, `compiler_diagnostics`, and remediation details on failure.
  - Hook is idempotent: rerun with same digest does not change manifest pointers.
- **Validation contract (VC-LC-06):**
  - **VC-LC-06-01:** Happy path -> ledger + delta artifact + snapshot + `next_seed` update succeed before stage-result finalization.
  - **VC-LC-06-02:** Malformed readout -> status `Blocked` with actionable remediation.
  - **VC-LC-06-03:** Supersede test: PASS/HIGH then superseding FAIL/HIGH yields baseline + FAIL delta only.
  - **VC-LC-06-04:** Rerun idempotency test: manifest pointers unchanged for identical digest.

### LC-07: Validate two-run seed propagation and supersede correctness

- **Type:** CHECKPOINT
- **Status:** Pending
- **Deliverable:** validation report
- **Execution-Skill:** /lp-build
- **Confidence:** 88%
- **Effort:** M
- **Depends on:** LC-06
- **Acceptance:**
  - Run 1 S10 writes learning entry and updated `next_seed` snapshot.
  - Run 2 S3 input is sourced from promoted `current` pointer and contains updated machine priors.
  - Fresh Run 2 S3 output remains authoritative in S4 merge.
  - Correction scenario validates replacement-consistent supersede behavior across runs.
- **Validation contract (VC-LC-07):**
  - **VC-LC-07-01:** Verify Run 2 S3 input contains Run 1 updated prior values.
  - **VC-LC-07-02:** Verify S4 prefers fresh Run 2 stage output when conflicting with seed prior.
  - **VC-LC-07-03:** Verify supersede correction produces baseline + latest effective delta only.
  - **VC-LC-07-04:** Verify ledger `effective` view matches applied baseline state.

## Validation Strategy

1. Migration validation for machine-block readiness (LC-00).
2. Schema and invariant validation (LC-01).
3. Unit tests for ledger/compiler logic and digest normalization (LC-02, LC-04).
4. Golden-file tests for bounded writes and snapshot determinism (LC-03, LC-05).
5. Integration tests for S10 hook, manifest lifecycle, and supersede behavior (LC-06, LC-07).

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Machine block missing in legacy baseline docs | High | LC-00 migration gate before runtime enablement |
| Supersede semantics mismatch causes double-counting | High | Store invertible deltas; enforce replacement-consistent replay in LC-06 |
| `prior_refs` adoption lag causes fallback ambiguity | Medium | Fallback emits `mapping_confidence`; ambiguous matches require remediation |
| Snapshot/version sprawl complicates operations | Medium | Deterministic naming by `entry_id`; manifest pointer lifecycle as source of truth |
| Compiler failures block S10 completion | Medium | Structured failure artifacts with explicit remediation hints |
| Seed propagation silently regresses | High | LC-07 regression validates Run 2 input payload and effective-state equivalence |

## What Would Make Confidence >=92%

1. Complete LC-00 migration for all active businesses and pass extraction tests.
2. Land LC-02 through LC-05 fixture-backed tests including digest normalization and hash-integrity guardrails.
3. Validate LC-06 supersede replacement test and manifest idempotency test.
4. Complete LC-07 two-run integration on at least two real business fixtures.

## Decision Log

### DL-LC-01: Learning compiler invocation point

**Decided:** 2026-02-13
**Chosen option:** Run learning compiler during S10 completion (after readout, before final stage-result write).

**Rationale:** S10 owns experiment outcomes and remains single writer for learning artifacts.

---

### DL-LC-02: Prior confidence update formulas

**Decided:** 2026-02-13
**Chosen option:** Weighted additive deltas with caps: `PASS +0.2*w`, `FAIL -0.3*w`, `INCONCLUSIVE 0`; weights `HIGH=1.0`, `MEDIUM=0.5`, `LOW=0.25`.

**Rationale:** Retains interpretability while allowing MEDIUM/LOW outcomes to contribute partial evidence.

---

### DL-LC-03: Fresh stage output vs learning-updated priors

**Decided:** 2026-02-13
**Chosen option:** Fresh S2B/S3/S6B outputs are authoritative for current run; learning-updated priors are seed defaults for next run.

**Rationale:** Preserves single-run authority and avoids hard constraints from prior-cycle output.

---

### DL-LC-04: Baseline artifact immutability/versioning

**Decided:** 2026-02-13
**Chosen option:** Baseline artifacts are immutable snapshots; learning writeback creates new versioned files and updates manifest pointers.

**Rationale:** Keeps audit semantics explicit in control-plane artifacts and avoids hidden history mutation.

---

### DL-LC-05: Deterministic idempotency identity

**Decided:** 2026-02-13
**Chosen option:** Dedup and idempotency keyed by `entry_id = sha256(run_id + experiment_id + readout_digest)`.

**Rationale:** Handles reruns deterministically.

---

### DL-LC-06: Hypothesis-to-prior mapping strategy

**Decided:** 2026-02-13
**Chosen option:** `prior_refs` in spec/readout are first-class mapping contract; keyword matching is fallback only.

**Rationale:** Mapping becomes stable control-plane behavior instead of brittle narrative inference.

---

### DL-LC-07: Supersede semantics and baseline consistency

**Decided:** 2026-02-13
**Chosen option:** Corrections are modeled via `supersedes_entry_id` plus invertible `prior_deltas_path`; baseline replay must equal effective ledger state.

**Rationale:** Prevents double-counting and aligns ledger `effective` view with applied baseline snapshots.

---

### DL-LC-08: Manifest pointer lifecycle

**Decided:** 2026-02-13
**Chosen option:** Separate pointer classes (`current`, `stage_candidate`, `next_seed`) with stage-scoped ownership.

**Rationale:** Removes ambiguity and prevents pointer field overloading conflicts.

## External References

- `docs/plans/advanced-math-algorithms-fact-find.md`
- `.claude/skills/lp-experiment/SKILL.md`
- `docs/business-os/startup-loop/loop-spec.yaml`
- `docs/business-os/startup-loop/manifest-schema.md`
- `docs/business-os/startup-loop/event-state-schema.md`
- `docs/plans/lp-skill-system-sequencing-plan.md`

## Next Steps

- [ ] Review LC-00/LC-01 decisions with startup-loop owners.
- [ ] Implement migration gate (LC-00) before enabling runtime writeback.
- [ ] Add `prior_refs` fields to S10 experiment spec/readout templates.
- [ ] Implement LC-02 through LC-06 in sequence with targeted validations.
- [ ] Run LC-07 two-run + correction scenario before rollout.
