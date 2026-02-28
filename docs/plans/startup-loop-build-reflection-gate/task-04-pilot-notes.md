---
Type: Pilot-Notes
Status: Complete
Feature-Slug: startup-loop-build-reflection-gate
Task-ID: TASK-04
Last-reviewed: 2026-02-27
artifact: pilot-notes
---

# TASK-04 Pilot Notes — Pattern Reflection Schema Validation

## 1. Builds Reviewed

Two completed builds with `results-review.user.md` files were used as pilot subjects:

| Build | Path | New Idea Candidates |
|---|---|---|
| xa-uploader-usability-hardening | `docs/plans/xa-uploader-usability-hardening/results-review.user.md` | 2 entries (restore sync scripts; add E2E coverage) |
| post-build-reflection-prompting | `docs/plans/_archive/post-build-reflection-prompting/results-review.user.md` | 2 entries (AI-to-mechanistic lint check; docs-patch skill) |

A third build (`lp-do-ideas-startup-loop-integration`) was read but had `New Idea Candidates: None` — confirmed valid empty-state behavior.

## 2. Synthetic `pattern-reflection.user.md` Artifacts

Pilot artifacts produced:

- `docs/plans/startup-loop-build-reflection-gate/pilot-xa-pattern-reflection.user.md`
  - 2 entries: `access_gap` (routing: defer, occurrence: 1) + `ad_hoc` (routing: defer, occurrence: 1)
- `docs/plans/startup-loop-build-reflection-gate/pilot-post-build-reflection-pattern-reflection.user.md`
  - 2 entries: `deterministic` (routing: defer, occurrence: 1) + `ad_hoc` (routing: defer, occurrence: 1)

## 3. Schema Field Assessment

| Field | Assessment | Notes |
|---|---|---|
| `pattern_summary` (≤100 chars) | Sufficient | All 4 entries fit within 100 chars. Plain language natural for the entries tested. |
| `category` enum | Sufficient | `access_gap`, `ad_hoc`, `deterministic` all appeared. `unclassified` not needed in pilot but definition is clear. |
| `routing_target` | Sufficient | All entries routed to `defer` (below thresholds). Routing logic is correct and unambiguous. |
| `occurrence_count` | Sufficient | Correctly set to 1 for first-observed patterns. Cross-build count accumulation is an operator responsibility — not automated in this schema version, which is correct. |
| `evidence_refs` | Sufficient | Optional field; populated for all pilot entries without difficulty. |
| `classifier_input` | Sufficient | Direct mapping to `IdeaClassificationInput`; no wrapper needed as confirmed in TASK-01. |
| `access_declarations` | Sufficient | Used correctly for the xa-uploader `access_gap` entry; `None identified` used for the post-build-reflection entry. |

No field gaps identified. Schema represents all observed patterns without compression or loss.

## 4. Routing Threshold Assessment

### Thresholds tested

| Threshold | Value | Did any entry cross it? | Assessment |
|---|---|---|---|
| Deterministic → loop_update | occurrence_count >= 3 | No (all occurrence_count = 1) | Threshold not triggered in pilot — correct, since all entries are first observations. |
| Ad-hoc → skill_proposal | occurrence_count >= 2 | No (all occurrence_count = 1) | Same — correct behavior. |

### Finding: thresholds not triggered by single-build pilot

This is expected behavior. The thresholds are designed to accumulate evidence across multiple builds. The pilot validates the routing logic is correct (defer when below threshold) but cannot validate whether the thresholds (3 and 2) are calibrated correctly — this requires observing the same pattern recur across 2–3 builds.

**Recommendation:** thresholds remain at 3 (deterministic) and 2 (ad-hoc) pending real-world accumulation. No calibration change needed at this stage.

## 5. Access Declarations Assessment

The xa-uploader pilot demonstrated the core use case: an `access_gap` entry captured that `validate-xa-inputs.ts` and `run-xa-pipeline.ts` were absent and discovered mid-build, not declared upfront.

If the Access Declarations step (TASK-03) had been in place during that build, the agent would have listed the XA sync scripts as a required dependency in Phase 2 of the fact-find. Either:
- (a) the absence would have been discovered before implementation started, unblocking an upfront decision about whether to scope the scripts into the plan, or
- (b) the agent would have declared the scripts `UNVERIFIED` and the plan would have carried an explicit known-risk rather than a silent mid-build surprise.

Both outcomes are better than the actual outcome (silent failure during J2 sync attempt). The access declarations gate has a clear, concrete value for this class of dependency.

## 6. Schema Calibration Needs

None identified. The schema represents all patterns found in the pilot builds without requiring new fields or category adjustments.

Deferred follow-up item (not blocking):
- The `occurrence_count` field is currently operator-assigned and not automatically accumulated across builds. For the cross-build routing thresholds to function, an operator or agent must manually identify that the same pattern appeared in a prior `pattern-reflection.user.md` and increment the count. This is a known limitation (schema v1, instruction-first). A future hardening step could scan all prior `pattern-reflection.user.md` files for matching `idea_key` values and auto-populate `occurrence_count`. This is deferred per the plan's non-goals.

## 7. Empty-State Validation

The `lp-do-ideas-startup-loop-integration` build (`New Idea Candidates: None`) was confirmed to produce a valid empty-state `pattern-reflection.user.md` under the schema: `entries: []` with `None identified` in both `## Patterns` and `## Access Declarations`. No issues.

## 8. Horizon Assumption Checks

| Assumption | Status | Evidence |
|---|---|---|
| Schema fields sufficient for real builds | Confirmed | All 4 entries from 2 builds represented without loss. |
| Routing thresholds produce at least 1 actionable decision across pilot | Not triggered — expected | All entries are occurrence_count=1; thresholds require 2–3. This is correct for first-ever build; accumulation happens over subsequent cycles. |
| Access declarations schema represents access verification state | Confirmed | xa-uploader entry correctly represents mid-build discovery event for sync scripts. |

## 9. Overall Pilot Verdict

Schema is fit for use. Routing logic is correct. Access declarations gate has clear demonstrated value. No calibration changes needed before first real-build deployment. TASK-02 and TASK-03 changes are ready to ship.

## 10. Operator Sign-Off Prompt

Please review:
- `docs/plans/startup-loop-build-reflection-gate/pilot-xa-pattern-reflection.user.md`
- `docs/plans/startup-loop-build-reflection-gate/pilot-post-build-reflection-pattern-reflection.user.md`

Confirm:
- [ ] Schema fields and routing results look correct for the two pilot builds
- [ ] No calibration changes needed before first real-build use
- [ ] TASK-02 and TASK-03 SKILL.md changes are acknowledged (see build evidence in plan.md)
