---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: PLAT-ENG-0010
Title: 'Plan: Rapid Shop Launch (v2)'
Business: PLAT
Tags:
  - plan-migration
  - launch
Created: 2026-01-23T00:00:00.000Z
Updated: 2026-01-23T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Plan: Rapid Shop Launch (v2)

**Source:** Migrated from `launch-3hr-v2-plan.md`


# Plan: Rapid Shop Launch (v2)

## Objectives

1. **45-minute target** — a trained operator launches a Basic tier shop in ≤45 minutes of operator-active time (90-minute ceiling with recovery). See [time budget](launch-time-budget.md) for metric definition.
2. **UI-driven** — the entire flow lives in the CMS. No terminal commands, no config file editing.
3. **Three stages** — Configure → Review → Launch. No ceremony between stages.
4. **Template-default experience** — each wizard step pre-selects the approved default. The operator confirms or overrides. Most steps are one-click confirmations.
5. **Content derivation** — pages are generated automatically from the operator's selections. No required content authoring; bounded inline edits (≤10 text fields) allowed during Review.
6. **Automated gates** — six go-live gates run without operator action. Failures produce actionable messages that link back to the relevant wizard step.
7. **No oversell** — inventory holds at checkout + OOS blocking, verified by gates before go-live.
8. **Auditable output** — every launch produces a timing report with per-stage operator-active time and gate results.

---

## Approach

The predecessor plan (v1) built primitives bottom-up. This plan delivers an integrated UI experience top-down: define the three-stage operator flow in the CMS, then wire it to existing infrastructure.


[... see full plan in docs/plans/launch-3hr-v2-plan.md]
