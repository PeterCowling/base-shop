---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: ideas-queue-noise-stub-suppression
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/ideas-queue-noise-stub-suppression/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309120000-QSTATE-002
---

# Ideas Queue Noise Stub Suppression — Fact-Find Brief

## Scope

### Summary

180 stub dispatches in `docs/business-os/startup-loop/ideas/trial/queue-state.json` have no substantive content and inflate the visible queue from ~59 to 239 enqueued items — a 4× distortion. They fall into two categories:

1. **Signal artifact stubs (160 enqueued)** — Repetitive `artifact_delta` dispatches for three signal artifacts (`BOS-BOS-AGENT_SESSION_FINDINGS`, `BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS`, `BOS-BOS-REPO_MATURITY_SIGNALS`). These stubs pass the emission gate because all three are registered with `artifact_class: source_process` and `trigger_policy: eligible` rather than the correct `artifact_class: system_telemetry` / `trigger_policy: never` that the trial contract prescribes for them.

2. **Malformed anchor-key stubs (20 enqueued)** — Dispatches where `anchor_key` is a slugified sentence fragment (e.g. `key-insight-changing-xadepartment-type-would-cascade-type-errors-to-37-files-pages-like-women-bags-page`, 103 chars). These originate from the agent-session bridge when a finding text longer than a slug becomes `area_anchor_hint`, which `buildAnchorKey()` in the trial orchestrator then slugifies without a length cap.

### Goals

- Change the registry entries for the three signal artifacts from `source_process/eligible` to `system_telemetry/never`, which causes the orchestrator's `projection_immunity` gate to suppress them at runtime.
- Add an `anchor_key` length cap (≤80 chars) and/or a slug-pattern validation in `buildAnchorKey()` so oversized keys are either truncated or the dispatch is suppressed with a new suppression reason.
- Mark all 180 existing noise stubs in `queue-state.json` as `queue_state: skipped` (not deleted), and update the counts block to match.

### Non-goals

- Changing the bridge scripts themselves (agent-session, codebase-signals, repo-maturity) beyond what the registry fix enables.
- Rewriting the deduplication logic.
- Addressing the separately tracked `auto_executed` state violation (Dispatch QSTATE-001).

### Constraints & Assumptions

- Constraints:
  - The monotonic state machine only allows `enqueued → skipped`. Entries cannot be deleted while preserving dedup integrity (dedup indexes are built from existing `dispatch_id` and dedupe key values). A JSON-level cleanup script that marks entries `skipped` and adjusts counts is the safe path.
  - `trigger_policy: never` cannot be bypassed by `manualOverrideIds` — the code at line 1264–1265 enforces this even with a manual override. This makes the registry fix safe: it can't be accidentally overridden.
  - The telemetry log (`telemetry.jsonl`) is append-only and cannot be retroactively corrected — only forward-recorded state changes matter.
- Assumptions:
  - The three signal artifacts (agent-session-findings, codebase-structural-signals, repo-maturity-signals) are not intended to produce actionable dispatches on their own. They are process-level signal collectors; the downstream stubs they produce should not be individually routed. This is supported by the contract (Section 11.1), the artifact notes in the registry, and the boilerplate-only content of all 160 stubs.
  - The anchor_key length cap of 64 characters is sufficient to discriminate legitimate slugs from sentence-fragment artifacts. All legitimate anchor keys in the queue are ≤65 chars; all malformed ones are ≥85 chars.

---

## Outcome Contract

- **Why:** 180 stub dispatches make the queue an unreliable signal source. The nominal backlog appears to be 239 enqueued items but only 59 are substantive. Any tool or operator review that reads queue depth, counts enqueued items, or scans for next work is misled by a 4× factor. The root cause is dual: the standing registry misclassifies the three signal artifacts (they carry `eligible` instead of `never`), and there is no anchor_key length guard to reject sentence-fragment slugs from agent output.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The three repetitive signal artifact anchors are suppressed at the registry/emission level so they no longer produce stub dispatches; malformed sentence-fragment anchor keys are rejected before reaching the queue; and the 180 existing noise stubs are marked skipped so the queue accurately reflects only substantive ideas.
- **Source:** operator

---

## Evidence Audit (Current State)

### Entry Points

- `docs/business-os/startup-loop/ideas/standing-registry.json` — artifact registry; triggers and gates are driven from here
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` — trial orchestrator; contains `isProjectionImmuneClass()`, `buildAnchorKey()`, and the trigger_policy gate
- `scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts` — produces `ArtifactDeltaEvent`s for `BOS-BOS-AGENT_SESSION_FINDINGS`; sets `area_anchor_hint` from raw finding text
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — persisted queue; contains the 180 noise stubs

### Key Modules / Files

- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` lines 596–601 — `PROJECTION_IMMUNE_CLASSES` set: includes `system_telemetry`, `projection_summary`, `execution_output`, `reflection`
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` lines 1245–1265 — gate sequence: `isProjectionImmuneClass()` → `requiresSourcePrimary` check → `trigger_policy` check
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` lines 648–657 — `buildAnchorKey()`: passes `event.anchor_key` through `normalizeKeyToken()` without length cap; falls back to `normalizeKeyToken(areaAnchor)` (the area_anchor_hint text)
- `scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts` lines 424–469 — `buildNarrativeHints()`: sets `area_anchor_hint = primaryFinding` (raw agent output, no length constraint)
- `docs/business-os/startup-loop/ideas/standing-registry.json` lines 537–581 — three signal artifact entries (all `source_process / eligible`)
- `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` Section 11.1 — contract table: `system_telemetry` → `never trigger`

### Patterns & Conventions Observed

- The `isProjectionImmuneClass()` gate fires before the `trigger_policy` gate. If an artifact is classified as `system_telemetry`, it gets suppressed by `projection_immunity` and the trigger_policy check is never reached. Both paths lead to the same suppression reason (`trigger_policy_blocked`) — evidence: lines 1247, 1261.
- `normalizeKeyToken()` is a pure slug function: lowercases, replaces non-alphanumeric with `-`, collapses runs, strips leading/trailing dashes. No length cap — evidence: lines 632–638.
- `buildAnchorKey()` falls through to `normalizeKeyToken(areaAnchor)` when `event.anchor_key` is absent. The agent-session bridge never sets `event.anchor_key` directly; it sets `area_anchor_hint` which becomes `areaAnchor` — evidence: `deriveEvent()` in bridge and `deriveAreaAnchor()` in trial orchestrator.
- The dedup system is cluster-fingerprint based. Each bridge run produces a new `after_sha` → new fingerprint → unique cluster → new dispatch admitted. This is correct behavior for `eligible` artifacts; the problem is the class/policy mismatch, not the dedup logic.

### Data & Contracts

- Types/schemas/events:
  - `ArtifactDeltaEvent` (trial.ts line 274): `anchor_key?: string` is optional; if absent, falls back to `areaAnchor`
  - `RegistryV2ArtifactEntry` (registry-migrate-v1-v2.ts): `artifact_class: string`, `trigger_policy: "eligible" | "manual_override_only" | "never"`
  - `PROJECTION_IMMUNE_CLASSES = new Set(["projection_summary", "system_telemetry", "execution_output", "reflection"])`
- Persistence:
  - `queue-state.json`: persists `dispatches[]` array with embedded `queue_state` per entry and a top-level `counts` block (must be kept in sync manually or by script)
  - `telemetry.jsonl`: append-only — no retroactive correction needed or possible
- API/contracts:
  - Trial contract Section 11.1: `system_telemetry → never trigger` (hard rule, contract-level)
  - Trial contract Section 11.2 line 270: `trigger_policy: never` cannot be bypassed even by manual override

### Dependency & Impact Map

- Upstream dependencies:
  - Bridge scripts (`lp-do-ideas-agent-session-bridge.ts`, `lp-do-ideas-codebase-signals-bridge.ts`, `repo-maturity-signals.ts`) produce events; they do not need code changes — only the registry entries and orchestrator gate need to change
- Downstream dependents:
  - `lp-do-ideas-persistence.ts` — reads queue-state.json; will see updated counts after cleanup
  - `lp-do-ideas-queue-audit.ts` — reads queue; audit results will reflect cleaned state
  - `lp-do-ideas-metrics-rollup.ts` — reads queue; metrics will no longer be inflated
- Likely blast radius:
  - Registry change: zero runtime impact on existing enqueued items (they're already in the queue). Future bridge runs will no longer emit.
  - Orchestrator anchor_key cap: future events with long anchor keys will be suppressed or truncated; no impact on existing queue entries.
  - Queue cleanup: the `counts` block must be updated atomically with the state changes. The cleanup is mechanical — a JSON transformation that sets `queue_state: "skipped"` for the 180 stubs and recomputes counts.

---

## Questions

### Resolved

- Q: Are the three signal artifacts registered in standing-registry.json?
  - A: Yes, all three are registered. None carries the correct `system_telemetry / never` classification. All three use `source_process / eligible` which causes them to pass the projection_immunity gate and be admitted as active dispatch candidates.
  - Evidence: `docs/business-os/startup-loop/ideas/standing-registry.json` lines 537–581
    - `BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS`: `artifact_class: "source_process"`, `trigger_policy: "eligible"` (line 542–543)
    - `BOS-BOS-REPO_MATURITY_SIGNALS`: `artifact_class: "source_process"`, `trigger_policy: "eligible"` (line 557–558)
    - `BOS-BOS-AGENT_SESSION_FINDINGS`: `artifact_class: "source_process"`, `trigger_policy: "eligible"` (line 573–574)

- Q: How do repetitive stubs bypass the trigger_policy: never gate?
  - A: They bypass it because none of the three artifacts carries `trigger_policy: "never"` in the registry — they all carry `"eligible"`. The gate at lines 1260–1265 checks `trigger_policy !== "eligible"` to suppress; since all three pass as `"eligible"`, they are admitted. The upstream `isProjectionImmuneClass()` check at line 1245 would also suppress them if they were classified as `system_telemetry`, but they're classified as `source_process`. Both gates fail to fire because the registry entries are wrong.
  - Evidence: `lp-do-ideas-trial.ts` lines 1245, 1260–1265; `standing-registry.json` lines 542, 557, 573

- Q: How are malformed sentence-fragment anchor keys generated?
  - A: The agent-session bridge's `buildNarrativeHints()` sets `area_anchor_hint = primaryFinding` where `primaryFinding` is a raw finding string extracted from agent transcripts (max 110 chars per `summarizeFindingForDisplay()`). The trial orchestrator's `buildAnchorKey()` has no `event.anchor_key` set (the bridge never sets it), so it falls back to `normalizeKeyToken(areaAnchor)` where `areaAnchor = area_anchor_hint`. `normalizeKeyToken()` slugifies the full text with no length cap, producing keys of 85–103+ characters. There is no validation gate on `anchor_key` length anywhere in the pipeline.
  - Evidence: `lp-do-ideas-agent-session-bridge.ts` lines 432–435 (`area_anchor_hint: primaryFinding`); `lp-do-ideas-trial.ts` lines 648–656 (`buildAnchorKey()` with no length cap); `normalizeKeyToken()` lines 632–638

- Q: What is the right disposition for the existing 180 noise stubs?
  - A: Mark as `queue_state: "skipped"` (not deleted). Deletion is unsafe because the dedup indexes (dispatch_id and dedupe_key maps) are built from the persisted entries; deleting entries would allow future bridge runs to re-admit the same content as fresh stubs (the dedupe key would not be found in the now-shorter list). Marking `skipped` is the monotonic transition from `enqueued` and preserves dedup integrity. The counts block must be updated: subtract 180 from `enqueued`, add 180 to `skipped`.
  - Evidence: `lp-do-ideas-trial-queue.ts` lines 315–322 (state machine); the 180 stubs are split as: 160 signal stubs (146 `bos-agent-session-findings`, 11 `bos-codebase-structural-signals`, 3 `bos-repo-maturity-signals`) + 20 malformed stubs (3 unique anchor keys, all `queue_state: enqueued`)

- Q: What are the exact fix points?
  - A: Three independent fix areas:
    1. **Registry fix** (standing-registry.json): Change `artifact_class` from `"source_process"` to `"system_telemetry"` and `trigger_policy` from `"eligible"` to `"never"` for all three entries (`BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS`, `BOS-BOS-REPO_MATURITY_SIGNALS`, `BOS-BOS-AGENT_SESSION_FINDINGS`). Also clear `propagation_mode: "source_mechanical_auto"` (incompatible with `system_telemetry` class).
    2. **Anchor-key length cap** (lp-do-ideas-trial.ts): In `buildAnchorKey()` add a post-slug truncation to ≤80 characters, or add a new suppression reason (`anchor_key_too_long`) that suppresses the dispatch before emission if `anchorKey.length > 80`. The truncation approach is simpler and produces a valid stub rather than a suppressed noop.
    3. **Queue cleanup script**: A one-shot Node script that reads `queue-state.json`, sets `queue_state: "skipped"` for all 180 noise stubs (identified by: `anchor_key` in `{bos-agent-session-findings, bos-codebase-structural-signals, bos-repo-maturity-signals}` OR `anchor_key.length > 80`), rewrites the counts block, and saves.
  - Evidence: all three fix areas derived from the above code traces

### Open (Operator Input Required)

- Q: Should `BOS-BOS-AGENT_SESSION_FINDINGS` / `BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS` / `BOS-BOS-REPO_MATURITY_SIGNALS` be made permanently `active: false` in addition to `trigger_policy: never`, or should they remain active for future use under a different emission model?
  - Why operator input is required: The three artifacts were deliberately registered as signal bridges (dispatches 0155–0157). It is not clear from the code alone whether the operator intends to eventually re-enable them with a manual_override_only policy or different aggregate dispatch pattern, or whether they should be fully decommissioned.
  - Decision impacted: Whether to set `active: false` (fully dormant) or keep `active: true` with `system_telemetry / never` (passively registered but non-triggering).
  - Decision owner: operator
  - Default assumption (if any) + risk: Default to `active: true` with `system_telemetry / never`. Risk: future bridge runs still run but emit zero dispatches; the bridge state files continue to be updated. Low risk.

---

## Confidence Inputs

- Implementation: 92%
  - Evidence: All three fix points are traced to specific file/line locations. The registry JSON changes are trivial. The anchor_key truncation is a 2-line addition to `buildAnchorKey()`. The cleanup script is a JSON read-modify-write.
  - What would raise to ≥95: Operator confirmation on `active: false` vs `active: true` for the three artifacts.
- Approach: 90%
  - Evidence: Registry reclassification as `system_telemetry/never` is the canonical contract-prescribed fix. The anchor_key cap matches the practical length distribution in the queue. The `skipped` disposition is required by the monotonic state machine.
  - What would raise to ≥95: Confirming no downstream consumers rely on the `source_process` classification of these three artifacts for routing logic.
- Impact: 95%
  - Evidence: Directly measured — 180 noise stubs currently enqueued, substantive count is 59. After cleanup, enqueued count drops from 239 to 59 (75% reduction in queue noise).
  - What would raise to ≥98: Confirming telemetry consumers don't need migration.
- Delivery-Readiness: 88%
  - Evidence: All three changes are bounded and independent. The cleanup script is a one-shot operation. No migrations or API changes required.
  - What would raise to ≥95: Operator confirms `active` field decision (open question above).
- Testability: 85%
  - Evidence: Existing test files cover `lp-do-ideas-trial.ts` (`lp-do-ideas-trial.test.ts`), `lp-do-ideas-trial-queue.ts` (`lp-do-ideas-trial-queue.test.ts`), and the agent-session bridge (`lp-do-ideas-agent-session-bridge.test.ts`). New unit tests for the anchor_key cap and the `system_telemetry` suppression path can use the existing harness.
  - What would raise to ≥95: One integration test that runs a bridge event through the orchestrator with the updated registry and asserts `projection_immunity` suppression.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Registry change re-classifies artifacts that are currently needed for valid dispatch | Low | Medium | Evidence shows 0 completed dispatches from these three artifacts (the 1 completed dispatch for agent-session-findings is a legacy entry); the re-classification is safe |
| Queue cleanup script incorrectly identifies a legitimate stub as noise | Low | Medium | Use explicit anchor_key matching (`in set of 3`) + `length > 80` as separate conditions; review 3 unique malformed anchor keys manually before running |
| `active: false` decision made incorrectly | Low | Low | Default to `active: true / never`; can be changed later |
| Anchor_key truncation causes cluster-key collisions | Very Low | Low | Truncated slugs still produce unique enough prefixes at 80 chars; actual collision risk in practice is negligible given each event has a unique fingerprint |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Registry JSON edits must preserve all other fields on the three entries unchanged (especially `artifact_id`, `path`, `domain`, `business`, `registered_at`)
  - Queue cleanup must use the monotonic `skipped` transition, not deletion
  - Counts block in `queue-state.json` must match the actual entry states after cleanup
- Rollout/rollback expectations:
  - All three changes are JSON/code edits with no deploy step — trivially rollback by reverting the git changes
  - Queue cleanup is one-way (can't un-skip without violating the state machine), but the skipped entries remain in file for dedup; this is acceptable
- Observability expectations:
  - After registry fix, future bridge runs should produce 0 new dispatches for the three signal artifacts (verifiable by checking suppression_reason_counts.projection_immunity in bridge output)
  - After queue cleanup, the counts block `enqueued` should drop by 180

---

## Rehearsal Trace

| Scope area | What was found | Confidence |
|---|---|---|
| Q1: Registry correctness | All three signal artifacts registered as `source_process / eligible` — wrong class and wrong trigger_policy per contract Section 11.1. Fix is three JSON field changes in standing-registry.json. | High |
| Q2: Trigger_policy bypass mechanism | Bypass is caused by the misclassification itself: the gate checks `artifact_class` first (would suppress `system_telemetry` via `projection_immunity`) then `trigger_policy` (would suppress non-`eligible`). Both gates pass because the class and policy are both wrong. | High |
| Q3: Malformed anchor_key origin | Agent-session bridge `buildNarrativeHints()` → `area_anchor_hint = primaryFinding` (raw agent text) → orchestrator `buildAnchorKey()` → `normalizeKeyToken(areaAnchor)` with no length cap → 85–103 char slugs. | High |
| Q4: Existing stub disposition | 160 signal stubs + 20 malformed = 180 total, all `enqueued`. Mark as `skipped` to preserve dedup integrity. Counts block must be updated. | High |
| Q5: Exact fix points | (1) Registry: 6 field changes across 3 entries. (2) Orchestrator: anchor_key truncation at 80 chars in `buildAnchorKey()`. (3) Cleanup script: JSON read-modify-write on queue-state.json. | High |

---

## Scope Signal

**Classification: constrained**

Evidence: All five investigation questions have complete, high-confidence answers from direct code and data inspection. The fix surface is narrow — three JSON fields in the registry, a 2-line addition in `buildAnchorKey()`, and a one-shot cleanup script. There are no architecture changes, no API changes, and no migrations. The open question (active vs. fully decommissioned) is low-stakes and has a clear safe default.

---

## Evidence Gap Review

### Gaps Addressed

1. **Registry misclassification** — Confirmed by direct JSON inspection of standing-registry.json lines 537–581. All three entries carry the wrong class and policy.
2. **Bypass mechanism** — Confirmed by code trace through `isProjectionImmuneClass()` and the `trigger_policy` gate (lines 1245–1265 in trial.ts). Both gates require the registry to carry the correct values to fire.
3. **Malformed key origin** — Confirmed by tracing `area_anchor_hint` through `buildNarrativeHints()` → `deriveEvent()` → `deriveAreaAnchor()` → `buildAnchorKey()` → `normalizeKeyToken()`.
4. **Stub count and state** — Confirmed by Python analysis of queue-state.json: 160 signal stubs + 20 malformed stubs, all `enqueued`, 0 `skipped`.

### Confidence Adjustments

- No confidence reductions needed. All key claims are backed by direct file evidence.

### Remaining Assumptions

- Assumption: The anchor_key cap of 80 characters will not truncate any current legitimate keys. Direct measurement shows the longest legitimate key in the queue is `xa-uploader-sync-fast-path-skip-code-quality-gates-during-operator-sync` at 71 chars — safely below 80. The malformed keys start at 85 chars. Plan should verify this pre-condition in the cleanup script.

---

## Suggested Task Seeds (Non-binding)

1. **TASK-01**: Update standing-registry.json — change `artifact_class` to `"system_telemetry"` and `trigger_policy` to `"never"` for `BOS-BOS-AGENT_SESSION_FINDINGS`, `BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS`, `BOS-BOS-REPO_MATURITY_SIGNALS`. Clear `propagation_mode` field.
2. **TASK-02**: Add anchor_key length cap in `buildAnchorKey()` in `lp-do-ideas-trial.ts` — truncate to 80 chars post-slug. Add unit test covering the truncation path.
3. **TASK-03**: Write and run a cleanup script that marks the 180 noise stubs as `queue_state: "skipped"` in `queue-state.json` and updates the counts block.
4. **TASK-04**: Add a regression test to `lp-do-ideas-trial.test.ts` asserting that `system_telemetry`-class artifacts are suppressed with reason `projection_immunity`.

---

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `standing-registry.json` — three entries reclassified to `system_telemetry / never`
  - `lp-do-ideas-trial.ts` — `buildAnchorKey()` truncates to 80 chars
  - `queue-state.json` — 180 stubs at `queue_state: "skipped"`, counts block updated
  - Test coverage: unit test for anchor_key cap; regression test for `system_telemetry` suppression
- Post-delivery measurement plan:
  - Run the agent-session bridge after registry change; confirm `suppression_reason_counts.projection_immunity > 0` and `dispatches_enqueued = 0`
  - Inspect `queue-state.json` counts block to confirm `enqueued` dropped from 239 to ~59

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan ideas-queue-noise-stub-suppression --auto`
