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
Feature-Slug: idea-readiness-bos-outcome-contract
Deliverable-Type: product-brief
Execution-Track: business-artifact
Primary-Execution-Skill: biz-update-plan
Supporting-Skills: idea-readiness
Business-OS-Integration: on
Business-Unit: BOS
---

# Ideas Readiness — BOS Outcome Contract Fact-Find

## Scope
### Summary
Define BOS outcomes around coordination effectiveness and decision throughput, not only system build activity.

### Goals
- Establish one active BOS outcome that measures whether coordination system improves delivery decisions.
- Link BOS outcome to explicit operating decisions (cadence, process strictness, tooling investment).
- Define quantitative leading indicators for cabinet/lp-do-fact-find/plan/build flow quality.

### Non-goals
- Expanding BOS scope before outcome measurement exists.
- Running new sweep ideation without BOS process instrumentation.

## Evidence Audit (Current State)
- Current BOS focus is project-activity based, not outcome-contract based.
  - `docs/business-os/strategy/BOS/plan.user.md:15`
- Key BOS process metrics are unmeasured.
  - `docs/business-os/strategy/BOS/plan.user.md:72`
  - `docs/business-os/strategy/BOS/plan.user.md:78`

## Missing Data Contract (BOS)

| Field | Type | Format / Constraints | Required Validation |
|---|---|---|---|
| Outcome-ID | string | `BOS-OUT-YYYYQ#-NN` | Unique in BOS plan |
| Outcome | string | coordination/throughput result statement | Not implementation-only |
| Baseline | number/string | include source + date | must be measurable |
| Target | number/string | explicit improvement target | decision-useful |
| By | date | `YYYY-MM-DD` | bounded |
| Owner | person | named owner | required |
| Leading-Indicator-1 | metric | pipeline conversion signal (sweep->card->done) | weekly |
| Leading-Indicator-2 | metric | cycle-time or rework signal | weekly |
| Decision-Link | string | `DEC-BOS-NN` statement | must gate process decisions |
| Evidence-Pointers | list | >=2 references | verifiable |
| Operating-Rhythm | enum/string | review cadence + forum | required |

## Required Decision Links (must be explicit)
1. Whether sweep cadence should remain monthly or increase/decrease.
2. Whether current skill/process strictness is increasing throughput or creating drag.
3. Whether additional process/tooling investment should be prioritized over business execution work.

## Question Set (User Input Needed)
1. What BOS outcome best represents coordination value this cycle?
2. What baseline process metrics do we have now (even if manual)?
3. What target values indicate BOS is working better, not just busier?
4. Which concrete operating decisions does this outcome unlock?
5. What cadence/forum will review this outcome and adjust policy?

## Planning Readiness Gate
- [ ] One active BOS outcome contract complete.
- [ ] Leading indicators and cadence are explicitly defined.
- [ ] Decision links are explicit and actionable.
- [ ] Baseline and target are measurable and evidence-backed.

## Recommended Next Step
- Update `docs/business-os/strategy/BOS/plan.user.md` with completed contract.
- Re-run `/idea-readiness`.
