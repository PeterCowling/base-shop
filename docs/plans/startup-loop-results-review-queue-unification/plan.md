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
Overall-confidence: 77%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Startup Loop Results-Review Queue Unification Plan

## Summary
The current startup-loop backlog is structurally split: `process-improvements.user.html` presents one idea backlog, but that backlog is still aggregated from both canonical queue state and build-review sidecars plus `completed-ideas.json` suppression. This plan fixes that in the only defensible order. First, define a canonical build-origin signal contract and harden the build-review emitters around it; then admit build-origin ideas into the normal ideas queue; then switch reporting and closure to queue-backed authority. Historical carry-over is treated explicitly, not hand-waved: after the live canonical path is in place, the plan audits the old report-only backlog and either executes a bounded carry-forward cutover in-thread or emits a dedicated follow-on project if the carry-over set is too large or too judgment-heavy.

## Active tasks
- [x] TASK-01: Define the canonical build-origin signal contract — Complete (2026-03-10)
- [x] TASK-02: Harden build-review emitters around the canonical contract — Complete (2026-03-10)
- [x] TASK-03: Implement build-review-to-queue admission and dedupe — Complete (2026-03-10)
- [x] TASK-04: Switch process-improvements idea backlog to queue-only sourcing — Complete (2026-03-10)
- [x] TASK-05: Demote `completed-ideas.json` from active backlog control — Complete (2026-03-10)
- [x] TASK-06: Determine the self-evolving build-origin alignment model — Complete (2026-03-10)
- [x] TASK-11: Implement the chosen self-evolving build-origin alignment — Complete (2026-03-10)
- [ ] TASK-13: Choose the canonical queue surface and admission seam for build-origin ideas
- [ ] TASK-14: Wire build-origin admission into the real build lifecycle
- [ ] TASK-15: Align report and closure consumers to the canonical queue surface
- [ ] TASK-07: Canonical queue-path readiness checkpoint
- [ ] TASK-08: Audit historical backlog carry-over and produce bounded carry-over evidence
- [ ] TASK-09: Cutover split checkpoint
- [ ] TASK-10: Execute bounded carry-over cutover
- [ ] TASK-12: Emit the dedicated carry-over follow-on project

## Goals
- Define one canonical build-origin signal contract for queue admission, reporting, and downstream joins.
- Make `queue-state.json` the sole canonical actionable backlog for idea items.
- Make the active backlog/report/closure path use one explicit queue surface rather than an accidental mix of `trial` and `live`.
- Remove direct build-review idea sourcing from `process-improvements`.
- Remove `completed-ideas.json` from active backlog control and make queue lifecycle authoritative.
- Reach a real cutover where the legacy report-only backlog no longer exists.
- Carry forward worthwhile historical backlog items into the queue, or explicitly split that carry-over into a follow-on cutover project.

## Non-goals
- Replacing `results-review.user.md` as the operator-authored narrative review artifact.
- Replacing `risk` or `pending-review` sourcing in `process-improvements`.
- Redesigning self-evolving policy more broadly than the build-origin identity seam required here.
- Solving the full `lp-do-ideas` go-live program beyond the queue-surface choice required to make this backlog canonical.
- Guaranteeing that the full historical carry-over happens inside this same plan if the audit proves it is a separate project.

## Constraints & Assumptions
- Constraints:
  - `results-review.user.md` remains operator-authored and evidence-oriented.
  - Existing ideas classifier and queue persistence must be reused, not bypassed.
  - Temporary compatibility reads are acceptable only during rollout; the end state cannot keep a hidden dual backlog.
  - Build-review extraction must become queue-safe; fail-open silent drop behavior is not acceptable once the queue becomes canonical.
  - Readiness cannot pass while build-origin admission, reporting, and closure point at different queue files.
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
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Define the canonical build-origin signal contract | 75% | M | Complete (2026-03-10) | - | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-10 |
| TASK-02 | IMPLEMENT | Harden build-review emitters around the canonical contract and fail-closed surfacing | 85% | M | Complete (2026-03-10) | TASK-01 | TASK-03, TASK-04, TASK-06, TASK-07, TASK-08, TASK-10 |
| TASK-03 | IMPLEMENT | Implement build-review-to-queue admission and dedupe | 80% | M | Complete (2026-03-10) | TASK-01, TASK-02 | TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-10 |
| TASK-04 | IMPLEMENT | Switch process-improvements idea backlog to queue-only sourcing | 85% | M | Complete (2026-03-10) | TASK-03 | TASK-05, TASK-07, TASK-08, TASK-10 |
| TASK-05 | IMPLEMENT | Demote `completed-ideas.json` from active backlog control | 80% | M | Complete (2026-03-10) | TASK-03, TASK-04 | TASK-07, TASK-08, TASK-10 |
| TASK-06 | INVESTIGATE | Determine the self-evolving build-origin alignment model | 70% | M | Complete (2026-03-10) | TASK-01, TASK-02, TASK-03 | TASK-11 |
| TASK-11 | IMPLEMENT | Implement the chosen self-evolving build-origin alignment in code | 80% | M | Complete (2026-03-10) | TASK-06 | TASK-13, TASK-07 |
| TASK-13 | INVESTIGATE | Choose the canonical queue surface and admission seam for build-origin ideas | 75% | M | Pending | TASK-03, TASK-04, TASK-05, TASK-11 | TASK-14, TASK-15, TASK-07 |
| TASK-14 | IMPLEMENT | Wire build-origin admission into the real build lifecycle on the chosen queue surface | 75% | M | Pending | TASK-13 | TASK-07 |
| TASK-15 | IMPLEMENT | Align report and closure consumers to the canonical queue surface | 75% | M | Pending | TASK-13 | TASK-07 |
| TASK-07 | CHECKPOINT | Canonical queue-path readiness checkpoint | 95% | S | Pending | TASK-02, TASK-03, TASK-04, TASK-05, TASK-11, TASK-14, TASK-15 | TASK-08, TASK-09, TASK-10, TASK-12 |
| TASK-08 | INVESTIGATE | Audit historical backlog carry-over and produce bounded carry-over evidence | 70% | M | Pending | TASK-07 | TASK-09, TASK-10, TASK-12 |
| TASK-09 | CHECKPOINT | Decide in-thread cutover versus separate carry-over project | 95% | S | Pending | TASK-08 | TASK-10, TASK-12 |
| TASK-10 | IMPLEMENT | Execute bounded carry-over cutover | 75% | M | Pending | TASK-09 | - |
| TASK-12 | IMPLEMENT | Emit the dedicated carry-over follow-on project | 90% | S | Pending | TASK-09 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establish the canonical build-origin contract before any queue work |
| 2 | TASK-02 | TASK-01 | Harden emitters and failure behavior around the new contract |
| 3 | TASK-03 | TASK-01, TASK-02 | Bridge build-origin signals into queue with canonical identity and dedupe |
| 4 | TASK-04, TASK-06 | TASK-03 | Queue-only reporting and self-evolving analysis can start once queue admission is real |
| 5 | TASK-05 | TASK-03, TASK-04 | Demote the compatibility registry only after the visible backlog is queue-only |
| 6 | TASK-11 | TASK-06 | Turn the chosen self-evolving alignment into real code before any readiness claim |
| 7 | TASK-13 | TASK-03, TASK-04, TASK-05, TASK-11 | Resolve the canonical queue surface and real admission seam before declaring the queue path ready |
| 8 | TASK-14, TASK-15 | TASK-13 | After the queue-surface decision, wire automated admission and align report/closure consumers |
| 9 | TASK-07 | TASK-02, TASK-03, TASK-04, TASK-05, TASK-11, TASK-14, TASK-15 | Check whether queue-backed canonical path is genuinely ready |
| 10 | TASK-08 | TASK-07 | Produce historical carry-over evidence only; do not decide project split here |
| 11 | TASK-09 | TASK-08 | Decide whether carry-over stays in-thread or becomes a separate project |
| 12 | TASK-10 or TASK-12 | TASK-09 | Exactly one conditional endgame task executes after the split checkpoint |

## Tasks

### TASK-01: Define the canonical build-origin signal contract
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-results-review-queue-unification/artifacts/build-origin-signal-contract.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
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
- **Build completion evidence (2026-03-10):**
  - Wrote [build-origin-signal-contract.md](/Users/petercowling/base-shop/docs/plans/startup-loop-results-review-queue-unification/artifacts/build-origin-signal-contract.md).
  - Verified current producer seams in [lp-do-build-results-review-extract.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts), [lp-do-build-pattern-reflection-extract.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts), [generate-process-improvements.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/generate-process-improvements.ts), and [self-evolving-from-build-output.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts).
  - Captured one real duplicate-sidecar case from [results-review.signals.json](/Users/petercowling/base-shop/docs/plans/_archive/startup-loop-structured-sidecar-introduction/results-review.signals.json) and [pattern-reflection.entries.json](/Users/petercowling/base-shop/docs/plans/_archive/startup-loop-structured-sidecar-introduction/pattern-reflection.entries.json).
  - Outcome: affirming. TASK-02, TASK-03, and TASK-06 stay at current confidence, but the contract ambiguity gate is now closed and Wave 2 is eligible.

### TASK-02: Harden build-review emitters around the canonical contract and fail-closed surfacing
- **Type:** IMPLEMENT
- **Deliverable:** hardened build-review emitter code plus canonical sidecar tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/build/build-origin-signal.ts`, `scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts`, `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts`, `scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts`, `scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-results-review-extract.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-extract.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts`
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
- **Build completion evidence (2026-03-10):**
  - Added shared canonical identity helpers in [build-origin-signal.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/build-origin-signal.ts).
  - Hardened [lp-do-build-results-review-extract.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-results-review-extract.ts) and [lp-do-build-pattern-reflection-extract.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-pattern-reflection-extract.ts) to emit `review_cycle_key`, `canonical_title`, `build_signal_id`, `recurrence_key`, and explicit `build_origin_status` / `failures`.
  - Brought [lp-do-build-pattern-reflection-prefill.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-pattern-reflection-prefill.ts) and [lp-do-pattern-promote-loop-update.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-pattern-promote-loop-update.ts) onto the same category and identity vocabulary.
  - Added regression coverage in [lp-do-build-results-review-extract.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/lp-do-build-results-review-extract.test.ts), [lp-do-build-pattern-reflection-extract.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/lp-do-build-pattern-reflection-extract.test.ts), and [self-evolving-signal-integrity.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts).
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` passed; targeted ESLint returned only ignore-pattern warnings for build-side files, with no rule violations.
  - Outcome: affirming. TASK-03 is now the next runnable implementation task.

### TASK-03: Implement build-review-to-queue admission and dedupe
- **Type:** IMPLEMENT
- **Deliverable:** deterministic build-review bridge that admits canonical build-origin signals into `queue-state.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-admission.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts`, `docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json`, `scripts/src/startup-loop/__tests__/lp-do-ideas-build-origin-bridge.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-dispatch-v2.test.ts`
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
- **Build completion evidence (2026-03-10):**
  - Added the canonical build-origin queue bridge in [lp-do-ideas-build-origin-bridge.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts), merging `pattern-reflection.entries.json` and `results-review.signals.json` by `build_signal_id` and emitting queue-native `dispatch.v2` packets with `build_origin` provenance.
  - Added shared queue admission logic in [lp-do-ideas-queue-admission.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-queue-admission.ts) and moved existing codebase/agent-session bridges onto it in [lp-do-ideas-codebase-signals-bridge.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts) and [lp-do-ideas-agent-session-bridge.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-agent-session-bridge.ts), so dedupe and queue persistence now share one path.
  - Extended the canonical dispatch contract in [lp-do-ideas-trial.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts) and [lp-do-ideas-dispatch.v2.schema.json](/Users/petercowling/base-shop/docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json) to allow `artifact_id: null` for build-origin `operator_idea` packets and to persist first-class `build_origin` provenance.
  - Added regression coverage in [lp-do-ideas-build-origin-bridge.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/lp-do-ideas-build-origin-bridge.test.ts) and [lp-do-ideas-dispatch-v2.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/lp-do-ideas-dispatch-v2.test.ts) for cross-sidecar merge, duplicate suppression on rerun, and route/status validation.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` passed; targeted ESLint passed on the bridge, shared queue admission helper, refactored bridges, dispatch contract, and new tests.
  - Outcome: affirming. Queue-backed build-origin admission is now real, and TASK-04/TASK-06 are the next runnable wave.

### TASK-04: Switch process-improvements idea backlog to queue-only sourcing
- **Type:** IMPLEMENT
- **Deliverable:** queue-only idea backlog in `process-improvements` with build-origin provenance surfaced
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
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
- **Build completion evidence (2026-03-10):**
  - Removed direct results-review markdown and sidecar idea ingestion from [generate-process-improvements.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/generate-process-improvements.ts); active `ideaItems` now come from canonical queue state plus existing bug-scan artifacts only, while `risk` and `pending-review` collection stayed intact.
  - Surfaced queue-backed build-origin provenance on process-improvement items and wired the visible report template in [process-improvements.user.html](/Users/petercowling/base-shop/docs/business-os/process-improvements.user.html) to show build signal, review cycle, and build-review path for those queue-backed items.
  - Rewrote [generate-process-improvements.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts) around the new queue-only contract: direct results-review sources no longer create backlog items, queue-backed build-origin items retain provenance, and sorting still works across canonical sources.
  - Refreshed [process-improvements.user.html](/Users/petercowling/base-shop/docs/business-os/process-improvements.user.html) and [process-improvements.json](/Users/petercowling/base-shop/docs/business-os/_data/process-improvements.json) from the new logic without invoking the normal bridge side effects.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit`, targeted ESLint on the generator and test, and `pnpm --filter scripts check-process-improvements` all passed.
  - Outcome: affirming. The visible backlog is now queue-backed for idea items, and TASK-05 is the next runnable closure tranche.

### TASK-05: Demote `completed-ideas.json` from active backlog control
- **Type:** IMPLEMENT
- **Deliverable:** queue-derived completion authority, with `completed-ideas.json` either derived-only or removed from active consumers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
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
- **Build completion evidence (2026-03-10):**
  - Removed active backlog suppression by `completed-ideas.json` from [generate-process-improvements.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/build/generate-process-improvements.ts), so queue visibility now depends on queue state and live artifact outputs rather than registry entries.
  - Demoted the registry to compatibility-only in [lp-do-ideas-completion-reconcile.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-completion-reconcile.ts): reconcile still writes queue-derived completed entries into the registry, but it no longer accepts registry rows as completion evidence for open queue items.
  - Extended regression coverage in [generate-process-improvements.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts), [lp-do-ideas-completion-reconcile.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/lp-do-ideas-completion-reconcile.test.ts), and [lp-do-ideas-keyword-calibrate.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/lp-do-ideas-keyword-calibrate.test.ts) so active queue items survive stale registry rows and fast-track calibration ignores registry-only completion claims.
  - Refreshed [process-improvements.user.html](/Users/petercowling/base-shop/docs/business-os/process-improvements.user.html) and [process-improvements.json](/Users/petercowling/base-shop/docs/business-os/_data/process-improvements.json) after the authority change; output remained stable at 19 idea items, 0 risks, and 12 pending reviews.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit`, targeted ESLint on the generator/reconcile/tests, and `pnpm --filter scripts check-process-improvements` all passed.
  - Outcome: affirming. Queue-derived truth now owns active backlog visibility and completion inference, while `completed-ideas.json` survives only as a derived compatibility artifact. TASK-06 is now the next runnable tranche.

### TASK-06: Determine the self-evolving build-origin alignment model
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-results-review-queue-unification/artifacts/self-evolving-build-origin-alignment.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-11
- **Confidence:** 70%
  - Implementation: 70% - the seam is explicit, but the right authority split still needs proof.
  - Approach: 75% - either shared join-key or queue-backed intake can work, but one must be chosen clearly.
  - Impact: 80% - without alignment, “one build-origin truth path” is overstated.
- **Acceptance:**
  - Artifact states the chosen alignment model and why.
  - Artifact names all self-evolving consumers affected.
  - Recommendation is decisive enough to drive a bounded IMPLEMENT task without reopening model choice.
- **Validation contract (TC-06):**
  - TC-01: both current self-evolving source reads are traced.
  - TC-02: the recommended model preserves build-origin joinability and does not recreate a second backlog authority.
  - TC-03: the recommendation identifies the minimal code change needed in follow-on work.
- **Execution plan:** trace current self-evolving readers, evaluate shared-identity versus queue-backed models, and choose one.
- **Planning validation (required for M/L):**
  - New outputs check:
    - chosen `build_signal_id` join behavior is consumed by self-evolving observation generation and downstream audit/reporting.
- **What would make this >=90%:** a tiny prototype proving one alignment model on real build-origin artifacts.
- **Build completion evidence (2026-03-10):**
  - Wrote the alignment decision in [self-evolving-build-origin-alignment.md](/Users/petercowling/base-shop/docs/plans/startup-loop-results-review-queue-unification/artifacts/self-evolving-build-origin-alignment.md).
  - Traced the current raw self-evolving intake in [self-evolving-from-build-output.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts): it still reads `results-review.signals.json` and `pattern-reflection.entries.json` directly and turns them into idea observations outside queue authority.
  - Traced the canonical queue-backed path in [lp-do-ideas-build-origin-bridge.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts) and [self-evolving-from-ideas.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts), and identified the missing bridge: `self-evolving-from-ideas.ts` does not yet consume `build_origin` provenance.
  - Chosen model: queue-backed build-origin dispatches are the only authoritative self-evolving intake for build-origin ideas; `self-evolving-from-build-output.ts` is narrowed to non-authoritative structural build observation.
  - Outcome: affirming. TASK-11 is now bounded and crosses the implement floor.

### TASK-11: Implement the chosen self-evolving build-origin alignment in code
- **Type:** IMPLEMENT
- **Deliverable:** code-level self-evolving alignment so build-output intake uses the canonical build-origin identity or explicit queue-backed equivalent
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts`
- **Depends on:** TASK-06
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 80% - TASK-06 fixed the model choice, and the remaining code seam is now narrow and explicit.
  - Approach: 80% - once TASK-06 chooses the model, the implementation path is bounded.
  - Impact: 85% - readiness is not credible while self-evolving still reads a second build-origin truth path.
- **Acceptance:**
  - Self-evolving build-output intake no longer relies on incompatible raw build-origin identity.
  - The chosen model is enforced in code, not just documented.
  - Tests cover provenance/join behavior for the aligned path.
  - The resulting path cannot recreate a second authoritative backlog.
- **Validation contract (TC-11):**
  - TC-01: self-evolving build-origin observations use the canonical build-origin fingerprint or a queue-backed equivalent that preserves joinability.
  - TC-02: direct raw-sidecar reads, if retained, are explicitly observational and non-authoritative by construction.
  - TC-03: alignment behavior is covered by regression tests on at least one real build-origin fixture shape.
- **Execution plan:** implement the TASK-06 alignment choice, update tests, and verify the self-evolving seam is no longer outside the canonical identity model.
- **Consumer tracing:**
  - aligned build-origin identity is consumed by self-evolving observation generation, downstream audit joins, and the readiness checkpoint.
- **What would make this >=90%:** one end-to-end fixture proving queue provenance and self-evolving provenance remain joinable after alignment.
- **Build completion evidence (2026-03-10):**
  - Updated [self-evolving-from-ideas.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts) so queue-backed `build_origin` provenance becomes first-class self-evolving context: canonical `recurrence_key` now drives signal hints, `build-origin-signal:<id>` is preserved in evidence refs, and build-origin observations get a stable `lp-do-ideas/build-origin/<review_cycle_key>/<build_signal_id>` context path.
  - Narrowed [self-evolving-from-build-output.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts) to non-authoritative structural build observation only: it no longer turns `results-review.signals.json` or `pattern-reflection.entries.json` into self-evolving idea observations, and `source_artifacts` now report only `build-record.user.md`.
  - Added regression coverage in [self-evolving-orchestrator-integration.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts) for queue-backed build-origin recurrence identity, and updated [self-evolving-signal-integrity.test.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts) so raw build-output sidecars are explicitly non-authoritative.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` passed; targeted ESLint passed on the touched self-evolving files and tests.
  - Outcome: affirming. This closed the self-evolving identity gap, but the readiness checkpoint still depends on resolving the queue-surface and automation seams discovered afterward.

### TASK-13: Choose the canonical queue surface and admission seam for build-origin ideas
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-results-review-queue-unification/artifacts/canonical-queue-surface-decision.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts`, `scripts/src/startup-loop/build/generate-process-improvements.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-completion-reconcile.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-11
- **Blocks:** TASK-14, TASK-15, TASK-07
- **Confidence:** 75%
  - Implementation: 75% - the code paths are visible, but the canonical queue surface is still ambiguous.
  - Approach: 80% - the correct next move is to choose one queue surface and one automation seam, not to keep patching around both.
  - Impact: 90% - readiness is false if admission, reporting, and closure are split across different queue files.
- **Acceptance:**
  - One queue surface is chosen explicitly for build-origin admission, active backlog reporting, and closure.
  - The real automation seam is named explicitly: standalone CLI is either replaced or demoted.
  - Every active producer/consumer that must align to the chosen surface is listed with file references.
  - The non-chosen queue surface is classified as compatibility-only, out-of-scope, or follow-on with explicit reason.
- **Validation contract (TC-13):**
  - TC-01: the decision traces all currently active queue-path defaults across bridge, report, completion, and calibration code.
  - TC-02: the chosen seam is an actually runnable lifecycle seam, not a manual CLI convenience path.
  - TC-03: the decision states what must change before TASK-07 can pass.
- **What would make this >=90%:** one dry-run of the chosen automation seam writing to the chosen queue surface with report and completion consumers pointed at the same file.

### TASK-14: Wire build-origin admission into the real build lifecycle
- **Type:** IMPLEMENT
- **Deliverable:** automated build-origin admission on the chosen queue surface
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts`, build-completion or commit-hook seam chosen in TASK-13, and focused tests around build-origin admission
- **Depends on:** TASK-13
- **Blocks:** TASK-07
- **Confidence:** 75%
  - Implementation: 75% - the bridge exists, but it is not yet attached to the real lifecycle seam.
  - Approach: 75% - the right fix is to wire the existing bridge into the real path, not to preserve a manual side tool.
  - Impact: 90% - the canonical queue path is not real until build-review ideas actually enter it automatically.
- **Acceptance:**
  - Build completion or build commit flow automatically admits build-origin signals into the chosen queue surface.
  - Duplicate suppression and telemetry remain intact.
  - Queue admission is no longer dependent on a standalone manual CLI invocation.
  - Tests cover the chosen automated seam.
- **Validation contract (TC-14):**
  - TC-01: a build-origin artifact set on the real seam produces queue dispatches without manual intervention.
  - TC-02: rerunning the same seam does not duplicate dispatches.
  - TC-03: emitted dispatches preserve canonical `build_origin` provenance.
- **What would make this >=90%:** a fixture-backed end-to-end run from build-output artifacts through the chosen automated seam into the chosen queue file.

### TASK-15: Align report and closure consumers to the canonical queue surface
- **Type:** IMPLEMENT
- **Deliverable:** report, completion, and calibration consumers aligned to the chosen queue surface
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/build/generate-process-improvements.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-completion-reconcile.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`, and any queue-path docs/tests touched by the chosen surface
- **Depends on:** TASK-13
- **Blocks:** TASK-07
- **Confidence:** 75%
  - Implementation: 75% - the affected consumers are known, but they must be updated consistently.
  - Approach: 80% - once the surface is chosen, these defaults and docs should converge on it in one tranche.
  - Impact: 90% - readiness is false while report and closure read a different queue file from admission.
- **Acceptance:**
  - `process-improvements` idea backlog reads the chosen canonical queue surface.
  - Completion and calibration consumers use the same queue surface as admission.
  - No active backlog or closure logic silently points at the wrong queue file.
  - Tests and docs reflect the chosen queue surface.
- **Validation contract (TC-15):**
  - TC-01: report generation reflects dispatches written to the chosen queue file.
  - TC-02: completion/reconcile and keyword calibration operate against that same queue file by default.
  - TC-03: no active code path required for this thread still defaults to the non-chosen queue file.
- **What would make this >=90%:** one integration-style fixture showing admission, report readback, and completion/reconcile all round-trip through the same queue file.

### TASK-07: Canonical queue-path readiness checkpoint
- **Type:** CHECKPOINT
- **Deliverable:** checkpoint note embedded in the plan or `artifacts/canonical-queue-readiness.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-11
- **Blocks:** TASK-08, TASK-09, TASK-10, TASK-12
- **Acceptance:**
  - Queue-backed build-origin path exists.
  - Build-origin queue admission is automated on the chosen lifecycle seam, not a standalone manual CLI.
  - Backlog reporting, completion, and calibration all point at the same canonical queue surface.
  - Active idea backlog is queue-only.
  - `completed-ideas.json` no longer governs active idea visibility.
  - Self-evolving build-output intake is aligned in code to the canonical build-origin identity or queue-backed equivalent.
- **Checkpoint Attempt (2026-03-10): failed -> replan required**
  - Pass: the code now closes the originally scoped seams.
    - `generate-process-improvements.ts` no longer reads build-review idea sidecars directly for idea backlog items.
    - `completed-ideas.json` no longer suppresses active queue backlog visibility.
    - `self-evolving-from-ideas.ts` now preserves queue-backed `build_origin` identity, and `self-evolving-from-build-output.ts` is narrowed to structural build observation only.
  - Fail: the build-origin queue path is still not live.
    - `lp-do-ideas-build-origin-bridge.ts` exists as a standalone CLI/utility seam, but repo search found no runtime caller outside tests, docs, and the package script.
    - `rg` over both `docs/business-os/startup-loop/ideas/live/queue-state.json` and `docs/business-os/startup-loop/ideas/trial/queue-state.json` found no persisted `build_origin` dispatches, so there is no evidence of actual build-review admission into queue.
  - Fail: queue surface authority is still split.
    - `generate-process-improvements.ts`, `lp-do-ideas-build-origin-bridge.ts`, `lp-do-ideas-completion-reconcile.ts`, `lp-do-ideas-keyword-calibrate.ts`, and `lp-do-ideas-queue-state-completion.ts` default to `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
    - `lp-do-ideas-build-commit-hook.ts` defaults to `docs/business-os/startup-loop/ideas/live/queue-state.json`.
    - That means admission, report, and closure do not yet share one canonical queue surface.
  - Result: TASK-07 stays pending. Added TASK-13, TASK-14, and TASK-15; rerun this checkpoint only after the queue-surface decision is explicit and the real admission seam is wired.

### TASK-08: Audit historical backlog carry-over and produce bounded carry-over evidence
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Depends on:** TASK-07
- **Blocks:** TASK-09, TASK-10, TASK-12
- **Confidence:** 70%
  - Implementation: 70% - the archive is large and item quality varies.
  - Approach: 75% - explicit triage is the right way to avoid cargo-cult backfill.
  - Impact: 80% - cutover integrity depends on not dropping worthwhile legacy work silently.
- **Acceptance:**
  - Audit inventories remaining legacy backlog-origin idea items.
  - Each item records worthwhile-item evidence, mapping feasibility, and whether admission is deterministic versus manual-judgment-required.
  - Worthwhile-item criteria are explicit and defensible.
  - Output includes a bounded carry-over count and effort estimate.
  - Output does not decide whether a separate project is required; it only supplies the evidence for TASK-09.
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
- **Blocks:** TASK-10, TASK-12
- **Acceptance:**
  - If worthwhile carry-over is bounded and deterministic, continue to TASK-10 only.
  - If worthwhile carry-over is too large or too judgment-heavy, continue to TASK-12 only and do not preserve legacy backlog reads as a convenience fallback.
  - Decision threshold is explicit:
    - continue in-thread only if the carry-forward set is `<=10` items, `manual-judgment-required = 0`, and each item maps deterministically to the canonical build-origin contract or queue packet shape;
    - otherwise emit a dedicated carry-over cutover project.

### TASK-10: Execute bounded carry-over cutover
- **Type:** IMPLEMENT
- **Deliverable:** final bounded carry-over cutover inside this thread
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Depends on:** TASK-09
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% - only valid if TASK-09 proves the carry-forward set is small and deterministic.
  - Approach: 85% - bounded cutover is safe once the checkpoint proves it is actually bounded.
  - Impact: 90% - this is where the legacy backlog path actually dies.
- **Acceptance:**
  - Legacy report-only idea backlog path is removed.
  - Worthwhile historical items are carried forward into queue when the set is bounded.
  - No hidden dual backlog read remains after the chosen cutover path.
- **Validation contract (TC-10):**
  - TC-01: after cutover, active idea backlog reads only queue-backed items.
  - TC-02: every carried-forward item is traceable to a queue dispatch.
  - TC-03: no convenience fallback keeps the old backlog alive.
- **What would make this >=90%:** completion of TASK-08 with a proven small carry-over set.

### TASK-12: Emit the dedicated carry-over follow-on project
- **Type:** IMPLEMENT
- **Deliverable:** dedicated follow-on carry-over project artifact set plus explicit split record in this plan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Depends on:** TASK-09
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - emitting a dedicated follow-on project is a bounded documentation/project-routing task.
  - Approach: 90% - once TASK-09 proves cutover is too large or judgment-heavy, splitting is the correct non-deceptive endpoint.
  - Impact: 85% - prevents the current thread from pretending to have finished historical cutover while keeping the live queue path clean.
- **Acceptance:**
  - A dedicated follow-on project slug is created for historical carry-over cutover.
  - This plan records the split explicitly and does not preserve legacy backlog reads as fallback.
  - The follow-on artifact names the worthwhile-item set, judgment load, and why in-thread cutover was rejected.
- **Validation contract (TC-12):**
  - TC-01: follow-on project artifact set exists at a concrete slug/path.
  - TC-02: this plan records that TASK-10 did not execute because TASK-09 selected the split path.
  - TC-03: no code or report change re-enables the old backlog as a convenience compatibility path.
- **What would make this >=90%:** a completed TASK-08 audit showing the carry-over set clearly exceeds the in-thread threshold.

## Risks & Mitigations
- Canonical contract lands, but emitters still diverge in subtle ways.
  - Mitigation: TASK-02 forces shared identity plus explicit failure states before the bridge exists.
- Queue becomes canonical for new items, but historical legacy backlog silently disappears.
  - Mitigation: TASK-08 and TASK-09 force explicit triage and split decisions before final cutover.
- `completed-ideas.json` remains an accidental control surface after report switch.
  - Mitigation: TASK-05 targets all active consumers together.
- Self-evolving continues to act like a second authority over build-origin signals.
  - Mitigation: TASK-06 chooses the model and TASK-11 implements it before TASK-07 can pass.
- Historical carry-over split logic gets hidden inside implementation instead of an explicit checkpoint.
  - Mitigation: TASK-08 produces evidence only, TASK-09 decides, and TASK-10/TASK-12 are atomic conditional endpoints.

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
- [ ] Self-evolving build-output intake uses the canonical build-origin identity or an explicitly queue-backed equivalent in code.
- [ ] The old report-only backlog path is either cut over in-thread or explicitly split into a dedicated carry-over project with no hidden dual-read fallback.

## Decision Log
- 2026-03-10: Chose contract-first instead of direct bridge-first because current build-review sidecars are not queue-ready.
- 2026-03-10: Chose explicit cutover as the target end state rather than indefinite compatibility mode.
- 2026-03-10: Chose a self-resolving split checkpoint for historical carry-over rather than a DECISION task; if the carry-forward set is too large, a separate project will be emitted automatically.
- 2026-03-10: Split self-evolving alignment into investigation plus required implementation so readiness cannot pass on documentation alone.
- 2026-03-10: Split the conditional endgame into atomic TASK-10 and TASK-12 so implementation never mixes two opposite outcomes.
- 2026-03-10: Narrowed historical audit output to evidence only; project-split choice now belongs solely to TASK-09.
- 2026-03-10: Readiness checkpoint exposed an unwired build-origin admission seam and a `trial`/`live` queue split, so queue-surface choice and automation wiring are now explicit precursor tasks.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Canonical build-origin contract | Yes | None | No |
| TASK-02: Emitter hardening | Yes (TASK-01 contract available) | None | No |
| TASK-03: Queue admission bridge | Yes (TASK-01 and TASK-02 complete) | None | No |
| TASK-04: Queue-only report sourcing | Yes (TASK-03 queue admission live) | None | No |
| TASK-05: `completed-ideas.json` demotion | Yes (TASK-03 and TASK-04 complete) | Moderate: queue-only closure must not leave calibration on stale compatibility reads | Yes |
| TASK-06: Self-evolving alignment investigation | Partial (depends on final bridge identity details) | Major: investigation alone is not enough for a readiness claim | Yes |
| TASK-11: Self-evolving alignment implementation | Partial (depends on TASK-06 choice) | Moderate: must enforce the chosen model in code, not just in an artifact | Yes |
| TASK-13: Queue surface + automation seam decision | Yes (after TASK-03, TASK-04, TASK-05, TASK-11) | Major: readiness cannot pass while admission, reporting, and closure point at different queue files | Yes |
| TASK-14: Automated build-origin admission | Partial (depends on TASK-13 decision) | Major: the bridge exists only as a manual seam today | Yes |
| TASK-15: Queue-surface consumer alignment | Partial (depends on TASK-13 decision) | Major: report and closure defaults still point at a different queue surface from one active hook | Yes |
| TASK-07: Canonical readiness checkpoint | Partial (depends on TASK-14 and TASK-15 as well as TASK-11) | Major: checkpoint would be false-positive while admission is manual or queue surfaces are split | Yes |
| TASK-08: Historical carry-over audit | Yes (after TASK-07) | Moderate: audit must produce evidence, not smuggle in the split decision | Yes |
| TASK-09: Cutover split checkpoint | Yes (after TASK-08) | None | No |
| TASK-10: Bounded carry-over cutover | Partial (depends on TASK-09 continue-in-thread outcome) | Moderate: only valid for a small deterministic carry-forward set | Yes |
| TASK-12: Follow-on project emission | Partial (depends on TASK-09 split outcome) | None | No |

## What would make this >=90%
- A concrete call-site inventory proving every active `completed-ideas.json` consumer to be migrated.
- A real dry-run of the chosen automated build-origin seam writing into the chosen canonical queue surface.
- A concrete queue-path inventory proving report, completion, and calibration all default to the same queue file.
- A tiny proven prototype for the chosen self-evolving alignment model.
- A small pilot audit showing the historical carry-forward set is bounded enough to remain in-thread.

## Overall-confidence Calculation
- S=1, M=2
- TASK-01: 75% * 2 = 150
- TASK-02: 85% * 2 = 170
- TASK-03: 80% * 2 = 160
- TASK-04: 85% * 2 = 170
- TASK-05: 80% * 2 = 160
- TASK-06: 70% * 2 = 140
- TASK-11: 80% * 2 = 160
- TASK-13: 75% * 2 = 150
- TASK-14: 75% * 2 = 150
- TASK-15: 75% * 2 = 150
- TASK-08: 70% * 2 = 140
- TASK-10: 75% * 2 = 150
- TASK-12: 90% * 1 = 90
- Overall = (150 + 170 + 160 + 170 + 160 + 140 + 160 + 150 + 150 + 150 + 140 + 150 + 90) / 25 = 77%

## Section Omission Rule

None: all sections are relevant to this plan.
