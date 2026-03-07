# Critique History — ideas-keyword-calibration-feedback-loop

## Fact-Find Critique

### Round 1 (codemoot)
- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Findings:** 5 Major, 1 Minor
  - Major: Keyword count stated as 41, actual is 38
  - Major: Outcome Contract stated "42+ terms" — inconsistent
  - Major: "125+ dispatches" overcounted — actual terminal = 109
  - Major: `processed_by.route` does not capture routing corrections — records process mode only
  - Major: Test command conflicts with CI-only testing policy
  - Minor: Idempotency/dedup strategy for repeated calibration not specified
- **Action:** Fixed all 6 findings — corrected keyword count to 38, dispatch count to 109, clarified processed_by.route semantics, updated test infra description, added dedup strategy to risk mitigation

### Round 2 (codemoot)
- **Score:** 8/10 → lp_score 4.0
- **Verdict:** needs_revision (advisory — score above credible threshold)
- **Findings:** 3 Major, 0 Critical
  - Major: CI governed-runner coverage overstated
  - Major: One remaining "41 keywords" reference in Q&A section
  - Major: Class imbalance (108 completed vs 1 skipped) weakly justified as sufficient
- **Action:** Fixed all 3 — corrected CI description, fixed stale 41→38 reference, added class imbalance risk with V1 mitigation strategy (absence-of-completion as secondary negative signal)

### Final Verdict (Fact-Find)
- **Score:** 4.0/5.0 (credible)
- **Rounds:** 2
- **Status:** Ready-for-planning

## Plan Critique

### Round 1 (codemoot)
- **Score:** 6/10 → lp_score 3.0
- **Verdict:** needs_revision
- **Findings:** 1 Critical, 3 Major, 1 Minor
  - Critical: Calibration signal not representative — all 108 completed dispatches went through fact-find, zero briefing completions, so lifecycle outcome cannot calibrate the fact-find vs briefing boundary
  - Major: Feature mismatch — calibration uses area_anchor but runtime uses changed_sections
  - Major: Stale-enqueued as negative signal conflates queue throughput with routing quality
  - Major: Including operator_idea dispatches contaminates keyword calibration signal
  - Minor: SELF_TRIGGER_PROCESSES is defense-in-depth only for this script
- **Action:** Reframed calibration objective (keyword effectiveness, not boundary correctness); narrowed to artifact_delta only; removed stale-enqueued signal; added feature proxy validation

### Round 2 (codemoot)
- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Findings:** 1 Critical, 1 Major, 1 Minor
  - Critical: Scoring math cannot change routing — base 1.0 - max 0.3 = 0.7, still above 0.6 threshold
  - Major: area_anchor vs changed_sections mismatch still flagged
  - Minor: SELF_TRIGGER_PROCESSES defense-in-depth
- **Action:** Fixed base score from 1.0 to 0.75 (so delta -30 → 0.45, below threshold); updated all TC contracts; added explicit proxy validation rationale

### Round 3 (codemoot, final)
- **Score:** 8/10 → lp_score 4.0
- **Verdict:** needs_revision (advisory — score credible)
- **Findings:** 0 Critical, 3 Major, 1 Minor
  - Major: area_anchor vs changed_sections (acknowledged as proxy — adequate for aggregate calibration)
  - Major: "demotes unused" wording inaccurate — unused keywords keep base score
  - Major: T1_SEMANTIC_KEYWORDS consumer tracing inaccurate
  - Minor: SELF_TRIGGER_PROCESSES defense-in-depth
- **Action:** Fixed assumption wording, corrected consumer tracing

### Final Verdict (Plan)
- **Score:** 4.0/5.0 (credible)
- **Rounds:** 3
- **Status:** Active
