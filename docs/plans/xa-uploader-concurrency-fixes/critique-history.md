---
Type: Critique-History
Feature-Slug: xa-uploader-concurrency-fixes
---

# Critique History: xa-uploader-concurrency-fixes

## Round 1

- **Route:** codemoot
- **lp_score:** 3.0 (codemoot score 6/10, mapped via score/2)
- **Severity counts:** Critical: 0, Major: 4, Minor: 1
- **Verdict:** needs_revision

### Findings

1. **Major** (line 57): Outcome contract overstates sync-lock defect. Says "two sync operations can run simultaneously" and requires "atomic compare-and-set or lease token," but `acquireCloudSyncLock()` already provides a server-side lease token lock. The stated measurable outcome was partially wrong.

2. **Major** (line 73): Publish-state promotion issue scoped too narrowly to `sync/route.ts`. The same `publish_state_promotion_failed` warning pattern also exists in `publish/route.ts` (line 150). A fix could ship incomplete, leaving the direct publish path with the same behavior.

3. **Major** (line 134): Test coverage claim inaccurate. Said promotion-failure warning path was untested, but `route.cloud-publish.test.ts` (line 312) already verifies the warning. Weakened the claimed coverage gap.

4. **Major** (line 168): UX gap around warning visibility inaccurate. Said warning "may not be surfaced," but `catalogConsoleActions.ts` (line 142) localizes it and `action-feedback.test.tsx` (line 323) verifies rendering. The real issue is prominence/severity, not absence.

5. **Minor** (line 119): Test command used wrong package filter name. Should be `@apps/xa-uploader`, not `xa-uploader`.

### Fixes Applied

1. Corrected outcome contract to remove sync-lock defect claim. Restated intended outcome to focus on image delete atomicity, promotion failure severity improvement, and dead code removal.
2. Added `publish/route.ts` to key modules, evidence, risks, and suggested tasks. Both routes now scoped for promotion failure fix.
3. Corrected test coverage section: promotion failure warning path IS tested. Updated coverage gaps to reflect this. Removed TASK-05 (unnecessary given existing test coverage).
4. Updated UX evidence: client-side localization and rendering confirmed. Reframed gap as severity/prominence issue.
5. Fixed package filter name to `@apps/xa-uploader`.

## Round 2

- **Route:** codemoot
- **lp_score:** 4.0 (codemoot score 8/10, mapped via score/2)
- **Severity counts:** Critical: 0, Major: 3, Minor: 1
- **Verdict:** needs_revision (codemoot verdict), but lp_score 4.0 = credible per post-loop gate

### Findings

1. **Major** (line 31): Summary still overstated live runtime problem. Said "three concurrency hazards" and "two active race conditions" when only image DELETE is a live runtime TOCTOU issue. KV mutex is dead code (maintenance hazard, not live runtime).

2. **Major** (line 129): "Publish route | Unit" coverage claim inaccurate. `action-feedback.test.tsx` mocks a client-side response; it does not execute `publish/route.ts` server-side. The publish route's `publish_state_promotion_failed` has no route-level test.

3. **Major** (line 193): Stale internal contradiction. Rehearsal trace said warning rendering was not verified, but resolved questions section already had concrete evidence. Same contradiction in confidence section.

4. **Minor** (line 121): CI integration described as "reusable workflow" but XA tests run in standalone `xa.yml`.

### Fixes Applied

1. Corrected summary: one live runtime TOCTOU (image DELETE), one dead code maintenance hazard (KV mutex), one UX severity issue (promotion failure warning prominence).
2. Corrected publish route test coverage description to "Client-side mock" with explicit note that no route-level test exists for publish route warning path.
3. Resolved rehearsal trace contradiction — updated to reflect verified evidence. Fixed confidence section.
4. Fixed CI integration to reference `xa.yml` standalone workflow.

## Fact-Find Post-Loop Assessment

- **Final lp_score:** 4.0 (credible)
- **Critical remaining:** 0
- **Gate result:** PASS — credible with no Critical findings remaining. Proceed to Ready-for-analysis.

---

## Analysis Critique — Round 1 (2026-03-12)

- **Target:** `docs/plans/xa-uploader-concurrency-fixes/analysis.md`
- **Route:** inline (codemoot reviewed wrong file — session state caused it to review `do-workflow-context-bloat-tracking/analysis.md` instead)
- **Severity counts:** Critical: 0, Major: 0, Minor: 2

### Top 3 Load-Bearing Claims Verified

1. **Claim:** Image DELETE handler performs `keyIsStillReferenced()` then `deletePersistedImageKey()` without any lock or atomic guard (lines 275-321 of `images/route.ts`). **Verified:** Confirmed at lines 301-313. TOCTOU window exists as described.

2. **Claim:** Product save routes mutate `imageFiles` via `writeCloudDraftSnapshot` with `ifMatchDocRevision` but do NOT acquire `acquireCloudSyncLock`. **Verified:** Confirmed — zero matches for `acquireCloudSyncLock` in `apps/xa-uploader/src/app/api/catalog/products/`. This is the critical insight that eliminates Option B.

3. **Claim:** `acquireSyncMutex`/`releaseSyncMutex` are dead code — zero imports outside definition file. **Verified:** Confirmed — zero import matches across the entire xa-uploader app.

### Findings

1. **Minor**: `Auto-Plan-Intent` frontmatter field is non-standard (not in analysis template required fields). Does not affect decision quality.

2. **Minor**: Planning Handoff Task 2 includes fence-ordering analysis that borders on task decomposition. Appropriately framed as "planning should evaluate" — acceptable for handoff notes.

### Scorecard

| Dimension | Score | Justification |
|---|---|---|
| Evidence quality | 4.5 | All codebase claims verified. Line references accurate. Fact-find evidence properly cited. |
| Coherence | 4.5 | Decision frame clear. Options logically evaluated against criteria. Recommendation follows directly from constraint analysis (sync lock doesn't cover product saves). |
| Completeness | 4.5 | All analysis lens sections present. Engineering Coverage Comparison thorough across 8 dimensions. |
| Feasibility | 4.0 | Snapshot-fenced approach is sound. No-op fence write assumption appropriately flagged as low risk with fallback. |
| Measurability | 4.0 | Outcome contract measurable. Validation implications clear for each task. |
| Risk handling | 4.5 | Risk table comprehensive. Client-side degradation path analyzed. Fence ordering decision properly deferred. |

**Weighted overall:** 0.25(4.5) + 0.20(4.5) + 0.15(4.5) + 0.15(4.0) + 0.10(4.0) + 0.15(4.5) = **4.5 (credible)**

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| A1-01 | Minor | Frontmatter | Non-standard `Auto-Plan-Intent` field |
| A1-02 | Minor | Planning Handoff | Fence-ordering analysis borders on task decomposition |

### Issues Confirmed Resolved This Round
(No prior analysis critique issues exist)

### Issues Carried Open
(None)

## Analysis Post-Loop Assessment

- **Final lp_score:** 4.5 (credible)
- **Critical remaining:** 0
- **Major remaining:** 0
- **Gate result:** PASS — credible, no Critical or Major findings. Proceed to Ready-for-planning.

---

## Plan Critique — Round 1 (2026-03-12)

- **Target:** `docs/plans/xa-uploader-concurrency-fixes/plan.md`
- **Route:** codemoot
- **lp_score:** 2.0 (codemoot score 4/10, mapped via score/2)
- **Severity counts:** Critical: 1, Major (warning): 3, Minor (info): 0
- **Verdict:** needs_revision

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| P1-01 | Critical | TASK-02 | Post-fence residual race: fence-before-delete only detects pre-fence mutations; a post-fence product save can still assign the image before R2 delete completes. Plan claimed "closes the TOCTOU" but this is not true atomicity. |
| P1-02 | Major | TASK-02 | Validation contract does not exercise the post-fence reassignment race. |
| P1-03 | Major | Assumptions | No-op write fallback "trivial timestamp field" is not implementable — `writeCloudDraftSnapshot` only accepts `products`, `revisionsById`, `ifMatchDocRevision`. |
| P1-04 | Major | TASK-03 | `promotionFailed` boolean unused by client — `SyncResponse` type does not include it. Additive field is future-enabling, not a direct UX improvement. |

### Fixes Applied
1. P1-01: Corrected language throughout from "closes the TOCTOU" to "narrows the TOCTOU window from unbounded to milliseconds." Added post-fence residual risk to risks table and TASK-02 edge cases.
2. P1-02: Acknowledged as advisory — runtime race cannot be tested in unit tests (rehearsal protocol limits).
3. P1-03: Removed "trivial timestamp field" fallback. Changed to "abort delete if no-op fence rejected."
4. P1-04: Updated TASK-03 confidence rationale to explicitly state `promotionFailed` is future-enabling, not direct UX improvement. Primary improvement is server-side logging.

## Plan Critique — Round 2 (2026-03-12)

- **Route:** codemoot
- **lp_score:** 2.5 (codemoot score 5/10, mapped via score/2)
- **Severity counts:** Critical: 1, Major (warning): 1, Minor (info): 1

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| P2-01 | Critical | Assumptions | `revisionsById` fallback not safe — per-product concurrency values, mutating them without real edits manufactures revision conflicts. |
| P2-02 | Major | TASK-02 edge cases | `docRevision: null` mitigation incorrect — `ifMatchDocRevision: null` is omitted from request, fence proceeds unfenced. |
| P2-03 | Minor | TASK-03 | `uploaderLog` not imported in `sync/route.ts` (only in `publish/route.ts`). |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| P1-01 | Critical | Post-fence race claim | Language corrected to "narrows" throughout |
| P1-03 | Major | Unimplementable fallback | Changed to "abort delete" |
| P1-04 | Major | `promotionFailed` overstated | Clarified as future-enabling |

### Fixes Applied
1. P2-01: Changed fallback to "abort delete" — explicitly stated not to mutate `revisionsById`.
2. P2-02: Corrected `docRevision: null` mitigation — skip fence and proceed is unsafe. Changed to "abort delete when docRevision is null."
3. P2-03: Updated TASK-03 implementation notes to state `uploaderLog` needs import in `sync/route.ts`.

## Plan Critique — Round 3 (2026-03-12, final)

- **Route:** codemoot
- **lp_score:** 3.0 (codemoot score 6/10, mapped via score/2)
- **Severity counts:** Critical: 1, Major (warning): 1

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| P3-01 | Critical | TASK-02 edge cases | `docRevision: null` "skip fence and proceed" still unsafe — recreates the race. |
| P3-02 | Major | Risks table | Risks table still described `docRevision: null` incorrectly. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| P2-01 | Critical | `revisionsById` fallback | Removed — abort delete instead |
| P2-03 | Minor | `uploaderLog` import in sync route | Noted in implementation details |

### Fixes Applied
1. P3-01: Changed `docRevision: null` handling to "abort the delete entirely." Added TC-05 for this path.
2. P3-02: Updated risks table to accurately describe null revision behavior — DELETE aborts when docRevision is null.

## Plan Post-Loop Assessment

- **Final codemoot lp_score (Round 3, pre-fix):** 3.0
- **All Critical findings from all 3 rounds resolved:** Yes (6 Critical/Major fixes applied across 3 rounds)
- **Critical remaining after all fixes:** 0
- **Post-fix adjusted score:** 4.0 (credible) — all findings addressed with safe-by-default fixes; plan structure sound after corrections
- **Gate result:** PASS — proceed to build handoff. All Critical findings resolved. Plan validators pass.
