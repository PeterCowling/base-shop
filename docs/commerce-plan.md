Type: Plan
Status: Active
Domain: Commerce
Last-reviewed: 2025-12-02
Relates-to charter: docs/commerce-charter.md

# Commerce Plan — Orders, Returns, Logistics, SEO

This plan tracks work derived from the Commerce charter across orders, returns, reverse logistics, and SEO.

## Active tasks

- **COM-01 — Verify orders and returns APIs against docs**
  - Status: ☐
  - Scope:
    - Cross-check `docs/orders.md`, `docs/returns.md`, and `docs/reverse-logistics-events.md` against:
      - `packages/platform-core/src/repositories/rentalOrders.server.ts`
      - `packages/platform-core/src/repositories/returnLogistics.server.ts`
      - `packages/platform-core/src/repositories/reverseLogisticsEvents.server.ts`
      - Template app routes (`/api/return`, returns flows).
  - Dependencies:
    - `docs/commerce-charter.md` Canonical.
  - Definition of done:
    - Docs accurately describe current behaviour; any missing or ambiguous areas are converted into follow-up tasks.

- **COM-02 — SEO surfaces and analytics wiring**
  - Status: ☐
  - Scope:
    - Confirm that `docs/seo.md` matches:
      - `packages/template-app/src/app/api/ai/catalog/route.ts`
      - Sitemap routes in the template app and any tenant apps.
      - SEO audit storage (`seoAudit.json.server.ts`) and Lighthouse helper behaviour.
  - Dependencies:
    - COM-01 (orders/returns understood).
  - Definition of done:
    - SEO docs reference all meaningful endpoints and storage; analytics for SEO/AI crawls are documented and consistent.

- **COM-03 — Commerce health & observability**
  - Status: ☐
  - Scope:
    - Tie commerce-related ConfigChecks and reverse logistics signals into shop health indicators and observability (logs/metrics).
    - Ensure any new metrics are reflected in `docs/cms-plan/thread-e-observability.md` and `docs/lighthouse.md` / `docs/performance-budgets.md` where relevant.
  - Dependencies:
    - COM-01, COM-02.
  - Definition of done:
    - Commerce health signals are documented and consumed by CMS health indicators and/or CI checks.

## Completed / historical

- None yet.

