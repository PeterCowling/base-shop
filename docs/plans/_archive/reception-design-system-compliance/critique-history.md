# Critique History: reception-design-system-compliance

## Round 4 (Plan) — 2026-03-13

**Verdict:** credible — **lp-score: 4.5/5** — focused mode
**Schema mode:** Plan (Current)
**Recommended action:** proceed

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 4-01 | Minor | TASK-02 Affects list | `[readonly]` annotation on DraftReviewPanel was misleading — file IS edited (3 layout primitive fixes); removed annotation, replaced with plain-language note clarifying no raw button conversion needed |
| 4-02 | Minor | TASK-02 header / Task Summary / Deliverable / Active tasks | File count stated as "7 files" throughout but Affects list contained 8 entries (DraftReviewPanel is a legitimate edit target); corrected all instances to "8 files" |
| 4-03 | Moderate | Overall Acceptance Criteria (line 343) | ESLint 0-warning gate parenthetical said "(TASK-02 complete)" but TASK-03 eliminates 6 of the 14 warnings — gate only passes when both tasks complete; corrected to "(TASK-02 + TASK-03 complete)" |
| 4-04 | Minor | TASK-03 Validation contract TC-04 vs Acceptance criterion | File order in TC-04 differs from Acceptance criterion scoped eslint command — cosmetic only, substance identical; no change needed |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Major | ESLint count reconciliation — "42 warnings" annotation in eslint.config.mjs vs live count of 14 | Live lint run confirmed exactly 14 warnings (stale annotation acknowledged in plan); plan updated with confirmed per-file split (8 TASK-02, 6 TASK-03); Fact-Find Support section, Summary, Risks, and Rehearsal Trace all updated. Issue is fully resolved. |

### Issues Carried Open (not yet resolved)
None.

### Score Delta Note
Prior round: 3.5/5 (partially credible). This round: 4.5/5 (credible). Delta = +1.0 (exceeds 0.5 stability threshold). Justification: resolution of Major issue 3-01 (ESLint baseline discrepancy) is the primary driver — that issue imposed a "partially credible" verdict ceiling. Remaining Round 4 findings are 1 Moderate + 3 Minor, all fixed inline. No new Major or Critical issues.

## Round 3 (Plan) — 2026-03-13

**Verdict:** partially credible — **lp-score: 3.5/5** — inline route
**Schema mode:** Plan (Current)
**Recommended action:** revise and re-critique (two major issues fixed inline; recommend review before build)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | Summary / Fact-Find Support / Risks | ESLint warning count stated as 14; eslint.config.mjs:2469 annotation says "42 known warnings" — 3x discrepancy on the completion gate baseline; added reconciliation note and lint re-run instruction to TASK-02 |
| 3-02 | Major | TASK-03 execution plan / withIconModal | DS Button BASE_CLASSES includes `inline-flex` which conflicts with tile layout's `flex-col` in className; changed approach to `compatibilityMode="passthrough"` which bypasses BASE_CLASSES entirely; confirmed `compatibilityMode` IS a valid DS Button prop (`primitives/button.tsx:48`) — Round 2's claim it was absent was incorrect |
| 3-03 | Moderate | TASK-02 acceptance / ESLint command | `--rule` flag invocation does not suppress other rules; `grep "warning"` matches any warning, not just the target rule; fixed to use `pnpm --filter @apps/reception lint 2>&1 \| grep "enforce-layout-primitives"` |
| 3-04 | Moderate | TASK-03 / hub file variant selection | StockHub, EodHub, CashHub, AnalyticsHub button variants deferred to build time with no className evidence; added scout requirement to pre-commit variant from current className |
| 3-05 | Minor | TASK-01 TC-04 / acceptance criteria | TC-04 and acceptance criteria for KeycardDepositMenu/BookingTooltip were inconsistent — claimed 0 `style={{` results but both files legitimately retain JS-computed dynamic position inline styles; fixed acceptance criteria to grep for zIndex (the static portion) rather than the full style block, and scoped the overall acceptance criterion to exclude JS-computed dynamic position blocks |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| (none — no open issues from Round 2) | — | — | — |

### Conflict Notes This Round
- Round 2 critique-history.md issue 2-01 recorded `compatibilityMode` as "not in confirmed DS Button API" — this was incorrect. `primitives/button.tsx:48` confirms the prop exists as `ButtonCompatibilityMode = "default" | "passthrough"`. The plan's Round 3 execution plan now uses `compatibilityMode="passthrough"` for withIconModal, which is the safer approach regardless of whether Round 2's claim was accurate. The history entry is superseded by Round 3.

### Issues Carried Open (not yet resolved)
None. Issue 3-01 confirmed resolved in Round 4 — live lint count of 14 verified, per-task split confirmed correct.

## Round 2 (Analysis) — 2026-03-13

**Verdict:** credible — **lp-score: 4.5/5** — inline route (codemoot score null)
**Schema mode:** Analysis (Current)
**Recommended action:** proceed

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Minor | Approach detail / withIconModal | `compatibilityMode` prop not in confirmed DS Button API — replaced with `asChild`/`variant="ghost"` |
| 2-02 | Minor | Approach detail / Tooltip marginLeft | Open-ended "investigate" instruction replaced with decisive `ml-[100px]` resolution |
| 2-03 | Minor | Risks to Carry Forward | Tooltip risk row still described approach as unresolved — updated to reflect decided approach |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Minor | ESLint count may be stale | Carried as advisory; 0-warning gate remains valid regardless of starting count |
| 1-02 | Minor | withIconModal asChild advisory | Confirmed asChild/variant="ghost" are correct; unconfirmed compatibilityMode prop removed from analysis |
| 1-03 | Minor | Tooltip position advisory | Approach detail now explicitly states keep JS-computed values, remove only static zIndex |

### Issues Carried Open (not yet resolved)
None.

---

## Round 1 — 2026-03-13

**Verdict:** credible — **lp-score: 4.5/5** — inline route (codemoot score null)
**Schema mode:** Current
**Recommended action:** proceed

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Minor | Confidence Inputs / lint gate | ds/enforce-layout-primitives count cited from CI run — may be stale by build time; re-run lint before finalising task contracts |
| 1-02 | Minor | Planning Constraints | withIconModal HOC approach advisory — resolved now that DS Button has asChild; note in plan task |
| 1-03 | Minor | Risks | Tooltip inline position replacement advisory — may need JS-computed class string rather than pure Tailwind static class |

### Issues Confirmed Resolved This Round
None (Round 1)

### Issues Carried Open (not yet resolved)
None blocking.
