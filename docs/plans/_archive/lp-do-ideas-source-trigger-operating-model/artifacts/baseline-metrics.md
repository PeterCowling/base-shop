---
Type: Investigation-Evidence
Status: Complete
Task: TASK-01
Feature-Slug: lp-do-ideas-source-trigger-operating-model
Created: 2026-02-25
Last-updated: 2026-02-25
---

# Baseline Metrics (Pre-Bridge)

## Scope
Snapshot baseline for current `lp-do-ideas` trial intake behavior before registry v2 + source-trigger bridge changes.

## Inputs
- `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
- `docs/plans/lp-do-ideas-source-trigger-operating-model/fact-find.md`

## Snapshot
- `created_at`: `2026-02-25T00:00:00Z`
- `last_updated`: `2026-02-25T00:00:00Z`
- Dispatch records in queue-state: `1`

## Raw counters
| Metric source | Value | Notes |
|---|---:|---|
| `counts.enqueued` | 0 | queue-state |
| `counts.processed` | 1 | queue-state |
| `counts.skipped` | 0 | queue-state |
| `counts.error` | 0 | queue-state |
| `counts.suppressed` | 0 | queue-state |

## Formula baseline
| Metric | Formula | Baseline value | Data quality |
|---|---|---:|---|
| `root_event_count` (proxy) | unique dispatch rows in `queue-state.dispatches` | 1 | Proxy only; no dedicated root-event field in v1 queue state |
| `admitted_dispatch_count` (proxy) | `counts.enqueued + counts.processed` | 1 | Proxy for admitted work in current snapshot |
| `fan_out_admitted` (proxy) | `admitted_dispatch_count / root_event_count` | 1.00 | Computable with proxy inputs |
| `fan_out_raw` | `candidate_count / root_event_count` | N/A | `candidate_count` not persisted in current snapshot files |
| `loop_incidence` | `suppressed_by_loop_guards / candidate_count` | N/A | No loop-guard suppression counters in v1 snapshot |
| Duplicate suppression rate (proxy) | `counts.suppressed / (dispatch rows + counts.suppressed)` | 0.00 | Indicates no observed duplicate suppression in this sample |

## Findings
1. Baseline supports an admitted-path proxy, but not full BR-07 formulas (`fan_out_raw`, `loop_incidence`).
2. Current queue-state sample is small (single processed dispatch), so baseline should be treated as structural, not performance-representative.
3. Trial contract lists telemetry artifacts (`dispatch-ledger.jsonl`, `telemetry.jsonl`) that are missing in the current snapshot, preventing richer pre-bridge metrics.

## Risks to carry into TASK-10
- Without candidate-level counters, BR-07 threshold tuning can drift.
- With no explicit loop-guard suppression dimensions yet, loop incidence must stay `N/A` until instrumentation lands.
