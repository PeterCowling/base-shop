---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-queue-quality-gates
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/ideas-queue-quality-gates/analysis.md
---

# Ideas Queue Quality Gates Plan

## Summary

Add deterministic content quality guards to the ideas queue admission path. The guards reject noise (agent chatter, duplicates, malformed content) before it enters the queue. A pure `validateDispatchContent()` function is called from `enqueueQueueDispatches()` (protecting 4 bridges) and also called directly by the 2 direct writers (historical-carryover bridge and self-evolving-backbone-consume) in their existing write loops. After guards are in place, a cleanup script purges existing noise and classifies missing domains. Finally, a fresh operator idea pattern analysis runs on the cleaned data.

## Active tasks
- [x] TASK-01: Extract content guard function and integrate into enqueueQueueDispatches()
- [x] TASK-02: Add guard call to historical-carryover bridge and self-evolving-backbone-consume
- [x] TASK-03: Queue data cleanup script
- [x] TASK-04: Re-run operator idea pattern analysis on clean data

## Goals

- Add deterministic admission guards that reject noise before it enters the queue
- Ensure all 6 queue writers route through the content guard (4 via enqueueQueueDispatches, 2 via direct guard call)
- Clean existing queue data: purge noise, classify domains, fix non-canonical values
- Produce a fresh pattern analysis on cleaned data

## Non-goals

- Migrating queue file format from hand-authored to TS persistence layer
- Adding LLM-based semantic validation
- Changing the dispatch.v2 schema

## Constraints & Assumptions

- Constraints:
  - `enqueueQueueDispatches()` in `lp-do-ideas-queue-admission.ts` is the write entrypoint for 4 of 6 queue writers. The historical-carryover bridge and self-evolving-backbone-consume both write directly via `queue.dispatches.push()` and must call the guard function directly.
  - `domain` is NOT in `TrialDispatchPacketV2` — exists only on persisted queue entries by convention. Domain enforcement operates on persisted entries only.
  - `enqueueQueueDispatches()` currently performs only dispatch_id + cluster dedup. No structural or content checks.
  - `ValidationFailureReason` type has 7 literals in `lp-do-ideas-trial-queue.ts`. New content guard reasons are separate — defined in queue-admission.ts.
  - No dedicated test file exists for `enqueueQueueDispatches()` — currently tested only indirectly through bridge tests.
- Assumptions:
  - All 154 duplicate noise dispatches have identical area_anchor text (area_anchor exact-match dedup is sufficient)
  - Historical-carryover bridge can be refactored to use `enqueueQueueDispatches()` without changing its external interface

## Inherited Outcome Contract

- **Why:** Right now, nothing checks whether an idea entering the backlog is real or just internal processing noise. Over half the entries have missing categories, and about 80 are duplicated fragments of the AI talking to itself. The operator cannot trust the backlog for decision-making. Adding automatic quality checks and cleaning up the existing data would make the ideas list reliable for prioritising what to work on next.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Deterministic admission guards prevent noise entering the queue, existing queue data is cleaned and domain-classified, and a fresh pattern analysis on clean data is produced.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/ideas-queue-quality-gates/analysis.md`
- Selected approach inherited:
  - Option A: Centralized guards in `enqueueQueueDispatches()` with historical-carryover bridge alignment
- Key reasoning used:
  - Single enforcement point protecting all 5 bridges
  - Guard logic extracted as a pure function for testability
  - Domain enforcement at persistence layer only (not packet type)
  - Historical-carryover bridge aligned to same write path

## Selected Approach Summary

- What was chosen:
  - Content quality guards as a pure function called from `enqueueQueueDispatches()` before append. Guards include: forbidden-pattern check on area_anchor, minimum word count (≥5 words for artifact_delta), area_anchor exact-match dedup against existing queue entries, and domain canonical check when present on persisted entry.
  - Historical-carryover bridge refactored to use `enqueueQueueDispatches()` instead of direct `queue.dispatches.push()`.
  - One-time cleanup script for existing queue data.
  - Fresh pattern analysis on cleaned data.
- Why planning is not reopening option selection:
  - Analysis evaluated 3 options and eliminated B and C on "all ingress paths protected" criterion. No new evidence changes the calculus.

## Fact-Find Support

- Supporting brief: `docs/plans/ideas-queue-quality-gates/fact-find.md`
- Evidence carried forward:
  - 160 noise dispatches (29.3% of 547) from artifact_delta trigger only
  - 291 dispatches missing domain, 10 with non-canonical domain
  - Noise patterns: 154 duplicate area_anchors, 106 agent reasoning fragments, 14 malformed, 17 slug-like paths (categories overlap)
  - `enqueueQueueDispatches()` is the 4-bridge convergence point; historical-carryover bypasses it

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Content guard function + integration into enqueueQueueDispatches() | 85% | M | Complete (2026-03-12) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Add content guard call to direct-write paths (historical-carryover + self-evolving-backbone) | 85% | S | Complete (2026-03-12) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Queue data cleanup script | 85% | M | Pending | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Re-run operator idea pattern analysis on clean data | 85% | S | Pending | TASK-03 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A: no UI — backend validation logic | - | - |
| UX / states | N/A: no user-facing states | - | - |
| Security / privacy | N/A: no auth/sensitive data — internal queue validation | - | - |
| Logging / observability / audit | Required: new content-rejection telemetry via existing `kind: "validation_rejected"` path | TASK-01 | New rejection reasons flow into existing telemetry |
| Testing / validation | Required: dedicated unit tests for guard function and bridge alignment | TASK-01, TASK-02 | First dedicated test file for queue-admission.ts |
| Data / contracts | Required: new ContentGuardResult type, new rejection reason literals | TASK-01 | Domain enforcement on persisted entries only |
| Performance / reliability | Required: regex + Set lookups must be fast on 547-entry queue | TASK-01 | Pre-compiled patterns, Set-based dedup |
| Rollout / rollback | N/A: internal tooling, no deployment | - | Code change to validation functions |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Guards must exist before anything else |
| 2 | TASK-02 | TASK-01 | Bridge alignment uses the guard function from TASK-01 |
| 3 | TASK-03 | TASK-01, TASK-02 | Cleanup uses guard functions and requires all bridges aligned |
| 4 | TASK-04 | TASK-03 | Pattern analysis needs clean data |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Queue admission (4 bridges via enqueueQueueDispatches) | Dispatch packet arrives at `enqueueQueueDispatches()` | 1. Existing dispatch_id dedup 2. Existing cluster dedup 3. **NEW: Content guard check** via `validateDispatchContent()` — forbidden patterns, min word count, area_anchor dedup, domain canonical check 4. Append to queue 5. Update counts and write atomically 6. Append telemetry (including rejection telemetry for guarded packets) | TASK-01 creates guards | Forbidden patterns derived from current noise — may need updates for future patterns |
| Queue admission (historical-carryover bridge) | Historical manifest item processed | 1. Existing inline dispatch_id + cluster dedup 2. **NEW: Content guard check** via same `validateDispatchContent()` called before `queue.dispatches.push()` 3. If rejected, stamp admission_result as suppressed 4. If accepted, push to queue + stamp admission_result as enqueued 5. Write queue + manifest atomically | TASK-02 adds guard call | Bridge keeps its own write loop for per-item manifest stamping and dry-run support |
| Queue admission (self-evolving-backbone-consume) | Self-evolving backbone processes follow-up dispatches | 1. Existing inline dispatch_id + cluster dedup 2. **NEW: Content guard check** via same `validateDispatchContent()` called before `queue.dispatches.push()` 3. If rejected, skip push 4. If accepted, push to queue 5. Write queue + telemetry | TASK-02 adds guard call | Writer keeps its own write loop for follow-up dispatch management |
| Queue data quality | One-time cleanup script invocation | 1. Load queue-state.json 2. Apply content guards to identify noise 3. Remove noise dispatches 4. Classify missing domains 5. Fix non-canonical domain values 6. Recalculate counts 7. Write atomically 8. Output reviewable diff | TASK-03 | Domain classification requires per-dispatch judgment; script produces reviewable diff |

## Tasks

### TASK-01: Extract content guard function and integrate into enqueueQueueDispatches()

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `scripts/src/startup-loop/ideas/lp-do-ideas-queue-admission.ts` + new test file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-12)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-queue-admission.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-admission.test.ts`, `[readonly] scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`, `[readonly] scripts/src/startup-loop/ideas/lp-do-ideas-trial-queue.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
- **Build evidence:**
  - `validateDispatchContent()` exported pure function with 4 guard rules: forbidden patterns (9 regex), min word count (≥5 for artifact_delta), area_anchor dedup (case-insensitive), domain canonical check
  - `enqueueQueueDispatches()` TPacket constraint widened: added `area_anchor: string` and `trigger: string`
  - Content-guard rejections folded into `suppressed` count, telemetry emitted as `kind: "validation_rejected"` with `queue_state: "error"`
  - 20 tests passing: 14 unit tests for `validateDispatchContent()`, 6 integration tests for `enqueueQueueDispatches` with guards
  - Typecheck clean, lint clean
  - Post-build validation: Mode 2 (Data Simulation), Attempt 1, Pass
  - Engineering coverage: Logging (validation_rejected telemetry), Testing (20 tests), Data/contracts (ContentGuardResult type + new reason literals), Performance (pre-compiled regex + Set dedup)
  - Implementation: 85% - Clear target function, pure function extraction, existing test patterns in adjacent bridge tests. Held-back test: no single unknown drops this below 80 because the guard logic is deterministic regex/set operations against well-understood noise patterns.
  - Approach: 90% - Analysis chose this approach decisively; single enforcement point is simplest viable option.
  - Impact: 85% - Guards catch 154/160 noise dispatches via area_anchor dedup alone; remaining 6 caught by forbidden patterns.
- **Acceptance:**
  - [ ] New exported `validateDispatchContent()` pure function in queue-admission.ts
  - [ ] Function checks: forbidden patterns on area_anchor, minimum word count (≥5 for artifact_delta trigger), area_anchor exact-match dedup against existing queue entries, domain canonical check (ArtifactDomain enum) when domain field is present
  - [ ] `enqueueQueueDispatches()` calls the guard function before append and records rejections in telemetry
  - [ ] New `ContentGuardResult` type exported for callers and tests
  - [ ] All 547 existing dispatches tested: 160 noise caught, 387 legitimate pass, 0 false positives
  - [ ] Existing bridge tests continue to pass (no breaking changes to enqueueQueueDispatches interface)
- **Engineering Coverage:**
  - UI / visual: N/A - no UI
  - UX / states: N/A - no user-facing states
  - Security / privacy: N/A - internal queue validation
  - Logging / observability / audit: Required - rejection telemetry using existing `kind: "validation_rejected"` pattern with new reason literals
  - Testing / validation: Required - dedicated unit test file `lp-do-ideas-queue-admission.test.ts` with tests for each guard rule
  - Data / contracts: Required - new `ContentGuardResult` type, new rejection reason string literals, `enqueueQueueDispatches` return type extended with rejection counts
  - Performance / reliability: Required - pre-compiled regex patterns, Set-based area_anchor dedup
  - Rollout / rollback: N/A - internal tooling
- **Validation contract (TC-XX):**
  - TC-01: Dispatch with area_anchor "Based on the analysis of..." → rejected (forbidden pattern)
  - TC-02: Dispatch with area_anchor "Fix bug" (2 words, artifact_delta trigger) → rejected (min word count)
  - TC-03: Dispatch with area_anchor identical to existing queue entry → rejected (area_anchor dedup)
  - TC-04: Dispatch with domain "BUILD" → rejected (non-canonical domain)
  - TC-05: Dispatch with domain "MARKET" → accepted (valid ArtifactDomain)
  - TC-06: Dispatch with no domain field → accepted (domain is optional)
  - TC-07: Dispatch with valid area_anchor, ≥5 words, unique, valid domain → accepted
  - TC-08: Dispatch with operator_idea trigger and 3-word area_anchor → accepted (min word count only applies to artifact_delta)
  - TC-09: Run all 547 existing dispatches through guard individually (each dispatch tested against an empty baseline, then against a queue containing only prior dispatches — simulating sequential arrival): verify 160 rejected by forbidden patterns or area_anchor dedup, 387 accepted. Note: area_anchor dedup test must exclude self (a dispatch cannot dedup against itself); test harness must replay dispatches sequentially into a growing baseline set.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write test for forbidden pattern rejection, verify it fails (no guard exists yet)
  - Green: Implement `validateDispatchContent()` pure function, integrate into `enqueueQueueDispatches()`, verify all TC pass
  - Refactor: Extract forbidden patterns as a constant array for extensibility; ensure telemetry recording is clean
- **Planning validation (required for M/L):**
  - Checks run: Verified `enqueueQueueDispatches()` signature (generic over TPacket with 4 required fields: dispatch_id, business, cluster_key, cluster_fingerprint). Content guards need additional fields (area_anchor, trigger, optionally domain) — generic constraint must be widened to include these. `QueueDispatch` has `[key: string]: unknown` index signature (allows reading area_anchor from existing queue entries for dedup). Verified existing bridge tests import and call `enqueueQueueDispatches` directly.
  - Validation artifacts: `lp-do-ideas-queue-admission.ts` lines 10-23 (generic constraint), `lp-do-ideas-queue-state-file.ts` QueueDispatch interface
  - Unexpected findings: Generic TPacket constraint must be widened to add `area_anchor: string` and `trigger: string` fields — this is a type-level breaking change that requires all 4 bridge callers to pass packets already including these fields (which they do — all bridges pass full dispatch packets, not minimal objects)
- **Consumer tracing:**
  - New output: `validateDispatchContent()` function — consumed by `enqueueQueueDispatches()` (TASK-01) and historical-carryover bridge (TASK-02)
  - New output: `ContentGuardResult` type — consumed by test file and `enqueueQueueDispatches()` return path
  - Modified behavior: `enqueueQueueDispatches()` generic TPacket constraint widened to require `area_anchor: string` and `trigger: string` in addition to existing 4 fields. All 4 bridge callers already pass full TrialDispatchPacket/V2 objects containing these fields, so the wider constraint is satisfied without code changes at call sites.
  - Modified behavior: `enqueueQueueDispatches()` folds content-guard rejections into the existing `suppressed` count (not a separate `rejected` field). This preserves the existing return type `{ appended, suppressed }` and means all bridge callers that surface `.suppressed` will correctly include guard rejections. No bridge code changes needed.
  - Content-guard rejection details are visible via telemetry (existing `kind: "validation_rejected"` path), not via bridge result shape.
  - Consumer `lp-do-ideas-agent-session-bridge.ts` — unchanged, reads `.appended`
  - Consumer `lp-do-ideas-codebase-signals-bridge.ts` — unchanged, reads `.appended`
  - Consumer `lp-do-ideas-milestone-bridge.ts` — unchanged, reads `.appended` and `.suppressed` (guard rejections now included in suppressed)
  - Consumer `lp-do-ideas-build-origin-bridge.ts` — unchanged, reads `.appended` and `.suppressed`
  - Consumer `lp-do-ideas-operator-actions.ts` — reads queue-state.json dispatches array; unaffected by guard changes (guard prevents new bad entries, does not change existing entries)
  - Consumer `lp-do-ideas-work-packages.ts` — reads queue-state.json dispatches array; same as above
  - Consumer `self-evolving-backbone-consume.ts` — reads queue-state.json and also writes directly (addressed in TASK-02)
  - Consumer `self-evolving-report.ts` — reads queue-state.json for reporting; unaffected by guard changes
  - Note: `lp-do-ideas-persistence.ts` handles the separate `queue-state.v1` `entries[]` schema, NOT the agent-maintained `dispatches[]` file — not a consumer of this change
- **Scouts:** None: guard logic is deterministic; noise patterns are well-characterized from fact-find
- **Edge Cases & Hardening:**
  - Edge: area_anchor with leading/trailing whitespace — normalize before dedup check
  - Edge: area_anchor that partially matches forbidden pattern but is legitimate — use anchored regex patterns, not substring match
  - Edge: operator_idea dispatch with short area_anchor — min word count exemption for operator_idea trigger
- **What would make this >=90%:**
  - Running the guard function against the full 547 dispatches during build and confirming exact match to fact-find noise counts
- **Rollout / rollback:**
  - Rollout: Code change, no deployment
  - Rollback: Revert commit
- **Documentation impact:**
  - None: internal validation function
- **Notes / references:**
  - Forbidden patterns from fact-find noise analysis: agent reasoning ("Based on", "Looking at", "The analysis"), slug-like paths (contain "/" without spaces), malformed content (< 3 chars after trim)

### TASK-02: Add content guard call to direct-write paths (historical-carryover + self-evolving-backbone)

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `scripts/src/startup-loop/ideas/lp-do-ideas-historical-carryover-bridge.ts` + `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts` + test updates
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-historical-carryover-bridge.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-historical-carryover-bridge.test.ts`, `[readonly] scripts/src/startup-loop/ideas/lp-do-ideas-queue-admission.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% - Both direct writers keep their existing per-item write loops. Historical-carryover needs per-item admission_result stamping and dry-run support. Self-evolving-backbone has its own dispatch_id + cluster dedup. The only change is calling `validateDispatchContent()` before `queue.dispatches.push()` in each. Held-back test: no single unknown drops this below 80 because the guard is a pure function with a simple boolean result.
  - Approach: 90% - Cannot replace these writers' entire paths with `enqueueQueueDispatches()` because they have per-item state management. Calling the guard function directly is the correct approach.
  - Impact: 85% - Closes the 2 unguarded ingress paths.
- **Acceptance:**
  - [ ] Historical-carryover bridge calls `validateDispatchContent()` from TASK-01 before each `queue.dispatches.push()`
  - [ ] If guard rejects, bridge records rejection in `admission_result` with `queue_state: "suppressed"` and appropriate `suppression_reason`
  - [ ] Bridge's existing per-item manifest stamping, dry-run support, and inline dedup (`duplicateReason()`) are preserved
  - [ ] Self-evolving-backbone-consume calls `validateDispatchContent()` before each `queue.dispatches.push()` (line 444)
  - [ ] Content guards from TASK-01 now protect both direct-write paths
  - [ ] Existing bridge tests continue to pass
  - [ ] Result interfaces unchanged
- **Engineering Coverage:**
  - UI / visual: N/A - no UI
  - UX / states: N/A - no user-facing states
  - Security / privacy: N/A - internal queue validation
  - Logging / observability / audit: Required - rejection telemetry for guard-rejected packets via existing bridge telemetry path
  - Testing / validation: Required - update existing bridge test to verify content guard integration
  - Data / contracts: N/A - bridge result interface unchanged; guard rejection mapped to existing suppression flow
  - Performance / reliability: N/A - one additional pure function call per packet
  - Rollout / rollback: N/A - internal tooling
- **Validation contract (TC-XX):**
  - TC-01: Eligible carry-forward item with valid content → enqueued (existing test, should still pass)
  - TC-02: Duplicate carry-forward item → suppressed by inline dedup (existing test, should still pass)
  - TC-03: Carry-forward item with area_anchor matching forbidden pattern → rejected by content guard, admission_result records suppression (new test)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add TC-03 test for forbidden-pattern rejection, verify it fails (bridge currently bypasses guards)
  - Green: Import `validateDispatchContent()` from queue-admission.ts, call before `queue.dispatches.push()` in the bridge's for-loop, handle rejection by setting admission_result with suppression_reason
  - Refactor: Ensure rejection telemetry is recorded for guard-rejected packets
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: guard function is a pure function; bridge's for-loop structure supports pre-push checks
- **Edge Cases & Hardening:**
  - Edge: Bridge's existing `duplicateReason()` check runs before content guard — if a packet is both a duplicate and has a forbidden pattern, it's recorded as duplicate (existing behavior preserved)
  - Edge: Dry-run mode (`write: false`) — content guard rejection still stamps admission_result on manifest item even in dry-run, but no queue file write occurs (existing pattern)
- **What would make this >=90%:**
  - Confirming the bridge's existing test suite fully passes after adding the guard call
- **Rollout / rollback:**
  - Rollout: Code change, no deployment
  - Rollback: Revert commit
- **Documentation impact:**
  - None
- **Notes / references:**
  - Bridge file: `scripts/src/startup-loop/ideas/lp-do-ideas-historical-carryover-bridge.ts`
  - Per-item write at line 442: `queue.dispatches.push(packet as unknown as QueueFileShape["dispatches"][number])`
  - Guard call goes between `duplicateReason()` check (line 410) and `queue.dispatches.push()` (line 442)
  - Bridge KEEPS its own write logic — only adds the guard check. This preserves per-item admission_result stamping, dry-run support, and manifest update flow.

### TASK-03: Queue data cleanup script

- **Type:** IMPLEMENT
- **Deliverable:** cleanup script + cleaned queue-state.json
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/ideas/trial/queue-state.json`, `scripts/src/startup-loop/ideas/`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - Guard function from TASK-01 provides the noise detection logic. Cleanup is load-filter-write with atomic file operations already available in queue-state-file.ts. Domain classification is the main judgment area. Held-back test: no single unknown drops this below 80 because noise detection is deterministic and domain classification is bounded to 8 known values.
  - Approach: 90% - Cleanup must happen after guards (can reuse guard function). Reviewable diff is a clear validation path.
  - Impact: 85% - Removes 160 noise dispatches and classifies 291 missing domains.
- **Acceptance:**
  - [ ] Cleanup script uses `validateDispatchContent()` from TASK-01 to identify noise
  - [ ] Noise dispatches (area_anchor dedup matches + forbidden pattern matches) removed from queue
  - [ ] Missing domain fields classified using ArtifactDomain enum (8 values)
  - [ ] Non-canonical domain values normalized (BUILD→PRODUCTS, Platform→BOS)
  - [ ] Counts recalculated after cleanup
  - [ ] Script produces a reviewable summary: dispatches removed (count + sample), domains classified (count + distribution), non-canonical values fixed
  - [ ] queue-state.json written atomically
- **Engineering Coverage:**
  - UI / visual: N/A - no UI
  - UX / states: N/A - no user-facing states
  - Security / privacy: N/A - internal data cleanup
  - Logging / observability / audit: Required - cleanup summary output for operator review
  - Testing / validation: Required - dry-run mode that reports changes without writing
  - Data / contracts: Required - queue-state.json format preserved, counts recalculated
  - Performance / reliability: N/A - one-time script
  - Rollout / rollback: N/A - one-time script, git revert restores queue-state.json
- **Validation contract (TC-XX):**
  - TC-01: Dry-run mode → reports noise count, domain classification count, non-canonical fixes, does NOT write file
  - TC-02: Write mode → queue-state.json has fewer dispatches, updated counts, all remaining dispatches have valid domain or are operator_idea trigger
  - TC-03: After cleanup, re-running content guards against remaining dispatches → 0 noise caught (clean)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write script with dry-run mode, verify it identifies expected noise count
  - Green: Implement write mode with atomic file operations, verify queue-state.json is valid after cleanup
  - Refactor: Ensure domain classification logic is simple lookup table, not complex heuristics
- **Planning validation (required for M/L):**
  - Checks run: Verified queue-state.json structure (last_updated, counts, dispatches array), verified QueueDispatch has `[key: string]: unknown` index allowing domain field, verified ArtifactDomain enum has 8 values
  - Validation artifacts: queue-state.json lines 1-17 (header structure), lp-do-ideas-trial.ts ArtifactDomain type
  - Unexpected findings: None
- **Consumer tracing:**
  - Modified output: queue-state.json — consumers include `ideas.user.html` viewer, `lp-do-ideas-operator-actions.ts`, `lp-do-ideas-work-packages.ts`, `self-evolving-backbone-consume.ts`, `self-evolving-report.ts`, `generate-build-summary.ts`. Note: `lp-do-ideas-persistence.ts` handles the separate `queue-state.v1` `entries[]` schema, NOT this file.
  - Cleanup scope: only remove enqueued noise entries; completed/processed entries preserved for downstream reporting integrity. Adding `domain` to entries that lack it is additive. Adding `noise_flagged: true` to completed noise entries is additive (consumers ignore unknown fields via index signature).
- **Scouts:** None: queue-state.json format is well-understood from fact-find
- **Edge Cases & Hardening:**
  - Edge: Dispatch that is both noise (area_anchor dedup) AND has valid domain — remove it (noise takes priority)
  - Edge: Dispatch with queue_state "completed" that matches noise pattern — mark as noise in report but do NOT remove from queue. Completed entries are historical input for downstream reporting flows (`self-evolving-report.ts`, `self-evolving-orchestrator.ts`). Only remove noise entries with queue_state "enqueued" (the active backlog). Completed noise entries are annotated with a `noise_flagged: true` marker for future reporting exclusion.
- **What would make this >=90%:**
  - Running dry-run first and confirming noise count matches fact-find's 160 exactly
- **Rollout / rollback:**
  - Rollout: Run script, commit cleaned queue-state.json
  - Rollback: `git revert <cleanup-commit>` to restore queue-state.json to pre-cleanup state
- **Documentation impact:**
  - None
- **Notes / references:**
  - Domain classification approach: Use dispatch `business` field + `area_anchor` content to infer domain. BRIK→STRATEGY/SELL/PRODUCTS by context, HBAG→SELL/PRODUCTS, PLAT→BOS, etc.

### TASK-04: Re-run operator idea pattern analysis on clean data

- **Type:** IMPLEMENT
- **Deliverable:** Updated pattern analysis artifact
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - Analysis is a read-only scan of cleaned queue data. Pattern identification follows established dispatch taxonomy.
  - Approach: 90% - Must run after cleanup to produce accurate results.
  - Impact: 85% - Clean data enables reliable operator decision-making about which standing artifacts to create.
- **Build evidence:**
  - Pattern analysis artifact: `docs/plans/ideas-queue-quality-gates/task-04-pattern-analysis.md`
  - 373 clean dispatches analyzed (181 noise-flagged excluded), 358 operator_idea + 15 artifact_delta
  - 0 missing domains, 0 non-canonical domains, 0% noise rate post-cleanup
  - 6 domains represented: BOS (36.9%), PRODUCTS (28.7%), SELL (20.8%), STRATEGY (11.2%), LOGISTICS (1.6%), MARKET (0.8%)
  - Key finding: 96% operator_idea vs 4% artifact_delta — loop is almost entirely manual. Only BOS has any auto-detection (21%)
  - 7 thematic clusters identified with 10 standing artifact recommendations across 3 priority tiers
  - Priority 1 artifacts (4) would auto-detect ~115 dispatches (32% of clean queue) across BRIK, HBAG, XA, BOS
  - TC-01 PASS: 0% noise rate on clean data
  - TC-02 PASS: All 373 clean dispatches have canonical domain values
  - TC-03 PASS: Top themes identified by domain across all 6 domains present
- **Acceptance:**
  - [x] Pattern analysis run on cleaned queue-state.json
  - [x] Analysis identifies operator idea patterns by domain, business, and theme
  - [x] Output identifies which standing artifacts should be created to enable auto-detection
  - [x] Domain distribution reported (covers all domains present in cleaned data; not all 8 ArtifactDomain values will necessarily appear)
  - [x] Noise rate confirmed at 0% post-cleanup
- **Engineering Coverage:**
  - UI / visual: N/A - no UI
  - UX / states: N/A - no user-facing states
  - Security / privacy: N/A - read-only analysis
  - Logging / observability / audit: N/A - one-time analysis output
  - Testing / validation: N/A - analysis artifact validated by operator review
  - Data / contracts: N/A - read-only
  - Performance / reliability: N/A - one-time analysis
  - Rollout / rollback: N/A - analysis artifact only
- **Validation contract (TC-XX):**
  - TC-01: Cleaned queue has 0% noise rate (re-run content guards, all pass)
  - TC-02: Domain distribution covers all remaining dispatches (0 missing domain after cleanup)
  - TC-03: Pattern analysis identifies top themes by domain
- **Execution plan:** Red -> Green -> Refactor
  - Red: Load cleaned queue data, verify noise rate is 0%
  - Green: Produce pattern analysis with domain distribution, theme clustering, standing artifact recommendations
  - Refactor: Format analysis for operator readability
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: analysis is read-only scan of known data format
- **Edge Cases & Hardening:** None: read-only analysis on cleaned data
- **What would make this >=90%:**
  - Operator confirmation that the analysis is actionable for standing artifact creation decisions
- **Rollout / rollback:**
  - Rollout: Produce analysis artifact
  - Rollback: N/A — analysis artifact is informational
- **Documentation impact:**
  - Analysis output informs future standing artifact creation
- **Notes / references:**
  - This is the deliverable that enables the operator to decide which areas need standing artifacts so the loop can auto-detect problems instead of relying on manual operator_idea submissions

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Forbidden-pattern regex false positive on legitimate dispatch | Low | Medium | TC-09 in TASK-01: test all 547 dispatches, verify 0 false positives |
| Domain classification judgment errors | Medium | Low | Cleanup script produces reviewable summary; operator can correct before commit |
| Historical-carryover bridge refactor breaks existing behavior | Low | Medium | 2 existing bridge tests + new TC-03 verify behavior preservation |
| Future noise patterns not covered by current guard rules | Low | Low | Forbidden patterns stored as extensible constant array |

## Observability

- Logging: Content guard rejections logged via existing telemetry path (`kind: "validation_rejected"` with new reason literals)
- Metrics: Rejection counts visible in queue counts
- Alerts/Dashboards: None needed — internal tooling

## Acceptance Criteria (overall)

- [ ] All 6 queue writers route through content guard (4 via enqueueQueueDispatches, 2 via direct guard call)
- [ ] Content guards reject known noise patterns deterministically
- [ ] No false positives on legitimate dispatches
- [ ] Existing bridge tests pass unchanged
- [ ] Queue-state.json cleaned: noise removed, domains classified
- [ ] Fresh pattern analysis produced on clean data
- [ ] `validate-engineering-coverage.sh` passes on plan artifact

## Decision Log

- 2026-03-12: Analysis chose Option A (centralized guards + bridge alignment) over Option B (shared function without bridge alignment) and Option C (routing adapter only)
- 2026-03-12: Domain enforcement limited to persistence layer — domain not in packet type, cannot enforce at admission time for programmatic bridges

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Content guard function | Yes | None | No |
| TASK-02: Direct-writer guard calls | Yes — depends on TASK-01's exported `validateDispatchContent()` | None — guard is a pure function call inserted into each writer's existing for-loop before `queue.dispatches.push()`; both writers keep their own write paths | No |
| TASK-03: Queue data cleanup | Yes — depends on TASK-01's guard function for noise detection, TASK-02 for complete bridge coverage | None — guard function is a pure function callable from cleanup script, queue-state.json format is well-understood | No |
| TASK-04: Pattern analysis | Yes — depends on TASK-03's cleaned queue data | None — read-only analysis on known format | No |

## Overall-confidence Calculation

- TASK-01: 85% × M(2) = 170
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × M(2) = 170
- TASK-04: 85% × S(1) = 85
- Total: 510 / 6 = 85%
