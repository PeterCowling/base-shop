# Critique History — brik-email-template-confidence-threshold

## Round 1 — Self-critique (2026-03-12)

**LP-Score: 4.1 / 5**

**Critical findings: 0**

**High findings: 0**

**Medium findings:**

1. The assumption that `data/email-templates.json` contains `reference_scope: "reference_required"` for `booking-issues` templates is not verified by reading the data file directly. This is a narrow remaining assumption that does not block planning — the fix (removing from `STRICT_REFERENCE_CATEGORIES`) is correct regardless of template data content.

2. The "suggest-but-wrong" scenario has no confirmed real production email as evidence — the operator audit described the symptom but the specific email was not replayed. Code analysis is sufficient to confirm the mechanism.

**Low findings:**

- `booking_context` is listed as a contributing factor. While it does not directly cause quality failures today, its wide trigger is a latent risk. This is noted and in scope for future tightening if needed.

**Summary:** Root cause analysis is well-evidenced from direct code inspection. Both bugs (single-question confidence floor gap and `booking-issues` in `STRICT_REFERENCE_CATEGORIES`) are confirmed with file paths and line numbers. Fix boundary is clearly bounded. No critical or high findings remain. Ready for planning.

## Round 2 — Analysis critique (2026-03-12)

**Target:** `docs/plans/brik-email-template-confidence-threshold/analysis.md`
**Score: 4.5 / 5**

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Minor | Planning Handoff / Chosen Approach | `candidates[0]` naming imprecision — actual variable is `policyCandidates[0]` (post-policy-constraint array) |
| 2-02 | Minor | Planning Handoff | Confidence comparison source unspecified — should be `policyCandidates[0].confidence`, not `rankResult.confidence` |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Medium | `data/email-templates.json` reference_scope assumption unverified | Noted as remaining assumption; does not block analysis; fix is correct regardless of data |
| 1-02 | Medium | No confirmed production email for "suggest-but-wrong" case | Code analysis is sufficient to confirm mechanism |

### Issues Carried Open

None — 2-01 and 2-02 were both fixed in this round via autofix.

**Summary:** Analysis is decision-grade. Both decisions have verified evidence, decisive recommendations, and non-strawman rejected alternatives. Two minor naming imprecisions fixed (Planning Handoff now uses `policyCandidates[0]` consistently). Status: Ready-for-planning.

## Round 3 — Plan critique Round 1 (2026-03-12)

**Target:** `docs/plans/brik-email-template-confidence-threshold/plan.md`
**Score: 4.0 / 5** (codemoot 8/10)

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | Engineering Coverage testing row | "3 new test cases" understated — plan defines 8 (TC-01-01–05, TC-02-01–03) |
| 3-02 | Major | TASK-01 Execution Plan Green step | Gate used `policyCandidates[0]` for hinted case instead of best hinted candidate via `reduce` — does not mirror `selectQuestionTemplateCandidate` |
| 3-03 | Major | TASK-02 Scouts / Risks | Framed `reference_scope: reference_required` in data as unresolved risk — actually already resolved: line 347–349 gates policy lookup with `continue` when `!bookingActionRequired` |

### Issues Confirmed Resolved This Round

All Round 3 issues resolved via inline autofix before Round 2.

### Issues Carried Open

None.

## Round 4 — Plan critique Round 2 (2026-03-12)

**Target:** `docs/plans/brik-email-template-confidence-threshold/plan.md`
**Score: 4.5 / 5** (codemoot 9/10)

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 4-01 | Major | TC-02-02 | Regression too weak: only asserts `missing_required_link` present; should also assert `missing_required_reference` for `booking_action_required = true` case (both enforcement paths must remain active) |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Major | Test count understated | Updated to 8 test cases with full TC IDs |
| 3-02 | Major | Gate picks wrong candidate for hinted case | Green step now uses `hintedCandidates.reduce()` mirroring `selectQuestionTemplateCandidate` exactly |
| 3-03 | Major | `reference_scope` data risk framed as unresolved | Resolved via code trace: `continue` at line 347–349 gates policy lookup; data file content is irrelevant when `!bookingActionRequired` |

### Issues Carried Open

4-01 fixed via inline autofix in same round.

**Summary:** Plan is credible (4.5/5). Both tasks have precise execution plans, correct TC contracts, confirmed entry points. No blocking findings remain. Status: Active, auto-build eligible.
