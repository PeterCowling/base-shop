---
Type: Plan
Status: Complete
Domain: Data
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-pdp-ga4-funnel-feed
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# HBAG PDP GA4 Funnel Feed Plan

## Summary
This plan closes the measurement gap identified in HBAG process improvements by introducing a standing weekly funnel artifact for PDP progression from `view_item` to `begin_checkout`. The current Caryina telemetry emits `product_view` and `checkout_started`; this plan keeps those event producers stable and adds an explicit KPI alias contract so reflections can reliably read `view_item` and `begin_checkout` from a consistent feed. Implementation is split into contract lock-in, feed generation, and regression tests. The result is a repeatable evidence source for post-build outcomes instead of one-off analytics checks.

## Active tasks
- [x] TASK-01: Lock KPI alias contract and feed schema (`product_view -> view_item`, `checkout_started -> begin_checkout`)
- [x] TASK-02: Implement weekly HBAG PDP funnel feed generator artifact
- [x] TASK-03: Add tests for alias mapping and feed output integrity
- [x] TASK-04: Wire operator runbook + results-review integration note for standing use

## Goals
- Produce a deterministic weekly artifact reporting HBAG PDP funnel counts/rates for `view_item` and `begin_checkout`.
- Codify KPI alias mapping from current emitted event names without breaking existing telemetry producers.
- Prevent drift by adding tests around mapping and artifact shape.

## Non-goals
- Full analytics taxonomy migration across all shops.
- New dashboard UI or external BI integration.
- New conversion events beyond the two KPI anchors.

## Constraints & Assumptions
- Constraints:
  - Current API allowlist accepts `product_view` and `checkout_started`; direct rename to GA names is not currently safe without broader blast-radius checks.
  - Feed must work with existing analytics storage/provider behavior.
- Assumptions:
  - Weekly cadence is sufficient for this KPI loop at current HBAG traffic level.

## Inherited Outcome Contract
- **Why:** The trust-cues improvement can only be validated if we can repeatedly observe whether PDP visitors progress from view_item to begin_checkout. Without a standing feed, each cycle remains evidence-light and cannot close the KPI loop.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** A standing HBAG PDP funnel artifact is produced weekly with GA4 counts/rates for view_item and begin_checkout so outcome reviews can compare trend direction and detect regression within one cycle.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/hbag-pdp-ga4-funnel-feed/fact-find.md`
- Key findings used:
  - Emitters currently produce `product_view` and `checkout_started`.
  - Route allowlist enforces accepted event names.
  - GA provider forwards `event.type` directly as MP event name.
  - No existing standing weekly feed artifact exists for this KPI pair.

## Proposed Approach
- Option A: Rename emitted event names everywhere to GA ecommerce canonical names.
- Option B: Keep emitters stable and introduce explicit KPI alias mapping in standing feed generation.
- Chosen approach: **Option B**. It closes the KPI loop with the smallest safe blast radius and avoids cross-shop event-contract regressions.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define KPI alias contract + feed schema and artifact path | 90% | S | Complete (2026-03-04) | - | TASK-02,TASK-03 |
| TASK-02 | IMPLEMENT | Build weekly feed generator for HBAG PDP funnel metrics | 84% | M | Complete (2026-03-04) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add regression tests for mapping and artifact shape | 83% | M | Complete (2026-03-04) | TASK-01,TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Add runbook usage + results-review integration note | 88% | S | Complete (2026-03-04) | TASK-02,TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Contract lock-in first |
| 2 | TASK-02 | TASK-01 | Main implementation |
| 3 | TASK-03 | TASK-01,TASK-02 | Tests after feed behavior is concrete |
| 4 | TASK-04 | TASK-02,TASK-03 | Documentation handoff and operator procedure |

## Tasks

### TASK-01: KPI alias contract and feed schema
- **Type:** IMPLEMENT
- **Deliverable:** Documented in-code contract and artifact schema for weekly feed.
- **Acceptance:**
  - Alias mapping explicitly defined and centralized:
    - `product_view -> view_item`
    - `checkout_started -> begin_checkout`
  - Feed artifact schema fixed (date range, raw counts, rate, source events, notes).
  - Artifact path fixed under `docs/business-os/startup-baselines/HBAG/`.

### TASK-02: Weekly feed generator
- **Type:** IMPLEMENT
- **Deliverable:** Generator that reads analytics events and writes weekly HBAG PDP funnel artifact.
- **Acceptance:**
  - Output includes at minimum: `view_item_count`, `begin_checkout_count`, and `begin_checkout_rate`.
  - Output includes explicit alias contract version so KPI interpretation is deterministic.
  - Command is runnable in repo workflow without manual editing of generated content.

### TASK-03: Regression tests
- **Type:** IMPLEMENT
- **Deliverable:** Automated tests covering alias mapping and feed output contract.
- **Acceptance:**
  - Failing test if mapping table changes unexpectedly.
  - Failing test if required artifact fields are missing.
  - Happy-path fixture test proving rate computation and date window behavior.

### TASK-04: Runbook and loop integration note
- **Type:** IMPLEMENT
- **Deliverable:** Operator-facing instructions + reflection integration pointer.
- **Acceptance:**
  - Short runbook added for generating/refreshing weekly feed.
  - Results-review guidance updated to reference the standing feed as evidence input.

## Risks & Mitigations
- Mapping contract misunderstood in later cycles.
  - Mitigation: single source mapping constant + test lock.
- GA setup incomplete (`G-XXXXXXXXXX` placeholder / missing secret) reduces external GA visibility.
  - Mitigation: feed works from repo analytics event stream and documents GA dependency state.
- Low event volume causes noisy weekly rates.
  - Mitigation: include raw counts and annotate low-sample weeks.

## Observability
- Logging:
  - Feed generation logs week window and event totals.
- Metrics:
  - `view_item_count`, `begin_checkout_count`, `begin_checkout_rate`.
- Alerts/Dashboards:
  - None in this plan; artifact-driven review in results-review.

## Acceptance Criteria (overall)
- [x] Standing weekly HBAG PDP funnel artifact exists and is reproducible.
- [x] KPI alias contract is explicit and test-covered.
- [x] Results-review can cite feed directly as evidence for trust-cues KPI movement.

## Decision Log
- 2026-03-04: Selected report-layer alias mapping over event-taxonomy rename to minimize blast radius.
- 2026-03-04: Implemented generator (`scripts/src/startup-loop/diagnostics/hbag-pdp-funnel-feed.ts`), added test coverage (`scripts/src/startup-loop/__tests__/hbag-pdp-funnel-feed.test.ts`), added runbook (`docs/business-os/startup-baselines/HBAG/pdp-funnel-feed-runbook.user.md`), and generated baseline artifacts (`pdp-funnel-feed.json`, `pdp-funnel-feed.user.md`).

## What would make this >=90%
- Add two consecutive weekly artifact samples from real data showing stable generation and interpretable KPI trend.
- Confirm no cross-consumer dependency on raw event names outside mapped feed path.
- Add one integration test on real analytics fixture covering low-volume edge cases.

## Overall-confidence Calculation
- S=1, M=2
- Weighted confidence = (90*1 + 84*2 + 83*2 + 88*1) / (1+2+2+1) = 85.3% -> 85%
