---
Type: Business-Plan
Status: Active
Business: HEAD
Created: 2026-02-11
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
---

# Headband — Business Plan

## Strategy

### Current Focus (2026-02-12)

1. **Active Outcome Contract (Locked)** (Priority: High)
   - Outcome-ID: `HEAD-OUT-2026Q1-01`
   - Outcome: Achieve first reliable direct sales for HEAD in Italy, then stabilize weekly sales with controlled CAC and returns.
   - Baseline (2026-02-12): orders 0, net revenue EUR 0, blended CAC unmeasured, returns unmeasured.
   - Target by 2026-05-13: 110 net orders, EUR 3,000 net revenue.
   - CAC guardrail: blended CAC <= EUR 13 by day 60; hard ceiling <= EUR 15 through day 90.
   - Owner: Pete
   - Decision Link: `DEC-HEAD-01` (scale paid expansion vs hold and fix).

2. **Offer Definition** (Priority: High)
   - Status: Product proposition and differentiation are not yet finalized.
   - Next: Finalize offer statement and attach testable customer-value claims.
   - Artifact: `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md`
   - Exec Summary: `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2-exec-summary.user.md`

3. **Launch Signal Design** (Priority: Medium)
   - Status: Baseline is now defined, but most signals are still week-0 and need measured values.
   - Next: Run weekly scorecard and enforce kill/pivot thresholds without exception.
   - Dry-run Evidence: `docs/business-os/strategy/HEAD/2026-02-11-week2-gate-dry-run.user.md`
   - Action Backlog: `docs/business-os/strategy/HEAD/launch-readiness-action-backlog.user.md`

### 90-Day Outcome Contract (Frozen on 2026-02-12)

- Sales target: 110 net orders and EUR 3,000 net revenue by 2026-05-13.
- CAC guardrail: blended CAC <= EUR 13 (day-60 target), hard ceiling <= EUR 15 (day-90 max), and paid CAC must remain <= observed gross profit per order.

#### Weekly leading indicators

| Indicator | Definition | Weekly guardrail |
|---|---|---|
| Sessions (all channels) | Total tracked sessions | >=500 sessions by week 4 |
| Sitewide CVR (7-day trailing) | Orders / sessions | >=1.4% target; 0.9% floor |
| Paid CAC (7-day trailing) | Paid spend / paid orders | <=EUR 25 by week 6; <= gross profit/order always |
| Blended CAC (7-day trailing) | Paid spend / all orders | <=EUR 15 by week 4; <=EUR 13 by week 8+ |
| Payment success rate | Successful payments / payment attempts | >=97% (decision-valid at >=100 attempts) |
| Return rate (30-day trailing) | Returned orders / shipped orders | <=7% (decision-valid at >=25 shipped orders) |

#### Kill/Pivot thresholds (enforced)

1. If paid CAC is above observed gross profit/order for 7 consecutive days, pivot to retargeting-only acquisition.
2. If sitewide CVR is below 0.9% after >=500 sessions in a 7-day window, stop spend expansion and run conversion fixes first.
3. If return rate exceeds 7% after >=25 shipped orders, hold growth and remediate compatibility/fit issues before re-scaling.
4. If payment success drops below 97% after >=100 attempts, pause traffic increases until checkout reliability recovers.

## Risks

### Active Risks

- **Unclear Differentiation** (Severity: High, Added: 2026-02-11)
  - Source: Offer framing and value proposition remain broad.
  - Impact: Weak demand signal and low conversion confidence.
  - Mitigation: Define a narrow ICP and value claim before expansion.

- **Measurement Gap** (Severity: Medium, Added: 2026-02-11)
  - Source: Baseline is locked but not yet populated with observed week-1/week-2 values.
  - Impact: Decisions can drift back to opinion.
  - Mitigation: Establish and enforce weekly scorecard before major expansion.

## Opportunities

### Validated (Ready for Cards)
_None yet — to be populated by Cabinet sweeps_

### Under Investigation
_None yet_

## Learnings

_No learnings recorded yet. This section is append-only — learnings are added after card reflections._

## Metrics

### Launch Readiness (Established: 2026-02-12)

- **Demand Signal:** Week-0 baseline
  - Target: >=500 sessions/week by week 4
  - Measurement: Sessions by channel (weekly)

- **Conversion Signal:** Week-0 baseline
  - Target: >=1.4% CVR (7-day trailing), hard floor 0.9%
  - Measurement: Orders / sessions (weekly)

- **Economics Signal:** Week-0 baseline
  - Target: blended CAC <=EUR 15 by week 4, <=EUR 13 by week 8+
  - Measurement: Paid spend / orders (weekly)

- **Reliability Signal:** Week-0 baseline
  - Target: payment success >=97%, return rate <=7%
  - Measurement: Checkout + operations logs (weekly)
