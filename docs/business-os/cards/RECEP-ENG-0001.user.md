---
Type: Card
Lane: Fact-finding
Priority: P2
Owner: Pete
ID: RECEP-ENG-0001
Title: Dashboard Upgrade Aggregator
Business: RECEP
Tags:
  - plan-migration
  - dashboard-/-upgrade
Created: 2025-12-02T00:00:00.000Z
Updated: 2026-01-17T00:00:00.000Z
---
# Dashboard Upgrade Aggregator

**Source:** Migrated from `dashboard-upgrade-aggregator-plan.md`


“Dashboard Upgrade Aggregator” — Implementation Plan
rev 2025-12-02 · Slice roadmap toward multi-shop release control

0 · Current Baseline
- Surface: only `apps/dashboard/src/pages/Upgrade.tsx` plus minimal `_app.tsx` wrapper; no layout/nav.
- Behavior: load diff via `/api/shop/:id/component-diff`, select components, POST to `/api/shop/:id/publish-upgrade`.
- States: loading, error, empty, validation; publish success/failure message; selection reset on shop change.
- Gaps: no shop metadata, no confirmation modal, no preflight or retries, no telemetry, no multi-shop routes, no history/workboard/metrics, no real i18n provider.
- Entry: no multi-shop list or shop detail route; the only entry point is `/Upgrade` with shop id from router query.

1 · Objectives
- Visibility: make upgrade state obvious per shop, then across shops.
- Safety: add confirmation, clearer errors, and recoverability.
- Velocity: reduce clicks to act on issues; prepare for bulk/multi-shop later.
- Observability: instrument load/publish outcomes.
- Foundations: introduce layout/nav for future aggregator pages.
- Auth clarity: make access failures explicit and recoverable (401/403 UX).

2 · Scope (by slice)

[... see full plan in docs/plans/dashboard-upgrade-aggregator-plan.md]
