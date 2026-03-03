---
Type: Dry-Run
Status: Complete
Business: PET
Region: Italy
Created: 2026-02-11
Updated: 2026-02-11
Last-reviewed: 2026-02-11
Owner: Pete
Source-Forecast: docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md
Mode: synthetic-no-live-site
Review-trigger: After each completed build cycle touching this document.
---

# PET Week-2 Gate Review — Dry-Run (Synthetic)

## Purpose

Validate that the launch decision process is correctly configured and produces useful decisions before the website is launch-ready.

## Inputs Used (Synthetic)

Assumed 7-day trailing observed metrics:

| Metric | Dry-run value | Gate |
|---|---:|---:|
| CVR | 1.43% | >= 1.2% |
| Contribution/order (pre ads) | EUR 15.79 | baseline |
| Blended CAC | EUR 8.57 | <= 70% of contribution/order (<= EUR 11.05) |
| Refund rate | 5.5% | <= 8% |
| On-time ship rate | 92.0% | >= 95% |
| Payment success rate | 98.1% | >= 97% |

## Gate Evaluation

| Gate | Result | Notes |
|---|---|---|
| CVR >= 1.2% | PASS | Demand conversion acceptable |
| CAC <= 70% of contribution/order | PASS | Acquisition efficiency acceptable |
| Refund <= 8% | PASS | Return burden controlled |
| On-time ship >= 95% | **FAIL** | Fulfillment execution below threshold |
| Payment success >= 97% | PASS | Checkout reliability acceptable |

Decision rule outcome:
- **NO-GO (scale hold)** because one mandatory gate failed.
- Prescribed action from v2 process: **fix-first mode** (hold cold scale, keep retargeting, run shipping trust + ops fixes, re-test next 7 days).

## Quality Check — Is This Setup Right and Valuable?

### Rubric

| Dimension | Score (0-5) | Why |
|---|---:|---|
| Deterministic decisioning | 5.0 | Hard numeric gates produce repeatable pass/fail outcomes |
| Actionability | 4.5 | Explicit fallback mode is defined when any gate fails |
| Margin protection | 4.5 | CAC threshold tied to contribution prevents false-positive scale |
| Operational risk capture | 5.0 | Shipping SLA gate blocks unsafe scaling despite good demand metrics |
| Data burden realism | 3.5 | Requires reliable daily instrumentation not yet proven live |
| Anti-vanity bias | 5.0 | Avoids scaling from top-line metrics alone |

Weighted quality score:
- **4.6 / 5.0 (92%)**

### Value Demonstrated by This Dry-Run

- Without this gate system, the team would likely scale (CVR/CAC look good).
- The process correctly blocks scale due to a fulfillment reliability failure (92% vs required 95%).
- This is exactly the intended behavior: preserve trust and contribution before expansion.

## Gaps Found in the Process Setup

1. Minimum sample-size rule coverage was missing at review time. **Resolved** in `docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md`.
2. No explicit confidence interval/variance handling is defined for low-volume weeks. **Open**.
3. Failed-gate owner/SLA assignment was missing at review time. **Resolved** in `docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md`.

## Patch Recommendations (Process-Level)

1. Add minimum denominator rules:
   - CVR gate valid only if `sessions >= 500` and `orders >= 10`.
   - Refund gate valid only if `orders_shipped >= 25`.
2. Add gate ownership:
   - Demand gates: growth owner.
   - Ops gates: fulfillment owner.
3. Add a re-test SLA:
   - after fail, re-test within 7 days with explicit recovery target.

## Conclusion

This process is configured well enough to add real decision value in pre-launch dry-runs. After same-day patches, only variance/confidence handling remains open before live scaling decisions.
