---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-11
Last-updated: 2026-02-11
Last-reviewed: 2026-02-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: idea-readiness-pipe-outcome-contract
Deliverable-Type: product-brief
Execution-Track: business-artifact
Primary-Execution-Skill: biz-update-plan
Supporting-Skills: idea-readiness
Business-OS-Integration: on
Business-Unit: PIPE
---

# Ideas Readiness — PIPE Outcome Contract Fact-Find

## Scope
### Summary
Specify the precise outcome data required for PIPE to move from implementation-first planning to market-validation-first idea generation.

### Goals
- Define PIPE's current-period outcome in measurable commercial terms.
- Tie outcome to explicit sequencing decisions (validation vs infrastructure build-out).
- Establish signal thresholds for go/hold/pivot decisions.

### Non-goals
- Designing PIPE architecture in this brief.
- Advancing new ideas without first-sale outcome clarity.

## Evidence Audit (Current State)
- Current focus is task/architecture oriented with no formal outcome contract.
  - `docs/business-os/strategy/PIPE/plan.user.md:15`
- Business is pre-revenue and lacks validated fulfillment signal loop.
  - `docs/business-os/strategy/PIPE/plan.user.md:18`
  - `docs/business-os/strategy/PIPE/plan.user.md:64`

## Missing Data Contract (PIPE)

| Field | Type | Format / Constraints | Required Validation |
|---|---|---|---|
| Outcome-ID | string | `PIPE-OUT-YYYYQ#-NN` | Unique in PIPE plan |
| Outcome | string | must reference demand/fulfillment result | No implementation-only phrasing |
| Baseline | number/string | include date + source | Must capture current pre-revenue state |
| Target | number/string | must be decision-useful (e.g., first paid order, repeat intent) | Must be reachable in 30-90 days |
| By | date | `YYYY-MM-DD` | Must bound decision window |
| Owner | person | named owner in people profile | Required |
| Leading-Indicator-1 | metric | demand signal metric + cadence | Weekly collectible |
| Leading-Indicator-2 | metric | fulfillment viability metric + cadence | Weekly collectible |
| Decision-Link | string | `DEC-PIPE-NN` with explicit decision statement | Must gate catalog/platform sequencing |
| Stop/Pivot Threshold | metric rule | explicit numeric/boolean trigger | Must define hold/pivot condition |
| Evidence-Pointers | list | >=2 references | Verifiable |

## Required Decision Links (must be explicit)
1. Whether to continue catalog/platform build before first repeatable demand signal.
2. Whether current fulfillment pathway is commercially viable enough to scale.
3. Whether to prioritize channel A (marketplace) or channel B (direct) for next cycle.

## Question Set (User Input Needed)
1. What PIPE outcome proves the business moved forward this cycle?
2. What is the minimum viable commercial signal threshold?
3. What weekly metric will tell us quickly if we're on track?
4. What exact decision will be taken when target is met vs missed?
5. What is the hard stop condition that prevents premature scale work?

## Planning Readiness Gate
- [ ] One active PIPE outcome contract complete with all required fields.
- [ ] Decision-link explicitly controls build-sequencing choices.
- [ ] Stop/pivot threshold declared and measurable.
- [ ] Weekly signal collection path defined.

## Recommended Next Step
- Add completed outcome contract to `docs/business-os/strategy/PIPE/plan.user.md`.
- Re-run `/idea-readiness`.
