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
Feature-Slug: ideas-readiness-brik-outcome-contract
Deliverable-Type: product-brief
Execution-Track: business-artifact
Primary-Execution-Skill: update-business-plan
Supporting-Skills: ideas-readiness
Business-OS-Integration: on
Business-Unit: BRIK
---

# Ideas Readiness — BRIK Outcome Contract Fact-Find

## Scope
### Summary
Define the exact missing outcome/decision information required for BRIK so idea generation can produce high-quality, decision-relevant ideas instead of implementation-only suggestions.

### Goals
- Produce one active, measurable current-period BRIK outcome contract.
- Attach explicit decision links so generated ideas can be scored against real decisions.
- Define required evidence and freshness standards for outcome fields.

### Non-goals
- Implementing new BRIK features.
- Running `/ideas-go-faster` before this data contract is complete.

## Evidence Audit (Current State)
- Current focus is implementation-heavy and lacks formal outcome fields.
  - `docs/business-os/strategy/BRIK/plan.user.md:15`
- Critical analytics/tooling gaps exist.
  - `docs/business-os/strategy/BRIK/plan.user.md:22`
  - `docs/business-os/strategy/BRIK/plan.user.md:64`
- Readiness audit currently blocks idea generation.
  - `docs/business-os/readiness/2026-02-10-ideas-readiness.user.md:34`

## Missing Data Contract (BRIK)

Complete all fields below for at least one active outcome.

| Field | Type | Format / Constraints | Required Validation |
|---|---|---|---|
| Outcome-ID | string | `BRIK-OUT-YYYYQ#-NN` | Unique in BRIK plan |
| Outcome | string | one sentence, result-focused, no implementation wording | Must describe business result, not task |
| Baseline | number/string | include unit and observation date | Must cite evidence source |
| Target | number/string | include unit and date-bound target | Must be comparable to Baseline |
| By | date | `YYYY-MM-DD` | Must be <= 90 days from review unless justified |
| Owner | person | `Pete` or named delegate | Must exist in people profile |
| Leading-Indicator-1 | metric | name + formula + cadence | Must be measurable weekly |
| Leading-Indicator-2 | metric | name + formula + cadence | Must be measurable weekly |
| Decision-Link | string | `DEC-BRIK-NN` + explicit decision statement | Must specify what decision unlocks |
| Evidence-Pointers | list | at least 2 file/query references | Must be verifiable in repo/system |
| Review-Cadence | enum | `weekly` or `biweekly` | Must include owner + day |

## Required Decision Links (must be explicit)

At minimum, BRIK outcome data must unlock these decisions:
1. Whether to prioritize conversion instrumentation before additional content expansion.
2. Whether reception-infrastructure work is on track to improve measurable guest/commercial outcomes.
3. Whether multilingual/content investment should continue, pause, or redirect based on conversion signal.

## Question Set (User Input Needed)

1. What is BRIK's single most important outcome for the next 30-90 days?
2. What is the current baseline value, with date and source?
3. What exact target value must be reached by what date?
4. What weekly leading indicators prove progress before the final target?
5. Which concrete decision does this outcome unlock?
6. What threshold will trigger a stop/pivot decision?
7. Which existing card(s) map directly to this outcome?

## Planning Readiness Gate

Status becomes `Ready-for-planning` only when:
- [ ] All contract fields above are complete for >=1 active outcome.
- [ ] Decision links are explicit and testable.
- [ ] Baseline/target units match and are evidence-backed.
- [ ] Leading indicators have weekly measurement path and owner.

## Recommended Next Step
- Update `docs/business-os/strategy/BRIK/plan.user.md` with the completed outcome contract.
- Re-run `/ideas-readiness` before any new idea generation.
