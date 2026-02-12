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
Feature-Slug: idea-readiness-xa-outcome-contract
Deliverable-Type: product-brief
Execution-Track: business-artifact
Primary-Execution-Skill: biz-update-plan
Supporting-Skills: idea-readiness
Business-OS-Integration: on
Business-Unit: XA
---

# Ideas Readiness — XA Outcome Contract Fact-Find

## Scope
Define the minimum outcome data contract required for XA so idea generation is decision-grade.

## Evidence Audit (Current State)
- XA has been scaffolded as a standalone active business.
  - `docs/business-os/strategy/XA/plan.user.md:1`
- Current-cycle outcome contract fields are not yet populated.
  - `docs/business-os/strategy/XA/plan.user.md:14`

## Missing Data Contract (XA)

| Field | Type | Required Validation |
|---|---|---|
| Outcome-ID | string (`XA-OUT-YYYYQ#-NN`) | Unique in XA plan |
| Outcome | result statement | No implementation-only wording |
| Baseline | metric + date + source | Evidence-backed |
| Target | metric + date | Comparable to baseline |
| By | `YYYY-MM-DD` | Explicit decision window |
| Owner | person | Accountable owner exists |
| Leading-Indicator-1 | weekly metric | Collectible weekly |
| Leading-Indicator-2 | weekly metric | Collectible weekly |
| Decision-Link | `DEC-XA-NN` | Explicit decision unlocked |
| Stop/Pivot Threshold | rule | Numeric or binary trigger |

## Question Set (User Input Needed)
1. What is XA’s single highest-priority outcome for the next 30-90 days?
2. What baseline and target values will define success?
3. Which concrete decision does this outcome unlock?
4. What stop/pivot trigger prevents continued investment when signal is weak?

## Planning Readiness Gate
- [ ] One complete XA outcome contract recorded in `docs/business-os/strategy/XA/plan.user.md`.
- [ ] Decision-link and stop/pivot threshold are explicit.
