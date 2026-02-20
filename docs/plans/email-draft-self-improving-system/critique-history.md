Type: Reference
Status: Active

# Critique History: email-draft-self-improving-system

## Round 1 — 2026-02-20

### Issues Opened This Round

| ID | Severity | Target | Plan location | Summary |
|---|---|---|---|---|
| 1-01 | Major | TASK-05 Notes | plan.md lines 445–447 (pre-fix) | Contradictory delta tables: 5-value first bullet coexisted with correct 7-value third bullet (Fix 3 regression — old bullet not removed) |
| 1-02 | Major | TASK-05 Green step | plan.md line 430 (pre-fix) | `buildCandidate()` has no priors parameter (source: template-ranker.ts lines 197–201); plan said to compute adjusted values there — architecturally impossible |
| 1-03 | Major | TASK-05 Acceptance + Green | plan.md lines 415, 430 (pre-fix) | `applyThresholds()` at template-ranker.ts:231 reads `candidates[0].confidence` (raw); plan never instructed updating this line; `adjustedConfidence` was a silent no-op |
| 1-04 | Major | TASK-05/TASK-02 Notes | plan.md lines 233, 445–447 (pre-fix) | Delta table referenced `accepted`, `light-edit`, `heavy-rewrite` — not present in `rewrite_reason` enum; `draft_ranker_calibrate` could not map event values to deltas |
| 1-05 | Moderate | TASK-04 TC-01 + Decision Log | plan.md lines 355, 592 (pre-fix) | TC-01 said "since last generation timestamp"; Decision Log line 592 used same phrasing — both contradicted composite-key dedup in TASK-04 Green step |
| 1-06 | Moderate | TASK-05 | plan.md line 318 (source) | `index.search(query, limit)` pre-filters to DEFAULT_LIMIT=3 before priors apply; priors cannot promote templates outside BM25 top-3; unacknowledged in plan |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved | Plan location (post-fix) |
|---|---|---|---|---|
| 1-01 | Major | Contradictory delta tables | TASK-05 full section rewrite; 5-value first bullet removed; single 7-value table retained with `none` replacing `accepted` | plan.md lines 445–447 (post-fix) |
| 1-02 | Major | `buildCandidate()` no priors parameter | TASK-05 full section rewrite; Green step (2) revised: priors applied in `rankTemplates()` after `buildCandidate()` returns; interface extension documented in Affects | plan.md lines 395–398, 431 (post-fix) |
| 1-03 | Major | `applyThresholds()` not updated | TASK-05 full section rewrite; Acceptance bullet and Green step (2) now explicitly name `applyThresholds()` line 231 change: `adjustedConfidence ?? confidence` | plan.md lines 416, 431 (post-fix) |
| 1-04 | Major | Delta table/enum mismatch | TASK-02 Notes point fix: enum expanded to include `light-edit` and `heavy-rewrite`; TASK-05 Notes `accepted` replaced with `none` throughout | plan.md lines 233, 446 (post-fix) |
| 1-05 | Moderate | "since last generation timestamp" in TC-01 and Decision Log | TASK-04 TC-01 point fix (plan.md line 355) + Decision Log point fix (plan.md line 592); both now describe composite-key dedup | plan.md lines 355, 592 (post-fix) |

### Issues Carried Open

| Prior ID | Severity | Rounds Open | Summary | Closure criterion |
|---|---|---|---|---|
| 1-06 | Moderate | 1 | `index.search(query, limit)` pre-filters to DEFAULT_LIMIT=3 (template-ranker.ts:318); priors can only reorder within BM25 top-3; plan does not acknowledge this boundary | Resolved when plan adds an explicit note in TASK-05 Edge Cases or Planning Validation stating the DEFAULT_LIMIT=3 constraint and confirming priors-within-top-N behaviour is acceptable |

### Round Scorecard

**Scoring dimensions and weights:**

| Dimension | Weight | Score | Justification |
|---|---|---|---|
| Evidence quality | 0.25 | 3.5 | Planning validation reads source correctly; delta table schema inconsistency undermined evidence credibility pre-fix |
| Coherence | 0.20 | 2.5 | Two coexisting delta tables, enum/table mismatch, plan description contradicted source signature |
| Completeness | 0.15 | 3.5 | All structural sections present; TemplateCandidate interface extension absent from Affects and execution plan pre-fix |
| Feasibility | 0.15 | 2.5 | `buildCandidate()` approach architecturally impossible as written for fourth round running |
| Measurability | 0.10 | 3.5 | TCs present; TC-01 TASK-04 wrong; TC-03 TASK-05 referenced non-enum value |
| Risk handling | 0.15 | 4.0 | Risk table comprehensive; `applyThresholds()` silent no-op risk absent |

**Overall (raw):** (0.25×3.5) + (0.20×2.5) + (0.15×3.5) + (0.15×2.5) + (0.10×3.5) + (0.15×4.0) = 0.875 + 0.500 + 0.525 + 0.375 + 0.350 + 0.600 = **3.225 → rounded to 3.0 / 5.0**

**Prior score:** N/A (first recorded round)
**Delta:** N/A
**Verdict:** Partially credible
**Status after autofix:** Issues 1-01 through 1-05 resolved by autofix in this round. Issue 1-06 carried open.
