---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: standing-artifact-deterministic-write-back
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/standing-artifact-deterministic-write-back/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Standing Artifact Deterministic Write-Back Fact-Find Brief

## Scope

### Summary

The self-evolving observation pipeline detects changes to standing artifacts and collects observations into `observations.jsonl` → `candidates.json` → `backbone-queue.jsonl`. However, it has no write-back path to apply verified factual updates back to standing artifacts. Even a single-field correction (price confirmed, supplier updated, metric refreshed) requires the full fact-find → plan → build pipeline. This creates unnecessary overhead for low-risk corrections and causes standing data to lag behind known truth.

The deliverable is a deterministic TypeScript script that applies verified, source-cited factual updates to standing artifacts with a lighter gate than the full planning pipeline.

### Goals

- Close the observation-to-artifact write-back gap with a deterministic script
- Define what constitutes a "verified low-risk update" with clear safety boundaries
- Integrate with the existing standing-registry and observation pipeline
- Provide audit trail for all write-back operations
- Maintain the fail-closed safety posture of the ideas system

### Non-goals

- Replacing the full fact-find/plan/build pipeline for structural changes
- Handling T1-semantic-keyword changes (ICP, pricing, channel strategy) without operator confirmation
- Modifying the standing-registry schema (work within registry.v2)
- Building a UI for write-back operations

### Constraints & Assumptions

- Constraints:
  - Must be deterministic (no LLM reasoning in the write path)
  - Must use SHA-based optimistic concurrency (consistent with BOS patterns)
  - Must not auto-apply changes to T1 semantic sections
  - Must integrate with existing trial-mode queue and audit infrastructure
  - Tests run in CI only per `docs/testing-policy.md`
- Assumptions:
  - Standing artifacts remain Markdown with YAML frontmatter or JSON
  - The observation pipeline's `MetaObservation` schema (v1) is stable
  - Registry.v2 `trigger_policy` and `propagation_mode` fields are sufficient for gating

## Outcome Contract

- **Why:** The self-evolving pipeline detects changes and collects observations but cannot apply verified factual updates back to standing artifacts without a full build cycle. This creates unnecessary overhead for low-risk corrections (price changes, supplier confirmations, metric updates) and causes standing data to lag behind known truth.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a deterministic TypeScript script that applies verified, source-cited factual updates to standing artifacts with a lighter gate than the full planning pipeline, closing the observation-to-artifact write-back gap.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts` — `runSelfEvolvingOrchestrator()` is the main entry that processes observations into candidates; currently terminates at candidate ledger write with no artifact write-back
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` — `buildObservation()` extracts signals from completed builds but only feeds forward into observations, never back to standing docs
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts` — `dispatchToMetaObservation()` converts dispatch packets to observations; the reverse path (observation → artifact update) does not exist
- `scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts` — detects changes to registered artifacts via git diff but only emits delta events downstream

### Key Modules / Files

- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts` — `MetaObservation` interface (line 52-88) with 30+ fields including `evidence_refs`, `detector_confidence`, `severity`, and `hard_signature`
- `scripts/src/startup-loop/self-evolving/self-evolving-detector.ts` — `detectRepeatWorkCandidates()` groups observations by `hard_signature` for recurrence detection; `buildHardSignature()` creates deterministic SHA-256 fingerprints
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone.ts` — `mapCandidateToBackboneRoute()` routes candidates to `lp-do-fact-find`, `lp-do-plan`, or `lp-do-build`; write-back would be a new route
- `scripts/src/startup-loop/self-evolving/self-evolving-lifecycle.ts` — Candidate state machine (draft → validated → canary → promoted → monitored → kept/reverted); `enforceCreationGate()` and `enforceBlockedSla()` for governance
- `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts` — `computeScoreResult()` with 8 V2 dimensions and autonomy capping; provides confidence signals usable for write-back gating
- `docs/business-os/startup-loop/ideas/standing-registry.json` — 34 registered artifacts across 6 domains (ASSESSMENT, BOS, LOGISTICS, MARKET, PRODUCTS, SELL); per-artifact fields: `trigger_policy`, `propagation_mode`, `depends_on`, `produces`, `last_known_sha`
- `scripts/src/startup-loop/self-evolving/self-evolving-events.ts` — `appendObservationAsEvent()` for audit trail; `readMetaObservations()` for reading observations.jsonl back

### Patterns & Conventions Observed

- **Fail-closed safety posture** — unknown artifacts never auto-admit; `trigger_policy: never` cannot be bypassed — evidence: `docs/business-os/startup-loop/ideas/standing-registry.json` `unknown_artifact_policy: "fail_closed_never_trigger"`
- **SHA-based optimistic concurrency** — BOS stage-doc patches use `baseEntitySha` for conflict detection — evidence: `mcp__brikette__bos_stage_doc_patch_guarded` tool signature
- **Append-only audit trail** — all pipeline operations emit to events.jsonl and telemetry.jsonl — evidence: `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`
- **Three-tier artifact safety** — `trigger_policy` enum (`eligible` / `manual_override_only` / `never`) gates which artifacts can be auto-processed — evidence: standing-registry schema
- **Deterministic hashing for deduplication** — `hard_signature` is SHA-256 of 6 normalized components; prevents duplicate processing — evidence: `self-evolving-detector.ts` line 35-46

### Data & Contracts

- Types/schemas/events:
  - `MetaObservation` (v1): 30+ fields — `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts` line 52-88
  - `ImprovementCandidate`: includes `candidate_type` (4 types), `risk_level`, `blast_radius_tag`, `autonomy_level_required` — contracts.ts line 90-117
  - `RepeatWorkCandidate`: `hard_signature`, `recurrence_count`, `average_daily_density` — detector.ts
  - `StandingRegistryArtifact` (registry.v2): `artifact_id`, `path`, `domain`, `artifact_class`, `trigger_policy`, `propagation_mode`, `depends_on`, `produces`, `last_known_sha` — standing-registry schema
  - `ArtifactDeltaEvent`: `artifact_id`, `before_sha`, `after_sha`, `changed_sections`, `material_delta` — lp-do-ideas-trial.ts line 60-95
- Persistence:
  - observations.jsonl — JSONL, one MetaObservation per line, per-business directory
  - candidates.json — JSON CandidateLedger with merged/scored candidates
  - backbone-queue.jsonl — JSONL routing dispatch entries
  - events.jsonl — append-only audit trail
  - standing-registry.json — registry.v2 with 34 artifact entries
- API/contracts:
  - No external APIs. All file-system based.

### Dependency & Impact Map

- Upstream dependencies:
  - `self-evolving-orchestrator.ts` — provides processed candidates that could inform write-back
  - `self-evolving-detector.ts` — provides `hard_signature` and recurrence counts for confidence gating
  - `self-evolving-scoring.ts` — provides `autonomy_cap` and priority scores for write-back eligibility
  - `standing-registry.json` — provides artifact metadata for gating and path resolution
- Downstream dependents:
  - `lp-do-ideas-build-commit-hook.ts` — detects changes after write-back and may emit new delta events (anti-loop risk)
  - `lp-do-ideas-trial.ts` — processes delta events; write-back updates will appear as artifact deltas
  - `self-evolving-from-build-output.ts` — if write-back is treated as a build output, it feeds back into observations
- Likely blast radius:
  - New script in `scripts/src/startup-loop/self-evolving/` (~200-400 lines)
  - New test file in `scripts/src/startup-loop/__tests__/` (~200-300 lines)
  - Minor update to `scripts/package.json` (1 new script entry)
  - No registry schema change needed — eligibility is a composite gate (trigger_policy + active + non-T1-change + source citation) rather than a single-field check

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest with `@jest/globals`, `@acme/config/jest.preset.cjs`
- Commands: CI-only (`pnpm --filter scripts test`)
- CI integration: GitHub Actions reusable workflow

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Self-evolving contracts | Unit | `self-evolving-contracts.test.ts` | MetaObservation, ImprovementCandidate validation |
| Detector + scoring | Unit | `self-evolving-detector-scoring.test.ts` | Repeat-work detection, scoring dimensions |
| Lifecycle | Unit | `self-evolving-lifecycle-container.test.ts` | State transitions, creation gates |
| Orchestrator | Integration | `self-evolving-orchestrator-integration.test.ts` | End-to-end orchestrator flow |
| Ideas trial | Unit | `lp-do-ideas-trial.test.ts` | Suppression rules, dispatch validation |
| Codebase signals bridge (adjacent to build-commit-hook) | Unit | `lp-do-ideas-codebase-signals-bridge.test.ts` | Git diff detection, event construction (no dedicated build-commit-hook test file) |

#### Coverage Gaps

- No tests for a write-back path (does not exist yet)
- No tests for standing artifact file modification (currently read-only)
- No tests for anti-self-trigger loop prevention in write-back context

#### Testability Assessment

- Easy to test:
  - Patch classification (metadata-only vs section-content vs T1-semantic) — pure function, no IO
  - Safety gate evaluation (trigger_policy + propagation_mode + section type → allow/deny) — pure function
  - Audit event emission — mock fs.appendFileSync
- Hard to test:
  - Anti-self-trigger loop prevention — requires simulating the full delta detection → write-back → delta re-detection cycle
- Test seams needed:
  - File system abstraction for standing artifact reads/writes (already patterned in self-evolving-events.ts)
  - Registry reader abstraction (already exists in build-commit-hook.ts)

#### Recommended Test Approach

- Unit tests for: patch classification, safety gate, frontmatter parser/writer, anti-loop guard, audit emission
- Integration tests for: end-to-end write-back with temp-dir standing artifacts and registry
- Contract tests for: write-back event schema compatibility with existing observation pipeline

### Recent Git History (Targeted)

- `scripts/src/startup-loop/self-evolving/*` — self-evolving pipeline reorganized into 8 domain subdirectories (commit `390142607a`, 2026-03-03); no functional changes but paths have shifted
- `scripts/src/startup-loop/build/lp-do-build-results-review-prefill.ts` — new deterministic pre-fill script (2026-03-04); demonstrates the pattern of deterministic scripts reading build artifacts and producing structured output
- `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts` — new pattern-reflection pre-fill (2026-03-04); demonstrates archive scanning and recurrence counting pattern

## Access Declarations

None. All data is local filesystem. No external services required.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The deliverable is a single deterministic script (~200-400 lines) with clear inputs (observations, registry, standing artifacts) and outputs (patched artifacts, audit events). The safety boundaries are well-defined by existing `trigger_policy` and T1 semantic keyword infrastructure. The anti-loop concern is real but bounded — requires adding `"standing-write-back"` to `SELF_TRIGGER_PROCESSES` in `lp-do-ideas-trial.ts` (a one-line change included in task scope).

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Observation pipeline flow | Yes | None | No |
| Standing registry structure | Yes | None | No |
| Standing artifact formats | Yes | None | No |
| Safety gate design (T1 keywords) | Yes | None | No |
| Anti-self-trigger loop | Yes | [Missing domain coverage] [Moderate]: `anti_self_trigger_non_material` suppression exists but its interaction with programmatic writes (vs agent-authored commits) is untested | No |
| Audit trail integration | Yes | None | No |
| Write concurrency | Partial | [Integration boundary] [Minor]: No file-level locking exists for standing artifact writes; relies on single-agent execution model | No |

## Questions

### Resolved

- Q: What constitutes a "verified low-risk update"?
  - A: Three tiers based on existing infrastructure: (1) **Metadata-only** — frontmatter date/timestamp fields, owner, review-trigger → auto-applicable, lowest risk. (2) **Non-T1 section content** — sections whose headings don't match T1 semantic keywords → auto-applicable with source citation. (3) **T1 semantic sections** — ICP, pricing, channel, brand identity, etc. → requires operator confirmation, NOT auto-applicable by write-back script.
  - Evidence: `standing-registry.json` T1 keyword list (42 terms); `lp-do-ideas-trial.ts` `T1_SEMANTIC_KEYWORDS`

- Q: How to prevent write-back from triggering an infinite loop (write → delta detection → new observation → new candidate → new write-back)?
  - A: The `anti_self_trigger_non_material` suppression rule in `lp-do-ideas-trial.ts` (line 836-844) checks `event.updated_by_process` against `SELF_TRIGGER_PROCESSES` (line 457-460, currently: `projection_auto`, `reflection_emit`, `reflection_emit_minimum`). Write-back must add `"standing-write-back"` to this set. This is a one-line change to `lp-do-ideas-trial.ts`. The `ArtifactDeltaEvent.updated_by_process` field already exists to carry this marker, but **the suppression only fires when the process name is in `SELF_TRIGGER_PROCESSES` AND the delta is non-material** — so the registration is required.
  - Evidence: `lp-do-ideas-trial.ts` line 457-460 (`SELF_TRIGGER_PROCESSES` set), line 836-844 (suppression logic)

- Q: Should write-back modify the standing-registry.json `last_known_sha` after updating an artifact?
  - A: Yes. Updating `last_known_sha` after write-back ensures the next delta detection uses the new baseline. Note: the build-commit-hook (`lp-do-ideas-build-commit-hook.ts`) computes blob SHAs from git refs for comparison but does NOT write them back to `standing-registry.json`. Write-back would be the first process to actually update `last_known_sha` in the registry — this is new behavior, not an existing pattern.
  - Evidence: Registry schema `last_known_sha` field (currently null for most artifacts); build-commit-hook uses `git rev-parse` for transient comparison only

- Q: Which artifacts should be eligible for write-back?
  - A: `propagation_mode: source_mechanical_auto` is semantically correct but currently too narrow — only 3 BOS telemetry JSON artifacts have this mode (bug-scan-findings, codebase-signals, agent-session-findings). The other 31 artifacts use `source_task`. The write-back script should use a **dedicated eligibility check** rather than relying solely on `propagation_mode`: (1) `trigger_policy` must be `eligible` or `manual_override_only`, (2) `active` must be `true`, (3) the proposed change must be non-T1 (metadata-only or non-semantic-section), (4) the source citation must reference a concrete observation or evidence ref. This composite gate is safer and more broadly applicable than any single field. For T1 semantic changes, write-back always requires operator confirmation regardless of `propagation_mode`.
  - Evidence: `standing-registry.json` — 31 of 34 artifacts are `source_task`; only 3 are `source_mechanical_auto` (all BOS telemetry JSON)

- Q: Where should the script live in the codebase?
  - A: `scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts` — consistent with the self-evolving module namespace and co-located with the observation/candidate pipeline it reads from.
  - Evidence: Existing module structure in `scripts/src/startup-loop/self-evolving/`

### Open (Operator Input Required)

None. All design questions are resolvable from available evidence and the operator's stated preference for deterministic implementation.

## Confidence Inputs

- **Implementation:** 85% — clear entry points, well-understood data shapes, established patterns (pre-fill scripts demonstrate the exact pattern). Reaches >=90 with a prototype that handles the metadata-only tier end-to-end.
- **Approach:** 90% — the three-tier safety model (metadata / non-T1 / T1) maps directly to existing infrastructure (T1 keywords, trigger_policy, propagation_mode). No novel concepts required.
- **Impact:** 80% — closes a concrete gap in the self-evolving pipeline. Impact is bounded by the number of observations that produce actionable write-back candidates (currently unknown). Reaches >=90 after first production run shows actual write-back volume.
- **Delivery-Readiness:** 85% — all dependencies exist, test infrastructure is established, no external services needed. Reaches >=90 with a clear execution plan.
- **Testability:** 90% — core logic is pure functions (classification, gating, frontmatter parsing). File IO is easily mockable via temp directories (established pattern in 78 existing test files).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Write-back triggers infinite delta detection loop | Low | High | Must add `"standing-write-back"` to `SELF_TRIGGER_PROCESSES` set in `lp-do-ideas-trial.ts` (line 457-460); without this, `updated_by_process` marker alone does nothing |
| Concurrent write-back and manual edit corrupt artifact | Low | Medium | Single-agent execution model; add advisory file lock check; write-back skips if file has uncommitted changes |
| Metadata-only update misclassified as content update | Low | Low | Classification is deterministic (frontmatter vs body); unit tests cover boundary cases |
| T1 keyword list expansion causes previously safe sections to become gated | Low | Low | Write-back reads T1 keywords from registry at runtime; changes propagate automatically |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `@jest/globals` imports, sync tmpdir pattern, `.js` import extensions (consistent with 78 existing tests)
  - Follow `self-evolving-contracts.ts` type patterns for any new interfaces
  - Use `appendObservationAsEvent()` pattern for audit trail
- Rollout/rollback expectations:
  - Script is invoked explicitly (not auto-triggered) — rollback is simply not invoking it
  - All writes are git-tracked — `git revert` recovers any incorrect patches
- Observability expectations:
  - Stderr logging with `[write-back]` prefix (consistent with `[pre-fill]` pattern)
  - Audit event emission to events.jsonl for every write-back operation

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT: Core write-back script** — `self-evolving-write-back.ts` with three-tier classification, safety gate, frontmatter parser/writer, anti-loop marker, audit emission. Entry in `scripts/package.json`.
2. **IMPLEMENT: Tests** — Unit tests for classification, gating, parsing; integration test for end-to-end write-back with temp-dir fixtures.
3. **IMPLEMENT: Anti-loop integration** — Add `"standing-write-back"` to `SELF_TRIGGER_PROCESSES` set in `lp-do-ideas-trial.ts` (line 457-460); verify suppression fires for write-back-authored deltas; add test case.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: Script exists, tests pass in CI, dry-run mode produces correct classification output for sample artifacts
- Post-delivery measurement plan: Count write-back operations per week; measure time-to-freshness for standing artifacts before vs after

## Evidence Gap Review

### Gaps Addressed

- Standing artifact format diversity: verified sampled artifacts are Markdown+YAML-frontmatter or JSON; some registered paths may not yet exist in-repo (path-based inference for unverified entries)
- Anti-loop mechanism: confirmed `anti_self_trigger_non_material` and `updated_by_process` field exist
- Safety gate mapping: confirmed `trigger_policy` + `propagation_mode` + T1 keywords provide sufficient gating
- Test infrastructure: confirmed 78 test files with established patterns in the target directory

### Confidence Adjustments

- Implementation raised from 75% to 85%: the pre-fill scripts (just completed) demonstrate the exact pattern needed
- Approach raised from 80% to 90%: T1 keyword infrastructure and registry.v2 fields map directly to the three-tier model

### Remaining Assumptions

- Single-agent execution model holds (no concurrent write-back invocations) — mitigated by advisory lock check
- Composite eligibility gate (trigger_policy + active + non-T1-change + source citation) is sufficient — verifiable during implementation by testing against all 34 registry entries

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none (anti-loop integration is a plan task, not a blocking prerequisite — write-back script includes dry-run mode and the `SELF_TRIGGER_PROCESSES` update is scoped within the same plan)
- Recommended next step: `/lp-do-plan standing-artifact-deterministic-write-back --auto`
