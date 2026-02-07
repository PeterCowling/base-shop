---
Type: Plan
Status: Draft
Domain: Dashboard / Upgrade
Last-reviewed: 2025-12-02
Relates-to charter: none
Last-updated: 2026-01-17
Last-updated-by: Codex
---

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
- Slice 1 (existing Upgrade hardening)
  - Add header (shop id, pending count, last refresh placeholder, status pill, refresh button, explicit “no access” state for 401/403 with sign-in/request-access CTAs).
  - Replace list with structured diff table (component, package/version if available, current/new checksum, preview link when API provides).
  - Publish confirmation modal + inline status and retry messaging; map 4xx vs 5xx; basic backoff or retry button on load error.
  - Telemetry hook for `upgrade_diff_load_{start,success,fail}` and `upgrade_publish_{start,success,fail}` with shop id, selection size, duration, and HTTP status (console/no-op backed).
  - i18n decision: either wrap with `TranslationsProvider` using default bundle or commit to EN-only for now.
- Slice 2 (layout + nav shell)
  - Shared layout in `_app.tsx` with header/nav; ensure `/Upgrade` deep link keeps working (alias or route) even after adding `/shops/:id/diff`.
  - Stub pages `/dashboard` and `/shops` (copy points to Upgrade for now).
- Slice 3 (multi-shop entry)
  - `/shops` index: fetch list (requires API/config source for shops: id, optional name/region/brand, last upgrade), show name/id, last upgrade, pending count/status, filters/search, links to Upgrade with shop id.
  - Optional `/shops/:id` wrapper that reuses the existing Upgrade Diff experience; sets empty History/Metrics tabs but does not populate them yet.
- Slice 4 (history + lightweight workboard)
  - `/api/shop/:id/upgrade-history` UI consumption (timeline with retry link).
  - Basic `/workboard` with status lanes (click-through cards; no drag/drop or bulk actions yet).
  - Extend telemetry with MTTR/failure rate; group errors by type (auth vs validation vs server vs network) for analysis and labels.

3 · Out of Scope (for now)
- Full Kanban interactions (drag/drop), bulk publish/rollback, scheduling/maintenance windows.
- Commercial KPIs, SLA calculators, notifications (Slack/email), gamification/leaderboards.
- Deep auth/permissions model changes beyond handling 401/403 gracefully.
- Automated pre-flight checks/rollbacks until backend support exists (smoke tests, inventory toggles, canary).

4 · Dependencies & Notes
- API: need component metadata (package/version/checksums) and optional preview URLs to enrich the table; history endpoint for Slice 4.
- Shops index data source: API or config for listing shops (id, optional name/region/brand, last upgrade) needed for Slice 3.
- Telemetry sink: decide destination (logging/analytics). Slice 1 can use console/no-op; target sink needed before MTTR/failure metrics in Slice 4.
- Auth UX: clarify whether 401/403 should prompt re-auth, request access, or both.
- Design tokens: reuse existing Tailwind utilities; keep file <350 lines per repo guidance.
- Testing policy: prefer targeted Jest/RTL specs; avoid monorepo-wide runs.
- ⚠️ Deployment TODO (Cloudflare): set `NEXT_PUBLIC_CMS_BASE_URL` to the CMS host so dashboard calls (history, publish retry) hit the right origin. Without this env var in Cloudflare, retry/history will fail across origins.
- Same-origin proxies exist at `/api/dashboard/shops`, `/api/dashboard/shop/:id/upgrade-history`, and `/api/dashboard/shop/:id/publish-upgrade`, but they still rely on `NEXT_PUBLIC_CMS_BASE_URL` to reach CMS in production.

5 · Testing & QA Strategy
- Slice 1: RTL tests for header render, diff table rows, confirmation modal flow, error states (4xx vs 5xx), telemetry calls (spy/no-op).
- Slice 2–4: add routing/layout smoke tests and per-page empty/error states (ensure /Upgrade, /dashboard, /shops, /workboard render and nav links exist); keep CT spec updated if UI changes drastically.
- Accessibility: axe check on Upgrade and new pages’ primary states (loading/error/empty/success); ensure confirmation modal is keyboard navigable and announced (ARIA).

6 · Milestones
- M1: /Upgrade has header, structured diff table, confirmation modal, improved errors, and telemetry events.
- M2: Layout/nav + stub pages live; /Upgrade uses shell; deep link still works.
- M3: /shops index lists shops and links into per-shop upgrade.
- M4: /shops/:id history timeline and basic /workboard live; telemetry includes publish durations and failure classifications.

7 · Assumptions / Open Questions
- Shops listing API contract and availability (id, name/region/brand, last upgrade).
- Component metadata fields (package/version/checksums/preview URLs) exposed by diff endpoint.
- Auth UX for 401/403 (re-auth vs request access).
- Telemetry sink selection for production (console/no-op acceptable in Slice 1).

## Active tasks

- **DASH-01** - Implement Slice 1: header, diff table, confirmation modal, and telemetry
