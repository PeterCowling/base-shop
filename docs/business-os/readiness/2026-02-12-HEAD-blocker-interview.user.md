---
Type: Readiness-Blocker-Interview
Status: Active
Business: HEAD
Date: 2026-02-12
Owner: Pete
Readiness-Source: docs/business-os/readiness/2026-02-12-idea-readiness.user.md
Plan-Source: docs/business-os/strategy/HEAD/plan.user.md
Seed-Source: docs/business-os/startup-baselines/HEAD-forecast-seed.user.md
---

# HEAD Blocker Interview Pack

## A) Blocker Summary

Current blockers are no longer app-mapping blockers. Remaining blockers are decision-quality blockers for HEAD execution:

1. Outcome contract not yet locked in canonical plan.
2. Baseline demand/conversion metrics not yet defined in working scorecard terms.
3. Operational confirmations (stock, pricing, compatibility, payments, returns SLA) incomplete.
4. Recalibration and weekly decision artifacts not started.

## B) Blocker-to-Question Table

| Blocker | Why it matters | Required question(s) | Acceptable evidence | Priority | Owner |
|---|---|---|---|---|---|
| Outcome contract missing in `plan.user.md` | Planning/build priorities cannot be objectively scored | What is the single active HEAD outcome contract (statement, baseline, target, deadline, owner, leading indicators, decision link)? | Updated `docs/business-os/strategy/HEAD/plan.user.md` with explicit outcome fields | critical | Pete |
| Demand/conversion baseline undefined | No clear go/no-go thresholds | What are week-1 minimum thresholds for sessions, CVR, paid CAC, and return rate? | Baseline table in `plan.user.md` and/or `HEAD-forecast-seed.user.md` | high | Pete |
| In-stock date and sellable units not confirmed | Spend and launch timing remain assumption-led | What exact date and unit count are launch-available? | Inventory snapshot note in `HEAD-forecast-seed.user.md` | critical | Pete |
| Price architecture not finalized | Contribution and CAC guardrails cannot be validated | What is launch price structure (single/bundle) and target contribution per order? | Price matrix in `HEAD-forecast-seed.user.md` | high | Pete |
| Compatibility matrix not finalized | High wrong-buy and return risk | Which processor families/models are confirmed supported at launch? | Compatibility table in site-upgrade brief and seed docs | critical | Pete |
| Payment stack and returns SLA unconfirmed | Checkout and trust risk at launch | Which payment methods are live day one and what is returns response SLA? | Checklist entry in seed + policy copy in strategy docs | high | Pete |
| Forecast recalibration artifact missing | No mechanism to update assumptions from live data | When will first recalibration run and what minimum sample thresholds apply? | `docs/business-os/strategy/HEAD/<date>-forecast-recalibration.user.md` | medium | Pete |
| Weekly K/P/C/S decision log missing | No recurring operating decision record | When is weekly decision cadence starting and who owns updates? | `docs/business-os/strategy/HEAD/<date>-weekly-kpcs-decision.user.md` | medium | Pete |

## C) Interview Script (Ordered)

1. Confirm active outcome contract fields exactly as they should appear in `plan.user.md`.
2. Confirm launch inventory facts: in-stock date and sellable units.
3. Confirm launch pricing architecture and contribution target assumptions.
4. Confirm compatibility matrix scope for day-one launch.
5. Confirm payment stack and returns SLA commitment.
6. Confirm week-1 baseline thresholds and week-2 recalibration criteria.
7. Confirm weekly K/P/C/S cadence start date and owner.

## D) Closure Checklist

| Item | Pass criteria |
|---|---|
| Outcome contract | `plan.user.md` has explicit outcome statement, baseline, target, by, owner, indicators, decision link |
| Inventory confirmation | Seed doc contains exact in-stock date and unit count |
| Price architecture | Seed doc contains single/bundle pricing and contribution assumptions |
| Compatibility | Launch compatibility matrix persisted in canonical doc |
| Payments + returns | Day-one methods and returns SLA documented |
| Recalibration | First forecast recalibration doc created with thresholds |
| Weekly decision | First weekly K/P/C/S decision doc created |

## E) Residual Risks After Closure

- If live CVR/CAC diverges materially from assumptions, recalibration may still force pivot.
- If returns spike despite compatibility clarity, product/fit iteration remains required.
