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
Feature-Slug: idea-readiness-head-outcome-contract
Deliverable-Type: product-brief
Execution-Track: business-artifact
Primary-Execution-Skill: biz-update-plan
Supporting-Skills: idea-readiness
Business-OS-Integration: on
Business-Unit: HEAD
---

# Ideas Readiness — HEAD Outcome Contract Fact-Find

## Scope
Capture the exact outcome contract needed for the Headband business to guide idea prioritization.

## Evidence Audit (Current State)
- HEAD business plan exists but has no locked current-cycle outcome contract.
  - `docs/business-os/strategy/HEAD/plan.user.md:14`

## Missing Data Contract (HEAD)

| Field | Type | Required Validation |
|---|---|---|
| Outcome-ID | string (`HEAD-OUT-YYYYQ#-NN`) | Unique in HEAD plan |
| Outcome | result statement | Must describe commercial result |
| Baseline | metric + date | Evidence-backed |
| Target | metric + date | Comparable to baseline |
| By | `YYYY-MM-DD` | Time-bound |
| Owner | person | Named accountable owner |
| Leading Indicators | 2 weekly metrics | Defined formulas/cadence |
| Decision-Link | `DEC-HEAD-NN` | Explicit decision unlocked |
| Stop/Pivot Threshold | rule | Clear hold/pivot trigger |

## Question Set (User Input Needed)
1. What single result proves the Headband business moved forward this cycle?
2. What exact baseline and target values define success?
3. Which decision is enabled by achieving or missing the target?
4. What threshold forces a pivot or stop?

## Planning Readiness Gate
- [ ] HEAD outcome contract is complete in `docs/business-os/strategy/HEAD/plan.user.md`.
- [ ] Decision link and stop/pivot threshold are explicit and measurable.
