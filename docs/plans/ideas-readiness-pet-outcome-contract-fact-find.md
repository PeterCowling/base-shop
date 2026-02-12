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
Feature-Slug: idea-readiness-pet-outcome-contract
Deliverable-Type: product-brief
Execution-Track: business-artifact
Primary-Execution-Skill: biz-update-plan
Supporting-Skills: idea-readiness
Business-OS-Integration: on
Business-Unit: PET
---

# Ideas Readiness — PET Outcome Contract Fact-Find

## Scope
Define the PET business outcome contract so ideation can rank opportunities by measurable value.

## Evidence Audit (Current State)
- PET has a planning scaffold but no active outcome contract.
  - `docs/business-os/strategy/PET/plan.user.md:14`

## Missing Data Contract (PET)

| Field | Type | Required Validation |
|---|---|---|
| Outcome-ID | string (`PET-OUT-YYYYQ#-NN`) | Unique in PET plan |
| Outcome | result statement | Must be business-result language |
| Baseline | metric + date + source | Evidence-backed |
| Target | metric + date | Comparable to baseline |
| By | `YYYY-MM-DD` | Bounded to decision cycle |
| Owner | person | Named owner |
| Leading Indicators | 2 weekly metrics | Collectible weekly |
| Decision-Link | `DEC-PET-NN` | Explicit decision unlocked |
| Margin Threshold | metric rule | Defines viable economics floor |

## Question Set (User Input Needed)
1. What is PET’s top outcome for the next 30-90 days?
2. What baseline and target values define success?
3. Which decision does that outcome unlock?
4. What minimum margin threshold keeps work viable?

## Planning Readiness Gate
- [ ] PET outcome contract complete in `docs/business-os/strategy/PET/plan.user.md`.
- [ ] Decision link and margin threshold explicitly defined.
