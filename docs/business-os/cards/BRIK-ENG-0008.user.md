---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0008
Title: Guide System Improvements
Business: BRIK
Tags:
  - plan-migration
  - cms-/-ui-/-platform
Created: 2026-01-27T00:00:00.000Z
Updated: 2026-01-27T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Guide System Improvements

**Source:** Migrated from `guide-system-improvements-phase2-plan.md`


# Guide System Improvements — Phase 2 (Guardrails) + Phase 3 (Bigger Bets)

## Summary

This plan keeps the **full breadth** of the guide-system improvements workstream, while making CI an **honest diagnostic**:

- **Phase 2** is “guardrails + operability”: bounded changes we can ship safely and validate quickly.
- **Phase 3** contains larger refactors/migrations that may still be worth doing, but require additional spikes/tests to become high-confidence.

### Phase 2 themes

- tighten and standardize validation (content schema + link tokens),
- surface “English fallback” clearly in authoring/preview,
- reduce block-authoring friction with safe scaffolding,
- add opt-in performance measurement for guide build/render hotspots.

### Phase 3 themes (preserved, not deleted)

- manifest TS → JSON,

[... see full plan in docs/plans/guide-system-improvements-phase2-plan.md]
