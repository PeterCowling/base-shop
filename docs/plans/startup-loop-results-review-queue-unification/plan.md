---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-10
Last-reviewed: 2026-03-10
Last-updated: 2026-03-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-results-review-queue-unification
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-ideas, startup-loop
Overall-confidence: 78%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Startup Loop Results-Review Queue Unification Plan

## Summary
The current startup-loop backlog is structurally split: `process-improvements.user.html` presents one idea backlog, but that backlog is still aggregated from both canonical queue state and build-review sidecars plus `completed-ideas.json` suppression. This plan fixes that in the only defensible order. First, define a canonical build-origin signal contract and harden the build-review emitters around it; then admit build-origin ideas into the normal ideas queue; then switch reporting and closure to queue-backed authority. Historical carry-over is treated explicitly, not hand-waved: after the live canonical path is in place, the plan audits the old report-only backlog and either executes a bounded carry-forward cutover in-thread or emits a dedicated follow-on project if the carry-over set is too large or too judgment-heavy.

## Active tasks
- [ ] TASK-01: Define the canonical build-origin signal contract
- [ ] TASK-02: Harden build-review emitters around the canonical contract
- [ ] TASK-03: Implement build-review-to-queue admission and dedupe
- [ ] TASK-04: Switch process-improvements idea backlog to queue-only sourcing
- [ ] TASK-05: Demote `completed-ideas.json` from active backlog control
- [ ] TASK-06: Align self-evolving build-output intake with the canonical build-origin identity
- [ ] TASK-07: Canonical queue-path readiness checkpoint
- [ ] TASK-08: Audit historical backlog carry-over and triage worthwhile items
- [ ] TASK-09: Cutover split checkpoint
- [ ] TASK-10: Execute bounded carry-over cutover or emit the follow-on project

## Goals
- Define one canonical build-origin signal contract for queue admission, reporting, and downstream joins.
- Make `queue-state.json` the sole canonical actionable backlog for idea items.
- Remove direct build-review idea sourcing from `process-improvements`.
- Remove `completed-ideas.json` from active backlog control and make queue lifecycle authoritative.
- Reach a real cutover where the legacy report-only backlog no longer exists.
- Carry forward worthwhile historical backlog items into the queue, or explicitly split that carry-over into a follow-on cutover project.

## Non-goals
- Replacing `results-review.user.md` as the operator-authored narrative review artifact.
- Replacing `risk` or `pending-review` sourcing in `process-improvements`.
- Redesigning self-evolving policy more broadly than the build-origin identity seam required here.
- Guaranteeing that the full historical carry-over happens inside this same plan if the audit proves it is a separate project.

## Constraints & Assumptions
- Constraints:
  - `results-review.user.md` remains operator-authored and evidence-oriented.
  - Existing ideas classifier and queue persistence must be reused, not bypassed.
  - Temporary compatibility reads are acceptable only during rollout; the end state cannot keep a hidden dual backlog.
  - Build-review extraction must become queue-safe; fail-open silent drop behavior is not acceptable once the queue becomes canonical.
  - Historical archived backlog items may require a separate cutover project if the carry-over set is too large or too judgment-heavy.
- Assumptions:
  - The correct approach is contract-first, then bridge, then report/closure cutover.
  - `pattern-reflection.entries.json` can become the primary build-intake source only after contract hardening.
  - The follow-on cutover decision can be self-resolved with explicit scope thresholds; no operator DECISION task is needed.

## Inherited Outcome Contract
- **Why:** The visible process-improvements backlog is currently fed by both queue-state.json and archived/current build-review sidecars, so build-spotted ideas bypass canonical grading, queue lifecycle, and closure tracking.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Queue state becomes the only canonical actionable backlog for idea items, while build-review outputs are admitted into that queue through regular grading, dedupe, and closure paths.
- **Source:** operator

## Fact-Find Reference
- Related brief: [fact-find.md](/Users/petercowling/base-shop/docs/plans/startup-loop-results-review-queue-unification/fact-find.md)
- Key findings used:
  - `generate-process-improvements.ts` currently builds `ideaItems` from both queue state and results-review artifacts.
  - `pattern-reflection.entries.json` is not queue-ready as persisted today.
  - `results-review.signals.json` and `pattern-reflection.entries.json` use incompatible identities.
  - `completed-ideas.json` still participates in active backlog suppression and completion compatibility.
  - `self-evolving-from-build-output.ts` remains a second downstream reader of raw build-review artifacts.

## Proposed Approach
- Option A: do a single-pass implementation that directly bridges existing build-review sidecars into queue, flips the report to queue-only, and handles historical carry-over afterward.
  - Pros: faster visible simplification.
  - Cons: formalizes ambiguous intake, leaves extractor failure and identity problems in place, and makes cutover brittle.
- Option B: define a canonical build-origin signal contract first, harden emitters against it, bridge only the normalized signal into queue, then switch reporting/closure, and only then audit historical carry-over for bounded in-thread cutover versus a separate project.
  - Pros: removes the hidden ambiguity before queue canonicalization and makes the cutover decision evidence-based.
  - Cons: one extra precursor tranche before the visible backlog simplification.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Define the canonical build-origin signal contract | 75% | M | Pending | - | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-10 |
| TASK-02 | IMPLEMENT | Harden build-review emitters around the canonical contract and fail-closed surfacing | 85% | M | Pending | TASK-01 | TASK-03, TASK-04, TASK-06, TASK-07, TASK-08, TASK-10 |
| TASK-03 | IMPLEMENT | Implement build-review-to-queue admission and dedupe | 80% | M | Pending | TASK-01, TASK-02 | TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-10 |
| TASK-04 | IMPLEMENT | Switch process-improvements idea backlog to queue-only sourcing | 85% | M | Pending | TASK-03 | TASK-05, TASK-07, TASK-08, TASK-10 |
| TASK-05 | IMPLEMENT | Demote `completed-ideas.json` from active backlog control | 80% | M | Pending | TASK-03, TASK-04 | TASK-07, TASK-08, TASK-10 |
| TASK-06 | INVESTIGATE | Align self-evolving build-output intake to the canonical build-origin identity | 70% | M | Pending | TASK-01, TASK-02, TASK-03 | TASK-07, TASK-10 |
| TASK-07 | CHECKPOINT | Canonical queue-path readiness checkpoint | 95% | S | Pending | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06 | TASK-08, TASK-09, TASK-10 |
| TASK-08 | INVESTIGATE | Audit historical backlog carry-over and triage worthwhile items | 70% | M | Pending | TASK-07 | TASK-09, TASK-10 |
| TASK-09 | CHECKPOINT | Decide in-thread cutover versus separate carry-over project | 95% | S | Pending | TASK-08 | TASK-10 |
| TASK-10 | IMPLEMENT | Execute bounded carry-over cutover or emit the follow-on project | 75% | M | Pending | TASK-09 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establish the canonical build-origin contract before any queue work |
| 2 | TASK-02 | TASK-01 | Harden emitters and failure behavior around the new contract |
| 3 | TASK-03 | TASK-01, TASK-02 | Bridge build-origin signals into queue with canonical identity and dedupe |
| 4 | TASK-04, TASK-05 | TASK-03 | Report and closure can move in parallel once queue admission is real |
| 5 | TASK-06 | TASK-01, TASK-02, TASK-03 | Resolve self-evolving overlap before claiming one authoritative build-origin path |
| 6 | TASK-07 | TASK-02 through TASK-06 | Check whether queue-backed canonical path is genuinely ready |
| 7 | TASK-08 | TASK-07 | Audit and triage historical backlog carry-over |
| 8 | TASK-09 | TASK-08 | Self-resolve whether carry-over stays in-thread or becomes a separate project |
| 9 | TASK-10 | TASK-09 | Execute only if the cutover remains bounded after audit |

## Tasks

### TASK-01: Define the canonical build-origin signal contract
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-results-review-queue-unification/artifacts/build-origin-signal-contract.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts`, `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts`, `scripts/src/startup-loop/build/generate-process-improvements.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-10
- **Confidence:** 75%
  - Implementation: 75% - the affected seams are explicit, but this is still a contract-definition task.
  - Approach: 80% - contract-first is the only defensible order.
  - Impact: 90% - without this, queue unification formalizes ambiguity.
- **Acceptance:**
  - Contract names one canonical build-origin fingerprint shared across sources.
  - Contract defines source precedence between `pattern-reflection.entries.json` and `results-review.signals.json`.
  - Contract defines queue-native fields, route derivation rules, and explicit failure states.
  - Contract defines the join surface for self-evolving and report provenance.
- **Validation contract (TC-01):**
  - TC-01: every field in the contract is mapped to at least one current producer or named as new required output.
  - TC-02: precedence and dedupe rules cover the case where both sidecars describe the same build-origin idea.
  - TC-03: the contract explicitly says what happens when extraction/parsing fails.
- **Execution plan:** Read both sidecar shapes and queue requirements, define the normalized contract, and document exact producer/consumer mappings.
- **Planning validation (required for M/L):**
  - New outputs check:
    - `build_signal_id` would be consumed by queue admission, report provenance, completion compatibility, and self-evolving join logic.
    - canonical `build_origin_status` would be consumed by the bridge and any fail-closed surfacing.
  - Modified behavior check:
    - current source precedence and title-based identity would be replaced; all direct readers must be named in the contract.
- **What would make this >=90%:** a fixture set proving the contract against both sidecar formats and one real duplicate case.

### TASK-02: Harden build-review emitters around the canonical contract and fail-closed surfacing
- **Type:** IMPLEMENT
- **Deliverable:** hardened build-review emitter code plus canonical sidecar tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts`, `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts`, `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-results-review-extract.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-06, TASK-07, TASK-08, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - the producer seams are narrow and already versioned.
  - Approach: 85% - emitters should own normalization and failure surfacing.
  - Impact: 90% - queue canonicality is impossible if producers can still silently diverge.
- **Acceptance:**
  - Both build-review sidecars emit the canonical build-origin identity.
  - `pattern-reflection` persisted output becomes queue-ready enough for the chosen precedence rule.
  - Extraction/parsing failures surface explicit machine-readable failure state instead of silent loss.
  - Tests cover happy path, duplicate-sidecar path, and extraction failure path.
- **Validation contract (TC-02):**
  - TC-01: same idea emitted from both sidecars produces the same canonical fingerprint.
  - TC-02: malformed or missing sidecar content does not disappear silently; failure state is surfaced explicitly.
  - TC-03: existing sidecar consumers remain parse-compatible or are updated in dependent tasks.
- **Execution plan:** add shared canonical signal shaping, update both extractor outputs, and add tests before any queue bridge lands.
- **Consumer tracing:**
  - New `build_signal_id` is consumed by TASK-03 bridge, TASK-04 report provenance, TASK-05 compatibility logic, and TASK-06 self-evolving alignment.
  - New failure-state output is consumed by the bridge and any pending-review surfacing.
- **Held-back test:** no single unresolved unknown would drop this below 80 because TASK-01 will already have fixed the identity and precedence contract before implementation starts.
- **What would make this >=90%:** one real repo fixture from archived build output passing through both emitters with no contract ambiguity.

### TASK-03: Implement build-review-to-queue admission and dedupe
- **Type:** IMPLEMENT
- **Deliverable:** deterministic build-review bridge that admits canonical build-origin signals into `queue-state.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/ideas/`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial-queue.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-work-packages.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-*.test.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-10
- **Confidence:** 80%
  - Implementation: 80% - existing signal bridges provide the structural pattern.
  - Approach: 85% - queue admission through the regular ideas path is the right place to unify grading and lifecycle.
  - Impact: 90% - this is the seam where build-origin work becomes canonical.
- **Acceptance:**
  - Canonical build-origin signals enter the queue with valid route/status contracts.
  - Duplicate admission across sidecars is suppressed by canonical fingerprint, not title text alone.
  - Queue entries carry build-origin provenance sufficient for reporting and downstream joins.
  - Tests cover direct admission, duplicate suppression, and invalid-route rejection.
- **Validation contract (TC-03):**
  - TC-01: a build-origin signal produces exactly one queue admission when both sidecars exist.
  - TC-02: emitted queue packet passes routing adapter validation.
  - TC-03: provenance fields survive persistence and are visible to downstream readers.
- **Execution plan:** implement a new build-origin bridge, feed normalized signals into standard ideas classification/queue persistence, and add regression tests.
- **Consumer tracing:**
  - New queue provenance fields are consumed by TASK-04 report rendering and TASK-05 closure compatibility.
  - Canonical queue dispatch identity is consumed by work-package processing and completion reconcile.
- **Held-back test:** no single unresolved unknown would drop this below 80 because TASK-01 and TASK-02 will have fixed contract, identity, and failure surfaces before the bridge is built.
- **What would make this >=90%:** a real dry-run over current build artifacts proving stable queue admission counts and zero duplicate leakage.

### TASK-04: Switch process-improvements idea backlog to queue-only sourcing
- **Type:** IMPLEMENT
- **Deliverable:** queue-only idea backlog in `process-improvements` with build-origin provenance surfaced
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/build/generate-process-improvements.ts`, `docs/business-os/process-improvements.user.html`, `docs/business-os/_data/process-improvements.json`, `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`
- **Depends on:** TASK-03
- **Blocks:** TASK-05, TASK-07, TASK-08, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - report source changes are localized.
  - Approach: 90% - once queue admission exists, the report must stop reading legacy idea sources directly.
  - Impact: 90% - the visible backlog becomes honest.
- **Acceptance:**
  - `ideaItems` are sourced only from canonical queue state.
  - Direct results-review idea scraping no longer contributes active idea backlog items.
  - Build-origin queue items expose provenance in the report/data output.
  - `risk` and `pending-review` behavior remains unchanged unless explicitly intended.
- **Validation contract (TC-04):**
  - TC-01: report generation with no queue-backed build items shows no direct results-review idea backlog leakage.
  - TC-02: queue-backed build-origin items appear with provenance.
  - TC-03: direct legacy idea sources no longer affect `IDEA_ITEMS`.
- **Execution plan:** remove direct idea-source reads from build-review artifacts, preserve non-idea sections, and update report tests.
- **Consumer tracing:**
  - Removed direct sidecar reads change the input surface for report generation only; queue readers remain authoritative.
- **What would make this >=90%:** a before/after fixture pair proving that the same worthwhile build item survives only when admitted into queue.

### TASK-05: Demote `completed-ideas.json` from active backlog control
- **Type:** IMPLEMENT
- **Deliverable:** queue-derived completion authority, with `completed-ideas.json` either derived-only or removed from active consumers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-completion-reconcile.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts`, `scripts/src/startup-loop/build/generate-process-improvements.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-completion-reconcile.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-keyword-calibrate.test.ts`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-07, TASK-08, TASK-10
- **Confidence:** 80%
  - Implementation: 80% - consumers are explicit, but closure compatibility is still delicate.
  - Approach: 85% - queue authority is not real while this registry still controls active behavior.
  - Impact: 85% - removes the second closure rail.
- **Acceptance:**
  - Active backlog visibility is no longer governed by `completed-ideas.json`.
  - Calibration and reconcile use queue-derived truth as primary authority.
  - If `completed-ideas.json` remains, it is derived compatibility only with no active control semantics.
  - Regression tests cover queue-only completion and compatibility behavior.
- **Validation contract (TC-05):**
  - TC-01: queue-completed build-origin items disappear from active backlog without direct registry suppression.
  - TC-02: calibration fast-track no longer requires registry authority to represent terminal queue truth.
  - TC-03: compatibility mode, if retained, cannot override queue state.
- **Execution plan:** move active consumers onto queue truth first, then demote the registry to derived compatibility if still needed.
- **Consumer tracing:**
  - Modified completion truth is consumed by reconcile snapshot, keyword calibration, and backlog generation.
- **Held-back test:** no single unresolved unknown would drop this below 80 because the current consumers are already concrete and limited in number.
- **What would make this >=90%:** a full call-site inventory proving no remaining active behavior depends on the registry.

### TASK-06: Align self-evolving build-output intake with the canonical build-origin identity
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-results-review-queue-unification/artifacts/self-evolving-build-origin-alignment.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-07, TASK-10
- **Confidence:** 70%
  - Implementation: 70% - the seam is explicit, but the right authority split still needs proof.
  - Approach: 75% - either shared join-key or queue-backed intake can work, but one must be chosen clearly.
  - Impact: 80% - without alignment, “one build-origin truth path” is overstated.
- **Acceptance:**
  - Artifact states the chosen alignment model and why.
  - Artifact names all self-evolving consumers affected.
  - Recommendation is decisive enough to become an IMPLEMENT task in replan if needed.
- **Validation contract (TC-06):**
  - TC-01: both current self-evolving source reads are traced.
  - TC-02: the recommended model preserves build-origin joinability and does not recreate a second backlog authority.
  - TC-03: the recommendation identifies the minimal code change needed in follow-on work.
- **Execution plan:** trace current self-evolving readers, evaluate shared-identity versus queue-backed models, and choose one.
- **Planning validation (required for M/L):**
  - New outputs check:
    - chosen `build_signal_id` join behavior is consumed by self-evolving observation generation and downstream audit/reporting.
- **What would make this >=90%:** a tiny prototype proving one alignment model on real build-origin artifacts.

### TASK-07: Canonical queue-path readiness checkpoint
- **Type:** CHECKPOINT
- **Deliverable:** checkpoint note embedded in the plan or `artifacts/canonical-queue-readiness.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-06
- **Blocks:** TASK-08, TASK-09, TASK-10
- **Acceptance:**
  - Queue-backed build-origin path exists.
  - Active idea backlog is queue-only.
  - `completed-ideas.json` no longer governs active idea visibility.
  - Remaining self-evolving overlap is either resolved or explicitly bounded.

### TASK-08: Audit historical backlog carry-over and triage worthwhile items
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Depends on:** TASK-07
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 70%
  - Implementation: 70% - the archive is large and item quality varies.
  - Approach: 75% - explicit triage is the right way to avoid cargo-cult backfill.
  - Impact: 80% - cutover integrity depends on not dropping worthwhile legacy work silently.
- **Acceptance:**
  - Audit inventories remaining legacy backlog-origin idea items.
  - Each item is tagged `carry-forward`, `do-not-carry`, or `needs-follow-on-project`.
  - Worthwhile-item criteria are explicit and defensible.
  - Output includes a bounded carry-over count and effort estimate.
- **Validation contract (TC-08):**
  - TC-01: audit samples archived and current legacy backlog inputs, not just one source bucket.
  - TC-02: worthwhile-item criteria are explicit enough to reproduce.
  - TC-03: output gives a clear size/risk basis for TASK-09 split.
- **What would make this >=90%:** a deterministic sampling script or fixture-backed audit helper.

### TASK-09: Cutover split checkpoint
- **Type:** CHECKPOINT
- **Deliverable:** checkpoint note deciding whether cutover stays in-thread or emits a new project
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Depends on:** TASK-08
- **Blocks:** TASK-10
- **Acceptance:**
  - If worthwhile carry-over is bounded and deterministic, continue to TASK-10.
  - If worthwhile carry-over is too large or too judgment-heavy, emit a new fact-find/plan slug for the cutover project and do not preserve legacy backlog reads as a convenience fallback.
  - Decision threshold is explicit:
    - continue in-thread only if the carry-forward set is `<=10` items and each item maps deterministically to the canonical build-origin contract or queue packet shape;
    - otherwise emit a dedicated carry-over cutover project.

### TASK-10: Execute bounded carry-over cutover or emit the follow-on project
- **Type:** IMPLEMENT
- **Deliverable:** either the final bounded cutover in this thread, or a created follow-on cutover fact-find if TASK-09 splits scope
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Depends on:** TASK-09
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% - bounded if TASK-09 keeps it in-thread, but otherwise intentionally split.
  - Approach: 80% - explicit cutover or explicit project split is the correct endpoint.
  - Impact: 90% - this is where the legacy backlog path actually dies.
- **Acceptance:**
  - Legacy report-only idea backlog path is removed.
  - Worthwhile historical items are carried forward into queue when the set is bounded.
  - If the set is not bounded, a follow-on project is emitted and this plan records the split rather than faking completion.
  - No hidden dual backlog read remains after the chosen cutover path.
- **Validation contract (TC-10):**
  - TC-01: after cutover, active idea backlog reads only queue-backed items.
  - TC-02: every carried-forward item is traceable to a queue dispatch or follow-on project packet.
  - TC-03: no convenience fallback keeps the old backlog alive.
- **What would make this >=90%:** completion of TASK-08 with a proven small carry-over set.

## Risks & Mitigations
- Canonical contract lands, but emitters still diverge in subtle ways.
  - Mitigation: TASK-02 forces shared identity plus explicit failure states before the bridge exists.
- Queue becomes canonical for new items, but historical legacy backlog silently disappears.
  - Mitigation: TASK-08 and TASK-09 force explicit triage and split decisions before final cutover.
- `completed-ideas.json` remains an accidental control surface after report switch.
  - Mitigation: TASK-05 targets all active consumers together.
- Self-evolving continues to act like a second authority over build-origin signals.
  - Mitigation: TASK-06 and TASK-07 block authoritative cutover claims until that seam is explicitly bounded.

## Observability
- Logging:
  - queue admission should record build-origin provenance and canonical build signal IDs.
  - extractor failure should emit explicit failure/debt state.
- Metrics:
  - count of build-origin signals emitted
  - count admitted into queue
  - duplicate suppression count across sidecars
  - count of active queue-backed build-origin backlog items
  - count of worthwhile historical items carried forward
- Alerts/Dashboards:
  - none required initially; process-improvements JSON/HTML and queue metrics are sufficient for first rollout.

## Acceptance Criteria (overall)
- [ ] One canonical build-origin signal contract exists and is used by build-review emitters.
- [ ] New actionable build-origin ideas enter the queue through the normal ideas path.
- [ ] `process-improvements` idea backlog is sourced only from queue state.
- [ ] `completed-ideas.json` no longer governs active idea backlog visibility.
- [ ] The old report-only backlog path is either cut over in-thread or explicitly split into a dedicated carry-over project with no hidden dual-read fallback.

## Decision Log
- 2026-03-10: Chose contract-first instead of direct bridge-first because current build-review sidecars are not queue-ready.
- 2026-03-10: Chose explicit cutover as the target end state rather than indefinite compatibility mode.
- 2026-03-10: Chose a self-resolving split checkpoint for historical carry-over rather than a DECISION task; if the carry-forward set is too large, a separate project will be emitted automatically.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Canonical build-origin contract | Yes | None | No |
| TASK-02: Emitter hardening | Yes (TASK-01 contract available) | None | No |
| TASK-03: Queue admission bridge | Yes (TASK-01 and TASK-02 complete) | None | No |
| TASK-04: Queue-only report sourcing | Yes (TASK-03 queue admission live) | None | No |
| TASK-05: `completed-ideas.json` demotion | Yes (TASK-03 and TASK-04 complete) | Moderate: queue-only closure must not leave calibration on stale compatibility reads | Yes |
| TASK-06: Self-evolving alignment | Partial (depends on final bridge identity details) | Moderate: alignment choice still needs proof, so this remains INVESTIGATE not IMPLEMENT | Yes |
| TASK-07: Canonical readiness checkpoint | Partial (depends on TASK-06 recommendation) | None | No |
| TASK-08: Historical carry-over audit | Yes (after TASK-07) | None | No |
| TASK-09: Cutover split checkpoint | Yes (after TASK-08) | None | No |
| TASK-10: Final cutover or follow-on split | Partial (depends on TASK-09 outcome) | Moderate: conditional by design; cannot be built credibly before carry-over scope is known | Yes |

## What would make this >=90%
- A concrete call-site inventory proving every active `completed-ideas.json` consumer to be migrated.
- A fixture-backed canonical build-origin contract with one real duplicate-sidecar example.
- A small pilot audit showing the historical carry-forward set is bounded enough to remain in-thread.

## Overall-confidence Calculation
- S=1, M=2
- TASK-01: 75% * 2 = 150
- TASK-02: 85% * 2 = 170
- TASK-03: 80% * 2 = 160
- TASK-04: 85% * 2 = 170
- TASK-05: 80% * 2 = 160
- TASK-06: 70% * 2 = 140
- TASK-08: 70% * 2 = 140
- TASK-10: 75% * 2 = 150
- Overall = (150 + 170 + 160 + 170 + 160 + 140 + 140 + 150) / 16 = 78%

## Section Omission Rule

None: all sections are relevant to this plan.
