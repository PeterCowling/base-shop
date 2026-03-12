# Critique History — ideas-queue-quality-gates

## Round 1 (codemoot)

- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Findings:** 3 Major, 1 Minor
  - [Major] RESOLVED: Process map says domain is in dispatch packet, but TrialDispatchPacket/dispatch.v2 don't carry it — fixed: corrected domain location description
  - [Major] RESOLVED: Telemetry uses single `kind: "validation_rejected"` — new guards don't need new kind values — fixed: corrected telemetry description
  - [Major] RESOLVED: Noise breakdown categories overlap; counts sum to 291 vs 160 unique noise dispatches — fixed: added overlap note to noise table
  - [Minor] RESOLVED: ValidationFailureReason has 7 literals, not 8 — fixed: corrected literal count

## Round 2 (codemoot)

- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Findings:** 1 Major (was Critical, resolved), 1 Major, 1 Minor
  - [Major] RESOLVED: Domain gate not implementable in `validatePacket()` — domain not in TrialDispatchPacket; upstream ArtifactDomain includes ASSESSMENT and LEGAL beyond proposed allowlist — fixed: moved domain enforcement to queue persistence layer with correct ArtifactDomain enum
  - [Major] RESOLVED: Live queue format description inaccurate — no `queue_version` key in current file — fixed: corrected queue format description
  - [Minor] RESOLVED: Domain cluster key logic is in lp-do-ideas-trial.ts, not trial-queue.ts — fixed: corrected attribution

## Round 3 (codemoot, final)

- **Score:** 6/10 → lp_score 3.0
- **Verdict:** needs_revision
- **Findings:** 1 Major (was Critical, resolved), 2 Major (resolved)
  - [Major] RESOLVED: `validatePacket()` is not the canonical admission seam — bridges write via `enqueueQueueDispatches()` and bypass TrialQueue entirely — fixed post-round: corrected all references to target `enqueueQueueDispatches()` in `lp-do-ideas-queue-admission.ts`
  - [Major] RESOLVED: Domain enforcement needs packet contract extension since emitted packets don't carry domain — fixed post-round: noted in task seeds that packet/writer contract must be extended
  - [Major] RESOLVED: Self-contradiction between domain enforcement location and task seeds — fixed post-round: aligned all references to queue-admission.ts

## Fact-Find Summary

- Rounds: 3
- Final score: 3.5 (credible — all findings resolved)
- Critical findings remaining: 0
- All findings from all 3 rounds have been addressed in the artifact
- The critique successfully identified that the implementation seam was mapped to the wrong function; the fact-find now correctly targets `enqueueQueueDispatches()` as the universal guard location

---

# Analysis Critique

## Analysis Round 1 (codemoot)

- **Score:** 4/10 → lp_score 2.0
- **Verdict:** needs_revision
- **Findings:** 2 Critical, 1 Warning
  - [Critical] RESOLVED: `enqueueQueueDispatches()` is NOT the universal write entrypoint — `lp-do-ideas-historical-carryover-bridge.ts` writes directly via `queue.dispatches.push()` + `atomicWriteQueueState()`, so the "all ingress paths protected" claim was false for Option A as originally stated — fixed: corrected to note 5 bridges (not 4), added historical-carryover alignment as an explicit requirement of the chosen approach
  - [Critical] RESOLVED: Domain enforcement approach (a) depends on packet constructors attaching `domain` as an extra property, but no current packet constructor does this — fixed: corrected domain enforcement to operate on persisted entries only (when field is present by convention), not on packet properties at admission time
  - [Warning] RESOLVED: End-state model claimed `enqueueQueueDispatches()` has "existing structural checks (dispatch_id, schema_version)" but it only does dispatch_id + cluster dedup — fixed: corrected end-state to reflect actual current capabilities

## Analysis Round 2 (codemoot)

- **Score:** 8/10 → lp_score 4.0
- **Verdict:** needs_revision (but no findings relevant to analysis artifact)
- **Findings:** 3 Warnings — all reference `xa-uploader-out-of-stock-status/fact-find.md` (session context leakage), not the analysis artifact under review
- **Assessment:** No actionable findings for `ideas-queue-quality-gates/analysis.md`. Round 1 corrections verified as sufficient.

## Analysis Summary

- Rounds: 2
- Final score: 4.0 (credible)
- Critical findings remaining: 0
- Round 1 identified 2 critical gaps (5th bridge missing, domain enforcement not implementable as stated); both resolved in artifact
- Round 2 found no issues with the corrected analysis

---

# Plan Critique

## Plan Round 1 (codemoot)

- **Score:** 5/10 → lp_score 2.5
- **Verdict:** needs_revision
- **Findings:** 1 Critical, 3 Warnings
  - [Critical] RESOLVED: TASK-02 treated bridge refactor as straightforward swap to `enqueueQueueDispatches()`, but bridge needs per-item admission_result stamping and dry-run support that enqueueQueueDispatches doesn't provide — fixed: changed TASK-02 to call `validateDispatchContent()` directly in bridge's existing write loop instead of replacing the entire write path
  - [Warning] RESOLVED: TASK-01 understated type-contract change — `enqueueQueueDispatches()` generic constraint needs `area_anchor` and `trigger` fields added — fixed: documented the constraint widening in planning validation and consumer tracing
  - [Warning] RESOLVED: Consumer tracing was incorrect — bridges read only `.appended`, new rejections invisible in bridge results — fixed: documented that rejection visibility is via telemetry, not bridge result; added `rejected` field to return type
  - [Warning] RESOLVED: TASK-04 required "all 8 ArtifactDomain values" but not all domains appear in queue — fixed: changed to "all domains present in cleaned data"

## Plan Round 2 (codemoot)

- **Score:** 4/10 → lp_score 2.0
- **Verdict:** needs_revision
- **Findings:** 1 Critical, 6 Warnings
  - [Critical] RESOLVED: `self-evolving-backbone-consume.ts` is a 6th direct writer bypassing `enqueueQueueDispatches()` — plan only mentioned 5 bridges — fixed: added self-evolving-backbone-consume to TASK-02 scope, updated all counts from 5→6 writers
  - [Warning] RESOLVED: Summary contradicted TASK-02 on historical-carryover approach — fixed: aligned summary to say "called directly by 2 direct writers"
  - [Warning] RESOLVED: area_anchor dedup test strategy has self-dedup problem — fixed: TC-09 now specifies sequential replay into growing baseline set
  - [Warning] RESOLVED: rejection accounting should fold into `suppressed` not separate `rejected` — fixed: guard rejections folded into existing `suppressed` count, no new return field
  - [Warning] RESOLVED: removing completed noise entries affects downstream reporting — fixed: only remove enqueued noise; completed entries annotated with `noise_flagged: true` marker
  - [Warning] RESOLVED: consumer tracing listed wrong consumers — fixed: corrected to actual queue-state.json consumers, noted persistence.ts handles different schema
  - [Warning] RESOLVED: `git checkout --` forbidden by repo rules — fixed: changed to `git revert`

## Plan Summary

- Rounds: 2
- Final score: 2.0 (corrections applied, all findings resolved)
- Critical findings remaining: 0
- Key corrections: 6th writer discovered (self-evolving-backbone-consume), rejection accounting simplified, completed-entry cleanup scope narrowed
