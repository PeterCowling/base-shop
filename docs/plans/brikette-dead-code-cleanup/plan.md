---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-10
Last-reviewed: 2026-03-10
Last-updated: 2026-03-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-dead-code-cleanup
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: weighted average by effort (S=1, M=2)
Auto-Build-Intent: plan-only
---

# Brikette Dead Code Cleanup Plan

## Summary
This plan turns the March 10, 2026 Brikette dead-code audit into a ranked cleanup sequence for `apps/brikette`. The audit produced 18 findings: 2 high-confidence, 9 medium-confidence, and 7 low-confidence. The first wave is straightforward: delete the two `_api-off` routes that are unreachable by naming convention. The remaining work is gated behind targeted verification because the audit also surfaced one confirmed false positive (`book-dorm-bed`) and several modules that may be intentionally retained for tests, previews, or future route inventory coverage.

## Active tasks
- [ ] TASK-05: Horizon checkpoint after verification passes
- [ ] TASK-06: Execute low-confidence cleanup or document intentional keepers
- [ ] TASK-07: Final validation and cleanup summary

## Goals
- Remove the two disabled `_api-off` route files from Brikette immediately.
- Re-verify every medium-confidence export finding before deletion.
- Reclassify low-confidence findings into false-positive, intentional-retain, or delete buckets.
- Keep all cleanup work behavior-preserving and revertable.

## Non-goals
- Reviving or replacing disabled API behavior under `_api-off`.
- Broad simplification work already covered by the archived February 2026 Brikette simplification plan.
- Refactoring live route architecture, search infrastructure, or pricing logic beyond deleting verified dead files.

## Constraints & Assumptions
- Constraints:
  - No runtime behavior change; only dead-file deletion or explicit retention decisions.
  - Local validation stays scoped to Brikette and follows current repo policy: `pnpm --filter @apps/brikette typecheck` and `pnpm --filter @apps/brikette lint`.
  - Tests run in CI only; do not execute Jest locally.
- Assumptions:
  - Files under `_api-off/` are intentionally disabled and unreachable.
  - Medium-confidence export findings are not safe to delete until a direct consumer sweep confirms there are no dynamic or non-static consumers.
  - `book-dorm-bed` is a live published route and should be removed from cleanup scope unless contradictory evidence appears.

## Inherited Outcome Contract
- **Why:** Reduce Brikette maintenance surface by removing code that is present in the repo but no longer reachable or consumed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette has a current, evidence-backed dead-code cleanup plan with the March 10 audit findings ranked into delete-now, verify-then-delete, and retain buckets.
- **Source:** auto

## Fact-Find Reference
- Related brief: None: this plan is based on the March 10, 2026 audit run (`node --import tsx scripts/src/quality/dead-code-audit.ts --app=brikette --format=json`) and direct repository evidence gathered during planning.
- Key findings used:
  - Audit totals: 18 findings, with 2 high-confidence `_api-off` route files and no `api`/`flags` findings.
  - `book-dorm-bed` is explicitly referenced by redirect logic, live funnel scripts, and routing comments, so it is not dead code.
  - `hospitality-preview` currently has no traced consumer beyond its page file and requires intent review before deletion.
  - Medium-confidence export findings are mostly unimported hooks/utils/lib barrels that require one more consumer sweep before removal.

## Proposed Approach
- Option A:
  - Delete only the two `_api-off` routes now.
  - Verify all other findings in ranked bands before any additional deletion.
  - Treat false positives and intentional preview/test support as explicit keep decisions.
- Option B:
  - Delete all 18 findings in one cleanup pass based on audit confidence alone.
- Chosen approach:
  - Option A. The audit already produced at least one false positive (`book-dorm-bed`), so cleanup beyond `_api-off` should be gated by direct verification rather than trusting the static audit output wholesale.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Delete unreachable `_api-off` routes | 95% | S | Complete (2026-03-10) | - | TASK-05 |
| TASK-02 | INVESTIGATE | Verify medium-confidence export candidates | 80% | M | Complete (2026-03-10) | - | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Delete medium-confidence export candidates confirmed dead by TASK-02 | 88% | M | Complete (2026-03-10) | TASK-02 | TASK-05 |
| TASK-04 | INVESTIGATE | Resolve low-confidence findings into keep/delete buckets | 90% | S | Complete (2026-03-10) | - | TASK-05, TASK-06 |
| TASK-05 | CHECKPOINT | Horizon checkpoint after verification passes | 95% | S | Pending | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Execute low-confidence cleanup or document intentional keepers | 82% | M | Pending | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Final validation and cleanup summary | 88% | S | Pending | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04 | - | High-confidence delete-now work can run while medium/low findings are re-verified |
| 2 | TASK-03 | TASK-02 | Only execute on candidates explicitly confirmed dead |
| 3 | TASK-05 | TASK-01, TASK-02, TASK-03, TASK-04 | Reassess the residual cleanup set before touching lower-confidence items |
| 4 | TASK-06 | TASK-05 | Delete only items that survived checkpoint review |
| 5 | TASK-07 | TASK-06 | Final scoped validation and written disposition summary |

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Delete unreachable `_api-off` routes | Yes | None | No |
| TASK-02: Verify medium-confidence export candidates | Yes | Minor: some barrels may be retained for planned-but-not-yet-wired consumers | Yes |
| TASK-03: Delete medium-confidence export candidates confirmed dead by TASK-02 | Partial | Moderate: deletion safety depends on TASK-02 proving no dynamic/test-expectation consumers | Yes |
| TASK-04: Resolve low-confidence findings into keep/delete buckets | Yes | Minor: intent for `hospitality-preview` is undocumented | Yes |
| TASK-05: Horizon checkpoint after verification passes | Partial | None beyond upstream evidence completeness | Yes |
| TASK-06: Execute low-confidence cleanup or document intentional keepers | Partial | Moderate: checkpoint must explicitly exclude `book-dorm-bed` and any preview/test-support keepers | Yes |
| TASK-07: Final validation and cleanup summary | Partial | None: depends on prior deletion set being finalized | Yes |

## Tasks

### TASK-01: Delete unreachable `_api-off` routes
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/brikette/src/app/_api-off/**`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-10)
- **Affects:** `apps/brikette/src/app/_api-off/recovery/quote/send/route.ts`, `apps/brikette/src/app/_api-off/availability/route.ts`, `apps/brikette/src/app/_api-off/availability/route.test.ts`, `apps/brikette/src/components/guides/RelatedGuides.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% - the files are unreachable by Next.js naming convention under `_api-off/`
  - Approach: 95% - deletion is simpler and lower-risk than preserving disabled route stubs
  - Impact: 95% - no live route points at these files
- **Acceptance:**
  - Both `_api-off` route files are deleted.
  - No unresolved imports or route references remain.
  - Brikette typecheck and lint pass locally.
- **Validation contract (TC-XX):**
  - TC-01: `rg "_api-off"` in `apps/brikette/src` shows no remaining live route code after deletion
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes
  - TC-03: `pnpm --filter @apps/brikette lint` passes
- **Execution plan:** Red -> Green -> Refactor
  - Red: confirm the two files are only present under `_api-off`
  - Green: delete the files and rerun scoped validation
  - Refactor: None: deletion-only task
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: `_api-off` naming convention is already sufficient evidence
- **Edge Cases & Hardening:** If a live import points into either route file, stop and reclassify the file into TASK-04 instead of deleting it
- **What would make this >=90%:**
  - Already >=90%
- **Rollout / rollback:**
  - Rollout: standalone deletion commit
  - Rollback: revert the deletion commit
- **Documentation impact:**
  - Update this plan with completion evidence
- **Notes / references:**
  - March 10 audit high-confidence findings
- **Build evidence (2026-03-10):**
  - Red: confirmed the only live `_api-off` route files were `apps/brikette/src/app/_api-off/recovery/quote/send/route.ts` and `apps/brikette/src/app/_api-off/availability/route.ts`
  - Green: both route files deleted; legacy test `apps/brikette/src/app/_api-off/availability/route.test.ts` removed; unrelated lint blocker in [RelatedGuides.tsx](/Users/petercowling/base-shop/apps/brikette/src/components/guides/RelatedGuides.tsx) fixed as bounded scope expansion for validation
  - TC-01: PASS — `_api-off` no longer appears under `apps/brikette/src` or `apps/brikette/scripts`
  - TC-02: PASS — `pnpm --filter @apps/brikette typecheck` passes after the bounded validation repairs in [HeroSection.tsx](/Users/petercowling/base-shop/apps/brikette/src/components/apartment/HeroSection.tsx) and [useHowToGetHereContent.ts](/Users/petercowling/base-shop/apps/brikette/src/routes/how-to-get-here/useHowToGetHereContent.ts)
  - TC-03: PASS — `pnpm --filter @apps/brikette lint` passes after removing stale suppressions in [page.tsx](/Users/petercowling/base-shop/apps/brikette/src/app/[lang]/book-private-accommodations/page.tsx)
  - Post-build validation:
    - Mode: 2 (Data)
    - Attempt: 2
    - Result: Complete
    - Evidence: deletion verified by file removal plus `_api-off` search; Brikette typecheck and lint now both pass locally
    - Degraded mode: No

### TASK-02: Verify medium-confidence export candidates
- **Type:** INVESTIGATE
- **Deliverable:** candidate verification matrix in `docs/plans/brikette-dead-code-cleanup/plan.md` and, if needed, a supporting notes artifact under `docs/plans/brikette-dead-code-cleanup/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `apps/brikette/src/hooks/useIsDesktop.ts`, `apps/brikette/src/lib/search/index.ts`, `apps/brikette/src/lib/rates.ts`, `apps/brikette/src/lib/metrics/index.ts`, `apps/brikette/src/lib/cfLibImage.ts`, `apps/brikette/src/lib/analytics/index.ts`, `apps/brikette/src/utils/testimonials.ts`, `apps/brikette/src/utils/ensureGuideContent.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-05
- **Confidence:** 80%
  - Implementation: 85% - the audit already narrowed the candidate set
  - Approach: 80% - one more pass is needed to distinguish dead barrels from intentional future-facing modules
  - Impact: 75% - accidental deletion would silently remove fallback or helper code
- **Questions to answer:**
  - Which of the medium-confidence candidates have zero production, script, and dynamic-import consumers?
  - Which candidates are only retained for tests, manual preview workflows, or forward-declared APIs?
  - Which candidates should be deleted together because they form a dead subgraph?
- **Acceptance:**
  - Every medium-confidence candidate is labeled `delete`, `keep`, or `needs-follow-up`.
  - Each label has a concrete evidence note.
  - TASK-03 receives a bounded deletion list.
- **Validation contract:** direct import/consumer sweeps and file-level evidence are recorded for every candidate
- **Planning validation:**
  - Checks run: March 10 audit review plus spot inspection of `useIsDesktop.ts`, `lib/search/index.ts`, `lib/rates.ts`, and `utils/ensureGuideContent.ts`
  - Unexpected findings: none yet, but the spot checks show some candidates are substantive modules rather than trivial wrappers
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update this plan with a verified candidate matrix
- **Notes / references:**
  - Audit medium-confidence findings list
  - `docs/plans/brikette-dead-code-cleanup/medium-confidence-findings.md`
- **Build evidence (2026-03-10):**
  - Deliverable written: `docs/plans/brikette-dead-code-cleanup/medium-confidence-findings.md`
  - Candidate split:
    - Delete candidate: `useIsDesktop.ts`, `lib/search/index.ts`, `lib/rates.ts`, `lib/metrics/index.ts`, `lib/analytics/index.ts`
    - Keep: `utils/ensureGuideContent.ts`
    - Needs follow-up: `utils/testimonials.ts`
    - Already removed outside task: `lib/cfLibImage.ts`
  - Acceptance: PASS — every medium-confidence finding now has a written disposition and TASK-03 input set

### TASK-03: Delete medium-confidence export candidates confirmed dead by TASK-02
- **Type:** IMPLEMENT
- **Deliverable:** code-change in verified-dead files under `apps/brikette/src/hooks`, `apps/brikette/src/lib`, and `apps/brikette/src/utils`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `apps/brikette/src/hooks/useIsDesktop.ts`, `apps/brikette/src/lib/search/index.ts`, `apps/brikette/src/lib/rates.ts`, `apps/brikette/src/lib/metrics/index.ts`, `apps/brikette/src/lib/analytics/index.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Confidence:** 88%
  - Implementation: 90% - TASK-02 produced a bounded deletion set with concrete file-level evidence
  - Approach: 88% - the task is now constrained to explicit delete candidates instead of the full audit list
  - Impact: 85% - keep/follow-up exclusions reduce accidental deletion risk
- **Acceptance:**
  - Only TASK-02-approved candidates are deleted.
  - No consumer regressions are introduced.
  - Brikette typecheck and lint pass locally.
- **Validation contract (TC-XX):**
  - TC-01: every deleted file has a recorded zero-consumer note from TASK-02
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes
  - TC-03: `pnpm --filter @apps/brikette lint` passes
- **Execution plan:** Red -> Green -> Refactor
  - Red: lock the deletion list from TASK-02
  - Green: remove the files and clean any import debris
  - Refactor: None beyond dead import cleanup
- **Planning validation (required for M/L):**
  - Checks run: audit review plus mandatory TASK-02 consumer sweeps
  - Validation artifacts: candidate matrix from TASK-02
  - Unexpected findings: one false positive already exists elsewhere in the audit, so this task must stay bounded
- **Scouts:** probe whether any candidate is only referenced from test fixtures or docs and therefore should move to TASK-04 instead of deletion here
- **Edge Cases & Hardening:** if a candidate has manual runtime usage that is not statically imported, move it out of this task
- **Consumer tracing (M/L required):**
  - New outputs: None
  - Modified behavior: removal of dead modules only
  - Unchanged consumers are safe only for files that TASK-02 proves have no live consumers
- **What would make this >=90%:**
  - Converting all bounded candidates to explicit zero-consumer proofs in TASK-02
- **Rollout / rollback:**
  - Rollout: standalone deletion commit after TASK-02
  - Rollback: revert the deletion commit
- **Documentation impact:**
  - Update plan candidate matrix and completion notes
- **Notes / references:**
  - TASK-02 verification output
- **Build evidence (2026-03-10):**
  - Red: TASK-02 candidate matrix rechecked before deletion
  - Green: deleted `apps/brikette/src/hooks/useIsDesktop.ts`, `apps/brikette/src/lib/search/index.ts`, `apps/brikette/src/lib/rates.ts`, `apps/brikette/src/lib/metrics/index.ts`, and `apps/brikette/src/lib/analytics/index.ts`
  - TC-01: PASS — bounded delete set matches TASK-02 zero-consumer evidence
  - TC-02: PASS — `pnpm --filter @apps/brikette typecheck` passes
  - TC-03: PASS — `pnpm --filter @apps/brikette lint` passes
  - Post-build validation:
    - Mode: 2 (Data)
    - Attempt: 2
    - Result: Complete
    - Evidence: delete tranche is applied on disk and package validation is green for Brikette
    - Degraded mode: No

### TASK-04: Resolve low-confidence findings into keep/delete buckets
- **Type:** INVESTIGATE
- **Deliverable:** low-confidence disposition notes in `docs/plans/brikette-dead-code-cleanup/plan.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-10)
- **Affects:** `apps/brikette/src/app/[lang]/hospitality-preview/page.tsx`, `apps/brikette/src/lib/seo-audit/index.ts`, `apps/brikette/src/lib/buildHostelSchema.ts`, `apps/brikette/src/utils/validate.ts`, `apps/brikette/src/utils/parseAmaKeywords.ts`, `apps/brikette/src/utils/guideLinks.ts`, `apps/brikette/src/utils/buildNavLinks.ts`, `[readonly] apps/brikette/src/app/[lang]/book-dorm-bed/page.tsx`
- **Depends on:** -
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 90%
  - Implementation: 90% - the remaining set is small and already scoped
  - Approach: 90% - each finding can be classified by traced references or explicit intent
  - Impact: 90% - this task prevents accidental deletion of live but unlinked routes
- **Questions to answer:**
  - Should `hospitality-preview` be retained as an intentional internal preview route?
  - Are the test-only referenced export files worth keeping, or should their tests be deleted too?
  - Does any low-confidence item need a documentation note instead of code deletion?
- **Acceptance:**
  - Every low-confidence finding is classified as `keep`, `delete`, or `defer`.
  - `book-dorm-bed` is explicitly documented as out of cleanup scope unless new evidence appears.
  - TASK-06 receives a bounded action set.
- **Validation contract:** each classification cites concrete repo evidence (references, comments, scripts, or lack thereof)
- **Planning validation:** `book-dorm-bed` has already been confirmed live via redirect and script references; `hospitality-preview` currently shows no traced consumer beyond the page file
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update this plan with the low-confidence disposition table
- **Notes / references:**
  - March 10 audit low-confidence findings
  - `docs/plans/brikette-dead-code-cleanup/low-confidence-findings.md`
- **Build evidence (2026-03-10):**
  - Deliverable written: `docs/plans/brikette-dead-code-cleanup/low-confidence-findings.md`
  - Confirmed false positive: `apps/brikette/src/app/[lang]/book-dorm-bed/page.tsx`
  - Keep: `apps/brikette/src/lib/seo-audit/index.ts`
  - Delete candidates: `apps/brikette/src/lib/buildHostelSchema.ts`, `apps/brikette/src/utils/validate.ts`, `apps/brikette/src/utils/parseAmaKeywords.ts`, `apps/brikette/src/utils/guideLinks.ts`, `apps/brikette/src/utils/buildNavLinks.ts`
  - Defer pending intent: `apps/brikette/src/app/[lang]/hospitality-preview/page.tsx`
  - Acceptance: PASS — every low-confidence finding now has a written keep/delete/defer disposition

### TASK-05: Horizon checkpoint after verification passes
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-dead-code-cleanup/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is defined
  - Approach: 95% - prevents low-confidence deletions from bypassing evidence review
  - Impact: 95% - catches residual false positives before final cleanup
- **Acceptance:**
  - Upstream task evidence is reviewed.
  - Low-confidence action set is re-sequenced from current evidence.
  - The plan is updated before TASK-06 begins.
- **Horizon assumptions to validate:**
  - No new evidence contradicts the `book-dorm-bed` keep decision.
  - Any candidate moving into TASK-06 has a written keep/delete rationale.
- **Validation contract:** plan diff shows updated dispositions and downstream confidence adjustments
- **Planning validation:** upstream task notes and candidate matrices are present
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** update this plan and re-sequence downstream work

### TASK-06: Execute low-confidence cleanup or document intentional keepers
- **Type:** IMPLEMENT
- **Deliverable:** code-change for any TASK-05-approved deletions plus inline documentation of retained intentional files where warranted
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** bounded subset from TASK-04/TASK-05
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Implementation: 82% - execution is straightforward once the checkpoint narrows scope
  - Approach: 82% - safe only if keep/delete decisions are explicit
  - Impact: 82% - this wave removes residual dead code while preserving intentional hidden surfaces
- **Acceptance:**
  - Only TASK-05-approved low-confidence deletions are executed.
  - Intentional keepers are documented when silent retention would be confusing.
  - Brikette typecheck and lint pass locally.
- **Validation contract (TC-XX):**
  - TC-01: each deleted file has a checkpoint-approved rationale
  - TC-02: `pnpm --filter @apps/brikette typecheck` passes
  - TC-03: `pnpm --filter @apps/brikette lint` passes
- **Execution plan:** Red -> Green -> Refactor
  - Red: freeze the low-confidence action list from TASK-05
  - Green: execute approved deletions or add minimal intent comments/docs for retained files
  - Refactor: remove stale imports or dead tests that depend on deleted files
- **Planning validation (required for M/L):**
  - Checks run: TASK-04 classification plus TASK-05 checkpoint
  - Validation artifacts: low-confidence disposition notes
  - Unexpected findings: `book-dorm-bed` is an explicit keep decision and must remain excluded
- **Scouts:** confirm no hidden script or manual QA dependency exists for any file promoted into this task
- **Edge Cases & Hardening:** do not delete routes or helpers that exist solely for internal preview, redirect, or operational runbook flows without documenting replacement intent
- **Consumer tracing (M/L required):**
  - New outputs: None
  - Modified behavior: removal of files classified as dead, or retention annotations only
  - Unchanged consumers are safe only for files that the checkpoint explicitly classifies as unused or intentional keepers
- **What would make this >=90%:**
  - Converting every low-confidence candidate into a checkpoint-approved keep/delete record before implementation
- **Rollout / rollback:**
  - Rollout: standalone final cleanup commit
  - Rollback: revert the final cleanup commit
- **Documentation impact:**
  - Update plan with final dispositions and any intentional-retain notes
- **Notes / references:**
  - TASK-04 and TASK-05 outputs

### TASK-07: Final validation and cleanup summary
- **Type:** IMPLEMENT
- **Deliverable:** updated plan evidence and scoped validation summary
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-dead-code-cleanup/plan.md`, `[readonly] apps/brikette/**`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% - only validation and summary remain
  - Approach: 88% - depends on prior task evidence quality
  - Impact: 88% - final documentation closes the loop for future audits
- **Acceptance:**
  - Brikette typecheck and lint results are recorded.
  - The plan shows final keep/delete dispositions for all March 10 findings.
  - CI-test follow-up is called out for the implementation branch.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter @apps/brikette typecheck` passes
  - TC-02: `pnpm --filter @apps/brikette lint` passes
  - TC-03: plan notes capture CI test follow-up requirement
- **Execution plan:** Red -> Green -> Refactor
  - Red: collect final deletion/retention list
  - Green: run scoped validation and record results
  - Refactor: None: documentation close-out only
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: close-out task
- **Edge Cases & Hardening:** if validation fails on unrelated pre-existing issues, record them separately and do not misattribute them to dead-code cleanup
- **What would make this >=90%:**
  - A green CI run on the cleanup branch
- **Rollout / rollback:**
  - Rollout: include summary in final cleanup PR/commit notes
  - Rollback: `None: summary task`
- **Documentation impact:**
  - Mark task statuses and final findings disposition in this plan
- **Notes / references:**
  - March 10 audit output and downstream task evidence

## Risks & Mitigations
- Risk: a seemingly unused file is consumed by a non-static path or operational script.
  - Mitigation: medium and low findings stay behind explicit verification tasks.
- Risk: hidden preview routes are intentional but undocumented.
  - Mitigation: TASK-04 and TASK-06 allow retention with a written intent note instead of forced deletion.
- Risk: future audits keep flagging `book-dorm-bed`.
  - Mitigation: record the keep decision here and update the audit tool later if repeated false positives become noisy.

## Observability
- Logging: None: deletion-only work
- Metrics: None: no runtime feature change
- Alerts/Dashboards: None: no production behavior change expected

## Acceptance Criteria (overall)
- [x] The two `_api-off` routes are removed.
- [ ] Every March 10 audit finding has a final disposition: deleted, retained intentionally, or confirmed false positive.
- [x] `book-dorm-bed` is documented as out of cleanup scope unless new evidence appears.
- [x] Brikette typecheck and lint pass for the implemented cleanup set.
- [ ] CI-only test follow-up is noted for the implementation branch.

## Decision Log
- 2026-03-10: Excluded `apps/brikette/src/app/[lang]/book-dorm-bed/page.tsx` from deletion scope because it is referenced by redirect generation, live funnel scripts, and routing comments that describe it as the canonical published booking route.
- 2026-03-10: Chose a ranked cleanup plan over bulk deletion because the audit already produced at least one false positive.
- 2026-03-10: Completed Wave 1 investigations and raised TASK-03 confidence from 82% to 88% using the written candidate matrix in `medium-confidence-findings.md`.
- 2026-03-10: Fixed the unrelated lint error in `apps/brikette/src/components/guides/RelatedGuides.tsx`, then discovered broader unrelated Brikette validation blockers in `book-private-accommodations/page.tsx`, `guide-seo/toc.ts`, `private-rooms/ApartmentPageContent.tsx`, and `useHowToGetHereContent.ts`.
- 2026-03-10: Cleared the Brikette validation gate for the implemented cleanup set; `pnpm --filter @apps/brikette typecheck` and `pnpm --filter @apps/brikette lint` now both pass.

## Overall-confidence Calculation
- Task confidence inputs:
  - TASK-01: 95 (S=1)
  - TASK-02: 80 (M=2)
  - TASK-03: 88 (M=2)
  - TASK-04: 90 (S=1)
  - TASK-05: 95 (S=1)
  - TASK-06: 82 (M=2)
  - TASK-07: 88 (S=1)
- Weighted result:
  - `(95*1 + 80*2 + 88*2 + 90*1 + 95*1 + 82*2 + 88*1) / 10 = 86.8`
  - Rounded plan `Overall-confidence`: 87%
