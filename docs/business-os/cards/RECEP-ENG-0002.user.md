---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: RECEP-ENG-0002
Title: Reception - Stock + Cash Control Plan v2
Business: RECEP
Tags:
  - plan-migration
  - reception
Created: 2026-01-23T00:00:00.000Z
Updated: 2026-01-23T00:00:00.000Z
---
# Reception - Stock + Cash Control Plan v2

**Source:** Migrated from `reception-stock-cash-control-plan-v2.md`


# Reception - Stock + Cash Control Plan v2

Goal: close the remaining accountability gaps identified in the v1 audit. The
foundational ledger infrastructure is in place; this plan addresses immutability
enforcement, reauth coverage, server-side rules, and ingredient audit trail.

## Audit summary (2026-01-23)

### What works
- Inventory ledger (append-only, Zod-validated, typed hooks)
- Stock management UI (receive, count, adjust, waste, transfer, alerts)
- Ingredient stock now uses inventory items + ledger (legacy migration supported)
- Cash/till shift management with denomination breakdowns
- Safe management (deposit, withdrawal, exchange, bank, reconcile, reset)
- Variance calculations (cash, keycard, safe) with mismatch detection
- End-of-day report aggregation and CSV export
- Role checks exist for stock/management (`Permissions.*`), but cash/safe still uses name-based gating
- Reauth in place: password reauth for bank deposits and large stock adjustments; PIN confirmation for safe deposit/withdrawal, petty cash, and shift close
- Recipes stored in `inventory/recipes` keyed by inventory item ID; bar sales post ledger `sale` entries; stock dashboard warns on missing mappings

[... see full plan in docs/plans/reception-stock-cash-control-plan-v2.md]
