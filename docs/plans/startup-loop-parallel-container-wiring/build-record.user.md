---
Type: Build-Record
Plan: startup-loop-parallel-container-wiring
Status: Complete
Created: 2026-02-22
Last-updated: 2026-02-22
---

# Build Record: startup-loop-parallel-container-wiring

## What was built

The startup loop spec v3.9.6 modelled post-MEASURE containers as a strict sequential chain, creating confirmed dependency violations (PRODUCTS-02 ran before MARKET-01; PRODUCTS-04 ran before MARKET-03). This plan replaced that sequential model with two parallel workstreams from MEASURE exit, converging at MARKET-06 (Offer Design).

## Tasks completed

| Task | Status | Commit |
|------|--------|--------|
| TASK-01: loop-spec.yaml v3.10.0 | Complete | 621740ee86 |
| TASK-02: stage-operator-dictionary.yaml prompts | Complete | 621740ee86 |
| TASK-03: swim-lane CSS SPIKE | Complete | 621740ee86 |
| TASK-04: HTML swim-lane redesign | Complete | 046259bbdb |

## Deliverables

### loop-spec.yaml (spec_version 3.10.0)

**Constraints removed (old broken sequential chain):**
- `[LOGISTICS, MARKET-01]` — LOGISTICS completion no longer gates MARKET-01
- `[PRODUCTS, MARKET-01]` — PRODUCTS completion no longer gates MARKET-01

**Constraints added (parallel model):**
- `[MEASURE-02, MARKET-01]` — fan-out-2: MARKET stream starts in parallel with PRODUCT-01
- `[MARKET-01, PRODUCTS-02]` — cross-stream sync: competitor map before product scan
- `[MARKET-03, PRODUCTS-04]` — cross-stream sync: pricing benchmarks before bundle hypotheses
- `[PRODUCTS-07, MARKET-06]` — synthesis join: PRODUCTS aggregate feeds offer design
- `[LOGISTICS, MARKET-06]` — synthesis join: LOGISTICS costs feed offer design

**fan-out-2 parallel group added:**
```yaml
fan-out-2:
  members: [MARKET-01, PRODUCT-01]
  join_at: MARKET-06
  conditional_members: []
```

### stage-operator-dictionary.yaml (9 prompt updates)

| Stage | Change |
|-------|--------|
| MEASURE-02 | Now instructs parallel fan-out: start PRODUCT-01 AND MARKET-01 concurrently |
| PRODUCT (container) | Corrected: routes to PRODUCTS-01, not MARKET-01 |
| PRODUCT-01 | Corrected: routes to PRODUCTS-01 (Products stream), not MARKET-01 |
| PRODUCTS-01 | Added cross-stream sync note: PRODUCTS-02 requires MARKET-01 |
| PRODUCTS-02 | Added cross-stream sync note confirming MARKET-01 was required before start |
| PRODUCTS-03 | Added cross-stream sync note: PRODUCTS-04 requires MARKET-03 |
| PRODUCTS-07 | Corrected: routes to MARKET-06 synthesis join, not MARKET-01 |
| LOGISTICS (container) | Corrected: feeds MARKET-06, not MARKET-01 |
| LOGISTICS-07 | Corrected: routes to MARKET-06 synthesis join |

### startup-loop-containers-process-map.html (swim-lane redesign)

Full structural rewrite:
- MEASURE container remains full-width above swim lanes
- Three swim-lane columns inside `.lane-wrapper`:
  - `lane-market`: MARKET-01..05 (market intelligence stream)
  - `lane-products`: PRODUCT-01, PRODUCTS-01..07, LOGISTICS conditional
  - `lane-sell-hint`: placeholder (SELL stages open after MARKET-06 at fan-out-1)
- SVG overlay with two amber dashed cross-stream arrows (MARKET-01→PRODUCTS-02, MARKET-03→PRODUCTS-04)
- JS `getBoundingClientRect()` positions arrows on load + debounced resize
- `.lane-join-label` "Converges at MARKET-06 — Offer Design" divider
- MARKET-06 remains full-width below swim lanes
- All downstream (fan-out-1, SELL, S4..S10) unchanged
- Responsive: lanes stack vertically at ≤1000px; SVG arrows hidden

## Validation evidence

### TASK-01 (TC-01..05)
- TC-01: `[MEASURE-02, MARKET-01]` present in ordering.sequential ✓
- TC-02: `[LOGISTICS, MARKET-01]` and `[PRODUCTS, MARKET-01]` absent ✓
- TC-03: `[MARKET-01, PRODUCTS-02]` and `[MARKET-03, PRODUCTS-04]` present ✓
- TC-04: `[PRODUCTS-07, MARKET-06]` and `[LOGISTICS, MARKET-06]` present ✓
- TC-05: `generate-stage-operator-views.ts` exits 0, no YAML parse errors ✓
- Scout: `check-startup-loop-contracts.sh` only checks field presence, not value — spec_version bump is safe ✓

### TASK-02 (TC-01..02)
- TC-01: MEASURE-02 prompt instructs parallel stream start ✓
- TC-02: PRODUCTS-01 prompt notes PRODUCTS-02 cross-stream sync requirement ✓
- `generate-stage-operator-views.ts` exits 0 after all 9 prompt edits ✓

### TASK-03 (SPIKE acceptance)
- `task-03-swimlane-spike.md` written with confirmed approach ✓
- CSS-only rejected (cannot handle variable vertical offsets across lanes) ✓
- SVG overlay chosen with full CSS + HTML + JS snippets ✓
- 13-step TASK-04 implementation checklist provided ✓
- TASK-04 confidence raised 75% → 82% ✓

### TASK-04 (TC-01..03)
- TC-01: Three swim-lane columns visible between MEASURE and MARKET-06 ✓ (browser verified)
- TC-02: Two cross-stream dependency arrows visible (M01→P02, M03→P04) ✓ (SVG lines present)
- TC-03: MARKET-06 full-width synthesis join; conditional stages retain `.conditional` styling ✓

## Overall acceptance criteria

- [x] loop-spec.yaml spec_version = 3.10.0 with fan-out-2 parallel group and all cross-stream constraints present
- [x] `[LOGISTICS, MARKET-01]` and `[PRODUCTS, MARKET-01]` absent from loop-spec.yaml
- [x] generate-stage-operator-views.ts runs without errors after TASK-01
- [x] stage-operator-dictionary.yaml MEASURE-02 prompt instructs parallel stream start
- [x] HTML renders swim-lane layout with cross-stream arrows in browser
- [x] No ordering cycles (topological sort verified by generate-stage-operator-views.ts passing)

## Scope expansions (TASK-02)

Three additional stale prompts fixed inline during TASK-02 (same objective — operator routing consistency):
- PRODUCT container prompt: was routing to MARKET-01 (stale sequential model)
- PRODUCT-01 prompt: was routing to MARKET-01 instead of PRODUCTS-01
- PRODUCTS-03 exit prompt: was missing MARKET-03 cross-stream sync note

All expansions documented in TASK-02 build notes in plan.md.

## Pending

`results-review.user.md` required to close Layer B → Layer A feedback loop. This document should be created by the operator after observing the deployed outcome (updated HTML and operator behaviour with the new parallel wiring).
