---
Type: Measurement-Plan
Stage: ASSESSMENT-07
Business: HEAD
Status: Draft
Created: 2026-02-21
Updated: 2026-02-21
Owner: Pete
Review-trigger: After each completed build cycle touching this document.
---

# Measurement Plan — HEAD (ASSESSMENT-07)

## A) Tracking Setup

| Field | Value |
|---|---|
| Primary tracking tool/method | GA4 (own-site sessions, CVR, funnel) + ad platform dashboards (paid CAC) + platform/checkout logs (payment success, returns) + Etsy dashboard (probe lane) |
| Setup feasibility | Conditional — tracking validation is a pre-launch dependency; paid spend is gated behind it |

## B) Key Metrics

| Metric | Capture method | Frequency |
|---|---|---|
| Sessions (all channels) | GA4 | Weekly |
| Sitewide CVR (7-day trailing) | GA4 (orders / sessions) | Weekly |
| Blended CAC (7-day trailing) | Ad platform spend / all orders | Weekly |
| Paid CAC (7-day trailing) | Ad platform spend / paid-attributed orders | Weekly |
| Payment success rate | Checkout / platform logs | Weekly |
| Return rate (30-day trailing) | Order management / manual log | Monthly |

## C) Success Thresholds

| Horizon | "Working" threshold | Reassessment trigger |
|---|---|---|
| 30 days | ≥500 sessions by week 4; CVR ≥1.4%; blended CAC ≤EUR 15 | CVR <0.9% after ≥500 sessions in a 7-day window → stop spend expansion; paid CAC > gross profit/order for 7 consecutive days → pivot to retargeting-only |
| 60–90 days | ≥110 net orders; ≥EUR 2,000 revenue; blended CAC ≤EUR 10; return rate <3% | Return rate ≥3% after ≥25 shipped orders → hold growth; payment success <97% after ≥100 attempts → pause traffic |

## D) Data Collection Feasibility

| Check | Status | Notes |
|---|---|---|
| GDPR/privacy compliance | ⚠️ Requires action | Italian DTC = EU GDPR in scope; GA4 requires consent mode + cookie banner before paid traffic launch |
| Tooling availability | ⚠️ Requires setup | GA4 property + ad platform conversion tracking must be validated pre-launch; Etsy dashboard available immediately |

## Sources

- `docs/business-os/contracts/HEAD/outcome-contract.user.md` (canonical guardrails — CAC and revenue targets revised at ASSESSMENT-07)
- `docs/business-os/startup-baselines/HEAD-channels.md`
- `docs/business-os/strategy/HEAD/distribution-plan.user.md`
