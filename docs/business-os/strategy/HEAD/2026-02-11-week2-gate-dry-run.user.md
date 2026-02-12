---
Type: Dry-Run
Status: Complete
Business: HEAD
Region: TBD
Created: 2026-02-11
Updated: 2026-02-11
Last-reviewed: 2026-02-11
Owner: Pete
Source-Forecast: docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v1.user.md
Mode: synthetic-no-live-site
---

# HEAD Week-2 Gate Review — Dry-Run (Synthetic)

## Purpose

Validate that the HEAD launch decision process is configured correctly and adds decision value before the website is launch-ready.

## Inputs Used (Synthetic)

Assumed 7-day trailing observed metrics:

| Metric | Dry-run value | Gate |
|---|---:|---:|
| CVR | 1.24% | >= 1.1% |
| Contribution/order (pre ads) | EUR 11.20 | baseline |
| Blended CAC | EUR 8.10 | <= 75% of contribution/order (<= EUR 8.40) |
| Refund rate | 10.4% | <= 9% |
| On-time ship rate | 96.3% | >= 95% |
| Payment success rate | 97.6% | >= 97% |

## Gate Evaluation

| Gate | Result | Notes |
|---|---|---|
| CVR >= 1.1% | PASS | conversion is acceptable |
| CAC <= 75% of contribution/order | PASS | efficiency within threshold |
| Refund <= 9% | **FAIL** | return burden too high |
| On-time ship >= 95% | PASS | fulfillment reliability acceptable |
| Payment success >= 97% | PASS | checkout reliability acceptable |

Decision rule outcome:

- **NO-GO (scale hold)** because one mandatory gate failed.
- Prescribed action: fix-first mode (hold cold scaling, keep retargeting, fix fit/comfort and expectation mismatch, re-test in 7 days).

## Quality Check — Is This Setup Right and Valuable?

### Rubric

| Dimension | Score (0-5) | Why |
|---|---:|---|
| Deterministic decisioning | 5.0 | hard gates create repeatable outcomes |
| Actionability | 4.5 | direct fallback mode is defined |
| Margin protection | 4.5 | CAC is tied to contribution capacity |
| Product-market signal quality | 4.0 | refund gate exposes fit/value mismatch early |
| Data burden realism | 3.5 | requires disciplined instrumentation cadence |
| Anti-vanity bias | 5.0 | avoids scaling on sessions alone |

Weighted quality score:

- **4.4 / 5.0 (88%)**

### Value Demonstrated by This Dry-Run

- Topline funnel metrics look passable, but refund burden blocks safe scaling.
- The gate system catches this and forces corrective action before spend expansion.
- This prevents avoidable CAC burn while core offer clarity is still unstable.

## Gaps Found in Process Setup

1. Region/tax model is still assumption-led and not locked. **Open**.
2. No explicit statistical confidence treatment yet for small weekly samples. **Open**.
3. Owner map and remediation SLA now exist in forecast v1. **Resolved**.

## Recommended Next Actions

1. Run a fit/comfort expectation audit on PDP and ad creative.
2. Add return-reason tags and require weekly root-cause review.
3. Re-run week-2 gate pack with updated funnel and returns data.

## Conclusion

The process is useful and materially protective, but currently constrained by unresolved region/tax assumptions and missing variance-aware evaluation.
