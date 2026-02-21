---
Type: Plan
Status: Active
Domain: Business-OS
Created: 2026-02-12
Last-updated: 2026-02-12
Last-reviewed: 2026-02-14
Relates-to charter: docs/business-os/business-os-charter.md
Audit-Ref: working-tree
Audit-Date: 2026-02-14
---

# HEAD + PET Outcome Contract Execution Plan

## Objective

Turn existing research into execution-grade 90-day contracts for `HEAD` and `PET`, with explicit sales targets, CAC guardrails, weekly leading indicators, and kill/pivot thresholds.

## Contract Freeze Snapshot

| Business | Contract status | Sales target (by 2026-05-13) | CAC guardrail | Canonical file |
|---|---|---|---|---|
| HEAD | Frozen | 110 net orders; EUR 3,000 net revenue | Blended CAC <=EUR 13 by day 60; hard ceiling <=EUR 15 by day 90 | `docs/business-os/strategy/HEAD/plan.user.md` |
| PET | Frozen | 178 orders; EUR 5,874 gross revenue incl VAT | Blended CAC <=EUR 12 by day 60 and <=70% of observed contribution/order | `docs/business-os/strategy/PET/plan.user.md` |

## Active tasks

- **HP-04**: Close remaining execution blockers for decision-grade scaling

### Completed tasks

| ID | Status | Task | Definition of done |
|---|---|---|---|
| HP-01 | Complete (2026-02-12) | Freeze HEAD 90-day outcome contract in canonical strategy doc | HEAD plan includes explicit sales target, CAC guardrail, weekly indicators, and kill/pivot thresholds |
| HP-02 | Complete (2026-02-12) | Freeze PET 90-day outcome contract in canonical strategy doc | PET plan includes explicit sales target, CAC guardrail, weekly indicators, and kill/pivot thresholds |
| HP-03 | Complete (2026-02-12) | Close PET website-reference quality gap | PET market-intelligence source section upgraded to URL-level references with explicit caveats |

## Remaining Weak Gaps (Execution-Critical)

| Gap | Business | Owner | Due | Impact if unresolved |
|---|---|---|---|---|
| Exact sellable units + in-stock date confirmation | HEAD, PET | Pete | 2026-02-19 | Forecast and spend pacing remain assumption-heavy |
| Final launch price architecture (single/bundle/threshold) | HEAD, PET | Pete | 2026-02-19 | CAC and contribution guardrails cannot be stress-tested accurately |
| Payment day-1 reliability checklist (live pass/fail) | HEAD, PET | Pete | 2026-02-19 | Traffic scaling risks conversion loss and false-negative demand read |
| Returns flow/SLA + reason taxonomy live | HEAD, PET | Pete | 2026-02-19 | Return-rate guardrails are hard to enforce operationally |
| URL-level citation refresh for PET TAM denominator claim | PET | Pete | 2026-02-26 | Top-of-funnel TAM sizing remains lower-confidence than conversion/ops evidence |

## Acceptance Criteria

1. Both strategy docs remain the canonical source for active outcome contracts and include enforceable thresholds.
2. Weekly K/P/C/S reviews can evaluate keep/pivot/scale/kill without inventing new gates mid-cycle.
3. PET research quality no longer relies on source-family placeholders for website-reference evidence.

## Decision Linkage

- `DEC-HEAD-01`: scale paid expansion vs hold and fix.
- `DEC-PET-01`: scale spend/channel breadth vs hold and fix.
