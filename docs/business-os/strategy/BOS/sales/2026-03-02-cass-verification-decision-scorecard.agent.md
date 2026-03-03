---
Type: Scorecard
Status: Active
Business: BOS
Created: 2026-03-02
Updated: 2026-03-02
Last-reviewed: 2026-03-02
Owner: Pete
Decision-Date: 2026-03-09
Priority: P1
---

# CASS Verification Decision Scorecard

## Objective

Measure whether CASS retrieval is creating enough value to justify current evidence-verification overhead, and decide on 2026-03-09 whether to keep full verification or move to risk-based verification.

## Decision Question (2026-03-09)

Should startup-loop skills continue full source-evidence verification for all CASS-derived claims, or switch to risk-based verification?

## Weekly Metrics (Track Daily, Review Weekly)

### A) CASS Benefit Metrics

| Metric | Definition | Target |
|---|---|---|
| Planning cycle time | Median time from fact-find start to plan-ready | >=15% faster vs pre-CASS baseline |
| Duplicate work avoided | Count of prior findings reused without re-audit | >=3 reused findings/week |
| Handoff continuity | Runs with explicit reuse of prior blockers/decisions | >=80% of runs |
| Rework rate | Tasks reopened after implementation | No increase vs pre-CASS baseline |

### B) Verification Value Metrics

| Metric | Definition | Target |
|---|---|---|
| Verified-claim rate | CASS-derived claims marked verified | >=85% |
| False-claim rate | CASS-derived claims later proven false | <=5% |
| High-impact false claims | False claims with medium/high impact | 0 |
| Would-be miss count | Claims that would have been accepted if verification were removed but were later disproven | 0 high-impact misses |

### C) Counterfactual Method (Required)

For each CASS-derived claim, record:
- `verification_status`: verified | partially_verified | not_verified | false
- `impact`: low | medium | high
- `would_pass_without_verification`: yes | no

This produces the "if we had skipped verification" evidence needed for decision quality.

## Weekly Log Template

| Week Start | Runs | Median Cycle Time (hrs) | Duplicate Work Avoided | Verified Claim Rate | False Claim Rate | High-Impact False Claims | Decision Signal |
|---|---:|---:|---:|---:|---:|---:|---|
| 2026-03-02 |  |  |  |  |  |  |  |

## Week 1 Execution Pack (2026-03-02 to 2026-03-09)

### Step 1: Gather CASS usage counts

```bash
WEEK_START=2026-03-02
WEEK_END=2026-03-09

rg -n "Type: Startup-Loop-CASS-Context|Generated:|Provider:" docs/plans \
  -g "*/artifacts/cass-context.md" -g "_tmp/cass-*.md"

rg -n "Provider: cass" docs/plans -g "*/artifacts/cass-context.md" -g "_tmp/cass-*.md" | wc -l
rg -n "Provider: fallback-rg" docs/plans -g "*/artifacts/cass-context.md" -g "_tmp/cass-*.md" | wc -l
```

### Step 2: Capture verification outcomes (manual but bounded)

For each startup-loop run this week, log claim counts in this format:

- `claims_total`
- `claims_verified`
- `claims_false`
- `claims_false_high_impact`
- `claims_would_pass_without_verification`

Recommended one-line log format (append per run):

```text
YYYY-MM-DD | <run-slug> | claims_total=<n> verified=<n> false=<n> false_high=<n> would_pass_without_verification=<n> duplicate_work_avoided=<n> cycle_time_hours=<n.n>
```

Store in:
- `docs/business-os/strategy/BOS/2026-03-02-cass-week1-log.agent.md`

### Step 3: Compute the scorecard row

Use:
- `Runs` = number of run lines in week1 log
- `Median Cycle Time` = median of `cycle_time_hours`
- `Duplicate Work Avoided` = sum of `duplicate_work_avoided`
- `Verified Claim Rate` = `claims_verified / claims_total`
- `False Claim Rate` = `claims_false / claims_total`
- `High-Impact False Claims` = sum of `claims_false_high_impact`

### Week 1 Row Template

| Week Start | Runs | Median Cycle Time (hrs) | Duplicate Work Avoided | Verified Claim Rate | False Claim Rate | High-Impact False Claims | Decision Signal |
|---|---:|---:|---:|---:|---:|---:|---|
| 2026-03-02 | <n> | <n.n> | <n> | <n%> | <n%> | <n> | <Keep Full Verification \| Move to Risk-Based \| Pause CASS> |

## Decision Gate (P1)

## P1 Idea: BOS-P1-CASS-VERIFY-DECISION-2026-03-09

- Priority: P1
- Owner: Pete
- Due date: 2026-03-09
- Required decision: choose one option below based on this scorecard evidence.

### Allowed Outcomes

1. **Keep Full Verification** (default)
   - Choose if any high-impact false claims exist, or false-claim rate >5%.
2. **Move to Risk-Based Verification**
   - Choose only if high-impact false claims = 0 and false-claim rate <=5%.
   - Scope: keep full verification for security, financial, and customer-facing critical paths.
3. **Pause CASS Usage**
   - Choose if CASS shows no measurable benefit and verification overhead is net negative.

## Current Recommendation (as of 2026-03-02)

Keep full verification until the 2026-03-09 decision gate is completed with at least one week of measured data.
