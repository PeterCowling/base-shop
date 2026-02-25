---
Type: Registry-Classification-Pilot
Status: Draft
Task: TASK-03
Feature-Slug: lp-do-ideas-source-trigger-operating-model
Business: HBAG
Created: 2026-02-25
Last-updated: 2026-02-25
Generated: 2026-02-25T00:00:00.000Z
---

# Registry v2 Classification Pilot

## Scope

- Includes all aggregate pack trigger artifacts and primary source-process artifacts for pilot scope.
- Enforces cutover-safe defaults for pack artifacts.
- Uses fail-closed defaults for unknown artifacts (none in this pilot seed).

## Classification Table

| Artifact ID | Path | Class | Trigger | Propagation | Status | Reason |
|---|---|---|---|---|---|---|
| HBAG-LOGISTICS-PACK | docs/business-os/strategy/HBAG/logistics-pack.user.md | projection_summary | manual_override_only | projection_auto | classified | aggregate-pack cutover default |
| HBAG-MARKET-PACK | docs/business-os/strategy/HBAG/market-pack.user.md | projection_summary | manual_override_only | projection_auto | classified | aggregate-pack cutover default |
| HBAG-PRODUCTS-PACK | docs/business-os/strategy/HBAG/product-pack.user.md | projection_summary | manual_override_only | projection_auto | classified | aggregate-pack cutover default |
| HBAG-SELL-PACK | docs/business-os/strategy/HBAG/sell-pack.user.md | projection_summary | manual_override_only | projection_auto | classified | aggregate-pack cutover default |
| HBAG-STRATEGY-CAPACITY_PLAN | docs/business-os/strategy/HBAG/capacity-plan.user.md | source_process | eligible | source_task | classified | primary source-process candidate |
| HBAG-STRATEGY-CHANNEL_POLICY | docs/business-os/strategy/HBAG/channel-policy.user.md | source_process | eligible | source_task | classified | primary source-process candidate |
| HBAG-STRATEGY-COMPETITOR_SCAN | docs/business-os/strategy/HBAG/competitor-scan.user.md | source_process | eligible | source_task | classified | primary source-process candidate |
| HBAG-STRATEGY-CUSTOMER_INTERVIEWS | docs/business-os/strategy/HBAG/customer-interviews.user.md | source_process | eligible | source_task | classified | primary source-process candidate |
| HBAG-STRATEGY-EXPERIMENT_BACKLOG | docs/business-os/strategy/HBAG/experiment-backlog.user.md | source_process | eligible | source_task | classified | primary source-process candidate |
| HBAG-STRATEGY-INSIGHT_LOG | docs/business-os/strategy/HBAG/insight-log.user.md | source_process | eligible | source_task | classified | primary source-process candidate |
| HBAG-STRATEGY-KPI_PACK | docs/business-os/strategy/HBAG/kpi-pack.user.md | source_reference | eligible | source_task | classified | primary source-process candidate |
| HBAG-STRATEGY-PRICING_DECISIONS | docs/business-os/strategy/HBAG/pricing-decisions.user.md | source_process | eligible | source_task | classified | primary source-process candidate |
| HBAG-STRATEGY-RISK_REGISTER | docs/business-os/strategy/HBAG/risk-register.user.md | source_process | eligible | source_task | classified | primary source-process candidate |
| HBAG-STRATEGY-WEEKLY_DEMAND_PLAN | docs/business-os/strategy/HBAG/weekly-demand-plan.user.md | source_process | eligible | source_task | classified | primary source-process candidate |

## Validation Notes

- No trigger-eligible row is unclassified.
- Aggregate packs are `projection_summary + manual_override_only` per cutover contract.
- Unknown artifacts remain fail-closed by policy (`trigger_policy: never`).
