---
Type: Fact-Find
Outcome: Planning
Status: Infeasible
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-smarter-dedup
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/do-workflow-smarter-dedup/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312075840-C005
---

# Workflow Smarter Dedup Fact-Find Brief

## Scope

### Summary

Investigation into whether the workflow telemetry dedupe key and ideas queue dedup system adequately handle reruns and semantic duplicates. The dispatch hypothesis was that `computeTelemetryKey` does not account for context changes, causing reruns to be silently dropped.

### Goals

- Verify whether the telemetry dedupe key includes context-sensitive fields
- Assess the ideas queue dedup system for gaps in semantic duplicate detection
- Determine if a smarter dedup approach is warranted

### Non-goals

- Changing existing dedup behavior without evidence of real operational problems
- Adding LLM-based semantic similarity (non-deterministic)

### Constraints & Assumptions

- Constraints:
  - Dedup system must remain deterministic and reproducible (no LLM involvement)
  - Must not break existing append-only telemetry contract
- Assumptions:
  - The dispatch claim that `computeTelemetryKey` excludes `context_paths` is accurate (to be verified)

## Outcome Contract

- **Why:** When the system goes live, the same real change could trigger multiple dispatches from different angles. Without content-aware dedup, duplicate investigations get queued, wasting time and creating conflicting plans.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Duplicate dispatches targeting the same underlying content change are automatically consolidated regardless of metadata differences.
- **Source:** auto

## Current Process Map

### Telemetry Dedupe (workflow_step records)

- Trigger: Agent runs `pnpm startup-loop:lp-do-ideas-record-workflow-telemetry`
- Step 1: `buildWorkflowStepTelemetryRecord()` builds record and computes `telemetry_key` via `computeTelemetryKey()`
- Step 2: `appendWorkflowStepTelemetry()` delegates to `appendJsonlRecords()` in `ideas-jsonl.ts`
- Step 3: `appendJsonlRecords` reads full JSONL, builds a `Set` of existing keys, filters incoming records
- Step 4: If key exists in set, record is silently dropped (returns 0). Otherwise, atomic rewrite with new record appended.
- End condition: Record appended or silently deduplicated

### Ideas Queue Dedupe (dispatch packets)

- Trigger: `lp-do-ideas` processes a delta event and calls `TrialQueue.enqueue()`
- Step 1: Orchestrator-level dedupe via `buildDedupeKey()`: `<artifact_id>:<before_sha>:<after_sha>` checked against `seenDedupeKeys` Set
- Step 2: Queue admission checks dispatch_id primary dedup (exact match)
- Step 3: V2 dedupe key check: `<cluster_key>:<cluster_fingerprint>` (SHA-256 hash of root_event_id + anchor_key + artifact_id + SHAs + evidence_refs + semantic_diff_hash)
- Step 4: V1 dedupe key check (legacy): `<artifact_id>:<before_sha>:<after_sha>`
- Step 5: If duplicate caught, evidence_refs and location_anchors are merged into canonical entry; `skipped_duplicate_dedupe_key` telemetry emitted
- End condition: Dispatch admitted or suppressed with merge

## Evidence Audit (Current State)

### Critical Finding: Dispatch Hypothesis is Factually Incorrect

The dispatch claim that "`computeTelemetryKey` hashes stage+slug+modules+checks but not context_paths or artifact content" is **wrong**.

Investigation of `computeTelemetryKey()` at `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts:327-348` shows the hash payload includes **15 fields**:

| Field | In Key? | Evidence |
|---|---|---|
| `feature_slug` | Yes | Line 331 |
| `stage` | Yes | Line 332 |
| `mode` | Yes | Line 333 |
| `artifact_path` | Yes | Line 334 |
| `artifact_bytes` | Yes | Line 335 |
| `artifact_lines` | Yes | Line 336 |
| `context_paths` | **Yes** | Line 337 |
| `context_input_bytes` | **Yes** | Line 338 |
| `modules_loaded` | Yes | Line 339 |
| `deterministic_checks` | Yes | Line 340 |
| `execution_track` | Yes | Line 341 |
| `deliverable_type` | Yes | Line 342 |
| `dispatch_ids` | Yes | Line 343 |
| `per_module_bytes` | Yes | Line 344 (added v1.5.0) |
| `deterministic_check_results` | Yes | Line 345 (added v1.6.0) |

**`context_paths` IS in the key. `artifact_bytes` and `artifact_lines` ARE in the key.** Reruns with different context produce different keys and are NOT silently dropped — they produce new, distinct telemetry records.

### Ideas Queue Dedup Assessment

The ideas queue uses a two-layer dedup system that is adequate for current and near-term scale:

- **Layer 1 (orchestrator):** `buildDedupeKey()` catches exact event replays within a run
- **Layer 2 (queue):** Dual V1/V2 keys with cluster fingerprinting (SHA-256 of root_event_id + anchor_key + artifact_id + SHAs + evidence_refs + semantic_diff_hash)
- **Supplementary:** Cooldown mechanism suppresses non-material re-fires within time windows

Real data from queue-state.json:
- 547 total dispatches, 196 suppressed (35.8%)
- Only 6/458 unique cluster_keys have >1 dispatch (all legitimate different work items from same cluster)
- 0 cluster_key overlap between suppressed and active states

### Theoretical Gaps (Not Operational Problems)

Three scenarios could theoretically evade dedup:

1. **Incremental edits to same section across commits** — Different SHA pairs produce different keys. Partially mitigated by cooldown mechanism.
2. **Same problem described from different artifact sources** — Different root_event_id and artifact_id produce different cluster_keys. No cross-artifact semantic matching exists.
3. **Operator ideas vs artifact deltas about same topic** — Different root_event_id patterns guarantee different cluster_keys.

None of these are causing operational problems at current scale. The V2 cluster fingerprint system with semantic_diff_hash already provides substantial content-awareness.

### One Real (Minor) Gap: `business` Not in Telemetry Key

`business` is excluded from `computeTelemetryKey`. Two records for the same feature_slug and stage but different businesses would collide. In practice this is not an issue because feature_slugs are unique across the repo, but it is a latent defect.

## Key Files & Modules

| File | Role |
|---|---|
| `scripts/src/startup-loop/ideas/lp-do-ideas-workflow-telemetry.ts:327-348` | `computeTelemetryKey()` — telemetry dedupe hash |
| `scripts/src/startup-loop/ideas/ideas-jsonl.ts:54-76` | `appendJsonlRecords()` — atomic append with dedupe |
| `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:1363` | `buildDedupeKey()` — orchestrator queue dedupe |
| `scripts/src/startup-loop/ideas/lp-do-ideas-trial-queue.ts:545` | `TrialQueue.enqueue()` — dual V1/V2 admission |
| `scripts/src/startup-loop/ideas/lp-do-ideas-fingerprint.ts:237` | `computeClusterFingerprint()` — content-aware hashing |
| `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts:115-132` | Idempotency test |
| `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts:356-393` | TC-03: per_module_bytes key divergence |
| `scripts/src/startup-loop/__tests__/lp-do-ideas-workflow-telemetry.test.ts:561-583` | TC-04: check_results key divergence |

## Test Landscape

- 3 direct dedupe tests in `lp-do-ideas-workflow-telemetry.test.ts` covering idempotency, per_module_bytes divergence, and check_results divergence
- Queue admission tests in `lp-do-ideas-trial-queue.ts` test suite covering V1/V2 dedup, merge behavior, and suppression telemetry
- No tests for cross-artifact semantic dedup (because no such feature exists or is needed)

## Engineering Coverage Matrix

| Row | Treatment | Rationale |
|---|---|---|
| UI / visual | N/A | No UI |
| UX / states | N/A | No user-facing states |
| Security / privacy | N/A | Internal tooling |
| Logging / observability / audit | N/A | Dedup already emits telemetry events for suppressions |
| Testing / validation | Required | Would need tests for any new dedup behavior |
| Data / contracts | Required | Telemetry key contract changes affect all consumers |
| Performance / reliability | N/A | No hot path impact |
| Rollout / rollback | N/A | Additive only |

## Access Declarations

None

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Telemetry dedupe key fields | Yes | None — dispatch hypothesis refuted by direct code inspection | No |
| Ideas queue V1/V2 dedup | Yes | None — dual-layer system with cluster fingerprinting is adequate | No |
| Real operational duplicates | Yes | None — 0 missed duplicates in real queue data | No |
| Theoretical cross-artifact semantic dedup | Partial | [Missing domain coverage] [Advisory]: No semantic matching exists, but real data shows no operational need | No |
| `business` field gap in telemetry key | Yes | [Data contract] [Minor]: Latent collision if feature_slugs shared across businesses | No |

## Scope Signal

- Signal: right-sized
- Rationale: Investigation covers both the telemetry dedupe key (direct code inspection refutes hypothesis) and the ideas queue dedup (dual-layer V1/V2 with cluster fingerprinting shown adequate via real data). No evidence supports expanding scope.

## Confidence Inputs

| Dimension | Value | Rationale |
|---|---|---|
| Evidence | 95% | Direct code inspection of hash payload, real queue data analysis |
| Approach | N/A | No approach needed — problem does not exist |
| Impact | N/A | No change warranted |

## Kill Rationale

The core hypothesis — that `computeTelemetryKey` does not include `context_paths` or artifact content, causing reruns to be silently dropped — is factually incorrect. The key includes 15 fields including `context_paths`, `artifact_bytes`, `artifact_lines`, `context_input_bytes`, `per_module_bytes`, and `deterministic_check_results`. The ideas queue dedup system uses a two-layer V1/V2 approach with cluster fingerprinting and cooldown that handles 35.8% of dispatches as suppressions with zero evidence of missed duplicates in real data. No operational problem exists to solve.

## Analysis Readiness

- Status: **Infeasible** — the stated problem does not exist. No analysis needed.
- Critique: Not required for Infeasible findings (kill rationale documents the evidence).

## Evidence Gap Review

### Gaps Addressed

- Telemetry dedupe key contents: fully verified via direct code inspection (15 fields in hash)
- Ideas queue dedup effectiveness: verified via real queue data (547 dispatches, 196 suppressed, 0 missed)
- Test coverage: 3 direct dedupe tests + queue admission test suite confirmed

### Confidence Adjustments

- Raised from default to 95% based on direct code evidence refuting the hypothesis

### Remaining Assumptions

- Feature slugs remain unique across businesses (mitigates the `business`-not-in-key gap)
