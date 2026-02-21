---
Type: Readiness-Blocker-Interview
Status: Active
Business: PET
Date: 2026-02-12
Owner: Pete
Readiness-Source: docs/business-os/readiness/2026-02-12-idea-readiness.user.md
Plan-Source: docs/business-os/strategy/PET/plan.user.md
Seed-Source: docs/business-os/startup-baselines/PET-forecast-seed.user.md
---

# PET Blocker Interview Pack

## A) Blocker Summary

App-mapping blocker is cleared for active scope. Remaining PET blockers are decision-quality blockers:

1. Outcome contract not yet locked in canonical plan.
2. Demand/margin baseline metrics not yet defined for weekly decisioning.
3. Inventory, cost, pricing, and reliability confirmations are incomplete.
4. Recalibration and weekly decision artifacts not started.

## B) Blocker-to-Question Table

| Blocker | Why it matters | Required question(s) | Acceptable evidence | Priority | Owner |
|---|---|---|---|---|---|
| Outcome contract missing in `plan.user.md` | PET work cannot be prioritized against explicit commercial target | What is the one active PET outcome contract (statement, baseline, target, deadline, owner, indicators, decision link)? | Updated `docs/business-os/strategy/PET/plan.user.md` with outcome fields | critical | Pete |
| Demand/margin baseline undefined | No objective scale/hold criteria | What are week-1 baseline thresholds for sessions, CVR, CAC, contribution/order, and return rate? | Baseline metrics section in `plan.user.md` and/or seed doc | high | Pete |
| Exact inventory/arrival not confirmed | Forecast remains assumption-heavy | What exact first sellable date and unit count are confirmed? | Updated `PET-forecast-seed.user.md` inventory section | critical | Pete |
| Launch pricing and bundle architecture not finalized | Contribution guardrails and CAC ceiling cannot be locked | What are single, bundle, and shipping-threshold launch prices? | Price table in seed doc | critical | Pete |
| Hardware/closure reliability criteria not defined | Early negative feedback loop risk | What pass/fail durability criteria must SKU1 meet before spend expansion? | Durability criteria checklist in seed/strategy docs | high | Pete |
| Payment stack and returns SLA unconfirmed | Conversion and trust risk | Which payment methods are live day one and what returns SLA will be promised? | Policy + ops checklist entries in strategy docs | high | Pete |
| Forecast recalibration artifact missing | No structured update from observed data | When is first recalibration run and what minimum sample thresholds apply? | `docs/business-os/strategy/PET/<date>-forecast-recalibration.user.md` | medium | Pete |
| Weekly K/P/C/S decision log missing | No recurring decision loop evidence | When does weekly cadence start and who owns publication? | `docs/business-os/strategy/PET/<date>-weekly-kpcs-decision.user.md` | medium | Pete |

## C) Interview Script (Ordered)

1. Lock PET outcome contract for current cycle in canonical plan terms.
2. Confirm inventory facts: exact first sellable date and units.
3. Confirm pricing architecture: single, bundle, and shipping threshold logic.
4. Confirm durability/reliability pass criteria for product 1.
5. Confirm day-one payment stack and returns SLA.
6. Confirm baseline weekly thresholds and first recalibration checkpoint.
7. Confirm weekly K/P/C/S publication cadence and owner.

## D) Closure Checklist

| Item | Pass criteria |
|---|---|
| Outcome contract | `plan.user.md` contains full outcome contract fields |
| Inventory facts | Seed doc includes exact date + unit count |
| Pricing architecture | Seed doc includes single + bundle + threshold pricing |
| Reliability criteria | Durability/closure pass criteria are documented |
| Payments + returns | Day-one methods and SLA are documented |
| Recalibration | First PET forecast recalibration doc is created |
| Weekly decision | First PET weekly K/P/C/S decision doc is created |

## E) Residual Risks After Closure

- Channel economics may still shift quickly after launch, requiring rapid recalibration.
- Reliability failures can still emerge at small scale and need fast mitigation.
