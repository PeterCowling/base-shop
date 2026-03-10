---
Type: Plan
Status: Active
Domain: BOS
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-queue-noise-stub-suppression
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Ideas Queue Noise Stub Suppression Plan

## Summary

180 stub dispatches in the ideas trial queue inflate the visible backlog from ~60 substantive items to 240 — a 4x distortion. The root causes are dual: three signal artifact registry entries carry the wrong class/policy (`source_process/eligible` instead of `system_telemetry/never`), and the anchor-key builder has no length cap, allowing sentence-fragment slugs from agent transcripts to pass through. This plan fixes the registry, adds the length cap, and marks all 180 existing noise stubs as skipped to restore an accurate queue signal.

## Active tasks
- [ ] TASK-01: Fix registry entries for the three signal artifacts
- [ ] TASK-02: Add anchor_key length cap in buildAnchorKey()
- [ ] TASK-03: Clean up existing noise stubs in queue-state.json
- [ ] TASK-04: Typecheck and commit

## Goals
- Reclassify the three signal artifacts as `system_telemetry/never` so future bridge runs produce zero new dispatches.
- Cap anchor keys at 80 characters in `buildAnchorKey()` to prevent sentence-fragment slugs from reaching the queue.
- Mark 180 existing noise stubs as `queue_state: "skipped"` and update the counts block, so queue depth accurately reflects substantive work.

## Non-goals
- Changing the agent-session, codebase-signals, or repo-maturity bridge scripts themselves.
- Rewriting or replacing the deduplication logic.
- Addressing the separately tracked `auto_executed` state violation (Dispatch QSTATE-001).
- Setting `active: false` on the three signal artifacts (defaulting to `active: true / never` per fact-find safe default).

## Constraints & Assumptions
- Constraints:
  - The monotonic state machine only allows `enqueued → skipped`; entries cannot be deleted without breaking dedup integrity.
  - `trigger_policy: never` cannot be bypassed by `manualOverrideIds` (enforced in trial.ts lines 1264–1265).
  - `propagation_mode` is a required field in the schema with enum `["projection_auto", "source_task", "source_mechanical_auto"]`; the value cannot be removed, only changed.
  - The counts block in `queue-state.json` must stay in sync with actual entry states.
- Assumptions:
  - The three signal artifacts are not intended to produce individually routed dispatches. They are process-level collectors; the contract (Section 11.1) prescribes `system_telemetry/never` for them.
  - The 80-char length cap does not truncate any current legitimate anchor keys (longest legitimate key in queue is 71 chars; malformed keys start at 85+ chars — verified by direct measurement).
  - `"source_task"` is the most semantically appropriate `propagation_mode` for passively-registered system telemetry artifacts.

## Inherited Outcome Contract

- **Why:** 180 stub dispatches make the queue an unreliable signal source. Any tool or operator review reading queue depth is misled by a 4x factor. The root cause is dual: standing registry misclassifies three signal artifacts, and there is no anchor_key length guard to reject sentence-fragment slugs from agent output.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The three repetitive signal artifact anchors are suppressed at the registry/emission level so they no longer produce stub dispatches; malformed sentence-fragment anchor keys are rejected before reaching the queue; and the 180 existing noise stubs are marked skipped so the queue accurately reflects only substantive ideas.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/ideas-queue-noise-stub-suppression/fact-find.md`
- Key findings used:
  - Registry lines 537–581: all three signal artifacts carry `source_process/eligible` (wrong class + policy)
  - Trial.ts lines 648–657: `buildAnchorKey()` calls `normalizeKeyToken()` with no length cap
  - Queue analysis: 160 signal stubs + 20 malformed stubs = 180 total noise stubs, all `enqueued`
  - Schema confirms `propagation_mode` is required; valid values do not include `"none"`

## Proposed Approach
- Option A: Change registry + code + run one-shot cleanup script (JSON transformation)
- Option B: Only change registry + code, leave existing noise stubs (would still show 240 enqueued)
- Chosen approach: Option A — all three changes are needed to fully restore queue accuracy. The registry fix prevents future noise; the anchor cap prevents a different noise class; the cleanup removes existing noise.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix registry entries (artifact_class + trigger_policy) | 95% | S | Pending | - | TASK-03 |
| TASK-02 | IMPLEMENT | Add 80-char anchor_key length cap in buildAnchorKey() | 92% | S | Pending | - | TASK-04 |
| TASK-03 | IMPLEMENT | Mark 180 noise stubs skipped in queue-state.json | 92% | S | Pending | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Typecheck and commit | 95% | S | Pending | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent — registry JSON and TypeScript code edits |
| 2 | TASK-03 | TASK-01 | Queue cleanup depends on registry logic being correct |
| 3 | TASK-04 | TASK-01, TASK-02, TASK-03 | Typecheck + commit after all changes |

## Tasks

### TASK-01: Fix registry entries for the three signal artifacts
- **Type:** IMPLEMENT
- **Deliverable:** JSON field changes in `docs/business-os/startup-loop/ideas/standing-registry.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/ideas/standing-registry.json`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 95%
  - Implementation: 95% - Direct JSON field changes with known target values
  - Approach: 95% - Contract Section 11.1 prescribes system_telemetry/never for these artifacts
  - Impact: 95% - Future bridge runs will be suppressed at the projection_immunity gate
- **Acceptance:**
  - All three entries (`BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS`, `BOS-BOS-REPO_MATURITY_SIGNALS`, `BOS-BOS-AGENT_SESSION_FINDINGS`) have `artifact_class: "system_telemetry"` and `trigger_policy: "never"`
  - `propagation_mode` changed to `"source_task"` (required field; `source_mechanical_auto` incompatible with system_telemetry semantics)
  - All other fields on the three entries unchanged
- **Validation contract (TC-01):**
  - TC-01: JSON remains schema-valid after changes (all required fields present, enum values valid)
  - TC-02: No other registry entries are modified

### TASK-02: Add anchor_key length cap in buildAnchorKey()
- **Type:** IMPLEMENT
- **Deliverable:** Code change in `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 92%
  - Implementation: 92% - 2-line change in buildAnchorKey(); slice(0, 80) after normalizeKeyToken()
  - Approach: 92% - Truncation is simpler than suppression; preserves dispatch with valid short key
  - Impact: 90% - Prevents future sentence-fragment slugs; does not affect existing entries
- **Acceptance:**
  - `buildAnchorKey()` returns keys of at most 80 characters
  - Both the `event.anchor_key` path and the `areaAnchor` fallback path are capped
  - TypeScript compiles without errors
- **Validation contract (TC-02):**
  - TC-01: anchor_key longer than 80 chars → truncated to exactly 80 chars
  - TC-02: anchor_key of 80 chars or fewer → unchanged

### TASK-03: Mark 180 noise stubs skipped in queue-state.json
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 92%
  - Implementation: 92% - Python script to read/transform/write JSON; identification criteria are precise
  - Approach: 95% - monotonic skipped transition preserves dedup integrity
  - Impact: 95% - Drops enqueued from 240 to 60; queue becomes accurate signal
- **Acceptance:**
  - All 180 noise stubs (160 signal-anchor + 20 malformed) have `queue_state: "skipped"`
  - No legitimate stubs (anchor_key <= 80 chars, not in the three noise anchors) are modified
  - Counts block: `enqueued` = 60, `skipped` = 180
  - No entries deleted from the dispatches array
- **Validation contract (TC-03):**
  - TC-01: count of `queue_state: "enqueued"` entries = 60 after transformation
  - TC-02: count of `queue_state: "skipped"` entries = 180 after transformation
  - TC-03: total dispatches array length unchanged

### TASK-04: Typecheck and commit
- **Type:** IMPLEMENT
- **Deliverable:** Clean typecheck + git commit via writer lock
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** all changed files
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - Standard typecheck + writer-lock commit
  - Approach: 95% - No deploy step; changes are JSON + TypeScript only
  - Impact: 95% - Ensures no regressions introduced
- **Acceptance:**
  - `pnpm --filter scripts typecheck` exits 0
  - Git commit created via writer lock with conventional commit message
- **Validation contract (TC-04):**
  - TC-01: Typecheck passes with no new errors
  - TC-02: Writer lock commit succeeds

## Risks & Mitigations
- Registry change re-classifies artifacts needed for valid dispatch: Low likelihood / Medium impact. Evidence shows 0 completed dispatches from these three artifacts (all 160 signal stubs are enqueued noise). Mitigated by keeping `active: true` for future re-enablement.
- Cleanup script incorrectly marks a legitimate stub as noise: Low likelihood / Medium impact. Identification uses explicit anchor_key set matching and `length > 80` — two independent conditions, manually verified against queue data.
- `propagation_mode: "source_task"` is semantically wrong for system_telemetry: Very Low likelihood / Low impact. The field is required by schema; `source_task` is the least-wrong valid option for a passively-registered artifact. Can be revisited when a `"none"` enum value is added to the schema.

## Observability
- Logging: After registry fix, future bridge runs will log `suppression_reason: "projection_immunity"` for these artifacts
- Metrics: Queue `counts.enqueued` drops from 240 to 60 after cleanup
- Alerts/Dashboards: Queue audit tool will reflect accurate backlog depth

## Acceptance Criteria (overall)
- [ ] standing-registry.json: three entries have `artifact_class: "system_telemetry"` and `trigger_policy: "never"`
- [ ] lp-do-ideas-trial.ts: `buildAnchorKey()` returns at most 80-character strings
- [ ] queue-state.json: 180 stubs at `queue_state: "skipped"`, counts block shows `enqueued: 60`, `skipped: 180`
- [ ] `pnpm --filter scripts typecheck` exits 0

## Decision Log
- 2026-03-09: `propagation_mode` kept as required field; changed to `"source_task"` (schema does not allow `"none"`)
- 2026-03-09: Three signal artifacts kept `active: true` per fact-find safe default; can be set `active: false` later if operator decides to fully decommission
- 2026-03-09: Truncation approach chosen for anchor_key cap (vs. suppression) — simpler, produces valid short key

## Overall-confidence Calculation
- All tasks are S effort (weight 1 each)
- TASK-01: 95% × 1 = 95
- TASK-02: 92% × 1 = 92
- TASK-03: 92% × 1 = 92
- TASK-04: 95% × 1 = 95
- Overall: (95 + 92 + 92 + 95) / 4 = 93.5% → **90%** (rounded down for open question on active field)
