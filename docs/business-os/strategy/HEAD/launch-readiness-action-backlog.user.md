---
Type: Action-Backlog
Status: Active
Business: HEAD
Region: Italy
Created: 2026-02-11
Updated: 2026-02-20
Last-reviewed: 2026-02-20
Owner: Pete
Source: docs/business-os/startup-baselines/HEAD/S3-forecast/2026-02-20-lp-forecast.user.md
---

# HEAD Launch Readiness Action Backlog (Refresh 2026-02-20)

## Objective

Turn the refreshed HEAD offer/forecast/channel stack into execution tasks that protect safety, compliance boundaries, and contribution economics.

## P0 (Do Now, Before Scale)

| ID | Action | Why it matters | Acceptance criteria | Owner |
|---|---|---|---|---|
| HEAD-P0-01 | MVP SKU readiness for top-3 lane | core growth thesis depends on these products | multi-pack headbands, organiser pouch, patch packs each pass launch QA checklist | Product/Ops |
| HEAD-P0-02 | Daily KPI scoreboard with denominator checks | guardrails are unusable without daily and valid denominators | sessions, orders, CVR, CAC, returns, payment success tracked with denominator notes | Growth/Ops |
| HEAD-P0-03 | Checkout reliability + payment test pack | payment friction destroys early signal quality | >=20 successful end-to-end test orders across payment/device mix | Growth |
| HEAD-P0-04 | Contribution model by SKU and bundle | single-SKU assumptions hide unit-economics risk | SKU/bundle contribution table updated weekly | Finance/Ops |
| HEAD-P0-05 | Returns taxonomy and remediation loop | return spikes must be explainable by cause | 100% returns tagged; weekly top-3 reason remediation | Ops |

## P1 (Week 1-2, Offer/Conversion Levers)

| ID | Action | Why it matters | Acceptance criteria | Owner |
|---|---|---|---|---|
| HEAD-P1-01 | PDP clarity pass (fit/routine/bundle use-cases) | expectation mismatch drives returns | pages include sizing, fit guidance, routine scenarios, care notes | Growth |
| HEAD-P1-02 | Bundle test matrix (starter vs school vs single) | AOV and contribution hinge on bundle fit | 7-day bundle test with contribution-adjusted winner | Growth |
| HEAD-P1-03 | Creative velocity system | CAC control needs rapid iteration | >=10 assets/week; bottom quartile paused every 72h | Growth |
| HEAD-P1-04 | Constrained Etsy probe pack | validates secondary channel economics | live probe with tracked fee-adjusted contribution | Growth |
| HEAD-P1-05 | Inventory and promise protocol | avoid oversell and delivery misses | stock thresholds + traffic throttle when sellable units <14 days | Ops |

## P2 (Week 2-4, De-risk and Scale Readiness)

| ID | Action | Why it matters | Acceptance criteria | Owner |
|---|---|---|---|---|
| HEAD-P2-01 | Variance-aware gate logic in weekly review | small samples can mislead decisions | weekly memo includes denominator and confidence annotations | Growth |
| HEAD-P2-02 | Naming clearance decision lock | needed for final brand and channel consistency | one shortlisted coined name passes TM/domain gate or fallback selected | Pete |
| HEAD-P2-03 | Partner/community pilot | diversify beyond paid channels | 5 tracked referral tests live with attribution | Growth |
| HEAD-P2-04 | Tether safety/governance pre-work | required before high-risk retention lane launch | safety design brief + warning language + legal review checklist complete | Ops/Sourcing |

## Decision Triggers

- Trigger scale-up: all contract guardrails pass with valid denominators.
- Trigger hold/fix: any hard guardrail fails or denominator threshold not met.
- Trigger pivot: same hard guardrail fails 2 consecutive weekly cycles.

## Next Review

- Review date: 2026-02-27
- Required evidence package:
  - daily KPI export
  - gate pass/fail table
  - SKU/bundle contribution snapshot
  - active experiment register
  - naming-clearance status memo
